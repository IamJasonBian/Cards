import { useState, useRef, useEffect, useCallback } from "react";
import { Grid3x3, Trophy, RotateCcw, Search, ChevronDown, ChevronRight } from "lucide-react";

// ── Trie ──────────────────────────────────────────────────────────────
interface TrieNode {
  children: Record<string, TrieNode>;
  word: string | null;
}

function buildTrie(words: string[]): TrieNode {
  const root: TrieNode = { children: {}, word: null };
  for (const w of words) {
    let node = root;
    for (const ch of w) {
      if (!node.children[ch]) node.children[ch] = { children: {}, word: null };
      node = node.children[ch];
    }
    node.word = w;
  }
  return root;
}

// ── Solver (LC 212 – Word Search II) ──────────────────────────────────
function solve(grid: string[][], trie: TrieNode): string[] {
  const rows = grid.length;
  const cols = grid[0].length;
  const found = new Set<string>();
  const dirs = [
    [-1, -1], [-1, 0], [-1, 1],
    [0, -1],           [0, 1],
    [1, -1],  [1, 0],  [1, 1],
  ];

  function dfs(r: number, c: number, node: TrieNode, visited: Set<string>) {
    const ch = grid[r][c];
    const next = node.children[ch];
    if (!next) return;

    if (next.word) found.add(next.word);

    const key = `${r},${c}`;
    visited.add(key);

    for (const [dr, dc] of dirs) {
      const nr = r + dr;
      const nc = c + dc;
      if (nr >= 0 && nr < rows && nc >= 0 && nc < cols && !visited.has(`${nr},${nc}`)) {
        dfs(nr, nc, next, visited);
      }
    }

    visited.delete(key);
  }

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      dfs(r, c, trie, new Set());
    }
  }

  return Array.from(found);
}

// ── Scoring ───────────────────────────────────────────────────────────
function wordPoints(len: number): number {
  if (len <= 3) return 100;
  if (len === 4) return 400;
  if (len === 5) return 800;
  if (len === 6) return 1400;
  if (len === 7) return 1800;
  return 2200;
}

interface TryResult {
  id: number;
  grid: string[][];
  words: string[];
  totalPoints: number;
}

// ── Component ─────────────────────────────────────────────────────────
type GroupMode = "trie" | "score";

export function WordHunt() {
  const [letters, setLetters] = useState<string[]>(Array(16).fill(""));
  const [trie, setTrie] = useState<TrieNode | null>(null);
  const [loading, setLoading] = useState(true);
  const [tries, setTries] = useState<TryResult[]>([]);
  const [expandedTry, setExpandedTry] = useState<number | null>(null);
  const [groupMode, setGroupMode] = useState<GroupMode>("score");
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Load dictionary once
  useEffect(() => {
    fetch("/words.txt")
      .then((r) => r.text())
      .then((text) => {
        const words = text.split("\n").filter((w) => w.length >= 3);
        setTrie(buildTrie(words));
        setLoading(false);
      });
  }, []);

  const handleInput = useCallback((index: number, value: string) => {
    const ch = value.slice(-1).toLowerCase();
    if (ch && !/^[a-z]$/.test(ch)) return;

    setLetters((prev) => {
      const next = [...prev];
      next[index] = ch;
      return next;
    });

    if (ch && index < 15) {
      inputRefs.current[index + 1]?.focus();
    }
  }, []);

  const handleKeyDown = useCallback(
    (index: number, e: React.KeyboardEvent) => {
      if (e.key === "Backspace" && !letters[index] && index > 0) {
        inputRefs.current[index - 1]?.focus();
      }
    },
    [letters]
  );

  function handleSolve() {
    if (!trie) return;
    const filled = letters.every((l) => l !== "");
    if (!filled) return;

    const grid: string[][] = [];
    for (let r = 0; r < 4; r++) {
      grid.push(letters.slice(r * 4, r * 4 + 4));
    }

    const words = solve(grid, trie);
    words.sort((a, b) => b.length - a.length || a.localeCompare(b));

    const totalPoints = words.reduce((sum, w) => sum + wordPoints(w.length), 0);
    const id = tries.length + 1;

    setTries((prev) => [{ id, grid, words, totalPoints }, ...prev]);
    setExpandedTry(id);
  }

  function handleClear() {
    setLetters(Array(16).fill(""));
    inputRefs.current[0]?.focus();
  }

  // Group words by length (score view)
  function groupByLength(words: string[]): [number, string[]][] {
    const groups = new Map<number, string[]>();
    for (const w of words) {
      const len = w.length;
      if (!groups.has(len)) groups.set(len, []);
      groups.get(len)!.push(w);
    }
    return Array.from(groups.entries()).sort((a, b) => b[0] - a[0]);
  }

  // Group words by shared prefix (trie-style)
  function groupByPrefix(words: string[]): { prefix: string; words: string[] }[] {
    const sorted = [...words].sort();
    const groups: { prefix: string; words: string[] }[] = [];
    let i = 0;

    while (i < sorted.length) {
      // Find the longest prefix shared with the next word(s)
      let j = i + 1;

      // Collect all words sharing a prefix of length >= 2 with sorted[i]
      while (j < sorted.length) {
        const shared = commonPrefix(sorted[i], sorted[j]);
        if (shared.length >= 2) {
          j++;
        } else {
          break;
        }
      }

      if (j > i + 1) {
        // Multiple words share a prefix — find the common prefix of the group
        const groupWords = sorted.slice(i, j);
        let prefix = groupWords[0];
        for (const w of groupWords) {
          prefix = commonPrefix(prefix, w);
        }
        // If the common prefix is too short, use 2-char prefix subgroups
        if (prefix.length < 2) prefix = sorted[i].slice(0, 2);
        groups.push({ prefix, words: groupWords });
      } else {
        // Single word — use its first 2 chars as prefix
        groups.push({ prefix: sorted[i].slice(0, 2), words: [sorted[i]] });
      }
      i = j;
    }

    // Merge groups that ended up with the same prefix
    const merged = new Map<string, string[]>();
    for (const g of groups) {
      if (!merged.has(g.prefix)) merged.set(g.prefix, []);
      merged.get(g.prefix)!.push(...g.words);
    }

    return Array.from(merged.entries())
      .map(([prefix, words]) => ({ prefix, words }))
      .sort((a, b) => b.words.length - a.words.length);
  }

  function commonPrefix(a: string, b: string): string {
    let i = 0;
    while (i < a.length && i < b.length && a[i] === b[i]) i++;
    return a.slice(0, i);
  }

  return (
    <div className="max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <Grid3x3 size={28} className="text-cyan-400" />
        <div>
          <h2 className="text-2xl font-bold text-slate-100">Word Hunt</h2>
          <p className="text-sm text-slate-400">
            Enter letters into the grid, then solve to find all words (LC 212)
          </p>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12 text-slate-400">Loading dictionary…</div>
      ) : (
        <>
          {/* Grid */}
          <div className="bg-slate-900/60 backdrop-blur-md rounded-2xl border border-white/10 shadow-sm p-6 mb-4">
            <div className="grid grid-cols-4 gap-2 max-w-[264px] mx-auto mb-5">
              {letters.map((letter, i) => (
                <input
                  key={i}
                  ref={(el) => { inputRefs.current[i] = el; }}
                  type="text"
                  inputMode="text"
                  maxLength={2}
                  value={letter.toUpperCase()}
                  onChange={(e) => handleInput(i, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(i, e)}
                  className="w-14 h-14 text-2xl font-bold text-center rounded-lg border-2 border-white/15 text-slate-100 focus:border-cyan-400 focus:outline-none focus:ring-2 focus:ring-cyan-400/40 transition-colors bg-slate-950/70 uppercase"
                />
              ))}
            </div>

            <div className="flex justify-center gap-3">
              <button
                onClick={handleSolve}
                disabled={!letters.every((l) => l !== "")}
                className="flex items-center gap-2 px-5 py-2.5 bg-cyan-500 text-slate-950 rounded-lg font-medium hover:bg-cyan-400 transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
              >
                <Search size={16} />
                Solve
              </button>
              <button
                onClick={handleClear}
                className="flex items-center gap-2 px-5 py-2.5 bg-slate-800/50 text-slate-300 rounded-lg font-medium hover:bg-white/5 transition-colors cursor-pointer"
              >
                <RotateCcw size={16} />
                Clear
              </button>
            </div>
          </div>

          {/* High score */}
          {tries.length > 0 && (() => {
            const best = tries.reduce((a, b) => a.totalPoints > b.totalPoints ? a : b);
            return (
              <div className="bg-amber-500/15 border border-amber-400/30 rounded-2xl px-5 py-4 mb-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Trophy size={22} className="text-amber-300" />
                  <div>
                    <p className="text-sm font-semibold text-amber-300">High Score</p>
                    <p className="text-xs text-amber-300">
                      Try #{best.id} · {best.words.length} words
                    </p>
                  </div>
                </div>
                <span className="text-2xl font-bold text-amber-300">
                  {best.totalPoints.toLocaleString()} pts
                </span>
              </div>
            );
          })()}

          {/* Results grouped by tries */}
          {tries.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wide">
                  Results — {tries.length} {tries.length === 1 ? "try" : "tries"}
                </h3>
                <div className="flex gap-1 bg-slate-800/50 rounded-lg p-0.5">
                  <button
                    onClick={() => setGroupMode("score")}
                    className={`px-3 py-1 rounded-md text-xs font-medium transition-colors cursor-pointer ${
                      groupMode === "score"
                        ? "bg-slate-900/60 text-slate-100 shadow-sm"
                        : "text-slate-400 hover:text-slate-300"
                    }`}
                  >
                    By Score
                  </button>
                  <button
                    onClick={() => setGroupMode("trie")}
                    className={`px-3 py-1 rounded-md text-xs font-medium transition-colors cursor-pointer ${
                      groupMode === "trie"
                        ? "bg-slate-900/60 text-slate-100 shadow-sm"
                        : "text-slate-400 hover:text-slate-300"
                    }`}
                  >
                    By Prefix
                  </button>
                </div>
              </div>

              {tries.map((t) => {
                const open = expandedTry === t.id;

                return (
                  <div
                    key={t.id}
                    className="bg-slate-900/60 backdrop-blur-md rounded-2xl border border-white/10 shadow-sm overflow-hidden"
                  >
                    {/* Try header */}
                    <button
                      onClick={() => setExpandedTry(open ? null : t.id)}
                      className="w-full flex items-center justify-between px-5 py-4 hover:bg-white/5 transition-colors cursor-pointer"
                    >
                      <div className="flex items-center gap-3">
                        {open ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
                        <span className="font-semibold text-slate-100">
                          Try #{t.id}
                        </span>
                        <span className="text-sm text-slate-400">
                          {t.grid.map((row) => row.join("")).join(" · ").toUpperCase()}
                        </span>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className="text-sm text-slate-400">
                          {t.words.length} words
                        </span>
                        <span className="flex items-center gap-1 text-sm font-semibold text-amber-300">
                          <Trophy size={14} />
                          {t.totalPoints.toLocaleString()} pts
                        </span>
                      </div>
                    </button>

                    {/* Expanded content */}
                    {open && (
                      <div className="border-t border-white/5 px-5 py-4 space-y-4">
                        {groupMode === "score"
                          ? groupByLength(t.words).map(([len, words]) => (
                              <div key={len}>
                                <div className="flex items-center gap-2 mb-2">
                                  <span className="text-xs font-semibold text-slate-400 uppercase tracking-wide">
                                    {len}-letter words
                                  </span>
                                  <span className="text-xs text-slate-400">
                                    ({words.length}) · {wordPoints(len)} pts each
                                  </span>
                                </div>
                                <div className="flex flex-wrap gap-1.5">
                                  {words.map((w) => (
                                    <span
                                      key={w}
                                      className="px-2.5 py-1 bg-cyan-500/10 text-cyan-400 rounded-md text-sm font-medium"
                                    >
                                      {w}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            ))
                          : groupByPrefix(t.words).map(({ prefix, words }) => (
                              <div key={prefix}>
                                <div className="flex items-center gap-2 mb-2">
                                  <span className="px-2 py-0.5 bg-slate-800/50 text-slate-100 rounded text-xs font-mono font-bold">
                                    {prefix}—
                                  </span>
                                  <span className="text-xs text-slate-400">
                                    {words.length} {words.length === 1 ? "word" : "words"}
                                  </span>
                                </div>
                                <div className="flex flex-wrap gap-1.5">
                                  {words.map((w) => (
                                    <span
                                      key={w}
                                      className="px-2.5 py-1 bg-cyan-500/10 text-cyan-400 rounded-md text-sm font-medium"
                                    >
                                      <span className="font-bold">{prefix}</span>
                                      {w.slice(prefix.length)}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}
    </div>
  );
}
