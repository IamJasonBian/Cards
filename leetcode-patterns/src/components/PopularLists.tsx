import { useState, useMemo } from "react";
import { BookOpen, ExternalLink, Filter } from "lucide-react";
import { popularLists } from "../data/popularLists";
import type { PopularProblem } from "../data/popularLists";

const diffStyles: Record<PopularProblem["difficulty"], string> = {
  Easy: "bg-green-100 text-green-700 border-green-200",
  Medium: "bg-yellow-100 text-yellow-700 border-yellow-200",
  Hard: "bg-red-100 text-red-700 border-red-200",
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
        <h1 className="text-3xl font-bold text-gray-900 mb-2 flex items-center gap-3">
          <BookOpen className="text-indigo-600" size={28} />
          Popular Lists
        </h1>
        <p className="text-gray-600 text-sm">
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
                ? "bg-indigo-600 text-white border-indigo-600"
                : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50"
            }`}
          >
            {list.name}
            <span
              className={`ml-2 text-xs ${
                activeId === list.id ? "text-indigo-100" : "text-gray-400"
              }`}
            >
              {list.problems.length}
            </span>
          </button>
        ))}
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-5 mb-4">
        <div className="flex items-start justify-between gap-4 mb-3">
          <div>
            <h2 className="text-xl font-bold text-gray-900">{active.name}</h2>
            <p className="text-xs text-gray-500 mt-0.5">by {active.author}</p>
          </div>
          <a
            href={active.url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 text-sm text-indigo-600 hover:text-indigo-700 font-medium shrink-0"
          >
            Source
            <ExternalLink size={14} />
          </a>
        </div>
        <p className="text-sm text-gray-600 mb-4">{active.description}</p>

        <div className="flex flex-wrap items-center gap-2">
          <Filter size={14} className="text-gray-400" />
          <button
            onClick={() => setDifficultyFilter(null)}
            className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors cursor-pointer ${
              difficultyFilter === null
                ? "bg-indigo-100 text-indigo-700 border-indigo-200"
                : "bg-white text-gray-500 border-gray-200 hover:bg-gray-50"
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
                  : "bg-white text-gray-500 border-gray-200 hover:bg-gray-50"
              }`}
            >
              {d} {counts[d]}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-3">
        {grouped.map(([category, problems]) => (
          <div key={category} className="bg-white rounded-xl border border-gray-200 p-5">
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-3">
              {category} ({problems.length})
            </p>
            <div className="flex flex-wrap gap-1.5">
              {problems.map((p) => (
                <a
                  key={`${p.slug}-${p.category}`}
                  href={`https://leetcode.com/problems/${p.slug}/`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-2.5 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-xs text-gray-700 hover:bg-indigo-50 hover:border-indigo-200 hover:text-indigo-700 transition-colors"
                >
                  <span
                    className={`inline-block w-1.5 h-1.5 rounded-full ${
                      p.difficulty === "Easy"
                        ? "bg-green-500"
                        : p.difficulty === "Medium"
                        ? "bg-yellow-500"
                        : "bg-red-500"
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
          <div className="text-center text-sm text-gray-400 py-8">
            No problems match this difficulty filter.
          </div>
        )}
      </div>
    </div>
  );
}
