const MARKDOWN_CONTENT_TYPE = "text/markdown; charset=utf-8";

const HOME_PATHS = new Set(["/", "/index.html"]);
const BOOKSHELF_PATHS = new Set(["/bookshelf", "/bookshelf.html"]);

export async function onRequest(context) {
  const { request } = context;

  if (request.method !== "GET" && request.method !== "HEAD") {
    return context.next();
  }

  if (!prefersMarkdown(request.headers.get("Accept"))) {
    return context.next();
  }

  const url = new URL(request.url);
  if (!HOME_PATHS.has(url.pathname) && !BOOKSHELF_PATHS.has(url.pathname)) {
    return context.next();
  }

  try {
    const data = await loadBackupData(context, url);
    const markdown = HOME_PATHS.has(url.pathname)
      ? buildHomeMarkdown(data.home, url.origin)
      : buildBookshelfMarkdown(data.books, url.origin);

    return markdownResponse(markdown, request.method);
  } catch (error) {
    console.error("Unable to create Markdown response", error);
    return context.next();
  }
}

function prefersMarkdown(acceptHeader) {
  if (!acceptHeader) return false;

  const ranges = acceptHeader
    .split(",")
    .map((part, index) => parseMediaRange(part, index))
    .filter(Boolean);

  const markdown = bestMatch(ranges, "text/markdown", false);
  if (!markdown || markdown.q <= 0) return false;

  const html = bestMatch(ranges, "text/html", true);
  if (!html || html.q <= 0) return true;

  if (markdown.q !== html.q) return markdown.q > html.q;
  if (markdown.index !== html.index) return markdown.index < html.index;

  // A shared text/* range follows Cloudflare's documented Markdown behavior.
  return markdown.mediaType === "text/*";
}

function parseMediaRange(part, index) {
  const [rawMediaType, ...rawParameters] = part.split(";");
  const mediaType = rawMediaType.trim().toLowerCase();
  if (!mediaType.includes("/")) return null;

  let q = 1;
  for (const parameter of rawParameters) {
    const [name, rawValue] = parameter.split("=");
    if (name?.trim().toLowerCase() !== "q") continue;

    const parsed = Number(rawValue?.trim());
    q = Number.isFinite(parsed) ? Math.min(Math.max(parsed, 0), 1) : 0;
  }

  return { mediaType, q, index };
}

function bestMatch(ranges, target, includeAny) {
  const [targetType] = target.split("/");
  const matches = ranges
    .map((range) => {
      let specificity = -1;
      if (range.mediaType === target) specificity = 2;
      else if (range.mediaType === `${targetType}/*`) specificity = 1;
      else if (includeAny && range.mediaType === "*/*") specificity = 0;
      return { ...range, specificity };
    })
    .filter((range) => range.specificity >= 0)
    .sort(
      (a, b) =>
        b.specificity - a.specificity || b.q - a.q || a.index - b.index,
    );

  return matches[0] || null;
}

async function loadBackupData(context, requestUrl) {
  const backupUrl = new URL("/backup.json", requestUrl);
  const response = await context.env.ASSETS.fetch(backupUrl);

  if (!response.ok) {
    throw new Error(`backup.json returned ${response.status}`);
  }

  const data = await response.json();
  if (!data || !Array.isArray(data.books)) {
    throw new Error("backup.json has an unexpected format");
  }

  return data;
}

function buildHomeMarkdown(home = {}, origin) {
  const name = cleanText(home.Name) || "Charles M. Hershey";
  const bio = cleanText(home.Bio) || "Personal bookshelf and portfolio.";

  return `---
title: ${yamlString(`${name} — Bookshelf & Portfolio`)}
description: ${yamlString(bio)}
canonical: ${yamlString(`${origin}/`)}
---

# ${escapeMarkdown(name)}

${escapeMarkdown(bio)}

## Explore

- [Personal Bookshelf](${origin}/bookshelf.html)
- [LinkedIn](https://www.linkedin.com/in/cmhershey)

To send Charles a message, use the Contact Me form on the [HTML homepage](${origin}/).
`;
}

function buildBookshelfMarkdown(books = [], origin) {
  const bookSections = books.map((book, index) => {
    const title = escapeMarkdown(cleanText(book.title) || "Untitled");
    const author = escapeMarkdown(cleanText(book.author) || "Unknown author");
    const summary = escapeMarkdown(cleanText(book.summary));
    const isbn = escapeMarkdown(cleanText(book.isbn));
    const amazonUrl = safeHttpUrl(book.amazonLink);

    const details = [`- **Author:** ${author}`];
    if (isbn) details.push(`- **ISBN:** ${isbn}`);
    if (amazonUrl) details.push(`- [View on Amazon](${amazonUrl})`);

    return `## ${index + 1}. ${title}

${details.join("\n")}${summary ? `\n\n${summary}` : ""}`;
  });

  return `---
title: "Bookshelf — Charles M. Hershey"
description: "The books Charles M. Hershey is reading and has read."
canonical: ${yamlString(`${origin}/bookshelf.html`)}
book_count: ${books.length}
---

# Personal Bookshelf

The books Charles M. Hershey is reading and has read. This Markdown response is generated from the same data used by the visual bookshelf.

${bookSections.join("\n\n")}
`;
}

function markdownResponse(markdown, method) {
  const headers = new Headers({
    "Cache-Control": "public, max-age=300",
    "Content-Signal": "search=yes, ai-input=yes, ai-train=yes",
    "Content-Type": MARKDOWN_CONTENT_TYPE,
    Link: '</sitemap.xml>; rel="describedby"; type="application/xml"',
    Vary: "Accept",
    "X-Content-Type-Options": "nosniff",
  });

  return new Response(method === "HEAD" ? null : markdown, { headers });
}

function cleanText(value) {
  return String(value ?? "")
    .replace(/\s+/g, " ")
    .trim();
}

function escapeMarkdown(value) {
  return value.replace(/([\\`*_{}\[\]<>#])/g, "\\$1");
}

function yamlString(value) {
  return JSON.stringify(String(value));
}

function safeHttpUrl(value) {
  try {
    const url = new URL(String(value ?? ""));
    if (url.protocol !== "http:" && url.protocol !== "https:") return "";
    return url.href.replace(/\(/g, "%28").replace(/\)/g, "%29");
  } catch {
    return "";
  }
}
