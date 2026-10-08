export type DomainErrorCode =
  | "invalidInput"
  | "unsupportedProtocol"
  | "credentialsNotAllowed"
  | "humanVerificationRequired"
  | "blockedAddress"
  | "dnsFailed"
  | "dnsNotFound"
  | "timeout"
  | "networkFailed"
  | "invalidResponse"
  | "certificateInvalid"
  | "redirectLoop"
  | "tooManyRedirects"
  | "registrationUnsupported"
  | "registrationNotFound"
  | "rateLimited";

export interface DomainTarget {
  hostname: string;
  url: string;
  protocol: "http:" | "https:";
  port: number;
  sslPort: number;
}

export interface CheckResult<T> {
  status: "success" | "partial" | "error" | "unsupported" | "notFound";
  data?: T;
  error?: DomainErrorCode;
}

export interface BasicInfo {
  addresses: { address: string; family: number }[];
}

export type DnsRecordType = "A" | "AAAA" | "CNAME" | "MX" | "NS" | "TXT";
export interface DnsInfo {
  records: Partial<Record<DnsRecordType, string[]>>;
  failedTypes: DnsRecordType[];
}

export interface SslInfo {
  valid: boolean;
  hostname: string;
  port: number;
  issuer?: string;
  subject?: string;
  subjectAltName?: string;
  validFrom?: string;
  validTo?: string;
  daysLeft?: number;
  protocol?: string;
  cipher?: string;
  fingerprint?: string;
}

export interface RegistrationInfo {
  domain: string;
  sourceUrl: string;
  registrar?: string;
  registrationDate?: string;
  expirationDate?: string;
  updatedDate?: string;
  statuses: string[];
  nameServers: string[];
}

export interface HttpHop {
  url: string;
  status: number;
  responseTime: number;
  method: "HEAD" | "GET";
  location?: string;
}

export const SECURITY_HEADERS = [
  "strict-transport-security",
  "content-security-policy",
  "x-content-type-options",
  "x-frame-options",
  "referrer-policy",
  "permissions-policy",
  "cross-origin-opener-policy",
] as const;

export interface HttpInfo {
  responseTime: number;
  httpStatus?: number;
  finalUrl?: string;
  hops: HttpHop[];
  headers: Record<string, string>;
}

export interface DomainReport {
  target: DomainTarget;
  checkedAt: string;
  basic: CheckResult<BasicInfo>;
  dns: CheckResult<DnsInfo>;
  ssl: CheckResult<SslInfo>;
  whois: CheckResult<RegistrationInfo>;
  performance: CheckResult<HttpInfo>;
}
