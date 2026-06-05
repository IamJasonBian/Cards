// Enriches every problem slug with LeetCode topic tags + the neetcode category.
//
// Topic tags come from the community alfa-leetcode-api, which mirrors the
// public LeetCode GraphQL `topicTags` for a given titleSlug. The neetcode
// `category` is merged from the Blind 75 registry (credit: neetcode-gh/leetcode,
// MIT-licensed).
//
// Usage: npx tsx scripts/fetch-topic-tags.ts
//
// Network-tolerant: on any fetch error / missing slug we log a warning and keep
// going, still writing the rest. If the API is unreachable for a slug, that
// slug is seeded with its registry category and an empty topicTags array (to be
// refreshed later). The output file is always valid, non-empty JSON.

import { readFile, writeFile } from "node:fs/promises";
import { blind75Registry } from "./blind75Registry.ts";
import { patterns } from "../src/data/patterns.ts";

const API_BASE = "https://alfa-leetcode-api.onrender.com/select";
const OUT_PATH = "src/data/topicTags.json";
const FETCH_TIMEOUT_MS = 15_000;
const DELAY_MS = 400; // be polite to the public API
const MAX_RETRIES = 3; // retries on HTTP 429 (rate limiting)
const BACKOFF_BASE_MS = 5_000; // grows linearly per retry

interface TopicInfo {
  category: string | null;
  topicTags: string[];
}

interface SelectResponse {
  topicTags?: Array<{ name?: string; slug?: string }>;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// Maps each unique slug to its neetcode category (null if the slug only appears
// in patterns.ts and has no registry entry).
function collectSlugs(): Map<string, string | null> {
  const slugs = new Map<string, string | null>();
  for (const entry of blind75Registry) {
    slugs.set(entry.slug, entry.category);
  }
  for (const pattern of patterns) {
    for (const problem of pattern.problems) {
      if (!slugs.has(problem.slug)) {
        slugs.set(problem.slug, null);
      }
    }
  }
  return slugs;
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

// Returns the topic-tag names for a slug, or null on any failure. Retries with
// linear backoff on HTTP 429 so the shared public API can recover.
async function fetchTopicTags(slug: string): Promise<string[] | null> {
  const url = `${API_BASE}?titleSlug=${encodeURIComponent(slug)}`;
  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      const res = await fetchWithTimeout(url, FETCH_TIMEOUT_MS);
      if (res.status === 429 && attempt < MAX_RETRIES) {
        const wait = BACKOFF_BASE_MS * (attempt + 1);
        console.warn(`  [${slug}] HTTP 429, backing off ${wait}ms (attempt ${attempt + 1})`);
        await sleep(wait);
        continue;
      }
      if (!res.ok) {
        console.warn(`  [${slug}] HTTP ${res.status} for ${url}`);
        return null;
      }
      const data = (await res.json()) as SelectResponse;
      if (!Array.isArray(data.topicTags)) {
        console.warn(`  [${slug}] no topicTags in response`);
        return null;
      }
      return data.topicTags
        .map((t) => t?.name)
        .filter((n): n is string => typeof n === "string" && n.length > 0);
    } catch (e) {
      console.warn(`  [${slug}] fetch error: ${e instanceof Error ? e.message : String(e)}`);
      return null;
    }
  }
  return null;
}

// Loads any previously generated file so a re-run only retries slugs that are
// still missing topic tags (idempotent backfill, kinder to the rate-limited API).
async function loadExisting(): Promise<Record<string, TopicInfo>> {
  try {
    const raw = await readFile(OUT_PATH, "utf8");
    return JSON.parse(raw) as Record<string, TopicInfo>;
  } catch {
    return {};
  }
}

async function main(): Promise<void> {
  const slugs = collectSlugs();
  const existing = await loadExisting();
  const result: Record<string, TopicInfo> = {};

  let withTags = 0;
  let seededOnly = 0;

  for (const [slug, category] of slugs) {
    // Keep already-fetched tags; only hit the API for slugs still missing them.
    const prior = existing[slug];
    if (prior && prior.topicTags.length > 0) {
      result[slug] = { category, topicTags: prior.topicTags };
      withTags++;
      continue;
    }

    const tags = await fetchTopicTags(slug);
    if (tags && tags.length > 0) {
      result[slug] = { category, topicTags: tags };
      withTags++;
      console.log(`  [${slug}] ✓ ${tags.length} tags`);
    } else {
      // Seed with the registry category so the file is always populated; tags
      // can be refreshed on a later run.
      result[slug] = { category, topicTags: [] };
      seededOnly++;
    }
    await sleep(DELAY_MS);
  }

  // Stable, deterministic key order for a clean diff.
  const sorted: Record<string, TopicInfo> = {};
  for (const slug of Object.keys(result).sort()) {
    sorted[slug] = result[slug];
  }

  await writeFile(OUT_PATH, JSON.stringify(sorted, null, 2) + "\n", "utf8");

  console.log(
    `\nfetch-topic-tags: ${withTags} with tags, ${seededOnly} seeded-only ` +
      `(of ${slugs.size}) -> ${OUT_PATH}`,
  );
  if (seededOnly > 0) {
    console.log(
      `  note: ${seededOnly} slug(s) have empty topicTags and need a later refresh.`,
    );
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
