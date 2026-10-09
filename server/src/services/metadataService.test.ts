import { describe, expect, it } from "vitest";
import { cleanText, parseMetadata } from "./metadataService";

const html = `<!doctype html>
<html>
  <head>
    <title>Fallback title</title>
    <meta name="description" content="Plain description" />
    <meta property="og:title" content="Open Graph Title" />
    <meta property="og:description" content="Graph &amp; description" />
    <link rel="stylesheet" href="/styles.css" />
    <link rel="icon" href="/favicon.ico" />
  </head>
  <body><h1>hi</h1></body>
</html>`;

describe("parseMetadata", () => {
  it("prefers open graph values", () => {
    const result = parseMetadata(html, new URL("https://example.com/page"));
    expect(result.title).toBe("Open Graph Title");
    expect(result.description).toBe("Graph & description");
    expect(result.faviconUrl).toBe("https://example.com/favicon.ico");
  });

  it("falls back to title and meta description", () => {
    const result = parseMetadata(
      `<title>  My   Page  </title><meta name="description" content="desc">`,
      new URL("https://example.com"),
    );
    expect(result.title).toBe("My Page");
    expect(result.description).toBe("desc");
    expect(result.faviconUrl).toBeNull();
  });

  it("resolves relative icon urls against base tag", () => {
    const result = parseMetadata(
      `<base href="/blog/"><link rel="shortcut icon" href="icon.png">`,
      new URL("https://example.com/other"),
    );
    expect(result.faviconUrl).toBe("https://example.com/blog/icon.png");
  });

  it("returns nulls for empty documents", () => {
    const result = parseMetadata("<html><body></body></html>", new URL("https://example.com"));
    expect(result.title).toBeNull();
    expect(result.description).toBeNull();
    expect(result.faviconUrl).toBeNull();
  });
});

describe("cleanText", () => {
  it("collapses whitespace and trims", () => {
    expect(cleanText("  a\n\t b  ", 100)).toBe("a b");
  });

  it("truncates long values", () => {
    expect(cleanText("x".repeat(50), 10)).toBe(`${"x".repeat(9)}…`);
  });

  it("returns null for empty values", () => {
    expect(cleanText("   ", 10)).toBeNull();
    expect(cleanText(null, 10)).toBeNull();
  });
});
