// Verifies the generated judge program actually runs, without needing Judge0.
//
// For every problem we assemble the real program around a probe solution and
// execute it with the local python3. The probe touches the names LeetCode
// pre-imports (`List`, `cache`, `defaultdict`, …) and returns None, so a green
// run proves three things at once:
//   1. the assembled program is valid Python (no JSON literals leaking in),
//   2. the preamble defines everything a pasted LeetCode solution expects,
//   3. the harness dispatches exactly one result line per test case.
//
// Usage: npm run verify-harness

import { spawnSync } from "node:child_process";
import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { buildProgram } from "../server/judgeHarness.ts";
import { getProblem, listProblemSlugs } from "../server/problemLoader.ts";

// Exercises the implicit-import surface, then returns None so every case fails
// the comparison but still produces a result line.
function probeSolution(methodName: string): string {
  return `class Solution:
    def ${methodName}(self, *args, **kwargs):
        _ = (List, Optional, cache, lru_cache, defaultdict, deque, Counter,
             heappush, heappop, bisect.bisect_left, math.inf, itertools.chain)
        return None
`;
}

const failures: string[] = [];
const slugs = (await listProblemSlugs()).sort();

for (const slug of slugs) {
  const problem = await getProblem(slug);
  if (!problem) continue;

  const expectedCases = problem.visibleExamples.length + problem.hiddenCases.length;
  const built = buildProgram(problem, probeSolution(problem.signature.methodName));
  const file = join(mkdtempSync(join(tmpdir(), "lc-verify-")), "program.py");
  writeFileSync(file, built.source);

  const run = spawnSync("python3", [file], { encoding: "utf8", timeout: 30_000 });
  const lines = (run.stdout ?? "").split("\n").filter((l) => l.trim());

  const parsed = lines.map((l) => {
    try {
      return JSON.parse(l) as { __fatal?: string; error?: string };
    } catch {
      return {};
    }
  });

  const fatal = parsed.find((o) => o.__fatal);
  // A NameError here means the preamble stopped defining a name that LeetCode
  // solutions are written against — the failure mode is per-case, so it never
  // shows up as a missing line.
  const nameError = parsed.find((o) => o.error?.startsWith("NameError"));

  if (fatal) {
    failures.push(`${slug}: harness fatal — ${fatal.__fatal}`);
  } else if (lines.length !== expectedCases) {
    const stderr = (run.stderr ?? "").trim().split("\n").slice(-3).join(" | ");
    failures.push(
      `${slug}: expected ${expectedCases} result lines, got ${lines.length}${stderr ? ` — ${stderr}` : ""}`
    );
  } else if (nameError) {
    failures.push(`${slug}: missing preamble name — ${nameError.error}`);
  }
}

console.log(`verify-harness: checked ${slugs.length} problems`);
if (failures.length > 0) {
  console.error(`\n${failures.length} failing:`);
  for (const f of failures) console.error(`  ${f}`);
  process.exit(1);
}
console.log("all problems assemble into a runnable judge program");
