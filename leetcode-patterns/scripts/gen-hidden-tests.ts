// Pass 3 of the build pipeline. For each json-friendly normalized problem:
//
//   1. Ask Haiku 4.5 for 25 test inputs covering: minimal, typical,
//      duplicates, edges, large, adversarial. The LLM produces ONLY inputs.
//   2. Run the reference solution against each input via `python3` subprocess.
//      The reference's output is the ground truth (LLM never sees outputs).
//   3. Discard inputs that error or take >1s.
//   4. Combine the visible examples + validated hidden cases.
//   5. Write public/problems/{slug}.json (the runtime asset).
//
// Skips problems where jsonFriendly == false; they're deferred to a future PR
// that ships ListNode/TreeNode adapters.

import { mkdir, readFile, writeFile, readdir } from "node:fs/promises";
import { existsSync, readFileSync } from "node:fs";
import { spawn } from "node:child_process";
import { complete } from "./llm.ts";
import { blind75Registry } from "./blind75Registry.ts";

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

const NORM_DIR = "scripts/normalized";
const SERVER_OUT_DIR = "server/problems";
const PUBLIC_OUT_DIR = "public/problems";
const TARGET_HIDDEN_COUNT = 25;
const PER_CASE_TIMEOUT_MS = 1500;

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
    params: { name: string; pyType: string; inputKind: string }[];
    returns: string;
  };
  starterCode: string;
  equality: "exact" | "set" | "set-of-sets" | "two-sum-pair";
  visibleExamples: { input: Record<string, unknown>; output: unknown; explanation?: string }[];
  jsonFriendly: boolean;
  jsonFriendlyReason?: string;
  referenceCode: string;
}

const SYSTEM = `You generate adversarial test INPUTS for LeetCode problems.
You never produce outputs — those are computed by the reference solution.
Your inputs must be JSON literals matching the parameter signature exactly.
Always reply with a single JSON array (no fences, no commentary).`;

function buildPrompt(p: NormalizedProblem): string {
  const sigStr = p.signature.params.map((x) => `${x.name}: ${x.pyType}`).join(", ");
  const examples = p.visibleExamples.map((e) => JSON.stringify(e.input)).join("\n  ");
  return `LeetCode #${p.number}: ${p.title} (${p.difficulty})

Statement:
${p.statement}

Constraints:
${p.constraints.map((c) => `- ${c}`).join("\n")}

Signature: def ${p.signature.methodName}(self, ${sigStr}) -> ${p.signature.returns}

Visible examples (already in our set; produce DIFFERENT inputs):
  ${examples}

Generate ${TARGET_HIDDEN_COUNT} test INPUTS. Cover:
- minimal valid input (smallest size allowed by constraints)
- typical / mid-size cases
- inputs with duplicates / repeats / collisions
- edge values (zero, negative, max range)
- ordering edges (sorted asc, sorted desc, reversed)
- adversarial cases that break naive O(n^2) approaches
- larger sizes up to ~500 elements / ~500 chars (NOT 10k+ — those break the time budget)

Each input MUST be a strict JSON literal. NO Python expressions like "a" * 100 or "x" + "y" — write out the string in full (or use shorter sizes). Strings: max 500 chars. Arrays: max 500 elements. Anything bigger will be rejected.

Reply with a JSON array of objects, each like:
[
  {"name": "<short label>", "input": {"<paramName>": <jsonLiteral>}},
  ...
]

Param names MUST match exactly: ${p.signature.params.map((x) => x.name).join(", ")}.
Return only the JSON array.`;
}

async function callLLM(p: NormalizedProblem): Promise<{ name: string; input: Record<string, unknown> }[]> {
  const MAX_ATTEMPTS = 5;
  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
    try {
      const text = await complete({
        system: SYSTEM,
        user: buildPrompt(p),
        maxTokens: 8000, // 25 cases × ~150 tokens each + JSON overhead can exceed 4000
      });
      const arr = parseJSONArrayLoose(text);
      if (arr && arr.length > 0) {
        return arr.filter(
          (x): x is { name: string; input: Record<string, unknown> } =>
            x !== null && typeof x === "object" && "input" in (x as object) && "name" in (x as object)
        );
      }
      const tail = text.slice(-120).replace(/\n/g, "\\n");
      console.warn(
        `  [${p.slug}] LLM unparseable (len=${text.length}, attempt ${attempt + 1}/${MAX_ATTEMPTS}) — tail: ${tail}`
      );
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      const isRateLimit = /429|rate.?limit|overloaded/i.test(msg);
      const backoffMs = isRateLimit ? 2000 * Math.pow(2, attempt) : 500 * (attempt + 1);
      console.warn(
        `  [${p.slug}] LLM error (attempt ${attempt + 1}/${MAX_ATTEMPTS}): ${msg.slice(0, 200)} — backing off ${backoffMs}ms`
      );
      await new Promise((r) => setTimeout(r, backoffMs));
    }
  }
  return [];
}

function parseJSONArrayLoose(text: string): unknown[] | null {
  // Strip code fences if the model wrapped the response in ```json ... ```
  const stripped = text.replace(/^```(?:json)?\s*/, "").replace(/\s*```\s*$/, "").trim();

  // 1) direct parse
  try {
    const v = JSON.parse(stripped);
    if (Array.isArray(v)) return v;
    // 2) {"cases": [...]} or {"tests": [...]} wrapper
    if (v && typeof v === "object") {
      for (const key of ["cases", "tests", "inputs", "data", "examples"]) {
        const inner = (v as Record<string, unknown>)[key];
        if (Array.isArray(inner)) return inner;
      }
    }
  } catch {
    // fall through
  }

  // 3) bracket-bounded extract
  const start = stripped.indexOf("[");
  const end = stripped.lastIndexOf("]");
  if (start !== -1 && end > start) {
    try {
      const v = JSON.parse(stripped.slice(start, end + 1));
      if (Array.isArray(v)) return v;
    } catch {
      /* fall through */
    }
  }

  return null;
}

async function runReferenceOnInputs(
  p: NormalizedProblem,
  inputs: { name: string; input: Record<string, unknown> }[]
): Promise<{ validCases: { name: string; input: Record<string, unknown>; expected: unknown }[]; rejected: number }> {
  if (inputs.length === 0) return { validCases: [], rejected: 0 };

  const harness = `
import json, sys, time
${p.referenceCode}
INPUTS = json.loads(${JSON.stringify(JSON.stringify(inputs))})
TIMEOUT = ${PER_CASE_TIMEOUT_MS / 1000.0}
def _norm(x):
    if isinstance(x, tuple): return [_norm(v) for v in x]
    if isinstance(x, set): return sorted([_norm(v) for v in x])
    if isinstance(x, list): return [_norm(v) for v in x]
    return x
sol = Solution()
method = getattr(sol, ${JSON.stringify(p.signature.methodName)})
out = []
for i, case in enumerate(INPUTS):
    name = case.get("name", f"case-{i}")
    inp = case.get("input", {})
    if not isinstance(inp, dict):
        out.append({"name": name, "ok": False, "reason": "input is not an object"})
        continue
    args = json.loads(json.dumps(inp))
    t0 = time.perf_counter()
    try:
        actual = method(**args)
    except Exception as e:
        out.append({"name": name, "ok": False, "reason": f"{type(e).__name__}: {e}"})
        continue
    if time.perf_counter() - t0 > TIMEOUT:
        out.append({"name": name, "ok": False, "reason": "timeout"})
        continue
    out.append({"name": name, "ok": True, "input": inp, "expected": _norm(actual)})
print(json.dumps(out))
`;
  return new Promise((resolve) => {
    const child = spawn("python3", ["-I", "-S", "-c", harness], {
      stdio: ["ignore", "pipe", "pipe"],
    });
    let out = "";
    let err = "";
    const timer = setTimeout(() => child.kill("SIGKILL"), 60_000);
    child.stdout.on("data", (d) => (out += d.toString()));
    child.stderr.on("data", (d) => (err += d.toString()));
    child.on("close", () => {
      clearTimeout(timer);
      try {
        const arr = JSON.parse(out.trim()) as Array<
          | { name: string; ok: false; reason: string }
          | { name: string; ok: true; input: Record<string, unknown>; expected: unknown }
        >;
        const validCases = arr
          .filter((c): c is { name: string; ok: true; input: Record<string, unknown>; expected: unknown } => c.ok)
          .map((c) => ({ name: c.name, input: c.input, expected: c.expected }));
        const rejected = arr.length - validCases.length;
        resolve({ validCases, rejected });
      } catch {
        if (err.trim()) console.warn(`    python error: ${err.trim().slice(0, 300)}`);
        resolve({ validCases: [], rejected: inputs.length });
      }
    });
  });
}

async function listNormalized(): Promise<string[]> {
  try {
    const files = await readdir(NORM_DIR);
    return files.filter((f) => f.endsWith(".json")).map((f) => f.replace(/\.json$/, ""));
  } catch {
    return [];
  }
}

async function main(): Promise<void> {
  await mkdir(SERVER_OUT_DIR, { recursive: true });
  await mkdir(PUBLIC_OUT_DIR, { recursive: true });
  const filterArg = process.argv[2];
  const slugs = filterArg ? [filterArg] : await listNormalized();

  type ManifestEntry = { slug: string; title: string; number: number; difficulty: string; category: string };
  const manifest: ManifestEntry[] = [];

  let okCount = 0;
  let deferredCount = 0;
  const failures: string[] = [];

  for (const slug of slugs) {
    let norm: NormalizedProblem;
    try {
      norm = JSON.parse(await readFile(`${NORM_DIR}/${slug}.json`, "utf8")) as NormalizedProblem;
    } catch {
      failures.push(`${slug}: missing normalized file`);
      continue;
    }

    if (!norm.jsonFriendly) {
      console.log(`  [${slug}] ⊘ deferred (${norm.jsonFriendlyReason})`);
      deferredCount++;
      continue;
    }

    const llmInputs = await callLLM(norm);
    const { validCases, rejected } = await runReferenceOnInputs(norm, llmInputs);
    if (validCases.length < 5) {
      failures.push(`${slug}: only ${validCases.length}/${llmInputs.length} valid hidden cases (need ≥5)`);
      continue;
    }

    // Server-side bundle: full schema, hidden cases included. Function reads this.
    const serverOut = {
      slug: norm.slug,
      title: norm.title,
      number: norm.number,
      difficulty: norm.difficulty,
      category: norm.category,
      url: norm.url,
      statement: norm.statement,
      constraints: norm.constraints,
      signature: norm.signature,
      starterCode: norm.starterCode,
      equality: norm.equality,
      visibleExamples: norm.visibleExamples,
      hiddenCases: validCases,
    };
    await writeFile(`${SERVER_OUT_DIR}/${slug}.json`, JSON.stringify(serverOut, null, 2) + "\n", "utf8");

    // Public stub: only what the browser needs (statement, visible examples,
    // hiddenCount). Hidden cases are NOT here — that's the whole point.
    const publicOut = {
      slug: norm.slug,
      title: norm.title,
      number: norm.number,
      difficulty: norm.difficulty,
      category: norm.category,
      url: norm.url,
      statement: norm.statement,
      constraints: norm.constraints,
      signature: norm.signature,
      starterCode: norm.starterCode,
      visibleExamples: norm.visibleExamples,
      hiddenCount: validCases.length,
    };
    await writeFile(`${PUBLIC_OUT_DIR}/${slug}.public.json`, JSON.stringify(publicOut, null, 2) + "\n", "utf8");

    manifest.push({
      slug: norm.slug,
      title: norm.title,
      number: norm.number,
      difficulty: norm.difficulty,
      category: norm.category,
    });
    okCount++;
    console.log(`  [${slug}] ✓ ${validCases.length} hidden cases (rejected ${rejected})`);
  }

  // Update the public manifest if we wrote anything (and we're not running on a single slug).
  if (!filterArg) {
    const existing = await readManifest();
    const bySlug = new Map<string, ManifestEntry>();
    for (const p of existing.problems) bySlug.set(p.slug, p);
    for (const p of manifest) bySlug.set(p.slug, p);
    const merged = Array.from(bySlug.values()).sort((a, b) => a.number - b.number);
    await writeFile(
      `${PUBLIC_OUT_DIR}/index.json`,
      JSON.stringify({ version: 1, generatedAt: new Date().toISOString(), problems: merged }, null, 2) + "\n",
      "utf8"
    );
  }

  console.log(
    `\ngen-hidden-tests: ${okCount} ok, ${deferredCount} deferred, ${failures.length} failed`
  );
  if (failures.length) {
    console.log("\nFailures:");
    for (const f of failures) console.log(`  ${f}`);
  }
  console.log(
    `\nOf ${blind75Registry.length} Blind 75 problems, ${okCount + 1 /* hand-authored two-sum */} have runnable judges.`
  );
}

async function readManifest(): Promise<{ problems: { slug: string; title: string; number: number; difficulty: string; category: string }[] }> {
  try {
    const raw = await readFile(`${PUBLIC_OUT_DIR}/index.json`, "utf8");
    return JSON.parse(raw) as { problems: { slug: string; title: string; number: number; difficulty: string; category: string }[] };
  } catch {
    return { problems: [] };
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
