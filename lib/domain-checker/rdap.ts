import {
  DomainCheckError,
  getDomainErrorCode,
} from "@/lib/domain-checker/input";
import {
  requestPublicUrl,
  type PublicRequest,
} from "@/lib/domain-checker/network";
import type { CheckResult, RegistrationInfo } from "@/lib/domain-checker/types";

const BOOTSTRAP_URL = "https://data.iana.org/rdap/dns.json";
type BootstrapService = [string[], string[]];
let bootstrapCache:
  { expires: number; promise: Promise<BootstrapService[]> } | undefined;

function object(value: unknown): Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

function strings(value: unknown): string[] {
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === "string")
    : [];
}

export function parseBootstrap(value: unknown): BootstrapService[] {
  const services = object(value).services;
  if (!Array.isArray(services)) throw new DomainCheckError("invalidResponse");
  return services.map(service => {
    if (!Array.isArray(service) || service.length !== 2)
      throw new DomainCheckError("invalidResponse");
    const suffixes = strings(service[0]);
    const urls = strings(service[1]).filter(url => {
      try {
        const parsed = new URL(url);
        return (
          parsed.protocol === "https:" && !parsed.username && !parsed.password
        );
      } catch {
        return false;
      }
    });
    return [suffixes, urls];
  });
}

export function findRdapService(
  hostname: string,
  services: BootstrapService[]
) {
  return services
    .flatMap(([suffixes, urls]) =>
      suffixes.flatMap(suffix =>
        (hostname === suffix || hostname.endsWith(`.${suffix}`)) && urls.length
          ? [{ suffix, url: urls[0] }]
          : []
      )
    )
    .sort((a, b) => b.suffix.length - a.suffix.length)[0];
}

export function parseRegistration(
  value: unknown,
  domain: string,
  sourceUrl: string
): RegistrationInfo {
  const data = object(value);
  if (
    typeof data.ldhName !== "string" ||
    data.ldhName.toLowerCase() !== domain
  ) {
    throw new DomainCheckError("invalidResponse");
  }
  const entities = Array.isArray(data.entities)
    ? data.entities.map(object)
    : [];
  const registrar = entities.find(entity =>
    strings(entity.roles).includes("registrar")
  );
  const vcard =
    registrar && Array.isArray(registrar.vcardArray)
      ? registrar.vcardArray[1]
      : [];
  const name = Array.isArray(vcard)
    ? vcard.find(field => Array.isArray(field) && field[0] === "fn")?.[3]
    : undefined;
  const events = Array.isArray(data.events) ? data.events.map(object) : [];
  const date = (action: string) => {
    const value = events.find(event => event.eventAction === action)?.eventDate;
    return typeof value === "string" && Number.isFinite(Date.parse(value))
      ? value
      : undefined;
  };
  const nameservers = Array.isArray(data.nameservers)
    ? data.nameservers.map(object)
    : [];
  return {
    domain,
    sourceUrl,
    registrar: typeof name === "string" ? name.slice(0, 512) : undefined,
    registrationDate: date("registration"),
    expirationDate: date("expiration"),
    updatedDate: date("last changed"),
    statuses: strings(data.status)
      .slice(0, 30)
      .map(status => status.slice(0, 256)),
    nameServers: nameservers
      .flatMap(ns => (typeof ns.ldhName === "string" ? [ns.ldhName] : []))
      .slice(0, 50),
  };
}

async function loadBootstrap(
  request: PublicRequest
): Promise<BootstrapService[]> {
  const load = async () => {
    const response = await request(BOOTSTRAP_URL, {
      method: "GET",
      json: true,
      timeout: 5000,
    });
    if (response.status !== 200) throw new DomainCheckError("networkFailed");
    return parseBootstrap(response.body);
  };
  // 只缓存固定的权威服务目录；失败时允许下一次查询重试。
  if (request !== requestPublicUrl) return load();
  if (!bootstrapCache || bootstrapCache.expires < Date.now()) {
    const promise = load();
    bootstrapCache = { expires: Date.now() + 24 * 60 * 60 * 1000, promise };
    promise.catch(() => {
      if (bootstrapCache?.promise === promise) bootstrapCache = undefined;
    });
  }
  return bootstrapCache.promise;
}

export async function checkRegistration(
  hostname: string,
  request: PublicRequest = requestPublicUrl
): Promise<CheckResult<RegistrationInfo>> {
  const deadline = Date.now() + 12000;
  try {
    const service = findRdapService(hostname, await loadBootstrap(request));
    if (!service)
      return { status: "unsupported", error: "registrationUnsupported" };
    const labels = hostname.split(".");
    const suffixLength = service.suffix.split(".").length;
    const candidates = labels.flatMap((_, index) =>
      labels.length - index > suffixLength
        ? [labels.slice(index).join(".")]
        : []
    );
    // 子域名未找到时向上查询注册域；限制次数，并优先保留接近注册域的候选。
    const domains = [...new Set([hostname, ...candidates.slice(-7)])];
    for (const domain of domains) {
      const remaining = deadline - Date.now();
      if (remaining <= 0) throw new DomainCheckError("timeout");
      const sourceUrl = new URL(
        `domain/${encodeURIComponent(domain)}`,
        service.url.endsWith("/") ? service.url : `${service.url}/`
      ).toString();
      const response = await request(sourceUrl, {
        method: "GET",
        json: true,
        timeout: remaining,
      });
      if (response.status === 404) continue;
      if (response.status === 429) throw new DomainCheckError("rateLimited");
      if (response.status !== 200) throw new DomainCheckError("networkFailed");
      return {
        status: "success",
        data: parseRegistration(response.body, domain, sourceUrl),
      };
    }
    return { status: "notFound", error: "registrationNotFound" };
  } catch (error) {
    return { status: "error", error: getDomainErrorCode(error) };
  }
}
