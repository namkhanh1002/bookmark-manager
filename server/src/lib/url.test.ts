import { describe, expect, it } from "vitest";
import { ApiError } from "../lib/errors";
import {
  isBlockedHostname,
  isPublicIPv4,
  isPublicIPv6,
  normalizedKey,
  normalizeUrl,
} from "../lib/url";

describe("normalizeUrl", () => {
  it("adds https when the scheme is missing", () => {
    expect(normalizeUrl("example.com/docs")).toBe("https://example.com/docs");
  });

  it("keeps http and https schemes", () => {
    expect(normalizeUrl("http://example.com")).toBe("http://example.com/");
    expect(normalizeUrl("https://example.com/a")).toBe("https://example.com/a");
  });

  it("keeps the hash for display but strips it when building the key", () => {
    expect(normalizeUrl("https://example.com/a#section")).toBe("https://example.com/a#section");
    expect(normalizedKey("https://example.com/a#section")).toBe("https://example.com/a");
  });

  it("lowercases the hostname", () => {
    expect(normalizeUrl("HTTPS://EXAMPLE.COM/Path")).toBe("https://example.com/Path");
  });

  it("rejects non http schemes", () => {
    expect(() => normalizeUrl("ftp://example.com")).toThrow(ApiError);
    expect(() => normalizeUrl("javascript:alert(1)")).toThrow(ApiError);
    expect(() => normalizeUrl("data:text/html,hi")).toThrow(ApiError);
  });

  it("rejects empty values", () => {
    expect(() => normalizeUrl("   ")).toThrow(ApiError);
  });
});

describe("normalizedKey", () => {
  it("strips tracking parameters and hash", () => {
    expect(normalizedKey("https://example.com/post?utm_source=x&id=2#top")).toBe(
      "https://example.com/post?id=2",
    );
  });

  it("drops the trailing slash for the root path", () => {
    expect(normalizedKey("https://example.com/")).toBe("https://example.com");
  });

  it("produces the same key for equivalent urls", () => {
    expect(normalizedKey("Example.com:8080/a?fbclid=1")).toBe(normalizedKey("https://example.com:8080/a"));
  });
});

describe("isPublicIPv4", () => {
  it("accepts public addresses", () => {
    expect(isPublicIPv4("93.184.216.34")).toBe(true);
    expect(isPublicIPv4("172.64.155.209")).toBe(true);
  });

  it("rejects private and reserved ranges", () => {
    expect(isPublicIPv4("127.0.0.1")).toBe(false);
    expect(isPublicIPv4("10.1.2.3")).toBe(false);
    expect(isPublicIPv4("192.168.1.1")).toBe(false);
    expect(isPublicIPv4("172.16.0.1")).toBe(false);
    expect(isPublicIPv4("172.32.0.1")).toBe(true);
    expect(isPublicIPv4("169.254.169.254")).toBe(false);
    expect(isPublicIPv4("0.0.0.0")).toBe(false);
    expect(isPublicIPv4("100.64.0.1")).toBe(false);
    expect(isPublicIPv4("255.255.255.255")).toBe(false);
  });
});

describe("isPublicIPv6", () => {
  it("accepts public addresses", () => {
    expect(isPublicIPv6("2606:4700:4700::1111")).toBe(true);
  });

  it("rejects loopback, link local and ula", () => {
    expect(isPublicIPv6("::1")).toBe(false);
    expect(isPublicIPv6("::")).toBe(false);
    expect(isPublicIPv6("fe80::1")).toBe(false);
    expect(isPublicIPv6("fc00::1")).toBe(false);
    expect(isPublicIPv6("fd12:3456::1")).toBe(false);
    expect(isPublicIPv6("::ffff:192.168.0.1")).toBe(false);
    expect(isPublicIPv6("::ffff:8.8.8.8")).toBe(true);
  });
});

describe("isBlockedHostname", () => {
  it("blocks local and internal hosts", () => {
    expect(isBlockedHostname("localhost")).toBe(true);
    expect(isBlockedHostname("app.localhost")).toBe(true);
    expect(isBlockedHostname("printer.local")).toBe(true);
    expect(isBlockedHostname("db.internal")).toBe(true);
    expect(isBlockedHostname("intranet")).toBe(true);
    expect(isBlockedHostname("metadata.google.internal")).toBe(true);
  });

  it("blocks ip literals in private ranges", () => {
    expect(isBlockedHostname("127.0.0.1")).toBe(true);
    expect(isBlockedHostname("169.254.169.254")).toBe(true);
    expect(isBlockedHostname("192.168.0.10")).toBe(true);
    expect(isBlockedHostname("[::1]")).toBe(true);
    expect(isBlockedHostname("0.0.0.0")).toBe(true);
  });

  it("allows public hosts", () => {
    expect(isBlockedHostname("example.com")).toBe(false);
    expect(isBlockedHostname("93.184.216.34")).toBe(false);
    expect(isBlockedHostname("neon.tech")).toBe(false);
  });
});
