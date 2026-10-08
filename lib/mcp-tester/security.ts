import { isIP } from "node:net";
import {
  isBlockedIpAddress,
  isPrivateNetworkIpAddress,
} from "@/lib/network/ip";
export {
  isBlockedIpAddress,
  isPrivateNetworkIpAddress,
} from "@/lib/network/ip";
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
