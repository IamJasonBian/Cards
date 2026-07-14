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
  Easy: "bg-emerald-500/10 text-emerald-300 border-emerald-500/30",
  Medium: "bg-amber-500/10 text-amber-300 border-amber-500/30",
  Hard: "bg-rose-500/10 text-rose-300 border-rose-500/30",
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
    <div className="mb-8 rounded-none border border-cyan-500/30 bg-cyan-500/10 backdrop-blur-2xl p-5">
      <div className="flex flex-wrap items-center gap-3">
        <Shuffle size={20} className="text-cyan-400" />
        <h2 className="text-base font-bold text-slate-100">Random Problem</h2>

        <div className="flex gap-1.5 ml-2">
          {(["Easy", "Medium", "Hard"] as Difficulty[]).map((d) => (
            <button
              key={d}
              onClick={() => setDifficulty(difficulty === d ? null : d)}
              className={`px-3 py-1 rounded-none text-xs font-medium border transition-colors cursor-pointer ${
                difficulty === d
                  ? diffStyles[d]
                  : "bg-slate-800/90 sm:bg-slate-800/70 text-slate-400 border-white/10 hover:bg-slate-900/5"
              }`}
            >
              {d}
            </button>
          ))}
        </div>

        <button
          onClick={roll}
          className="ml-auto flex items-center gap-2 px-4 py-2 rounded-none bg-cyan-600 text-white text-sm font-medium hover:bg-cyan-700 transition-colors cursor-pointer"
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
            className="inline-flex items-center gap-2 px-4 py-2 rounded-none bg-slate-900/85 sm:bg-slate-900/70 backdrop-blur-2xl border border-cyan-500/30 text-cyan-300 font-medium text-sm hover:bg-cyan-500/10 transition-colors"
          >
            {problem.name}
            <ExternalLink size={14} />
          </a>
        </div>
      )}
    </div>
  );
}
