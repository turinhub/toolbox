import type { DomainErrorCode, DomainTarget } from "@/lib/domain-checker/types";

export class DomainCheckError extends Error {
  constructor(public readonly code: DomainErrorCode) {
    super(code);
    this.name = "DomainCheckError";
  }
}

export function normalizeDomainInput(input: string): DomainTarget {
  const value = input.trim();
  if (!value || value.length > 2048 || /[\s\\\u0000-\u001f]/.test(value)) {
    throw new DomainCheckError("invalidInput");
  }
  const hasScheme = /^[a-z][a-z\d+.-]*:\/\//i.test(value);
  if (hasScheme && !/^https?:\/\//i.test(value)) {
    throw new DomainCheckError("unsupportedProtocol");
  }
  // 拒绝缺少双斜杠的协议写法，避免 URL 自动纠正到意外目标。
  if (/^https?:/i.test(value) && !hasScheme) {
    throw new DomainCheckError("invalidInput");
  }
  let url: URL;
  try {
    url = new URL(hasScheme ? value : `https://${value.replace(/^\/\//, "")}`);
  } catch {
    throw new DomainCheckError("invalidInput");
  }
  if (url.username || url.password) {
    throw new DomainCheckError("credentialsNotAllowed");
  }
  const hostname = url.hostname.toLowerCase().replace(/\.$/, "");
  const labels = hostname.split(".");
  if (
    hostname.length > 253 ||
    labels.length < 2 ||
    labels.some(label => !/^[a-z\d](?:[a-z\d-]{0,61}[a-z\d])?$/.test(label)) ||
    !/[a-z]/.test(labels.at(-1)!)
  ) {
    throw new DomainCheckError("invalidInput");
  }
  url.hostname = hostname;
  url.hash = "";
  const protocol = url.protocol as DomainTarget["protocol"];
  const port = Number(url.port || (protocol === "https:" ? 443 : 80));
  if (!port) throw new DomainCheckError("invalidInput");
  return {
    hostname,
    url: url.toString(),
    protocol,
    port,
    sslPort: protocol === "https:" ? port : 443,
  };
}

export function getDomainErrorCode(error: unknown): DomainErrorCode {
  if (error instanceof DomainCheckError) return error.code;
  return "networkFailed";
}
