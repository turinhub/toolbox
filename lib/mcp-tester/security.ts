import { isIP } from "node:net";
import { lookup } from "node:dns/promises";
import type { LookupAddress } from "node:dns";
import type { LookupFunction } from "node:net";
import { Agent, fetch as undiciFetch } from "undici";
import type { FetchLike } from "@modelcontextprotocol/client";
import type { McpHeaderInput } from "@/lib/mcp-tester/types";

export const MCP_MAX_REQUEST_BYTES = 256 * 1024;
export const MCP_MAX_RESPONSE_BYTES = 2 * 1024 * 1024;
export const MCP_REQUEST_TIMEOUT_MS = 30_000;
export const MCP_MAX_REDIRECTS = 3;
export const MCP_MAX_HEADERS = 10;

const BLOCKED_HEADER_NAMES = new Set([
  "accept",
  "accept-encoding",
  "connection",
  "content-length",
  "content-type",
  "cookie",
  "forwarded",
  "host",
  "origin",
  "proxy-authorization",
  "proxy-connection",
  "referer",
  "set-cookie",
  "te",
  "trailer",
  "transfer-encoding",
  "upgrade",
  "via",
]);

export class McpSecurityError extends Error {
  constructor(
    public readonly code: string,
    message: string
  ) {
    super(message);
    this.name = "McpSecurityError";
  }
}

function parseIpv4(address: string) {
  const parts = address.split(".").map(Number);
  if (
    parts.length !== 4 ||
    parts.some(part => !Number.isInteger(part) || part < 0 || part > 255)
  ) {
    return null;
  }
  return (
    (((parts[0] << 24) >>> 0) |
      (parts[1] << 16) |
      (parts[2] << 8) |
      parts[3]) >>>
    0
  );
}

function ipv4InCidr(address: string, base: string, prefix: number) {
  const value = parseIpv4(address);
  const network = parseIpv4(base);
  if (value === null || network === null) return false;
  const mask = prefix === 0 ? 0 : (0xffffffff << (32 - prefix)) >>> 0;
  return (value & mask) === (network & mask);
}

const BLOCKED_IPV4_RANGES: Array<[string, number]> = [
  ["0.0.0.0", 8],
  ["10.0.0.0", 8],
  ["100.64.0.0", 10],
  ["127.0.0.0", 8],
  ["169.254.0.0", 16],
  ["172.16.0.0", 12],
  ["192.0.0.0", 24],
  ["192.0.2.0", 24],
  ["192.88.99.0", 24],
  ["192.168.0.0", 16],
  ["198.18.0.0", 15],
  ["198.51.100.0", 24],
  ["203.0.113.0", 24],
  ["224.0.0.0", 4],
  ["240.0.0.0", 4],
];

const PRIVATE_IPV4_RANGES: Array<[string, number]> = [
  ["10.0.0.0", 8],
  ["172.16.0.0", 12],
  ["192.168.0.0", 16],
];

function expandIpv6(address: string) {
  let normalized = address.toLowerCase().split("%")[0];
  const mappedMatch = normalized.match(/^(.*:)(\d+\.\d+\.\d+\.\d+)$/);
  if (mappedMatch) {
    const ipv4 = parseIpv4(mappedMatch[2]);
    if (ipv4 === null) return null;
    normalized = `${mappedMatch[1]}${((ipv4 >>> 16) & 0xffff).toString(
      16
    )}:${(ipv4 & 0xffff).toString(16)}`;
  }

  const halves = normalized.split("::");
  if (halves.length > 2) return null;
  const left = halves[0] ? halves[0].split(":") : [];
  const right = halves[1] ? halves[1].split(":") : [];
  const missing = 8 - left.length - right.length;
  if ((halves.length === 1 && missing !== 0) || missing < 0) return null;

  const parts = [
    ...left,
    ...Array.from({ length: halves.length === 2 ? missing : 0 }, () => "0"),
    ...right,
  ];
  if (parts.length !== 8) return null;
  if (parts.some(part => !/^[0-9a-f]{1,4}$/.test(part))) return null;
  return parts.map(part => Number.parseInt(part, 16));
}

function ipv6PrefixMatches(
  parts: number[],
  prefixParts: number[],
  prefixBits: number
) {
  const fullParts = Math.floor(prefixBits / 16);
  const remainingBits = prefixBits % 16;
  for (let index = 0; index < fullParts; index += 1) {
    if (parts[index] !== prefixParts[index]) return false;
  }
  if (!remainingBits) return true;
  const mask = (0xffff << (16 - remainingBits)) & 0xffff;
  return (parts[fullParts] & mask) === (prefixParts[fullParts] & mask);
}

function ipv6InCidr(address: string, base: string, prefix: number) {
  const parts = expandIpv6(address);
  const baseParts = expandIpv6(base);
  if (!parts || !baseParts) return false;
  return ipv6PrefixMatches(parts, baseParts, prefix);
}

const BLOCKED_IPV6_RANGES: Array<[string, number]> = [
  ["2001::", 23],
  ["2001:db8::", 32],
  ["3fff::", 20],
];

function extractMappedIpv4(address: string) {
  const parts = expandIpv6(address);
  if (!parts) return null;
  const isMapped =
    parts.slice(0, 5).every(part => part === 0) && parts[5] === 0xffff;
  if (!isMapped) return null;
  return `${parts[6] >>> 8}.${parts[6] & 0xff}.${parts[7] >>> 8}.${
    parts[7] & 0xff
  }`;
}

function extractSixToFourIpv4(address: string) {
  const parts = expandIpv6(address);
  if (!parts || parts[0] !== 0x2002) return null;
  return `${parts[1] >>> 8}.${parts[1] & 0xff}.${parts[2] >>> 8}.${
    parts[2] & 0xff
  }`;
}

export function isBlockedIpAddress(address: string) {
  const family = isIP(address);
  if (family === 4) {
    return BLOCKED_IPV4_RANGES.some(([base, prefix]) =>
      ipv4InCidr(address, base, prefix)
    );
  }
  if (family === 6) {
    const embedded =
      extractMappedIpv4(address) ?? extractSixToFourIpv4(address);
    if (embedded && isBlockedIpAddress(embedded)) return true;
    if (!ipv6InCidr(address, "2000::", 3)) return true;
    return BLOCKED_IPV6_RANGES.some(([base, prefix]) =>
      ipv6InCidr(address, base, prefix)
    );
  }
  return true;
}

export function isPrivateNetworkIpAddress(address: string): boolean {
  const family = isIP(address);
  if (family === 4) {
    return PRIVATE_IPV4_RANGES.some(([base, prefix]) =>
      ipv4InCidr(address, base, prefix)
    );
  }
  if (family === 6) {
    const mapped = extractMappedIpv4(address);
    return mapped
      ? isPrivateNetworkIpAddress(mapped)
      : ipv6InCidr(address, "fc00::", 7);
  }
  return false;
}

function getAllowedPorts() {
  const configured = process.env.MCP_TESTER_ALLOWED_PORTS;
  const values = (configured || "443")
    .split(",")
    .map(value => Number(value.trim()))
    .filter(value => Number.isInteger(value) && value > 0 && value <= 65535);
  return new Set(values.length ? values : [443]);
}

function privateNetworksAllowed() {
  return (
    process.env.NODE_ENV !== "production" &&
    process.env.MCP_TESTER_ALLOW_PRIVATE_NETWORKS === "true"
  );
}

export async function validateMcpTarget(input: string) {
  let url: URL;
  try {
    url = new URL(input);
  } catch {
    throw new McpSecurityError("INVALID_ENDPOINT", "MCP Endpoint 不是有效 URL");
  }

  if (url.protocol !== "https:") {
    throw new McpSecurityError("HTTPS_REQUIRED", "MCP Endpoint 必须使用 HTTPS");
  }
  if (url.username || url.password) {
    throw new McpSecurityError(
      "URL_CREDENTIALS_BLOCKED",
      "Endpoint URL 不能包含用户名或密码"
    );
  }
  if (url.port && !getAllowedPorts().has(Number(url.port))) {
    throw new McpSecurityError("PORT_BLOCKED", `不允许连接端口 ${url.port}`);
  }

  const hostname =
    url.hostname.startsWith("[") && url.hostname.endsWith("]")
      ? url.hostname.slice(1, -1)
      : url.hostname;
  const addressFamily = isIP(hostname);
  let addresses: LookupAddress[];
  if (addressFamily) {
    addresses = [{ address: hostname, family: addressFamily }];
  } else {
    try {
      addresses = await lookup(hostname, { all: true, verbatim: true });
    } catch {
      throw new McpSecurityError(
        "DNS_LOOKUP_FAILED",
        "无法解析 MCP Endpoint 域名"
      );
    }
  }
  if (!addresses.length) {
    throw new McpSecurityError(
      "DNS_LOOKUP_FAILED",
      "MCP Endpoint 没有可用的 IP 地址"
    );
  }
  const allowPrivate = privateNetworksAllowed();
  if (
    addresses.some(
      item =>
        isBlockedIpAddress(item.address) &&
        !(allowPrivate && isPrivateNetworkIpAddress(item.address))
    )
  ) {
    throw new McpSecurityError(
      "PRIVATE_ADDRESS_BLOCKED",
      "不允许连接私网、回环或保留地址"
    );
  }

  url.hash = "";
  return { url, addresses };
}

export function resolveMcpRedirect(source: URL, location: string) {
  const target = new URL(location, source);
  if (target.origin !== source.origin) {
    throw new McpSecurityError(
      "CROSS_ORIGIN_REDIRECT_BLOCKED",
      "MCP Endpoint 不允许跨 Origin 重定向"
    );
  }
  return target;
}

export function sanitizeOutboundHeaders(headers: McpHeaderInput[]) {
  if (headers.length > MCP_MAX_HEADERS) {
    throw new McpSecurityError(
      "TOO_MANY_HEADERS",
      `自定义 Header 不能超过 ${MCP_MAX_HEADERS} 个`
    );
  }

  const result: Record<string, string> = {};
  for (const header of headers) {
    const name = header.name.trim();
    const normalized = name.toLowerCase();
    if (!name) continue;
    if (!/^[!#$%&'*+\-.^_`|~0-9A-Za-z]+$/.test(name)) {
      throw new McpSecurityError("INVALID_HEADER", `Header 名称无效：${name}`);
    }
    if (
      BLOCKED_HEADER_NAMES.has(normalized) ||
      normalized.startsWith("mcp-") ||
      normalized.startsWith("sec-") ||
      normalized.startsWith("x-forwarded-") ||
      normalized.startsWith("proxy-")
    ) {
      throw new McpSecurityError(
        "HEADER_BLOCKED",
        `不允许覆盖 Header：${name}`
      );
    }
    if (name.length > 64 || header.value.length > 4096) {
      throw new McpSecurityError(
        "HEADER_TOO_LARGE",
        `Header 超出长度限制：${name}`
      );
    }
    result[name] = header.value;
  }
  return result;
}

export function redactHeaders(headers: Record<string, string>) {
  return Object.fromEntries(
    Object.keys(headers).map(name => [name, headers[name] ? "••••••••" : ""])
  );
}

export function redactErrorText(value: string, secrets: string[]) {
  return secrets
    .filter(secret => secret.length > 0)
    .reduce((text, secret) => text.split(secret).join("[REDACTED]"), value);
}

function createPinnedAgent(address: string, family: number) {
  const pinnedLookup: LookupFunction = (_hostname, _options, callback) => {
    callback(null, address, family);
  };
  return new Agent({
    connect: {
      lookup: pinnedLookup,
      timeout: 10_000,
    },
    headersTimeout: MCP_REQUEST_TIMEOUT_MS,
    bodyTimeout: MCP_REQUEST_TIMEOUT_MS,
    maxResponseSize: MCP_MAX_RESPONSE_BYTES,
    maxRedirections: 0,
  });
}

function combineSignals(signal?: AbortSignal | null) {
  const timeoutSignal = AbortSignal.timeout(MCP_REQUEST_TIMEOUT_MS);
  return signal ? AbortSignal.any([signal, timeoutSignal]) : timeoutSignal;
}

export function createSafeMcpFetch(): {
  fetch: FetchLike;
  close: () => Promise<void>;
} {
  const agents = new Set<Agent>();

  const safeFetch: FetchLike = async (input, init) => {
    let currentUrl = new URL(input.toString());
    let redirects = 0;

    while (true) {
      const target = await validateMcpTarget(currentUrl.toString());
      const selected = target.addresses[0];
      const agent = createPinnedAgent(selected.address, selected.family);
      agents.add(agent);

      const response = await undiciFetch(target.url, {
        ...(init as Parameters<typeof undiciFetch>[1]),
        dispatcher: agent,
        redirect: "manual",
        signal: combineSignals(init?.signal),
      });

      if (
        response.status !== 307 &&
        response.status !== 308 &&
        response.headers.has("location")
      ) {
        await response.body?.cancel();
        throw new McpSecurityError(
          "REDIRECT_BLOCKED",
          `MCP Endpoint 返回了不允许的重定向状态 ${response.status}`
        );
      }

      if (
        (response.status === 307 || response.status === 308) &&
        response.headers.has("location")
      ) {
        await response.body?.cancel();
        redirects += 1;
        if (redirects > MCP_MAX_REDIRECTS) {
          throw new McpSecurityError(
            "TOO_MANY_REDIRECTS",
            "MCP Endpoint 重定向次数过多"
          );
        }
        currentUrl = resolveMcpRedirect(
          target.url,
          response.headers.get("location")!
        );
        continue;
      }

      return response as unknown as Response;
    }
  };

  return {
    fetch: safeFetch,
    close: async () => {
      await Promise.allSettled([...agents].map(agent => agent.close()));
      agents.clear();
    },
  };
}
