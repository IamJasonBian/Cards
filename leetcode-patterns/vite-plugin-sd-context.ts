import fs from "node:fs";
import path from "node:path";
import type { Plugin } from "vite";

export type SdFlowItem =
  | { kind: "subhead"; text: string; level: number }
  | { kind: "diagram"; src: string }
  | { kind: "code"; text: string; lang: string };

export type SdContextSection = {
  title: string;
  items: SdFlowItem[];
};

export type SdContextChapter = {
  id: string;
  title: string;
  sections: SdContextSection[];
};

const CHAPTER_FILES: { file: string; id: string }[] = [
  { file: "c1.html", id: "core-concepts" },
  { file: "c2.html", id: "delivery-framework" },
  { file: "c3.html", id: "common-patterns" },
  { file: "c4.html", id: "key-technologies" },
];

function stripTags(html: string): string {
  return html
    .replace(/<[^>]+>/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&#39;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/\s+/g, " ")
    .trim();
}

function decodeEntities(text: string): string {
  return text
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&#39;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&");
}

function articleHtml(html: string): string {
  const start = html.indexOf('data-hi-narration-block-id="p-0"');
  if (start === -1) return "";
  const end = html.indexOf('id="comments"', start);
  return html.slice(start, end === -1 ? start + 400_000 : end);
}

/** Headings (h2 sections, h3-h5 sub-headers), diagrams and code blocks, in reading order. Prose is dropped. */
export function parseChapterHtml(html: string, id: string): SdContextChapter {
  const article = articleHtml(html);
  const titleMatch = html.match(/<h1\b[^>]*>([\s\S]*?)<\/h1>/);
  const title = titleMatch ? stripTags(titleMatch[1]) : id;

  // Diagrams are either <img> data URIs or inline Excalidraw exports (<svg ... version="1.1">).
  const token =
    /<h([2-5])\b[^>]*>([\s\S]*?)<\/h\1>|<img\b[^>]*\bsrc="(data:image\/svg\+xml;base64,[^"]+)"|(<svg xmlns="http:\/\/www\.w3\.org\/2000\/svg" version="1\.1"[\s\S]*?<\/svg>)|<pre\b[^>]*>([\s\S]*?)<\/pre>/g;

  const sections: SdContextSection[] = [];
  let current: SdContextSection | null = null;

  for (const match of article.matchAll(token)) {
    if (match[1]) {
      const text = stripTags(match[2]);
      if (!text || text === "Comments") continue;
      if (match[1] === "2") {
        current = { title: text, items: [] };
        sections.push(current);
      } else if (current) {
        current.items.push({ kind: "subhead", text, level: Number(match[1]) });
      }
    } else if (match[3] && current) {
      current.items.push({ kind: "diagram", src: match[3] });
    } else if (match[4] && current) {
      const src = `data:image/svg+xml;base64,${Buffer.from(match[4]).toString("base64")}`;
      current.items.push({ kind: "diagram", src });
    } else if (match[5] && current) {
      // The language sits on a wrapper just before the <pre>.
      const before = article.slice(Math.max(0, match.index - 400), match.index);
      const lang = before.match(/data-code-language="([^"]*)"/g)?.pop()?.slice(20, -1) ?? "";
      const text = decodeEntities(match[5].replace(/<[^>]+>/g, "")).trimEnd();
      if (text) current.items.push({ kind: "code", text, lang });
    }
  }

  return { id, title, sections };
}

export function loadSdContext(root: string): { chapters: SdContextChapter[] } {
  const dir = path.join(root, "leetcode-cards-context");
  const chapters: SdContextChapter[] = [];
  for (const { file, id } of CHAPTER_FILES) {
    const full = path.join(dir, file);
    if (!fs.existsSync(full)) continue;
    const html = fs.readFileSync(full, "utf8");
    chapters.push(parseChapterHtml(html, id));
  }
  return { chapters };
}

export function sdContextPlugin(): Plugin {
  let cached: string | null = null;
  return {
    name: "sd-context",
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        const url = req.url?.split("?")[0];
        if (url !== "/sd-context.json") return next();
        try {
          if (!cached) {
            const payload = loadSdContext(server.config.root);
            cached = JSON.stringify(payload);
          }
          res.setHeader("Content-Type", "application/json");
          res.end(cached);
        } catch (err) {
          res.statusCode = 500;
          res.end(String(err));
        }
      });
    },
  };
}
