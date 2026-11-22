import { useEffect, useMemo, useState } from "react";
import {
  Play,
  RotateCcw,
  ExternalLink,
  AlertTriangle,
  Loader2,
} from "lucide-react";
import type {
  CaseResult,
  PublicProblem,
  ProblemManifest,
  RunResult,
} from "../lib/problemSchema";
import { apiUrl } from "../lib/api";

const STORAGE_PREFIX = "leetcards:submit:code:";
const LAST_PROBLEM_KEY = "leetcards:submit:last";
const DEFAULT_SLUG = "two-sum";

type Tab = "solution" | "tests" | "results";

// Flat "task page" vocabulary: small uppercase labels, hairline rows, mono counts.
const EYEBROW = "text-[11px] uppercase tracking-wider text-slate-500";
const CHIP = "px-1.5 py-0.5 rounded text-[10px] font-mono uppercase tracking-wider";
const ROW = "flex items-start gap-3 py-3 border-t border-slate-900/10 first:border-t-0";
const COUNT = "font-mono text-[11px] text-slate-500 tabular-nums";

function difficultyClass(d: string): string {
  if (d === "Easy") return "bg-emerald-50 text-emerald-700";
  if (d === "Medium") return "bg-amber-50 text-amber-700";
  return "bg-rose-50 text-rose-700";
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
  const [tab, setTab] = useState<Tab>("solution");
  const [expandedSlug, setExpandedSlug] = useState<string | null>(null);
  const expanded = expandedSlug === slug;

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
    setTab("results");
    try {
      const res = await fetch(apiUrl("/api/submissions/run"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
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
      <div className="max-w-2xl rounded-xl border border-rose-200 bg-rose-50 backdrop-blur-2xl p-4 text-sm text-rose-700">
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

  const lineCount = currentCode.split("\n").length;
  const tabs: { id: Tab; label: string; count?: string }[] = [
    { id: "solution", label: "Solution", count: `${lineCount} lines` },
    {
      id: "tests",
      label: "Tests",
      count: `${problem.visibleExamples.length} + ${problem.hiddenCount} hidden`,
    },
    {
      id: "results",
      label: "Results",
      count: currentResult && currentResult.total > 0 ? `${currentResult.passed}/${currentResult.total}` : undefined,
    },
  ];
  const longStatement = problem.statement.length > 480;

  return (
    <div className="max-w-5xl bg-[#3a3a3c]/55 backdrop-blur-2xl rounded-2xl border border-slate-900/10 px-4 sm:px-6 pb-6">
      <header className="pt-6 pb-8">
        <div className="flex items-center gap-3 mb-3">
          <span className={`${EYEBROW} font-mono`}>
            Blind 75 · Problem #{problem.number} · {problem.slug}
          </span>
          {sortedManifest.length > 1 && (
            <select
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              aria-label="Problem"
              className="ml-auto max-w-[50%] text-xs border border-slate-900/10 rounded-md px-2 py-1 bg-transparent text-slate-700 focus:ring-2 focus:ring-cyan-400/40 focus:outline-none"
            >
              {sortedManifest.map((p) => (
                <option key={p.slug} value={p.slug}>
                  #{p.number} · {p.title} · {p.difficulty}
                </option>
              ))}
            </select>
          )}
        </div>
        <h1 className="text-2xl sm:text-3xl font-semibold text-slate-900">{problem.title}</h1>
        <div className="mt-3 flex items-center gap-3 flex-wrap text-sm text-slate-700">
          <span>{problem.category}</span>
          <span className={`${CHIP} ${difficultyClass(problem.difficulty)}`}>{problem.difficulty}</span>
          <span className={`${CHIP} bg-slate-100/70 text-slate-500`}>Python 3</span>
          <a
            href={problem.url}
            target="_blank"
            rel="noreferrer"
            className="text-xs text-slate-500 hover:text-slate-900 flex items-center gap-1 transition-colors"
          >
            on LeetCode <ExternalLink size={11} />
          </a>
        </div>

        <h2 className={`${EYEBROW} mt-8 mb-4`}>Instruction</h2>
        <p
          className={`text-slate-900 whitespace-pre-line text-[15px] leading-relaxed max-w-3xl ${
            longStatement && !expanded ? "line-clamp-6" : ""
          }`}
        >
          {problem.statement}
        </p>
        {problem.constraints?.length > 0 && (!longStatement || expanded) && (
          <ul className="mt-4 text-xs text-slate-700 space-y-1 font-mono">
            {problem.constraints.map((c) => (
              <li key={c}>{c}</li>
            ))}
          </ul>
        )}
        {longStatement && (
          <button
            onClick={() => setExpandedSlug(expanded ? null : slug)}
            aria-expanded={expanded}
            className={`${EYEBROW} mt-4 hover:text-slate-900 transition-colors cursor-pointer`}
          >
            {expanded ? "Show less" : "Show more"}
          </button>
        )}
      </header>

      <div
        role="tablist"
        aria-label="Solution, tests and results"
        className="sticky top-12 z-[5] -mx-4 sm:-mx-6 px-4 sm:px-6 flex flex-wrap gap-x-6 gap-y-1 border-b border-slate-900/10 bg-[#3a3a3c]/60 backdrop-blur-2xl"
      >
        {tabs.map((t) => {
          const selected = t.id === tab;
          return (
            <button
              key={t.id}
              role="tab"
              type="button"
              id={`submit-tab-${t.id}`}
              aria-selected={selected}
              aria-controls="submit-tabpanel"
              onClick={() => setTab(t.id)}
              className={`relative py-3 text-[12px] uppercase tracking-wider transition-colors cursor-pointer ${
                selected ? "text-slate-900" : "text-slate-500 hover:text-slate-900"
              }`}
            >
              <span>{t.label}</span>
              {t.count && (
                <span className="ml-1.5 font-mono normal-case tracking-normal text-[11px] text-slate-500 tabular-nums">
                  {t.count}
                </span>
              )}
              {selected && <span aria-hidden="true" className="absolute inset-x-0 -bottom-px h-[2px] bg-slate-900" />}
            </button>
          );
        })}
      </div>

      <div role="tabpanel" id="submit-tabpanel" aria-labelledby={`submit-tab-${tab}`} className="pt-4">
        {tab === "solution" && (
          <>
            <textarea
              value={currentCode}
              onChange={(e) => {
                setCode(e.target.value);
                setCodeSlug(slug);
              }}
              onKeyDown={handleKeyDown}
              spellCheck={false}
              aria-label="Solution code"
              className="w-full font-mono text-sm bg-white/[0.08] text-slate-900 p-4 rounded-lg border border-slate-900/10 outline-none resize-y leading-relaxed focus:ring-2 focus:ring-cyan-400/40"
              style={{ minHeight: 420, tabSize: 4 }}
            />
            <div className="flex items-center gap-4 pt-3">
              <span className="text-[11px] text-slate-500 font-mono">Tab indents · ⌘/Ctrl + Enter submits</span>
              <button
                onClick={reset}
                className="ml-auto text-xs text-slate-500 hover:text-slate-900 flex items-center gap-1 cursor-pointer transition-colors"
                title="Reset to starter code"
              >
                <RotateCcw size={12} />
                Reset
              </button>
              <button
                onClick={submit}
                disabled={running}
                className="flex items-center gap-2 px-4 py-1.5 rounded-full bg-cyan-600 text-white text-sm font-medium hover:bg-cyan-700 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer transition-colors"
              >
                {running ? <Loader2 size={14} className="animate-spin" /> : <Play size={14} />}
                {running ? "Running…" : "Submit"}
              </button>
            </div>
          </>
        )}

        {tab === "tests" && (
          <div>
            {problem.visibleExamples.map((ex, i) => (
              <div key={i} className={ROW}>
                <span className="w-28 shrink-0 text-sm text-slate-900">example {i + 1}</span>
                <div className="min-w-0 flex-1 font-mono text-xs text-slate-700 grid gap-0.5">
                  <div>
                    <span className="text-slate-500">input </span>
                    {formatInputCompact(ex.input, 200)}
                  </div>
                  <div>
                    <span className="text-slate-500">output </span>
                    {formatValue(ex.output, 200)}
                  </div>
                  {ex.explanation && <div className="font-sans text-slate-500 mt-1">{ex.explanation}</div>}
                </div>
              </div>
            ))}
            <div className={ROW}>
              <span className="w-28 shrink-0 text-sm text-slate-900">hidden</span>
              <span className="flex-1 text-xs text-slate-500">graded server-side via Judge0</span>
              <span className={COUNT}>{problem.hiddenCount}</span>
            </div>
          </div>
        )}

        {tab === "results" &&
          (running ? (
            <div className="py-8 text-sm text-slate-500 flex items-center gap-2">
              <Loader2 size={14} className="animate-spin" />
              Running against {problem.visibleExamples.length + problem.hiddenCount} tests…
            </div>
          ) : currentResult ? (
            <ResultsPanel result={currentResult} />
          ) : (
            <div className="py-8 text-sm text-slate-500">No run yet. Submit the solution to grade it.</div>
          ))}
      </div>
    </div>
  );
}

function PassChip({ passed }: { passed: boolean }) {
  return (
    <span className={`${CHIP} ${passed ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-rose-700"}`}>
      {passed ? "Pass" : "Fail"}
    </span>
  );
}

function CaseDetail({ c, max }: { c: CaseResult; max: number }) {
  return (
    <div className="font-mono text-[11px] text-slate-700 grid gap-0.5 pb-3 pl-28">
      {c.input && (
        <div>
          <span className="text-slate-500">input </span>
          {formatInputCompact(c.input, max)}
        </div>
      )}
      <div>
        <span className="text-slate-500">expected </span>
        {formatValue(c.expected, max)}
      </div>
      <div>
        <span className="text-slate-500">actual </span>
        {formatValue(c.actual, max)}
      </div>
      {c.error && <div className="text-rose-700 mt-1 whitespace-pre-wrap">{c.error}</div>}
    </div>
  );
}

function ResultsPanel({ result }: { result: RunResult }) {
  const status = statusLabel(result);
  const visibleCases = result.cases.filter((c) => c.visible);
  const firstFailingHidden = result.cases.find((c) => !c.visible);
  const hiddenPassed = result.hiddenPassed === result.hiddenTotal;
  const toneClass =
    status.tone === "good" ? "text-emerald-700" : status.tone === "warn" ? "text-amber-700" : "text-rose-700";

  return (
    <div>
      <div className="flex items-center gap-3 pb-3">
        <span className={`text-sm font-semibold ${toneClass}`}>{status.text}</span>
        <span className="ml-auto font-mono text-[11px] text-slate-500 tabular-nums">{result.durationMs}ms</span>
        {result.total > 0 && (
          <span className={COUNT}>
            {result.passed}/{result.total}
          </span>
        )}
      </div>

      {result.fatal && (
        <pre className="bg-rose-50 border border-rose-200 text-rose-700 text-xs font-mono p-3 rounded-lg whitespace-pre-wrap mb-3">
          {result.fatal}
        </pre>
      )}

      {visibleCases.map((c, i) => (
        <div key={i} className="border-t border-slate-900/10">
          <div className="flex items-center gap-3 py-2.5">
            <span className="w-28 shrink-0 truncate text-sm text-slate-900">{c.name}</span>
            <PassChip passed={c.passed} />
          </div>
          {!c.passed && <CaseDetail c={c} max={200} />}
        </div>
      ))}

      {result.hiddenTotal > 0 && (
        <div className="border-t border-slate-900/10">
          <div className="flex items-center gap-3 py-2.5">
            <span className="w-28 shrink-0 text-sm text-slate-900">hidden</span>
            <PassChip passed={hiddenPassed} />
            {!hiddenPassed && (
              <span className="text-xs text-slate-500">
                first failure at case {result.hiddenPassed + 1}
              </span>
            )}
            <span className={`ml-auto ${COUNT}`}>
              {result.hiddenPassed}/{result.hiddenTotal}
            </span>
          </div>
          {firstFailingHidden && <CaseDetail c={firstFailingHidden} max={60} />}
        </div>
      )}
    </div>
  );
}
