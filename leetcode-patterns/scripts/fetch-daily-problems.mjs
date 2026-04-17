#!/usr/bin/env node
// Fetch one random problem per difficulty from LeetCode's GraphQL API
// and write to public/daily-problems.json.

import { writeFile } from "node:fs/promises";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUTPUT_PATH = resolve(__dirname, "..", "public", "daily-problems.json");

const DIFFICULTIES = ["EASY", "MEDIUM", "HARD"];

const QUERY = `
  query randomQuestion($categorySlug: String, $filters: QuestionListFilterInput) {
    randomQuestion(categorySlug: $categorySlug, filters: $filters) {
      title
      titleSlug
      difficulty
      isPaidOnly
    }
  }
`;

async function fetchOne(difficulty) {
  for (let attempt = 0; attempt < 5; attempt++) {
    const res = await fetch("https://leetcode.com/graphql", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "User-Agent": "Mozilla/5.0 daily-problems-bot",
        Referer: "https://leetcode.com/problemset/",
      },
      body: JSON.stringify({
        query: QUERY,
        variables: { categorySlug: "", filters: { difficulty } },
      }),
    });
    if (!res.ok) {
      throw new Error(`LeetCode API ${res.status} for ${difficulty}`);
    }
    const json = await res.json();
    const q = json?.data?.randomQuestion;
    if (q && !q.isPaidOnly) {
      return {
        title: q.title,
        titleSlug: q.titleSlug,
        difficulty: q.difficulty,
      };
    }
  }
  throw new Error(`Could not find free random ${difficulty} question`);
}

async function main() {
  const [easy, medium, hard] = await Promise.all(
    DIFFICULTIES.map((d) => fetchOne(d))
  );

  const payload = {
    updatedAt: new Date().toISOString().slice(0, 10),
    easy,
    medium,
    hard,
  };

  await writeFile(OUTPUT_PATH, JSON.stringify(payload, null, 2) + "\n", "utf8");
  console.log("Wrote", OUTPUT_PATH);
  console.log(payload);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
