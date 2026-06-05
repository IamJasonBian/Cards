import { useEffect, useMemo, useState } from "react";
import {
  Play,
  RotateCcw,
  ExternalLink,
  CheckCircle2,
  XCircle,
  Clock,
  AlertTriangle,
  Loader2,
  Eye,
  EyeOff,
} from "lucide-react";
import type {
  CaseResult,
  PublicProblem,
  ProblemManifest,
  RunResult,
} from "../lib/problemSchema";

const STORAGE_PREFIX = "leetcards:submit:code:";
const LAST_PROBLEM_KEY = "leetcards:submit:last";
const DEFAULT_SLUG = "two-sum";

function difficultyClass(d: string): string {
  if (d === "Easy") return "bg-emerald-50 text-emerald-700 border-emerald-200";
  if (d === "Medium") return "bg-amber-50 text-amber-700 border-amber-200";
  return "bg-rose-50 text-rose-700 border-rose-200";
}

function formatValue(v: unknown, max = 80): string {
  if (v === null || v === undefined) return "null";
  const s = JSON.stringify(v);
  return s.length > max ? s.slice(0, max - 1) + "…" : s;
}

function formatInputCompact(input: Record<string, unknown> | undefined, max = 80): string {
  if (!input) return "";
  return Object.entries(input)
    .map(([k, v]) => `${k} = ${formatValue(v, max)}`)
    .join(", ");
}

function statusLabel(r: RunResult): { text: string; tone: "good" | "bad" | "warn" } {
  if (r.status === "accepted") return { text: "Accepted", tone: "good" };
  if (r.status === "time-limit") return { text: "Time Limit Exceeded", tone: "warn" };
  if (r.status === "compile-error") return { text: "Compile Error", tone: "bad" };
  if (r.status === "runtime-error") return { text: "Runtime Error", tone: "bad" };
  if (r.status === "judge-unavailable") return { text: "Judge unavailable", tone: "warn" };
  return { text: "Wrong Answer", tone: "bad" };
}

export function Blind75Submit() {
  const [manifest, setManifest] = useState<ProblemManifest | null>(null);
  const [slug, setSlug] = useState<string>(() => {
    try {
      return localStorage.getItem(LAST_PROBLEM_KEY) ?? DEFAULT_SLUG;
    } catch {
      return DEFAULT_SLUG;
    }
  });
  const [loaded, setLoaded] = useState<{ slug: string; problem: PublicProblem } | null>(null);
  const [code, setCode] = useState<string>("");
  const [codeSlug, setCodeSlug] = useState<string | null>(null);
  const [result, setResult] = useState<{ slug: string; result: RunResult } | null>(null);
  const [problemError, setProblemError] = useState<string | null>(null);
  const [running, setRunning] = useState(false);

  // Derived: only show problem/code/results when they belong to the current slug.
  const problem = loaded?.slug === slug ? loaded.problem : null;
  const currentCode = codeSlug === slug ? code : "";
  const currentResult = result?.slug === slug ? result.result : null;

  // Load the manifest once.
  useEffect(() => {
    let cancelled = false;
    fetch("/problems/index.json")
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(`status ${r.status}`))))
      .then((m: ProblemManifest) => {
        if (!cancelled) setManifest(m);
      })
      .catch((e) => {
        if (!cancelled) setProblemError(`Could not load problem list: ${String(e)}`);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  // Load the selected problem's PUBLIC stub (no hidden cases).
  useEffect(() => {
    let cancelled = false;
    fetch(`/problems/${slug}.public.json`)
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(`status ${r.status}`))))
      .then((p: PublicProblem) => {
        if (cancelled) return;
        setLoaded({ slug, problem: p });
        const stored = localStorage.getItem(STORAGE_PREFIX + slug);
        setCode(stored ?? p.starterCode);
        setCodeSlug(slug);
        try {
          localStorage.setItem(LAST_PROBLEM_KEY, slug);
        } catch {
          /* quota — ignore */
        }
      })
      .catch((e) => {
        if (!cancelled) setProblemError(`Could not load problem '${slug}': ${String(e)}`);
      });
    return () => {
      cancelled = true;
    };
  }, [slug]);

  // Persist code per-problem.
  useEffect(() => {
    if (codeSlug !== slug) return;
    try {
      localStorage.setItem(STORAGE_PREFIX + slug, code);
    } catch {
      /* quota — ignore */
    }
  }, [code, codeSlug, slug]);

  async function submit() {
    if (!problem) return;
    const submissionSlug = slug;
    setRunning(true);
    setResult(null);
    try {
      const res = await fetch("/api/submissions/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ problemId: problem.slug, code: currentCode }),
      });
      // 503 still carries a JSON RunResult body for "judge-unavailable".
      const data = (await res.json()) as RunResult | { error: string };
      if (!("status" in data)) {
        throw new Error(data.error ?? `HTTP ${res.status}`);
      }
      setResult({ slug: submissionSlug, result: data });
    } catch (e) {
      setResult({
        slug: submissionSlug,
        result: {
          passed: 0,
          total: 0,
          visiblePassed: 0,
          visibleTotal: 0,
          hiddenPassed: 0,
          hiddenTotal: 0,
          durationMs: 0,
          cases: [],
          fatal: e instanceof Error ? e.message : String(e),
          status: "judge-unavailable",
        },
      });
    } finally {
      setRunning(false);
    }
  }

  function reset() {
    if (!problem) return;
    setCode(problem.starterCode);
    setCodeSlug(slug);
    setResult(null);
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Tab") {
      e.preventDefault();
      const target = e.currentTarget;
      const start = target.selectionStart;
      const end = target.selectionEnd;
      const next = currentCode.slice(0, start) + "    " + currentCode.slice(end);
      setCode(next);
      setCodeSlug(slug);
      requestAnimationFrame(() => {
        target.selectionStart = target.selectionEnd = start + 4;
      });
    } else if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
      e.preventDefault();
      if (!running) void submit();
    }
  }

  const sortedManifest = useMemo(() => {
    if (!manifest) return [];
    return [...manifest.problems].sort((a, b) => a.number - b.number);
  }, [manifest]);

  if (problemError) {
    return (
      <div className="max-w-2xl rounded-none border border-rose-200 bg-rose-50 backdrop-blur-2xl p-4 text-sm text-rose-700">
        <div className="flex items-center gap-2 font-medium mb-1">
          <AlertTriangle size={16} />
          Couldn't load the problem.
        </div>
        <div className="text-xs">{problemError}</div>
      </div>
    );
  }

  if (!problem) {
    return (
      <div className="max-w-2xl text-sm text-slate-500 flex items-center gap-2 py-12">
        <Loader2 size={14} className="animate-spin" />
        Loading problem…
      </div>
    );
  }

  return (
    <div className="max-w-7xl">
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-1">
          <span className="text-xs font-medium text-slate-500 uppercase tracking-wide">
            Blind 75 · #{problem.number}
          </span>
          <span
            className={`px-2 py-0.5 rounded-none text-[11px] font-semibold border ${difficultyClass(problem.difficulty)}`}
          >
            {problem.difficulty}
          </span>
          <span className="px-2 py-0.5 rounded-none text-[11px] font-medium bg-slate-100/90 sm:bg-slate-100/70 text-slate-700 border border-slate-900/10">
            {problem.category}
          </span>
          <span className="ml-auto text-[11px] text-slate-500 flex items-center gap-1">
            <EyeOff size={11} />
            {problem.hiddenCount} hidden tests · graded server-side via Judge0
          </span>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <h1 className="text-3xl font-bold text-slate-900">{problem.title}</h1>
          <a
            href={problem.url}
            target="_blank"
            rel="noreferrer"
            className="text-sm text-cyan-600 hover:underline flex items-center gap-1"
          >
            on LeetCode <ExternalLink size={12} />
          </a>
          {sortedManifest.length > 1 && (
            <select
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              className="ml-auto text-sm border border-slate-900/10 rounded-none px-2 py-1 bg-white/85 sm:bg-white/65 backdrop-blur-2xl text-slate-900 focus:ring-2 focus:ring-cyan-400/40 focus:outline-none"
            >
              {sortedManifest.map((p) => (
                <option key={p.slug} value={p.slug}>
                  #{p.number} · {p.title} · {p.difficulty}
                </option>
              ))}
            </select>
          )}
        </div>
        <p className="text-slate-700 text-sm mt-1">
          Solve in Python. Code runs server-side in a sandboxed Judge0 container; you'll see only
          the first failing hidden test on a wrong answer.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <section className="bg-white/85 sm:bg-white/65 backdrop-blur-2xl rounded-none border border-slate-900/10 p-5">
          <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-3">Problem</h2>
          <p className="text-slate-900 whitespace-pre-line text-sm leading-relaxed mb-4">
            {problem.statement}
          </p>

          <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mt-4 mb-2 flex items-center gap-1">
            <Eye size={12} />
            Examples
          </h3>
          <div className="space-y-3">
            {problem.visibleExamples.map((ex, i) => (
              <div key={i} className="rounded-none border border-slate-900/10 bg-slate-100/90 sm:bg-slate-100/70 p-3 text-xs">
                <div className="font-mono text-slate-700">
                  <span className="text-slate-500">Input:</span> {formatInputCompact(ex.input, 200)}
                </div>
                <div className="font-mono text-slate-700">
                  <span className="text-slate-500">Output:</span> {formatValue(ex.output, 200)}
                </div>
                {ex.explanation && <div className="text-slate-500 mt-1">{ex.explanation}</div>}
              </div>
            ))}
          </div>

          {problem.constraints?.length > 0 && (
            <>
              <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mt-4 mb-2">
                Constraints
              </h3>
              <ul className="text-xs text-slate-700 space-y-1 list-disc pl-4">
                {problem.constraints.map((c) => (
                  <li key={c} className="font-mono">
                    {c}
                  </li>
                ))}
              </ul>
            </>
          )}
        </section>

        <section className="space-y-4">
          <div className="bg-white/85 sm:bg-white/65 backdrop-blur-2xl rounded-none border border-slate-900/10 overflow-hidden">
            <div className="flex items-center justify-between px-4 py-2 border-b border-slate-900/10 bg-slate-100/90 sm:bg-slate-100/70">
              <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                Solution · Python 3
              </div>
              <button
                onClick={reset}
                className="text-xs text-slate-500 hover:text-slate-800 flex items-center gap-1 cursor-pointer"
                title="Reset to starter code"
              >
                <RotateCcw size={12} />
                Reset
              </button>
            </div>
            <textarea
              value={currentCode}
              onChange={(e) => {
                setCode(e.target.value);
                setCodeSlug(slug);
              }}
              onKeyDown={handleKeyDown}
              spellCheck={false}
              className="w-full font-mono text-sm bg-slate-100/90 text-slate-900 p-4 outline-none resize-y leading-relaxed focus:ring-2 focus:ring-cyan-400/40"
              style={{ minHeight: 360, tabSize: 4 }}
            />
            <div className="flex items-center justify-between px-4 py-3 bg-slate-100/90 sm:bg-slate-100/70 border-t border-slate-900/10">
              <span className="text-[11px] text-slate-500">Tab indents · ⌘/Ctrl + Enter to submit</span>
              <button
                onClick={submit}
                disabled={running}
                className="flex items-center gap-2 px-4 py-2 rounded-none bg-cyan-600 text-white text-sm font-medium hover:bg-cyan-700 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer transition-colors"
              >
                {running ? <Loader2 size={14} className="animate-spin" /> : <Play size={14} />}
                {running ? "Running…" : "Submit"}
              </button>
            </div>
          </div>

          {currentResult && <ResultsPanel result={currentResult} />}
        </section>
      </div>
    </div>
  );
}

function ResultsPanel({ result }: { result: RunResult }) {
  const status = statusLabel(result);
  const visibleCases = result.cases.filter((c) => c.visible);
  const firstFailingHidden = result.cases.find((c) => !c.visible);

  return (
    <div className="bg-white/85 sm:bg-white/65 backdrop-blur-2xl rounded-none border border-slate-900/10 p-5">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          {status.tone === "good" ? (
            <CheckCircle2 size={18} className="text-emerald-600" />
          ) : status.tone === "warn" ? (
            <AlertTriangle size={18} className="text-amber-600" />
          ) : (
            <XCircle size={18} className="text-rose-600" />
          )}
          <h2
            className={`text-sm font-semibold ${
              status.tone === "good"
                ? "text-emerald-700"
                : status.tone === "warn"
                  ? "text-amber-700"
                  : "text-rose-700"
            }`}
          >
            {status.text}
          </h2>
        </div>
        <div className="text-xs text-slate-500 flex items-center gap-3">
          <span className="flex items-center gap-1">
            <Clock size={11} />
            {result.durationMs}ms
          </span>
          {result.total > 0 && (
            <span className="font-medium">
              {result.passed} / {result.total} passed
            </span>
          )}
        </div>
      </div>

      {result.fatal && (
        <pre className="bg-rose-50 border border-rose-200 text-rose-700 text-xs font-mono p-3 rounded-none whitespace-pre-wrap mb-3">
          {result.fatal}
        </pre>
      )}

      {visibleCases.length > 0 && (
        <div className="space-y-2 mb-3">
          <div className="text-[11px] uppercase tracking-wide text-slate-500 font-semibold">
            Visible examples
          </div>
          {visibleCases.map((c, i) => (
            <CaseRow key={i} c={c} />
          ))}
        </div>
      )}

      {result.hiddenTotal > 0 && (
        <div className="space-y-2">
          <div className="text-[11px] uppercase tracking-wide text-slate-500 font-semibold flex items-center gap-1">
            <EyeOff size={11} />
            Hidden cases
          </div>
          <div
            className={`rounded-none border p-3 text-xs ${
              result.hiddenPassed === result.hiddenTotal
                ? "bg-emerald-50 border-emerald-200"
                : "bg-rose-50 border-rose-200"
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="font-medium text-slate-900">
                {result.hiddenPassed === result.hiddenTotal
                  ? "All hidden tests passed"
                  : `Wrong Answer on case ${result.hiddenPassed + 1} / ${result.hiddenTotal}`}
              </span>
              <span className="font-mono text-slate-500">
                {result.hiddenPassed} / {result.hiddenTotal}
              </span>
            </div>
            {firstFailingHidden && (
              <div className="mt-2 pt-2 border-t border-slate-900/10 font-mono text-[11px] text-slate-700 grid gap-0.5">
                <div>
                  <span className="text-slate-500">input:&nbsp;&nbsp;&nbsp;</span>
                  {formatInputCompact(firstFailingHidden.input, 60)}
                </div>
                <div>
                  <span className="text-slate-500">expected:</span> {formatValue(firstFailingHidden.expected, 60)}
                </div>
                <div>
                  <span className="text-slate-500">actual:&nbsp;&nbsp;</span> {formatValue(firstFailingHidden.actual, 60)}
                </div>
                {firstFailingHidden.error && (
                  <div className="text-rose-700 mt-1 whitespace-pre-wrap">{firstFailingHidden.error}</div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function CaseRow({ c }: { c: CaseResult }) {
  return (
    <div
      className={`rounded-none border p-3 text-xs ${
        c.passed ? "bg-emerald-50 border-emerald-200" : "bg-rose-50 border-rose-200"
      }`}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {c.passed ? (
            <CheckCircle2 size={12} className="text-emerald-600" />
          ) : (
            <XCircle size={12} className="text-rose-600" />
          )}
          <span className="font-medium text-slate-900">{c.name}</span>
        </div>
        <span
          className={`text-[10px] font-semibold uppercase ${
            c.passed ? "text-emerald-700" : "text-rose-700"
          }`}
        >
          {c.passed ? "passed" : "failed"}
        </span>
      </div>
      {!c.passed && (
        <div className="font-mono text-[11px] text-slate-700 grid grid-cols-1 gap-0.5 ml-5 mt-1">
          {c.input && (
            <div>
              <span className="text-slate-500">input:&nbsp;&nbsp;&nbsp;</span>
              {formatInputCompact(c.input, 200)}
            </div>
          )}
          <div>
            <span className="text-slate-500">expected:</span> {formatValue(c.expected, 200)}
          </div>
          <div>
            <span className="text-slate-500">actual:&nbsp;&nbsp;</span> {formatValue(c.actual, 200)}
          </div>
          {c.error && <div className="text-rose-700 mt-1 whitespace-pre-wrap">{c.error}</div>}
        </div>
      )}
    </div>
  );
}
