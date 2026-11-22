import fs from "node:fs";
import path from "node:path";
import type { Plugin } from "vite";

export type SdFlowItem =
  | { kind: "subhead"; text: string }
  | { kind: "diagram"; src: string };

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

function articleHtml(html: string): string {
  const start = html.indexOf('data-hi-narration-block-id="p-0"');
  if (start === -1) return "";
  const end = html.indexOf('id="comments"', start);
  return html.slice(start, end === -1 ? start + 400_000 : end);
}

/** Headings and Excalidraw diagrams, in reading order. Article prose is dropped. */
export function parseChapterHtml(html: string, id: string): SdContextChapter {
  const article = articleHtml(html);
  const titleMatch = html.match(/<h1\b[^>]*>([\s\S]*?)<\/h1>/);
  const title = titleMatch ? stripTags(titleMatch[1]) : id;

  const token =
    /<h([23])\b[^>]*>([\s\S]*?)<\/h\1>|<img\b[^>]*\bsrc="(data:image\/svg\+xml;base64,[^"]+)"/g;

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
        current.items.push({ kind: "subhead", text });
      }
    } else if (match[3] && current) {
      current.items.push({ kind: "diagram", src: match[3] });
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
