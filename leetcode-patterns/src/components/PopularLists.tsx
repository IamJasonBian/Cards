import { useState, useMemo } from "react";
import { BookOpen, ExternalLink, Filter } from "lucide-react";
import { popularLists } from "../data/popularLists";
import type { PopularProblem } from "../data/popularLists";

const diffStyles: Record<PopularProblem["difficulty"], string> = {
  Easy: "bg-emerald-500/15 text-emerald-300 border-emerald-400/30",
  Medium: "bg-amber-500/15 text-amber-300 border-amber-400/30",
  Hard: "bg-rose-500/15 text-rose-300 border-rose-400/30",
};

export function PopularLists() {
  const [activeId, setActiveId] = useState(popularLists[0].id);
  const [difficultyFilter, setDifficultyFilter] = useState<PopularProblem["difficulty"] | null>(null);

  const active = popularLists.find((l) => l.id === activeId)!;

  const grouped = useMemo(() => {
    const filtered = difficultyFilter
      ? active.problems.filter((p) => p.difficulty === difficultyFilter)
      : active.problems;
    const map = new Map<string, PopularProblem[]>();
    for (const p of filtered) {
      const key = p.category ?? "Other";
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(p);
    }
    return Array.from(map.entries());
  }, [active, difficultyFilter]);

  const counts = useMemo(() => {
    const c = { Easy: 0, Medium: 0, Hard: 0 } as Record<PopularProblem["difficulty"], number>;
    for (const p of active.problems) c[p.difficulty]++;
    return c;
  }, [active]);

  return (
    <div className="max-w-5xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-slate-100 mb-2 flex items-center gap-3">
          <BookOpen className="text-cyan-400" size={28} />
          Popular Lists
        </h1>
        <p className="text-slate-300 text-sm">
          Curated problem sets from the community — each kept to 75 or fewer problems so they stay finishable.
        </p>
      </div>

      <div className="flex flex-wrap gap-2 mb-6">
        {popularLists.map((list) => (
          <button
            key={list.id}
            onClick={() => {
              setActiveId(list.id);
              setDifficultyFilter(null);
            }}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors cursor-pointer border ${
              activeId === list.id
                ? "bg-cyan-500 text-slate-950 border-cyan-500"
                : "bg-slate-900/45 backdrop-blur-xl text-slate-300 border-white/10 hover:bg-white/5"
            }`}
          >
            {list.name}
            <span
              className={`ml-2 text-xs ${
                activeId === list.id ? "text-slate-900/70" : "text-slate-400"
              }`}
            >
              {list.problems.length}
            </span>
          </button>
        ))}
      </div>

      <div className="bg-slate-900/45 backdrop-blur-xl rounded-2xl border border-white/10 p-5 mb-4">
        <div className="flex items-start justify-between gap-4 mb-3">
          <div>
            <h2 className="text-xl font-bold text-slate-100">{active.name}</h2>
            <p className="text-xs text-slate-400 mt-0.5">by {active.author}</p>
          </div>
          <a
            href={active.url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 text-sm text-cyan-400 hover:text-cyan-300 font-medium shrink-0"
          >
            Source
            <ExternalLink size={14} />
          </a>
        </div>
        <p className="text-sm text-slate-300 mb-4">{active.description}</p>

        <div className="flex flex-wrap items-center gap-2">
          <Filter size={14} className="text-slate-400" />
          <button
            onClick={() => setDifficultyFilter(null)}
            className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors cursor-pointer ${
              difficultyFilter === null
                ? "bg-cyan-500/15 text-cyan-300 border-cyan-400/30"
                : "bg-slate-800/40 text-slate-400 border-white/10 hover:bg-white/5"
            }`}
          >
            All {active.problems.length}
          </button>
          {(["Easy", "Medium", "Hard"] as PopularProblem["difficulty"][]).map((d) => (
            <button
              key={d}
              onClick={() => setDifficultyFilter(difficultyFilter === d ? null : d)}
              className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors cursor-pointer ${
                difficultyFilter === d
                  ? diffStyles[d]
                  : "bg-slate-800/40 text-slate-400 border-white/10 hover:bg-white/5"
              }`}
            >
              {d} {counts[d]}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-3">
        {grouped.map(([category, problems]) => (
          <div key={category} className="bg-slate-900/45 backdrop-blur-xl rounded-2xl border border-white/10 p-5">
            <p className="text-xs font-medium text-slate-400 uppercase tracking-wide mb-3">
              {category} ({problems.length})
            </p>
            <div className="flex flex-wrap gap-1.5">
              {problems.map((p) => (
                <a
                  key={`${p.slug}-${p.category}`}
                  href={`https://leetcode.com/problems/${p.slug}/`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-2.5 py-1.5 bg-slate-800/40 border border-white/10 rounded-lg text-xs text-slate-300 hover:bg-cyan-500/10 hover:border-cyan-400/30 hover:text-cyan-300 transition-colors"
                >
                  <span
                    className={`inline-block w-1.5 h-1.5 rounded-full ${
                      p.difficulty === "Easy"
                        ? "bg-emerald-400"
                        : p.difficulty === "Medium"
                        ? "bg-amber-400"
                        : "bg-rose-400"
                    }`}
                  />
                  {p.name}
                  <ExternalLink size={10} className="opacity-60" />
                </a>
              ))}
            </div>
          </div>
        ))}
        {grouped.length === 0 && (
          <div className="text-center text-sm text-slate-400 py-8">
            No problems match this difficulty filter.
          </div>
        )}
      </div>
    </div>
  );
}
