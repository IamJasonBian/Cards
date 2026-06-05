// Pass 2 of the build pipeline. For each scraped seed solution:
//
//   1. Ask Haiku 4.5 to extract:
//      - canonical class Solution with the right method
//      - parameter signature (Python types)
//      - LeetCode problem statement (re-authored from public knowledge)
//      - 2-3 visible examples
//      - 3-5 constraints
//      - inputType per param: "primitive" | "ListNode" | "TreeNode" | "complex"
//      - jsonFriendly: true/false (false = needs an input adapter we don't ship yet)
//   2. AST-validate the resulting Python.
//   3. Sanity-check by running the reference against each visible example via
//      `python3` subprocess (must finish in <1s, output must match).
//   4. Write scripts/references/{slug}.py and scripts/normalized/{slug}.json.
//
// jsonFriendly == false problems are skipped from gen-hidden-tests for now.
// (LinkedList / TreeNode adapters are a future PR — see plan.md.)

import { mkdir, readFile, writeFile } from "node:fs/promises";
import { existsSync, readFileSync } from "node:fs";
import { spawn } from "node:child_process";
import Anthropic from "@anthropic-ai/sdk";
import { blind75Registry } from "./blind75Registry.ts";

// Load .env if present (so `ANTHROPIC_API_KEY=...` in a project-root file works
// without needing dotenv as a dep).
function loadDotenv(): void {
  if (!existsSync(".env")) return;
  for (const line of readFileSync(".env", "utf8").split("\n")) {
    const m = line.match(/^([A-Z_][A-Z0-9_]*)\s*=\s*(.*)$/);
    if (!m) continue;
    let v = m[2].trim();
    if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
      v = v.slice(1, -1);
    }
    if (!process.env[m[1]]) process.env[m[1]] = v;
  }
}
loadDotenv();

const anthropic = new Anthropic();
const MODEL = "claude-haiku-4-5-20251001";
const SEED_DIR = "scripts/seed";
const REF_DIR = "scripts/references";
const NORM_DIR = "scripts/normalized";

interface SeedFile {
  slug: string;
  number: number;
  title: string;
  difficulty: "Easy" | "Medium" | "Hard";
  category: string;
  sourceCode: string;
}

interface NormalizedProblem {
  slug: string;
  number: number;
  title: string;
  difficulty: "Easy" | "Medium" | "Hard";
  category: string;
  url: string;
  statement: string;
  constraints: string[];
  signature: {
    className: string;
    methodName: string;
    params: { name: string; pyType: string; inputKind: "primitive" | "ListNode" | "TreeNode" | "complex" }[];
    returns: string;
  };
  starterCode: string;
  equality: "exact" | "set" | "set-of-sets" | "two-sum-pair";
  visibleExamples: { input: Record<string, unknown>; output: unknown; explanation?: string }[];
  jsonFriendly: boolean;
  jsonFriendlyReason?: string;
  referenceCode: string;
}

const SYSTEM = `You analyse LeetCode reference solutions and produce machine-readable metadata.
Be precise. Never fabricate. The reference code is correct — your job is normalization, not solving.
You always reply with a single JSON object (no fences, no commentary).`;

function buildPrompt(seed: SeedFile): string {
  return `LeetCode #${seed.number}: ${seed.title} (${seed.difficulty}, ${seed.category})

Source solution scraped from neetcode-gh/leetcode (MIT-licensed):

\`\`\`python
${seed.sourceCode}
\`\`\`

Produce a JSON object with this exact shape:

{
  "statement": "<the LeetCode problem statement, re-authored from your training. Should describe what the function does. Plain text, may use \\n for paragraph breaks. Don't restate examples here — those go below.>",
  "constraints": ["<3-5 constraint lines, e.g. '1 <= n <= 1000'>"],
  "signature": {
    "className": "Solution",
    "methodName": "<the method name from the source code, e.g. twoSum>",
    "params": [{"name": "<param name>", "pyType": "<list[int] | int | str | list[str] | list[list[int]] | bool | TreeNode | Optional[ListNode] | etc>", "inputKind": "<primitive | ListNode | TreeNode | complex>"}],
    "returns": "<return type as Python annotation>"
  },
  "starterCode": "class Solution:\\n    def <methodName>(self, <params with types>) -> <return type>:\\n        # write your solution here\\n        pass\\n",
  "equality": "<exact | set | set-of-sets | two-sum-pair>",
  "visibleExamples": [{"input": {"<paramName>": <jsonLiteral>}, "output": <jsonLiteral>, "explanation": "<optional>"}],
  "jsonFriendly": <true if all params have inputKind == "primitive" AND return type is JSON-representable (int/str/bool/list/None); false otherwise>,
  "jsonFriendlyReason": "<if jsonFriendly is false, one short sentence explaining what input/output type would need a custom adapter (e.g. 'requires ListNode adapter for head parameter')>",
  "referenceCode": "<the cleaned-up reference: a single 'class Solution:' with one method matching the signature. Use built-in types (list[int] not List[int], no 'from typing'). Pure functions; no I/O. Preserve the algorithm exactly.>"
}

Rules:
- "primitive" inputKind = list/int/str/bool/dict (not LinkedList nodes, not TreeNode, not custom classes)
- For LinkedList problems where the param is a head pointer, inputKind="ListNode" and jsonFriendly=false.
- For Tree problems where the param is a root pointer, inputKind="TreeNode" and jsonFriendly=false.
- For Trie / Design / serialize problems where the *class itself* is the answer, inputKind="complex" and jsonFriendly=false.
- "two-sum-pair" equality is ONLY for the literal Two Sum problem (return any valid index pair).
- "set" equality: result is a list where order doesn't matter (e.g. group-anagrams' inner groups).
- "set-of-sets" equality: result is list-of-lists where neither outer nor inner order matters (e.g. 3sum).
- visibleExamples should be 2-3 examples with simple, JSON-literal inputs. Skip if jsonFriendly=false.
- referenceCode MUST compile (check it mentally). Preserve algorithm; only rewrite typing.

Return only the JSON object.`;
}

async function callLLM(seed: SeedFile): Promise<NormalizedProblem | null> {
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const msg = await anthropic.messages.create({
        model: MODEL,
        max_tokens: 4000,
        system: [{ type: "text", text: SYSTEM, cache_control: { type: "ephemeral" } }],
        messages: [{ role: "user", content: buildPrompt(seed) }],
      });
      const text = msg.content
        .filter((b) => b.type === "text")
        .map((b) => b.text)
        .join("\n");
      const parsed = parseJSONLoose(text);
      if (!parsed) {
        console.warn(`  [${seed.slug}] could not parse LLM output, retrying…`);
        continue;
      }
      return {
        slug: seed.slug,
        number: seed.number,
        title: seed.title,
        difficulty: seed.difficulty,
        category: seed.category,
        url: `https://leetcode.com/problems/${seed.slug}/`,
        ...parsed,
      };
    } catch (e) {
      console.warn(`  [${seed.slug}] LLM error: ${e instanceof Error ? e.message : String(e)}`);
    }
  }
  return null;
}

function parseJSONLoose(text: string): Record<string, unknown> | null {
  // Try direct parse first
  try {
    return JSON.parse(text);
  } catch {
    // Strip leading/trailing fence or commentary; find the first {...} block
    const start = text.indexOf("{");
    const end = text.lastIndexOf("}");
    if (start === -1 || end <= start) return null;
    try {
      return JSON.parse(text.slice(start, end + 1));
    } catch {
      return null;
    }
  }
}

async function pythonSyntaxOk(code: string): Promise<boolean> {
  return new Promise((resolve) => {
    const child = spawn("python3", ["-c", "import sys, ast; ast.parse(sys.stdin.read())"], {
      stdio: ["pipe", "ignore", "ignore"],
    });
    child.stdin.end(code);
    child.on("close", (c) => resolve(c === 0));
    child.on("error", () => resolve(false));
  });
}

// Run the reference against each visible example. Reference is ground truth:
// if an example's "expected" disagrees with what the reference produces, we
// REPLACE the LLM's expected with the reference's output. The LLM is good at
// inventing diverse inputs but routinely hallucinates outputs.
async function runReferenceAgainstExamples(
  norm: NormalizedProblem
): Promise<{ ok: boolean; reason?: string; corrected?: NormalizedProblem["visibleExamples"] }> {
  if (!norm.jsonFriendly || norm.visibleExamples.length === 0) {
    return { ok: true };
  }
  const harness = `
import json, sys, time, traceback
${norm.referenceCode}
EXAMPLES = json.loads(${JSON.stringify(JSON.stringify(norm.visibleExamples))})
EQ = ${JSON.stringify(norm.equality)}
def _norm(x):
    if isinstance(x, tuple): return [_norm(v) for v in x]
    if isinstance(x, set): return sorted([_norm(v) for v in x])
    if isinstance(x, list): return [_norm(v) for v in x]
    return x
sol = Solution()
method = getattr(sol, ${JSON.stringify(norm.signature.methodName)})
results = []
for i, ex in enumerate(EXAMPLES):
    t0 = time.perf_counter()
    try:
        actual = method(**json.loads(json.dumps(ex["input"])))
    except Exception as e:
        results.append({"i": i, "ok": False, "reason": f"{type(e).__name__}: {e}"})
        continue
    if time.perf_counter() - t0 > 1.0:
        results.append({"i": i, "ok": False, "reason": "> 1s"})
        continue
    actual_n = _norm(actual)
    results.append({"i": i, "ok": True, "actual": actual_n})
print(json.dumps({"results": results}))
`;
  return new Promise((resolve) => {
    const child = spawn("python3", ["-I", "-S", "-c", harness], {
      stdio: ["ignore", "pipe", "pipe"],
    });
    let out = "";
    let err = "";
    const timer = setTimeout(() => child.kill("SIGKILL"), 10_000);
    child.stdout.on("data", (d) => (out += d.toString()));
    child.stderr.on("data", (d) => (err += d.toString()));
    child.on("close", () => {
      clearTimeout(timer);
      if (err.trim() && !out.trim()) {
        return resolve({ ok: false, reason: err.trim().slice(0, 200) });
      }
      try {
        const parsed = JSON.parse(out.trim()) as {
          results: Array<{ i: number; ok: boolean; reason?: string; actual?: unknown }>;
        };
        const corrected = norm.visibleExamples.map((ex) => ({ ...ex }));
        for (const r of parsed.results) {
          if (!r.ok) {
            return resolve({ ok: false, reason: `example ${r.i}: ${r.reason}` });
          }
          // Reference is authoritative: replace expected with what reference returned.
          corrected[r.i].output = r.actual;
        }
        return resolve({ ok: true, corrected });
      } catch {
        return resolve({ ok: false, reason: `unparseable output: ${out.slice(0, 200)}` });
      }
    });
  });
}

async function main(): Promise<void> {
  await mkdir(REF_DIR, { recursive: true });
  await mkdir(NORM_DIR, { recursive: true });
  const filterArg = process.argv[2];

  let ok = 0;
  let skippedNonJson = 0;
  const failed: string[] = [];

  for (const entry of blind75Registry) {
    if (filterArg && filterArg !== entry.slug) continue;
    let seed: SeedFile;
    try {
      seed = JSON.parse(await readFile(`${SEED_DIR}/${entry.slug}.json`, "utf8")) as SeedFile;
    } catch {
      console.warn(`  [${entry.slug}] no seed file, skipping`);
      continue;
    }

    const norm = await callLLM(seed);
    if (!norm) {
      failed.push(`${entry.slug}: LLM returned no normalized form`);
      continue;
    }

    if (!(await pythonSyntaxOk(norm.referenceCode))) {
      failed.push(`${entry.slug}: reference code has syntax error`);
      continue;
    }

    if (norm.jsonFriendly) {
      const sanity = await runReferenceAgainstExamples(norm);
      if (!sanity.ok) {
        failed.push(`${entry.slug}: examples failed: ${sanity.reason}`);
        continue;
      }
      if (sanity.corrected) norm.visibleExamples = sanity.corrected;
    } else {
      skippedNonJson++;
    }

    await writeFile(`${REF_DIR}/${entry.slug}.py`, norm.referenceCode + "\n", "utf8");
    await writeFile(`${NORM_DIR}/${entry.slug}.json`, JSON.stringify(norm, null, 2) + "\n", "utf8");
    ok++;
    const tag = norm.jsonFriendly ? "json-friendly" : `deferred (${norm.jsonFriendlyReason ?? "non-primitive"})`;
    console.log(`  [${entry.slug}] ✓ ${tag}`);
  }

  console.log(
    `\nnormalize-references: ${ok} ok (${ok - skippedNonJson} json-friendly, ${skippedNonJson} deferred), ${failed.length} failed`
  );
  if (failed.length) {
    console.log("\nFailures:");
    for (const f of failed) console.log(`  ${f}`);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
