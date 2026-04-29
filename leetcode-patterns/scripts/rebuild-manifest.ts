// Rebuild public/problems/index.json from whatever's currently in
// server/problems/. Cheap utility for after single-slug regen runs.

import { readdir, readFile, writeFile } from "node:fs/promises";

const SERVER_DIR = "server/problems";
const PUBLIC_DIR = "public/problems";

interface ProblemFile {
  slug: string;
  title: string;
  number: number;
  difficulty: "Easy" | "Medium" | "Hard";
  category: string;
}

async function main(): Promise<void> {
  const files = (await readdir(SERVER_DIR)).filter((f) => f.endsWith(".json"));
  const problems: ProblemFile[] = [];
  for (const f of files) {
    try {
      const raw = await readFile(`${SERVER_DIR}/${f}`, "utf8");
      const p = JSON.parse(raw) as ProblemFile;
      if (p.slug && p.title && typeof p.number === "number") {
        problems.push({
          slug: p.slug,
          title: p.title,
          number: p.number,
          difficulty: p.difficulty,
          category: p.category,
        });
      }
    } catch (e) {
      console.warn(`  skip ${f}: ${e instanceof Error ? e.message : String(e)}`);
    }
  }
  problems.sort((a, b) => a.number - b.number);
  const manifest = {
    version: 1,
    generatedAt: new Date().toISOString(),
    problems,
  };
  await writeFile(`${PUBLIC_DIR}/index.json`, JSON.stringify(manifest, null, 2) + "\n", "utf8");
  console.log(`rebuilt manifest: ${problems.length} problems`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
