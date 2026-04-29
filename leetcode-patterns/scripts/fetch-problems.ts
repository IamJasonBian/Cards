// Fetches the canonical Python solution for each Blind75 problem from
// neetcode-gh/leetcode (MIT-licensed). Writes one seed file per problem at
// scripts/seed/{slug}.json containing { slug, number, sourceUrl, sourceCode }.
//
// Usage: npm run fetch-problems
//
// We intentionally do NOT download problem statements — those are easy to
// get wrong (TOS, formatting, image-only constraints). Instead the next
// pipeline step (normalize-references.ts) asks the LLM to write a clean
// statement based on the canonical signature + reference solution.

import { mkdir, writeFile } from "node:fs/promises";
import { dirname } from "node:path";
import { blind75Registry, pad4 } from "./blind75Registry.ts";

const NEETCODE_BASE = "https://raw.githubusercontent.com/neetcode-gh/leetcode/main/python";
const SEED_DIR = "scripts/seed";
const FETCH_TIMEOUT_MS = 10_000;

interface SeedEntry {
  slug: string;
  number: number;
  title: string;
  difficulty: "Easy" | "Medium" | "Hard";
  category: string;
  sourceUrl: string;
  sourceCode: string;
  fetchedAt: string;
  source: "neetcode-gh";
}

async function fetchWithTimeout(url: string, timeoutMs: number): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

async function fetchOne(slug: string, number: number): Promise<string | null> {
  const url = `${NEETCODE_BASE}/${pad4(number)}-${slug}.py`;
  try {
    const res = await fetchWithTimeout(url, FETCH_TIMEOUT_MS);
    if (!res.ok) {
      console.warn(`  [${slug}] HTTP ${res.status} for ${url}`);
      return null;
    }
    return await res.text();
  } catch (e) {
    console.warn(`  [${slug}] fetch error: ${e instanceof Error ? e.message : String(e)}`);
    return null;
  }
}

async function main(): Promise<void> {
  await mkdir(SEED_DIR, { recursive: true });
  const filterArg = process.argv[2]; // optional: single slug

  let ok = 0;
  let missing = 0;

  for (const entry of blind75Registry) {
    if (filterArg && filterArg !== entry.slug) continue;
    const code = await fetchOne(entry.slug, entry.number);
    if (!code) {
      missing++;
      continue;
    }
    const seed: SeedEntry = {
      slug: entry.slug,
      number: entry.number,
      title: entry.title,
      difficulty: entry.difficulty,
      category: entry.category,
      sourceUrl: `${NEETCODE_BASE}/${pad4(entry.number)}-${entry.slug}.py`,
      sourceCode: code,
      fetchedAt: new Date().toISOString(),
      source: "neetcode-gh",
    };
    const path = `${SEED_DIR}/${entry.slug}.json`;
    await mkdir(dirname(path), { recursive: true });
    await writeFile(path, JSON.stringify(seed, null, 2) + "\n", "utf8");
    ok++;
    console.log(`  [${entry.slug}] ✓ ${code.length} bytes`);
  }
  console.log(`\nfetch-problems: ${ok} ok, ${missing} missing (of ${blind75Registry.length})`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
