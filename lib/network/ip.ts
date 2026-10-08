import { isIP } from "node:net";

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
