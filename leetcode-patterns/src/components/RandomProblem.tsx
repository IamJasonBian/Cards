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
  let pool = allProblems;
  if (difficulty) {
    // Rough heuristic: patterns early in the list skew easier
    const total = allProblems.length;
    if (difficulty === "Easy") pool = allProblems.slice(0, Math.floor(total * 0.33));
    else if (difficulty === "Medium") pool = allProblems.slice(Math.floor(total * 0.2), Math.floor(total * 0.75));
    else pool = allProblems.slice(Math.floor(total * 0.5));
  }
  return pool[Math.floor(Math.random() * pool.length)];
}

const diffStyles: Record<Difficulty, string> = {
  Easy: "bg-green-100 text-green-700 border-green-200",
  Medium: "bg-yellow-100 text-yellow-700 border-yellow-200",
  Hard: "bg-red-100 text-red-700 border-red-200",
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
    <div className="mb-8 rounded-xl border border-indigo-200 bg-gradient-to-r from-indigo-50 to-purple-50 p-5">
      <div className="flex flex-wrap items-center gap-3">
        <Shuffle size={20} className="text-indigo-600" />
        <h2 className="text-base font-bold text-gray-900">Random Problem</h2>

        <div className="flex gap-1.5 ml-2">
          {(["Easy", "Medium", "Hard"] as Difficulty[]).map((d) => (
            <button
              key={d}
              onClick={() => setDifficulty(difficulty === d ? null : d)}
              className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors cursor-pointer ${
                difficulty === d
                  ? diffStyles[d]
                  : "bg-white text-gray-500 border-gray-200 hover:bg-gray-50"
              }`}
            >
              {d}
            </button>
          ))}
        </div>

        <button
          onClick={roll}
          className="ml-auto flex items-center gap-2 px-4 py-2 rounded-lg bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700 transition-colors cursor-pointer"
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
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-white border border-indigo-200 text-indigo-700 font-medium text-sm hover:bg-indigo-50 transition-colors"
          >
            {problem.name}
            <ExternalLink size={14} />
          </a>
        </div>
      )}
    </div>
  );
}
