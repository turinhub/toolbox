import { Resolver } from "node:dns/promises";
import type { LookupAddress } from "node:dns";
import { connect, checkServerIdentity } from "node:tls";
import {
  getDomainErrorCode,
  normalizeDomainInput,
} from "@/lib/domain-checker/input";
import {
  resolvePublicHost,
  withPublicAddresses,
  withTimeout,
} from "@/lib/domain-checker/network";
import { DomainCheckError } from "@/lib/domain-checker/input";
import { checkHttp } from "@/lib/domain-checker/http";
import { checkRegistration } from "@/lib/domain-checker/rdap";
import type {
  BasicInfo,
  CheckResult,
  DnsInfo,
  DnsRecordType,
  DomainReport,
  DomainTarget,
  SslInfo,
} from "@/lib/domain-checker/types";

export async function checkBasic(
  hostname: string
): Promise<CheckResult<BasicInfo>> {
  try {
    return {
      status: "success",
      data: { addresses: await resolvePublicHost(hostname) },
    };
  } catch (error) {
    return { status: "error", error: getDomainErrorCode(error) };
  }
}

export async function checkDns(
  hostname: string
): Promise<CheckResult<DnsInfo>> {
  const resolver = new Resolver({ timeout: 2500, tries: 1 });
  const queries: [DnsRecordType, () => Promise<string[]>][] = [
    ["A", () => resolver.resolve4(hostname)],
    ["AAAA", () => resolver.resolve6(hostname)],
    ["CNAME", () => resolver.resolveCname(hostname)],
    [
      "MX",
      async () =>
        (await resolver.resolveMx(hostname)).map(
          mx => `${mx.priority} ${mx.exchange}`
        ),
    ],
    ["NS", () => resolver.resolveNs(hostname)],
    [
      "TXT",
      async () =>
        (await resolver.resolveTxt(hostname)).map(parts => parts.join("")),
    ],
  ];
  const data: DnsInfo = { records: {}, failedTypes: [] };
  try {
    await withTimeout(
      Promise.all(
        queries.map(async ([type, query]) => {
          try {
            data.records[type] = await query();
          } catch (error) {
            const code = (error as NodeJS.ErrnoException).code;
            if (code !== "ENODATA" && code !== "ENOTFOUND")
              data.failedTypes.push(type);
          }
        })
      ),
      8000
    );
    const hasRecords = Object.values(data.records).some(
      records => records.length > 0
    );
    if (data.failedTypes.length)
      return {
        status: hasRecords ? "partial" : "error",
        data,
        error: "dnsFailed",
      };
    return hasRecords
      ? { status: "success", data }
      : { status: "notFound", data, error: "dnsNotFound" };
  } catch (error) {
    return { status: "error", error: getDomainErrorCode(error) };
  } finally {
    resolver.cancel();
  }
}

export async function checkSsl(
  target: DomainTarget
): Promise<CheckResult<SslInfo>> {
  const data: SslInfo = {
    valid: false,
    hostname: target.hostname,
    port: target.sslPort,
  };
  try {
    return await withPublicAddresses(
      target.hostname,
      10000,
      (address, timeout) => checkSslAddress(target, data, address, timeout)
    );
  } catch (error) {
    return { status: "error", data, error: getDomainErrorCode(error) };
  }
}

function checkSslAddress(
  target: DomainTarget,
  data: SslInfo,
  address: LookupAddress,
  timeout: number
): Promise<CheckResult<SslInfo>> {
  return new Promise((resolve, reject) => {
    const socket = connect({
      host: address.address,
      port: target.sslPort,
      servername: target.hostname,
      // 仅采集证书，不发送 HTTP 数据；随后分别检查信任、域名和有效期。
      rejectUnauthorized: false,
    });
    let settled = false;
    const finish = (result: CheckResult<SslInfo> | DomainCheckError) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      socket.destroy();
      if (result instanceof DomainCheckError) reject(result);
      else resolve(result);
    };
    const timer = setTimeout(
      () => finish(new DomainCheckError("timeout")),
      timeout
    );
    socket.once("error", () => finish(new DomainCheckError("networkFailed")));
    socket.once("secureConnect", () => {
      try {
        const cert = socket.getPeerCertificate();
        if (!cert || !cert.raw) {
          finish({ status: "error", data, error: "invalidResponse" });
          return;
        }
        const from = new Date(cert.valid_from);
        const to = new Date(cert.valid_to);
        const now = Date.now();
        const valid =
          socket.authorized &&
          !checkServerIdentity(target.hostname, cert) &&
          now >= from.getTime() &&
          now <= to.getTime();
        const text = (value: string | string[] | undefined) =>
          Array.isArray(value) ? value.join(", ") : value;
        const info: SslInfo = {
          ...data,
          valid,
          issuer: text(cert.issuer?.O || cert.issuer?.CN),
          subject: text(cert.subject?.CN),
          subjectAltName: cert.subjectaltname,
          validFrom: from.toISOString(),
          validTo: to.toISOString(),
          daysLeft: Math.floor((to.getTime() - now) / 86400000),
          protocol: socket.getProtocol() || undefined,
          cipher: socket.getCipher()?.name,
          fingerprint: cert.fingerprint256,
        };
        finish({
          status: valid ? "success" : "error",
          data: info,
          error: valid ? undefined : "certificateInvalid",
        });
      } catch {
        finish({ status: "error", data, error: "invalidResponse" });
      }
    });
  });
}

export async function createDomainReport(input: string): Promise<DomainReport> {
  const target = normalizeDomainInput(input);
  const [basic, dns, ssl, whois, performance] = await Promise.all([
    checkBasic(target.hostname),
    checkDns(target.hostname),
    checkSsl(target),
    checkRegistration(target.hostname),
    checkHttp(target),
  ]);
  return {
    target,
    checkedAt: new Date().toISOString(),
    basic,
    dns,
    ssl,
    whois,
    performance,
  };
}
