import { useState, useCallback } from "react";
import { Shuffle, ExternalLink } from "lucide-react";
import { patterns } from "../data/patterns";
import type { Problem } from "../data/patterns";

type Difficulty = "Easy" | "Medium" | "Hard";

const allProblems: Problem[] = [];
const seen = new Set<string>();
for (const p of patterns) {
  for (const prob of p.problems) {
    if (!seen.has(prob.slug)) {
      seen.add(prob.slug);
      allProblems.push(prob);
    }
  }
}

function pickRandom(difficulty: Difficulty | null): Problem {
  const pool = difficulty
    ? allProblems.filter((p) => p.difficulty === difficulty)
    : allProblems;
  return pool[Math.floor(Math.random() * pool.length)];
}

const diffStyles: Record<Difficulty, string> = {
  Easy: "bg-emerald-500/15 text-emerald-300 border-emerald-400/30",
  Medium: "bg-amber-500/15 text-amber-300 border-amber-400/30",
  Hard: "bg-rose-500/15 text-rose-300 border-rose-400/30",
};

export function RandomProblem() {
  const [difficulty, setDifficulty] = useState<Difficulty | null>(null);
  const [problem, setProblem] = useState<Problem | null>(null);
  const [spinning, setSpinning] = useState(false);

  const roll = useCallback(() => {
    setSpinning(true);
    setProblem(pickRandom(difficulty));
    setTimeout(() => setSpinning(false), 500);
  }, [difficulty]);

  return (
    <div className="mb-8 rounded-2xl border border-cyan-400/30 bg-cyan-500/10 backdrop-blur-md p-5">
      <div className="flex flex-wrap items-center gap-3">
        <Shuffle size={20} className="text-cyan-400" />
        <h2 className="text-base font-bold text-slate-100">Random Problem</h2>

        <div className="flex gap-1.5 ml-2">
          {(["Easy", "Medium", "Hard"] as Difficulty[]).map((d) => (
            <button
              key={d}
              onClick={() => setDifficulty(difficulty === d ? null : d)}
              className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors cursor-pointer ${
                difficulty === d
                  ? diffStyles[d]
                  : "bg-slate-800/50 text-slate-400 border-white/10 hover:bg-white/5"
              }`}
            >
              {d}
            </button>
          ))}
        </div>

        <button
          onClick={roll}
          className="ml-auto flex items-center gap-2 px-4 py-2 rounded-2xl bg-cyan-500 text-slate-950 text-sm font-medium hover:bg-cyan-400 transition-colors cursor-pointer"
        >
          <Shuffle size={14} className={spinning ? "animate-spin" : ""} />
          Roll
        </button>
      </div>

      {problem && (
        <div className="mt-4 flex items-center gap-3">
          <a
            href={`https://leetcode.com/problems/${problem.slug}/`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl bg-slate-900/60 backdrop-blur-md border border-cyan-400/30 text-cyan-300 font-medium text-sm hover:bg-cyan-500/10 transition-colors"
          >
            {problem.name}
            <ExternalLink size={14} />
          </a>
        </div>
      )}
    </div>
  );
}
