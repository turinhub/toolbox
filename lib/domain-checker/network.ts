import { lookup } from "node:dns/promises";
import type { LookupAddress } from "node:dns";
import http from "node:http";
import https from "node:https";
import {
  DomainCheckError,
  getDomainErrorCode,
  normalizeDomainInput,
} from "@/lib/domain-checker/input";
import { isBlockedIpAddress } from "@/lib/network/ip";
import type { DomainTarget } from "@/lib/domain-checker/types";

export async function withTimeout<T>(
  promise: Promise<T>,
  milliseconds: number
): Promise<T> {
  let timer: ReturnType<typeof setTimeout>;
  try {
    return await Promise.race([
      promise,
      new Promise<never>((_, reject) => {
        timer = setTimeout(
          () => reject(new DomainCheckError("timeout")),
          milliseconds
        );
      }),
    ]);
  } finally {
    clearTimeout(timer!);
  }
}

export async function resolvePublicHost(
  hostname: string,
  timeout = 5000,
  resolveHost: (hostname: string) => Promise<LookupAddress[]> = name =>
    lookup(name, { all: true, verbatim: true })
): Promise<LookupAddress[]> {
  let addresses: LookupAddress[];
  try {
    addresses = await withTimeout(resolveHost(hostname), timeout);
  } catch (error) {
    if (error instanceof DomainCheckError) throw error;
    throw new DomainCheckError("dnsFailed");
  }
  if (!addresses.length) throw new DomainCheckError("dnsFailed");
  if (addresses.some(({ address }) => isBlockedIpAddress(address))) {
    throw new DomainCheckError("blockedAddress");
  }
  return addresses;
}

export async function withPublicAddresses<T>(
  hostname: string,
  timeout: number,
  attempt: (address: LookupAddress, timeout: number) => Promise<T>
): Promise<T> {
  const deadline = Date.now() + timeout;
  const addresses = await resolvePublicHost(hostname, Math.min(timeout, 5000));
  for (let index = 0; index < addresses.length; index++) {
    const remaining = deadline - Date.now();
    if (remaining <= 0) throw new DomainCheckError("timeout");
    // 每个连接尝试均可取消，并为后续已验证地址保留总超时预算。
    const attemptTimeout = Math.max(
      1,
      Math.floor(remaining / (addresses.length - index))
    );
    try {
      return await attempt(addresses[index], attemptTimeout);
    } catch (error) {
      const code = getDomainErrorCode(error);
      if (
        (code !== "networkFailed" && code !== "timeout") ||
        index === addresses.length - 1
      ) {
        throw error;
      }
    }
  }
  throw new DomainCheckError("networkFailed");
}

export interface PublicResponse {
  status: number;
  headers: Record<string, string>;
  responseTime: number;
  body?: unknown;
}

export type PublicRequest = (
  url: string,
  options: { method: "HEAD" | "GET"; timeout: number; json?: boolean }
) => Promise<PublicResponse>;

export const requestPublicUrl: PublicRequest = async (input, options) => {
  const started = Date.now();
  const target = normalizeDomainInput(input);
  return withPublicAddresses(
    target.hostname,
    options.timeout,
    (address, timeout) =>
      requestPublicAddress(target, options, address, timeout, started)
  );
};

function requestPublicAddress(
  target: DomainTarget,
  options: Parameters<PublicRequest>[1],
  address: LookupAddress,
  timeout: number,
  started: number
): Promise<PublicResponse> {
  return new Promise((resolve, reject) => {
    const request = target.protocol === "https:" ? https.request : http.request;
    const req = request(
      target.url,
      {
        method: options.method,
        agent: false,
        family: address.family,
        // 固定已验证的 IP；异步回调确保 TLS 初始化完成后才连接。
        lookup: (_hostname, _options, callback) =>
          process.nextTick(() =>
            callback(null, address.address, address.family)
          ),
        headers: {
          "User-Agent": "Turinhub-Domain-Checker/1.0",
          Accept: options.json
            ? "application/rdap+json, application/json"
            : "*/*",
        },
      },
      res => {
        const headers: Record<string, string> = {};
        for (const [name, value] of Object.entries(res.headers)) {
          if (value !== undefined && name !== "set-cookie") {
            headers[name] = Array.isArray(value) ? value.join(", ") : value;
          }
        }
        const response = {
          status: res.statusCode || 0,
          headers,
          responseTime: Date.now() - started,
        };
        if (!options.json || response.status !== 200) {
          clearTimeout(timer);
          res.destroy();
          resolve(response);
          return;
        }
        const chunks: Buffer[] = [];
        let size = 0;
        res.on("data", (chunk: Buffer) => {
          size += chunk.length;
          if (size > 1024 * 1024) {
            req.destroy(new DomainCheckError("invalidResponse"));
            return;
          }
          chunks.push(chunk);
        });
        res.on("error", () => {
          clearTimeout(timer);
          reject(new DomainCheckError("networkFailed"));
        });
        res.on("end", () => {
          clearTimeout(timer);
          try {
            resolve({
              ...response,
              body: JSON.parse(Buffer.concat(chunks).toString("utf8")),
            });
          } catch {
            reject(new DomainCheckError("invalidResponse"));
          }
        });
      }
    );
    const timer = setTimeout(
      () => req.destroy(new DomainCheckError("timeout")),
      timeout
    );
    req.on("error", error => {
      clearTimeout(timer);
      reject(
        error instanceof DomainCheckError
          ? error
          : new DomainCheckError("networkFailed")
      );
    });
    req.end();
  });
}
