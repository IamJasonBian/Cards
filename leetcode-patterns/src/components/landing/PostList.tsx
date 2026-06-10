import { ArrowRight } from "lucide-react";

const featuredLists = [
  { count: "75 problems", title: "Blind 75", tags: ["Arrays", "Graphs", "DP"] },
  { count: "150 problems", title: "NeetCode 150", tags: ["Trees", "Heaps", "Backtracking"] },
  { count: "75 problems", title: "Grind 75", tags: ["Two Pointers", "Intervals", "Greedy"] },
];

export function PostList({ onNavigate }: { onNavigate: (view: string) => void }) {
  return (
    <section className="mx-auto w-full max-w-5xl px-4 sm:px-6 py-16 sm:py-24">
      <div className="mb-6 flex items-baseline justify-between">
        <h2 className="bg-slate-900/95 px-3 py-1 sm:bg-transparent sm:px-0 sm:py-0 text-2xl sm:text-3xl font-bold text-slate-100 sm:[text-shadow:_0_2px_18px_rgb(255_255_255_/_70%)]">
          Popular lists
        </h2>
        <button
          type="button"
          onClick={() => onNavigate("popular-lists")}
          className="bg-slate-900/95 px-3 py-1 sm:bg-transparent sm:px-0 sm:py-0 text-sm font-medium text-cyan-300 hover:text-cyan-300 inline-flex items-center gap-1 cursor-pointer sm:[text-shadow:_0_1px_12px_rgb(255_255_255_/_80%)]"
        >
          View all
          <ArrowRight size={14} />
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-px bg-slate-900/10">
        {featuredLists.map((list) => (
          <button
            key={list.title}
            type="button"
            onClick={() => onNavigate("popular-lists")}
            className="bg-slate-900/95 sm:bg-slate-900/65 backdrop-blur-sm hover:bg-slate-900/80 p-6 text-left transition-colors cursor-pointer flex flex-col gap-3"
          >
            <span className="text-xs font-semibold uppercase tracking-[0.15em] text-slate-400">
              {list.count}
            </span>
            <span className="text-lg font-semibold text-slate-100">{list.title}</span>
            <div className="flex flex-wrap gap-2">
              {list.tags.map((tag) => (
                <span
                  key={tag}
                  className="border border-white/15 text-slate-400 px-2 py-0.5 text-xs rounded-none"
                >
                  {tag}
                </span>
              ))}
            </div>
          </button>
        ))}
      </div>
    </section>
  );
}
