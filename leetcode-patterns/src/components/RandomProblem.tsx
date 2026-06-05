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
  Easy: "bg-emerald-50 text-emerald-700 border-emerald-200",
  Medium: "bg-amber-50 text-amber-700 border-amber-200",
  Hard: "bg-rose-50 text-rose-700 border-rose-200",
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
    <div className="mb-8 rounded-none border border-cyan-500/30 bg-cyan-50 backdrop-blur-2xl p-5">
      <div className="flex flex-wrap items-center gap-3">
        <Shuffle size={20} className="text-cyan-600" />
        <h2 className="text-base font-bold text-slate-900">Random Problem</h2>

        <div className="flex gap-1.5 ml-2">
          {(["Easy", "Medium", "Hard"] as Difficulty[]).map((d) => (
            <button
              key={d}
              onClick={() => setDifficulty(difficulty === d ? null : d)}
              className={`px-3 py-1 rounded-none text-xs font-medium border transition-colors cursor-pointer ${
                difficulty === d
                  ? diffStyles[d]
                  : "bg-slate-100/90 sm:bg-slate-100/70 text-slate-500 border-slate-900/10 hover:bg-slate-900/5"
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
            className="inline-flex items-center gap-2 px-4 py-2 rounded-none bg-white/85 sm:bg-white/65 backdrop-blur-2xl border border-cyan-500/30 text-cyan-700 font-medium text-sm hover:bg-cyan-50 transition-colors"
          >
            {problem.name}
            <ExternalLink size={14} />
          </a>
        </div>
      )}
    </div>
  );
}
