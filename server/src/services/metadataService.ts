import http from "node:http";
import https from "node:https";
import { ApiError } from "../lib/errors";
import {
  assertAddressesPublic,
  isBlockedHostname,
  lookupAddresses,
  normalizeUrl,
  pinnedLookup,
} from "../lib/url";

const MAX_BODY_BYTES = 512 * 1024;
const TIMEOUT_MS = 5000;
const MAX_REDIRECTS = 3;
const USER_AGENT = "BookmarkManager/1.0 (+https://localhost; metadata fetcher)";

export interface PageMetadata {
  url: string;
  title: string | null;
  description: string | null;
  faviconUrl: string | null;
  source: "remote" | "fallback";
}

interface HopResult {
  redirect?: string;
  body?: string;
}

export async function fetchMetadata(rawUrl: string): Promise<PageMetadata> {
  const target = normalizeUrl(rawUrl);
  const fallback = buildFallback(target);

  try {
    const html = await fetchHtml(target);
    if (!html) return fallback;

    const parsed = parseMetadata(html, new URL(target));
    if (!parsed.title && !parsed.description && !parsed.faviconUrl) return fallback;

    return {
      url: target,
      title: parsed.title ?? fallback.title,
      description: parsed.description,
      faviconUrl: parsed.faviconUrl ?? fallback.faviconUrl,
      source: "remote",
    };
  } catch (err) {
    if (err instanceof ApiError) throw err;
    return fallback;
  }
}

function buildFallback(url: string): PageMetadata {
  const parsed = new URL(url);
  const host = parsed.hostname.replace(/^www\./, "");
  return {
    url,
    title: host,
    description: null,
    faviconUrl: `https://www.google.com/s2/favicons?sz=64&domain=${encodeURIComponent(parsed.hostname)}`,
    source: "fallback",
  };
}

async function fetchHtml(startUrl: string): Promise<string> {
  let current = startUrl;

  for (let hop = 0; hop <= MAX_REDIRECTS; hop += 1) {
    const result = await requestOnce(current);
    if (result.redirect) {
      current = result.redirect;
      continue;
    }
    return result.body ?? "";
  }

  throw new Error("Too many redirects");
}

function requestOnce(rawUrl: string): Promise<HopResult> {
  return new Promise((resolve, reject) => {
    let url: URL;
    try {
      url = new URL(rawUrl);
    } catch {
      reject(new ApiError(400, "INVALID_URL", "Invalid URL"));
      return;
    }

    if (url.protocol !== "http:" && url.protocol !== "https:") {
      reject(new ApiError(400, "INVALID_URL", "Only http and https URLs are supported"));
      return;
    }

    if (isBlockedHostname(url.hostname)) {
      reject(new ApiError(400, "INVALID_URL", `"${url.hostname}" is not a public address`));
      return;
    }

    lookupAddresses(url.hostname)
      .then((addresses) => {
        assertAddressesPublic(url.hostname, addresses);

        const transport = url.protocol === "https:" ? https : http;
        const request = transport.request(
          {
            protocol: url.protocol,
            hostname: url.hostname,
            port: url.port || undefined,
            path: `${url.pathname}${url.search}`,
            method: "GET",
            headers: {
              "user-agent": USER_AGENT,
              accept: "text/html,application/xhtml+xml",
              "accept-language": "*",
            },
            timeout: TIMEOUT_MS,
            lookup: pinnedLookup(addresses) as never,
          },
          (response) => {
            const status = response.statusCode ?? 0;

            if (status >= 300 && status < 400 && response.headers.location) {
              response.resume();
              try {
                const next = new URL(response.headers.location, url);
                resolve({ redirect: next.toString() });
              } catch {
                reject(new Error("Invalid redirect location"));
              }
              return;
            }

            const contentType = String(response.headers["content-type"] ?? "");
            if (status >= 400) {
              response.resume();
              reject(new Error(`Upstream responded with status ${status}`));
              return;
            }
            if (contentType && !/text\/html|application\/xhtml\+xml/i.test(contentType)) {
              response.resume();
              resolve({ body: "" });
              return;
            }

            const chunks: Buffer[] = [];
            let size = 0;
            let settled = false;

            const finish = (fn: () => void) => {
              if (settled) return;
              settled = true;
              fn();
            };

            response.on("data", (chunk: Buffer) => {
              size += chunk.length;
              if (size <= MAX_BODY_BYTES) {
                chunks.push(chunk);
              }
              if (size > MAX_BODY_BYTES) {
                response.destroy();
                finish(() => resolve({ body: Buffer.concat(chunks).toString("utf8") }));
              }
            });
            response.on("end", () => finish(() => resolve({ body: Buffer.concat(chunks).toString("utf8") })));
            response.on("error", (err) => finish(() => reject(err)));
          },
        );

        request.on("timeout", () => {
          request.destroy(new Error("Request timed out"));
        });
        request.on("error", (err) => reject(err));
        request.end();
      })
      .catch((err) => reject(err));
  });
}

export function parseMetadata(
  html: string,
  base: URL,
): { title: string | null; description: string | null; faviconUrl: string | null } {
  const head = html.slice(0, Math.min(html.length, 64 * 1024));
  const meta: Record<string, string> = {};

  for (const tag of matchTags(head, /<meta\b[^>]*>/gi)) {
    const attributes = parseAttributes(tag);
    const key = (attributes.property ?? attributes.name ?? attributes.itemprop ?? "").toLowerCase();
    const content = attributes.content;
    if (key && content && meta[key] === undefined) meta[key] = content;
  }

  let favicon: string | null = null;
  let baseHref: string | null = null;

  for (const tag of matchTags(head, /<link\b[^>]*>/gi)) {
    const attributes = parseAttributes(tag);
    const rel = (attributes.rel ?? "").toLowerCase();
    if (rel.split(/\s+/).includes("icon") && attributes.href) {
      favicon = attributes.href;
      break;
    }
  }

  const baseTag = matchTags(head, /<base\b[^>]*>/gi)[0];
  if (baseTag) {
    const attributes = parseAttributes(baseTag);
    if (attributes.href) baseHref = attributes.href;
  }

  let baseUrl = base;
  if (baseHref) {
    try {
      baseUrl = new URL(baseHref, base);
    } catch {
      baseUrl = base;
    }
  }

  const rawTitle =
    meta["og:title"] ?? meta["twitter:title"] ?? extractTag(head, "title") ?? null;
  const description =
    meta["og:description"] ?? meta["description"] ?? meta["twitter:description"] ?? null;

  let faviconUrl: string | null = null;
  if (favicon) {
    try {
      faviconUrl = new URL(favicon, baseUrl).toString();
    } catch {
      faviconUrl = null;
    }
  }

  return {
    title: cleanText(rawTitle, 300),
    description: cleanText(description, 1000),
    faviconUrl,
  };
}

function matchTags(html: string, pattern: RegExp): string[] {
  return [...html.matchAll(pattern)].map((match) => match[0]);
}

function extractTag(html: string, tag: string): string | null {
  const match = html.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, "i"));
  return match ? match[1] : null;
}

function parseAttributes(tag: string): Record<string, string> {
  const attributes: Record<string, string> = {};
  const pattern = /([a-zA-Z_:][-a-zA-Z0-9_:.]*)\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'>]+))/g;

  for (const match of tag.matchAll(pattern)) {
    const name = match[1].toLowerCase();
    const value = match[2] ?? match[3] ?? match[4] ?? "";
    attributes[name] = decodeEntities(value);
  }
  return attributes;
}

export function cleanText(value: string | null | undefined, maxLength: number): string | null {
  if (!value) return null;
  const decoded = decodeEntities(value).replace(/\s+/g, " ").trim();
  if (!decoded) return null;
  return decoded.length > maxLength ? `${decoded.slice(0, maxLength - 1).trimEnd()}…` : decoded;
}

function decodeEntities(value: string): string {
  const named: Record<string, string> = {
    amp: "&",
    lt: "<",
    gt: ">",
    quot: '"',
    apos: "'",
    "#39": "'",
    nbsp: " ",
  };

  return value
    .replace(/&(#x?[0-9a-fA-F]+|[a-zA-Z]+);/g, (entity, body: string) => {
      const key = body.toLowerCase();
      if (key.startsWith("#x")) {
        const code = parseInt(key.slice(2), 16);
        return Number.isFinite(code) ? String.fromCodePoint(code) : entity;
      }
      if (key.startsWith("#")) {
        const code = parseInt(key.slice(1), 10);
        return Number.isFinite(code) ? String.fromCodePoint(code) : entity;
      }
      return named[key] ?? entity;
    });
}
