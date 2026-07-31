// Loads problems from the bundled `server/problems/` directory.
// On Netlify Functions this directory is included via the `included_files`
// config (see netlify.toml). In dev (`npm run server`) we read it from disk.

import { readdir, readFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import type { ServerProblem } from "./problemSchema.ts";
import { log, errFields } from "./log.ts";

const plog = log("problems");

const HERE = dirname(fileURLToPath(import.meta.url));
// Try a few locations: repo-relative (dev) and function-bundle-relative (prod).
const CANDIDATE_DIRS = [
  join(HERE, "problems"), // server/problems (alongside this file)
  join(process.cwd(), "server", "problems"),
  join(process.cwd(), "leetcode-patterns", "server", "problems"),
];

let cache: Map<string, ServerProblem> | null = null;

function findProblemsDir(): string | null {
  for (const d of CANDIDATE_DIRS) {
    if (existsSync(d)) return d;
  }
  return null;
}

async function loadAll(): Promise<Map<string, ServerProblem>> {
  if (cache) return cache;
  const dir = findProblemsDir();
  cache = new Map();
  if (!dir) {
    plog.error("problems_dir_missing", { searched: CANDIDATE_DIRS });
    return cache;
  }
  const entries = await readdir(dir);
  for (const entry of entries) {
    if (!entry.endsWith(".json")) continue;
    try {
      const raw = await readFile(join(dir, entry), "utf8");
      const p = JSON.parse(raw) as ServerProblem;
      if (p.slug) cache.set(p.slug, p);
    } catch (e) {
      plog.warn("problem_load_failed", { entry, ...errFields(e) });
    }
  }
  plog.info("problems_loaded", { dir, count: cache.size });
  return cache;
}

export async function getProblem(slug: string): Promise<ServerProblem | null> {
  const all = await loadAll();
  return all.get(slug) ?? null;
}

export async function listProblemSlugs(): Promise<string[]> {
  const all = await loadAll();
  return Array.from(all.keys());
}
