import { lookup as dnsLookup } from "node:dns";
import { ApiError } from "./errors";

const TRACKING_PARAMS = new Set([
  "utm_source",
  "utm_medium",
  "utm_campaign",
  "utm_term",
  "utm_content",
  "fbclid",
  "gclid",
  "mc_cid",
  "mc_eid",
]);

const BLOCKED_HOSTNAMES = new Set([
  "localhost",
  "metadata.google.internal",
  "instance-data",
  "metadata",
]);

const BLOCKED_HOST_SUFFIXES = [".localhost", ".local", ".internal", ".lan", ".home", ".intranet"];

export function normalizeUrl(raw: string): string {
  const trimmed = raw.trim();
  if (!trimmed) {
    throw new ApiError(400, "INVALID_URL", "URL không được để trống");
  }

  if (/^[a-zA-Z][a-zA-Z0-9+.-]*:\/\//.test(trimmed) && !/^https?:\/\//i.test(trimmed)) {
    throw new ApiError(400, "INVALID_URL", "Chỉ hỗ trợ URL http và https");
  }

  const withProtocol = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;

  let parsed: URL;
  try {
    parsed = new URL(withProtocol);
  } catch {
    throw new ApiError(400, "INVALID_URL", `"${raw}" không phải URL hợp lệ`);
  }

  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    throw new ApiError(400, "INVALID_URL", "Chỉ hỗ trợ URL http và https");
  }

  return parsed.toString();
}

export function normalizedKey(raw: string): string {
  const url = new URL(normalizeUrl(raw));
  url.hash = "";
  url.hostname = url.hostname.toLowerCase();

  const params = [...url.searchParams.entries()].filter(
    ([key]) => !TRACKING_PARAMS.has(key.toLowerCase()),
  );
  url.search = "";
  for (const [key, value] of params) url.searchParams.append(key, value);

  let result = url.toString();
  if (url.pathname === "/" && url.search === "") {
    result = result.replace(/\/$/, "");
  }
  return result;
}

export function hostnameOf(raw: string): string {
  return new URL(normalizeUrl(raw)).hostname.toLowerCase();
}

export function isBlockedHostname(hostname: string): boolean {
  const host = hostname.toLowerCase().replace(/\.$/, "");

  if (BLOCKED_HOSTNAMES.has(host)) return true;
  if (BLOCKED_HOST_SUFFIXES.some((suffix) => host.endsWith(suffix))) return true;
  if (!host.includes(".")) return true;

  const ipv4 = parseIPv4(host);
  if (ipv4) return !isPublicIPv4(host);

  if (host.startsWith("[") || host.includes(":")) {
    return !isPublicIPv6(host.replace(/^\[|\]$/g, ""));
  }

  return false;
}

export interface ResolvedAddress {
  address: string;
  family: number;
}

export function lookupAddresses(hostname: string): Promise<ResolvedAddress[]> {
  return new Promise((resolve, reject) => {
    dnsLookup(hostname, { all: true, verbatim: true }, (err, addresses) => {
      if (err) {
        reject(new ApiError(400, "INVALID_URL", `Không thể phân giải host "${hostname}"`));
        return;
      }
      if (!addresses || addresses.length === 0) {
        reject(new ApiError(400, "INVALID_URL", `Không thể phân giải host "${hostname}"`));
        return;
      }
      resolve(addresses);
    });
  });
}

export function assertAddressesPublic(hostname: string, addresses: ResolvedAddress[]): void {
  const unsafe = addresses.find(({ address }) => {
    const family = address.includes(":") ? 6 : 4;
    return family === 4 ? !isPublicIPv4(address) : !isPublicIPv6(address);
  });
  if (unsafe) {
    throw new ApiError(400, "INVALID_URL", `"${hostname}" trỏ đến địa chỉ mạng nội bộ`);
  }
}

function parseIPv4(value: string): number[] | null {
  const parts = value.split(".");
  if (parts.length !== 4) return null;
  const octets = parts.map((part) => Number(part));
  if (octets.some((octet) => !Number.isInteger(octet) || octet < 0 || octet > 255)) return null;
  if (parts.some((part) => part.length > 1 && part.startsWith("0"))) return null;
  return octets;
}

export function isPublicIPv4(value: string): boolean {
  const octets = parseIPv4(value);
  if (!octets) return false;
  const [a, b, c] = octets;

  if (a === 0 || a === 10 || a === 127 || a >= 224) return false;
  if (a === 100 && b >= 64 && b <= 127) return false;
  if (a === 169 && b === 254) return false;
  if (a === 172 && b >= 16 && b <= 31) return false;
  if (a === 192 && b === 168) return false;
  if (a === 192 && b === 0 && c === 0) return false;
  if (a === 192 && b === 0 && c === 2) return false;
  if (a === 198 && (b === 18 || b === 19)) return false;
  if (a === 198 && b === 51 && c === 100) return false;
  if (a === 203 && b === 0 && c === 113) return false;

  return true;
}

export function isPublicIPv6(value: string): boolean {
  const address = value.toLowerCase().replace(/^\[|\]$/g, "");
  if (!address) return false;

  const mapped = address.match(/^::ffff:(\d{1,3}(?:\.\d{1,3}){3})$/);
  if (mapped) return isPublicIPv4(mapped[1]);

  const groups = expandIPv6(address);
  if (!groups) return false;

  const g0 = groups[0];
  const g1 = groups[1];
  const g2 = groups[2];
  const g3 = groups[3];
  const g7 = groups[7];

  const isAllZero = groups.every((group) => group === 0);
  if (isAllZero) return false;
  if (groups.slice(0, 7).every((group) => group === 0) && g7 === 1) return false;

  if ((g0 & 0xfe00) === 0xfc00) return false;
  if ((g0 & 0xffc0) === 0xfe80) return false;
  if ((g0 & 0xff00) === 0xff00) return false;

  if (g0 === 0x2001 && g1 === 0x0db8) return false;
  if (g0 === 0x2001 && g1 === 0x0000) return false;
  if (g0 === 0x2002) return false;
  if (g0 === 0x0100 && g1 === 0 && g2 === 0 && g3 === 0) return false;
  if (g0 === 0x0064 && g1 === 0xff9b) return false;

  return true;
}

function expandIPv6(address: string): number[] | null {
  if (!address.includes(":")) return null;
  const [head, tail, extra] = address.split("::");
  if (extra !== undefined) return null;

  const parseSide = (side: string | undefined): number[] | null => {
    if (side === undefined || side === "") return [];
    const parts = side.split(":");
    const values: number[] = [];
    for (const part of parts) {
      if (part === "") return null;
      if (part.includes(".")) {
        const octets = parseIPv4(part);
        if (!octets) return null;
        values.push((octets[0] << 8) | octets[1], (octets[2] << 8) | octets[3]);
        continue;
      }
      if (!/^[0-9a-f]{1,4}$/i.test(part)) return null;
      values.push(parseInt(part, 16));
    }
    return values;
  };

  const headGroups = parseSide(head);
  const tailGroups = parseSide(tail);
  if (!headGroups || !tailGroups) return null;

  const missing = 8 - headGroups.length - tailGroups.length;
  if (missing < 0) return null;

  const full = [...headGroups, ...new Array(missing).fill(0), ...tailGroups];
  if (address.includes("::") && missing === 0) return null;
  if (!address.includes("::") && full.length !== 8) return null;
  return full;
}

export function pinnedLookup(addresses: ResolvedAddress[]) {
  return (
    hostname: string,
    options: { all?: boolean },
    callback: (
      err: NodeJS.ErrnoException | null,
      address: string | ResolvedAddress[],
      family?: number,
    ) => void,
  ): void => {
    void hostname;
    if (options?.all) {
      callback(null, addresses);
      return;
    }
    const first = addresses[0];
    callback(null, first.address, first.family);
  };
}
