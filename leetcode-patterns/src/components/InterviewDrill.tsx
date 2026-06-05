import { useState } from "react";
import { ChevronRight, Play, RotateCcw } from "lucide-react";
import { CameraCapture } from "./CameraCapture";

type Phase = "solve" | "code" | "verify";
type CheckState = "pending" | "pass" | "fail";

const ALL_PATTERNS = [
  "Array / Two Pointer", "Sliding Window", "Binary Search", "Hash Map / Set",
  "Stack", "Monotonic Stack", "Tree / Trie", "BFS", "DFS", "Topological Sort",
  "Dynamic Programming", "Greedy", "Backtracking", "Math / Bit Manipulation", "Simulation",
];

const VERIFY_CHECKS = [
  "Base case — smallest valid input returns correct answer.",
  "Zero / empty input — handled explicitly.",
  "Negative / boundary values — no off-by-one or sign errors.",
  "No infinite loop — visited/memo is checked before re-processing.",
  "Data structure choice — gives the right ordering guarantee (FIFO/LIFO/heap).",
  "Returns on first match — not continuing after the answer is found.",
  "Complexity matches target — no hidden O(n) inside the inner loop.",
];

const PHASE_CONFIG: { id: Phase; label: string }[] = [
  { id: "solve", label: "1. Problem Solving" },
  { id: "code",  label: "2. Coding" },
  { id: "verify", label: "3. Verification" },
];

// ── Pattern detection (keyword heuristic) ────────────────────────────────────
function detectPatterns(problem: string): string[] {
  const p = problem.toLowerCase();
  const found: string[] = [];
  if (p.match(/shortest|minimum steps|knight|bfs/)) found.push("BFS");
  if (p.match(/longest|subarray|substring|window/)) found.push("Sliding Window");
  if (p.match(/sorted|binary search/)) found.push("Binary Search");
  if (p.match(/tree|trie|node|root/)) found.push("Tree / Trie");
  if (p.match(/graph|connect|path|cycle/)) found.push("DFS");
  if (p.match(/\bdp\b|dynamic|memo|substructure/)) found.push("Dynamic Programming");
  if (p.match(/parenthes|bracket|\bstack\b/)) found.push("Stack");
  if (p.match(/\bgreedy\b/)) found.push("Greedy");
  if (p.match(/backtrack|permut|subset|combination/)) found.push("Backtracking");
  return found.length ? found : ["Hash Map / Set"];
}

// ── Socratic hint generator ──────────────────────────────────────────────────
function getHint(code: string, n: number, patterns: string[]): string {
  if (!code.trim()) return "Write some code first, then request a hint.";
  const c = code.toLowerCase();
  const isBFS = patterns.includes("BFS");
  const isDP  = patterns.includes("Dynamic Programming");

  if (n === 1) {
    if (isBFS && !c.includes("visited") && !c.includes("seen"))
      return "Hint 1: Your BFS doesn't appear to track visited states. What happens if a node gets enqueued multiple times?";
    if (isDP && !c.match(/memo|cache|\bdp\b/))
      return "Hint 1: Are you re-solving the same subproblems? How could memoization help?";
    return "Hint 1: Trace through the smallest example by hand. Does your code produce the expected output?";
  }
  if (n === 2) {
    if (isBFS && !c.includes("deque") && !c.includes("queue"))
      return "Hint 2: What data structure are you using for BFS? Does it guarantee first-in, first-out ordering for shortest-path correctness?";
    return "Hint 2: Check your loop/recursion boundary conditions — is there an edge case that causes incorrect early exit or infinite looping?";
  }
  return "Hint 3 (final): Revisit the constraint that seemed minor in the problem — it usually points directly at the missing guard in your code.";
}

function reviewCode(code: string, patterns: string[]): string {
  if (!code.trim()) return "Paste your implementation first.";
  const c = code.toLowerCase();
  const issues: string[] = [];
  if (patterns.includes("BFS") && !c.includes("visited") && !c.includes("seen"))
    issues.push("No visited/seen set found — BFS will revisit nodes and may loop infinitely.");
  if (patterns.includes("BFS") && !c.includes("deque") && !c.includes("queue") && !c.includes("append"))
    issues.push("No obvious queue detected — are you sure BFS is using FIFO ordering?");
  if (patterns.includes("Dynamic Programming") && !c.match(/memo|cache|\bdp\b/))
    issues.push("No memoization or dp array visible — are subproblems being recomputed?");
  return issues.length
    ? "Observations (not fixes):\n• " + issues.join("\n• ")
    : "No obvious structural issues spotted. Move to Phase 3 to stress-test.";
}

// ── Small shared UI pieces ────────────────────────────────────────────────────
function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="text-xs font-bold uppercase tracking-widest text-cyan-600 mb-2">
      {children}
    </h3>
  );
}
function Card({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`bg-white/85 sm:bg-white/65 backdrop-blur-2xl border border-slate-900/10 rounded-none p-5 ${className}`}>
      {children}
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────
export function InterviewDrill() {
  const [phase, setPhase] = useState<Phase>("solve");

  // Phase 1
  const [problemText, setProblemText] = useState("");
  const [detectedPatterns, setDetectedPatterns] = useState<string[]>([]);
  const [solveVisible, setSolveVisible] = useState(false);

  // Phase 2
  const [codeText, setCodeText] = useState("");
  const [hintsUsed, setHintsUsed] = useState(0);
  const [codeFeedback, setCodeFeedback] = useState("");
  const [dryRunText, setDryRunText] = useState("");
  const [dryRunInput, setDryRunInput] = useState("");
  const [checks, setChecks] = useState<CheckState[]>(VERIFY_CHECKS.map(() => "pending"));

  // Phase 3
  const [verifyCode, setVerifyCode] = useState("");
  const [verifyVisible, setVerifyVisible] = useState(false);

  function handleSolve() {
    if (!problemText.trim()) return;
    setDetectedPatterns(detectPatterns(problemText));
    setSolveVisible(true);
  }

  function toggleCheck(i: number) {
    const cycle: CheckState[] = ["pending", "pass", "fail"];
    setChecks((prev) => {
      const next = [...prev];
      next[i] = cycle[(cycle.indexOf(prev[i]) + 1) % 3];
      return next;
    });
  }

  function handleHint() {
    if (hintsUsed >= 3) return;
    const n = hintsUsed + 1;
    setHintsUsed(n);
    setCodeFeedback(getHint(codeText, n, detectedPatterns));
  }

  function handleReview() {
    if (!codeText.trim()) return;
    setCodeFeedback(reviewCode(codeText, detectedPatterns));
  }

  const checkIcon = (s: CheckState) => s === "pass" ? "✓" : s === "fail" ? "✗" : "○";
  const checkRow = (s: CheckState) => ({
    pending: "border-slate-900/10 bg-slate-100/90 sm:bg-slate-100/70 hover:bg-slate-900/5 text-slate-700",
    pass:    "border-emerald-200 bg-emerald-50 text-emerald-700",
    fail:    "border-rose-200 bg-rose-50 text-rose-700",
  }[s]);
  const checkIconColor = (s: CheckState) => ({
    pending: "text-slate-500",
    pass:    "text-emerald-700",
    fail:    "text-rose-700",
  }[s]);

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-slate-900">Interview Drill</h2>
        <p className="text-sm text-slate-500 mt-1">
          Problem Solving → Coding → Verification
        </p>
      </div>

      {/* Phase tabs */}
      <div className="flex items-center gap-2 mb-6 flex-wrap">
        {PHASE_CONFIG.map(({ id, label }, i) => (
          <div key={id} className="flex items-center gap-2">
            <button
              onClick={() => setPhase(id)}
              className={`px-3 py-1.5 rounded-none text-sm font-medium transition-colors cursor-pointer ${
                phase === id
                  ? "bg-cyan-100 text-cyan-700"
                  : "bg-slate-100/90 sm:bg-slate-100/70 text-slate-700 hover:bg-slate-900/5"
              }`}
            >
              {label}
            </button>
            {i < PHASE_CONFIG.length - 1 && (
              <ChevronRight size={14} className="text-slate-500" />
            )}
          </div>
        ))}
      </div>

      {/* ── PHASE 1: SOLVE ── */}
      {phase === "solve" && (
        <div className="space-y-4">
          <Card>
            <div className="flex items-center justify-between mb-2">
              <SectionLabel>Problem Statement</SectionLabel>
              <CameraCapture mode="problem" onResult={(text) => setProblemText(text)} />
            </div>
            <p className="text-xs text-slate-500 mb-2">
              Paste the full problem — or capture it from your camera.
            </p>
            <textarea
              className="w-full bg-slate-100/90 text-slate-900 border border-slate-900/15 rounded-none p-3 text-sm font-mono resize-y focus:outline-none focus:ring-2 focus:ring-cyan-400/40"
              rows={7}
              placeholder="Paste or capture the problem here..."
              value={problemText}
              onChange={(e) => setProblemText(e.target.value)}
            />
            <button
              onClick={handleSolve}
              className="mt-3 flex items-center gap-1.5 px-4 py-2 bg-cyan-600 text-white text-sm font-semibold rounded-none hover:bg-cyan-700 transition-colors"
            >
              <Play size={14} /> Break it down
            </button>
          </Card>

          {solveVisible && (
            <>
              <Card>
                <SectionLabel>Pattern Classification</SectionLabel>
                <p className="text-xs text-slate-500 mb-2">Highlighted patterns match keywords in the problem.</p>
                <div className="flex flex-wrap gap-1.5">
                  {ALL_PATTERNS.map((p) => (
                    <span
                      key={p}
                      className={`px-2.5 py-1 rounded-none text-xs font-medium border ${
                        detectedPatterns.includes(p)
                          ? "bg-cyan-50 border-cyan-500/30 text-cyan-700"
                          : "bg-slate-100/90 sm:bg-slate-100/70 border-slate-900/10 text-slate-500"
                      }`}
                    >
                      {p}
                    </span>
                  ))}
                </div>
              </Card>

              <Card>
                <SectionLabel>Brute Force Baseline</SectionLabel>
                <p className="text-xs text-slate-500 mb-2">Describe the naive solution in plain English — no code. What is its time and space complexity?</p>
                <textarea
                  className="w-full bg-slate-100/90 border border-slate-900/15 rounded-none p-3 text-sm resize-y focus:outline-none focus:ring-2 focus:ring-cyan-400/40 text-slate-900"
                  rows={3}
                  placeholder="e.g. Enumerate all possibilities with nested loops. Time: O(n²). Space: O(1)."
                />
              </Card>

              <Card>
                <SectionLabel>Optimal Algorithm (English only — no code)</SectionLabel>
                <p className="text-xs text-slate-500 mb-2">Numbered steps. Include data structures, initialization, main loop, and termination.</p>
                <textarea
                  className="w-full bg-slate-100/90 border border-slate-900/15 rounded-none p-3 text-sm resize-y focus:outline-none focus:ring-2 focus:ring-cyan-400/40 text-slate-900"
                  rows={6}
                  placeholder={"1. Initialize ...\n2. Main loop: ...\n3. Return ..."}
                />
              </Card>

              <Card>
                <SectionLabel>Complexity Target</SectionLabel>
                <div className="grid grid-cols-2 gap-3">
                  {["Time", "Space"].map((label) => (
                    <div key={label} className="bg-slate-100/90 sm:bg-slate-100/70 rounded-none p-3">
                      <div className="text-xs text-slate-500 uppercase tracking-wide mb-1">{label}</div>
                      <input
                        className="w-full bg-transparent font-mono text-base font-bold text-cyan-600 focus:outline-none"
                        placeholder="O(?)"
                      />
                    </div>
                  ))}
                </div>
              </Card>

              <Card>
                <SectionLabel>Gotchas</SectionLabel>
                <p className="text-xs text-slate-500 mb-2">List 2-3 things that commonly trip people up on this problem.</p>
                <textarea
                  className="w-full bg-slate-100/90 border border-slate-900/15 rounded-none p-3 text-sm resize-y focus:outline-none focus:ring-2 focus:ring-cyan-400/40 text-slate-900"
                  rows={3}
                  placeholder={"• Off-by-one on boundary\n• Forgetting to handle empty input\n• ..."}
                />
              </Card>

              <div className="bg-emerald-50 border border-emerald-200 rounded-none p-4 text-sm text-emerald-700 font-medium">
                Algorithm locked in —{" "}
                <button
                  className="underline font-semibold cursor-pointer"
                  onClick={() => setPhase("code")}
                >
                  move to Phase 2: Code
                </button>
              </div>
            </>
          )}
        </div>
      )}

      {/* ── PHASE 2: CODE ── */}
      {phase === "code" && (
        <div className="space-y-4">
          <Card>
            <div className="flex items-center justify-between mb-2">
              <SectionLabel>Your Implementation</SectionLabel>
              <CameraCapture mode="code" onResult={(text) => setCodeText(text)} />
            </div>
            <p className="text-xs text-slate-500 mb-2">
              Type your code — or capture handwritten code from your camera.
            </p>
            <textarea
              className="w-full bg-slate-100/90 text-slate-900 border border-slate-900/15 rounded-none p-3 text-sm font-mono resize-y focus:outline-none focus:ring-2 focus:ring-cyan-400/40"
              rows={12}
              placeholder={"class Solution:\n    def solve(self, ...):\n        # your code here"}
              value={codeText}
              onChange={(e) => setCodeText(e.target.value)}
            />
          </Card>

          {/* Dry Run */}
          <Card>
            <SectionLabel>Dry Run</SectionLabel>
            <p className="text-xs text-slate-500 mb-3">
              Pick a small test input, trace your algorithm by hand, and write what you expect each step to do.
            </p>
            <div className="flex gap-2 mb-3">
              <input
                className="flex-1 bg-slate-100/90 text-slate-900 border border-slate-900/15 rounded-none px-3 py-1.5 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-cyan-400/40"
                placeholder="Test input (e.g. x=2, y=1)"
                value={dryRunInput}
                onChange={(e) => setDryRunInput(e.target.value)}
              />
            </div>
            <textarea
              className="w-full bg-slate-100/90 text-slate-900 border border-slate-900/15 rounded-none p-3 text-sm font-mono resize-y focus:outline-none focus:ring-2 focus:ring-cyan-400/40"
              rows={6}
              placeholder={"Step 1: queue = [(0,0)], visited = {(0,0)}\nStep 2: pop (0,0), enqueue (1,2),(2,1),...\n..."}
              value={dryRunText}
              onChange={(e) => setDryRunText(e.target.value)}
            />
          </Card>

          {/* Verification Checklist */}
          <Card>
            <SectionLabel>Verification Checklist</SectionLabel>
            <p className="text-xs text-slate-500 mb-3">
              Mentally verify each claim against your code. Click to mark pass / fail.
            </p>
            <ul className="space-y-1.5">
              {VERIFY_CHECKS.map((text, i) => (
                <li
                  key={i}
                  onClick={() => toggleCheck(i)}
                  className={`flex items-start gap-2.5 p-2.5 rounded-none border cursor-pointer transition-colors select-none text-sm ${checkRow(checks[i])}`}
                >
                  <span className={`font-mono text-base leading-tight min-w-[1rem] text-center font-bold ${checkIconColor(checks[i])}`}>
                    {checkIcon(checks[i])}
                  </span>
                  <span>{text}</span>
                </li>
              ))}
            </ul>
            <button
              onClick={() => setChecks(VERIFY_CHECKS.map(() => "pending"))}
              className="mt-2 flex items-center gap-1 text-xs text-slate-500 hover:text-slate-700"
            >
              <RotateCcw size={11} /> Reset
            </button>
          </Card>

          {/* Coding Hints */}
          <Card>
            <SectionLabel>Coding Hints</SectionLabel>
            <p className="text-xs text-slate-500 mb-3">
              3-hint budget — Socratic nudges only, no full solutions.
            </p>
            <div className="flex items-center gap-2 mb-3 text-sm text-slate-500">
              <span>Hints used:</span>
              {[0, 1, 2].map((i) => (
                <span key={i} className={`font-mono text-base ${i < hintsUsed ? "text-amber-600" : "text-slate-600"}`}>
                  {i < hintsUsed ? "●" : "○"}
                </span>
              ))}
            </div>
            <div className="flex gap-2 flex-wrap">
              <button
                onClick={handleHint}
                disabled={hintsUsed >= 3}
                className="px-3 py-1.5 border border-cyan-500/30 text-cyan-700 text-sm font-medium rounded-none hover:bg-cyan-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                Request a hint
              </button>
              <button
                onClick={handleReview}
                className="px-3 py-1.5 bg-cyan-600 text-white text-sm font-semibold rounded-none hover:bg-cyan-700 transition-colors"
              >
                Review my code →
              </button>
            </div>

            {codeFeedback && (
              <div className="mt-3 p-3 bg-slate-100/90 sm:bg-slate-100/70 rounded-none text-sm text-slate-700 font-mono whitespace-pre-wrap">
                {codeFeedback}
              </div>
            )}
          </Card>
        </div>
      )}

      {/* ── PHASE 3: VERIFY ── */}
      {phase === "verify" && (
        <div className="space-y-4">
          <Card>
            <SectionLabel>Final Solution</SectionLabel>
            <textarea
              className="w-full bg-slate-100/90 text-slate-900 border border-slate-900/15 rounded-none p-3 text-sm font-mono resize-y focus:outline-none focus:ring-2 focus:ring-cyan-400/40"
              rows={12}
              placeholder="Paste your final solution..."
              value={verifyCode}
              onChange={(e) => setVerifyCode(e.target.value)}
            />
            <button
              onClick={() => { if (verifyCode.trim()) setVerifyVisible(true); }}
              className="mt-3 flex items-center gap-1.5 px-4 py-2 bg-cyan-600 text-white text-sm font-semibold rounded-none hover:bg-cyan-700 transition-colors"
            >
              <Play size={14} /> Run verification
            </button>
          </Card>

          {verifyVisible && (
            <>
              <Card>
                <SectionLabel>Test Cases</SectionLabel>
                <p className="text-xs text-slate-500 mb-2">
                  Fill in inputs, expected outputs, and your actual outputs. Mark pass/fail.
                </p>
                <table className="w-full text-sm border-collapse">
                  <thead>
                    <tr className="text-left text-xs text-slate-500 border-b border-slate-900/5">
                      {["Input", "Expected", "Actual", "Pass?"].map((h) => (
                        <th key={h} className="py-1.5 pr-3 font-semibold uppercase tracking-wide">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {Array.from({ length: 5 }).map((_, i) => (
                      <tr key={i} className="border-b border-slate-900/5">
                        {["", "", ""].map((_, j) => (
                          <td key={j} className="py-1 pr-3">
                            <input className="w-full bg-slate-100/90 text-slate-900 font-mono text-xs border border-slate-900/15 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-cyan-400/40" />
                          </td>
                        ))}
                        <td className="py-1">
                          <select className="bg-slate-100/90 text-slate-900 text-xs border border-slate-900/15 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-cyan-400/40">
                            <option>—</option>
                            <option>✓</option>
                            <option>✗</option>
                          </select>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </Card>

              <Card>
                <SectionLabel>Edge Cases</SectionLabel>
                <p className="text-xs text-slate-500 mb-2">List the edge cases you checked and whether they passed.</p>
                <textarea
                  className="w-full bg-slate-100/90 border border-slate-900/15 rounded-none p-3 text-sm resize-y focus:outline-none focus:ring-2 focus:ring-cyan-400/40 text-slate-900"
                  rows={4}
                  placeholder={"• Empty input → ?\n• Single element → ?\n• Max constraints → ?\n• Negative values → ?"}
                />
              </Card>

              <Card>
                <SectionLabel>Complexity Audit</SectionLabel>
                <div className="grid grid-cols-2 gap-3">
                  {["Time", "Space"].map((label) => (
                    <div key={label} className="bg-slate-100/90 sm:bg-slate-100/70 rounded-none p-3">
                      <div className="text-xs text-slate-500 uppercase tracking-wide mb-1">{label}</div>
                      <input
                        className="w-full bg-transparent font-mono text-base font-bold text-cyan-600 focus:outline-none"
                        placeholder="O(?)"
                      />
                    </div>
                  ))}
                </div>
              </Card>

              <Card>
                <SectionLabel>Interview Rubric</SectionLabel>
                <ul className="space-y-2 text-sm">
                  {[
                    "Correctness — all test cases pass",
                    "Edge case handling — explicit checks present",
                    "Time complexity — matches target",
                    "Space complexity — no unnecessary allocations",
                    "Code clarity — names are meaningful, logic is readable",
                    "Communication — explained approach before coding",
                  ].map((item, i) => (
                    <li key={i} className="flex items-center gap-2">
                      <select className="bg-slate-100/90 text-slate-900 text-xs border border-slate-900/15 rounded px-1.5 py-0.5 focus:outline-none focus:ring-2 focus:ring-cyan-400/40">
                        <option>—</option>
                        <option>✓ Pass</option>
                        <option>⚠ Partial</option>
                        <option>✗ Fail</option>
                      </select>
                      <span className="text-slate-700">{item}</span>
                    </li>
                  ))}
                </ul>
              </Card>
            </>
          )}
        </div>
      )}
    </div>
  );
}
