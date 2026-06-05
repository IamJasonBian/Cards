import { tags } from "../../data/patterns";

export function TagRail({ onNavigate }: { onNavigate: (view: string) => void }) {
  return (
    <section className="mx-auto w-full max-w-5xl px-4 sm:px-6 py-10 sm:py-12 text-center">
      <p className="text-xs font-semibold uppercase tracking-[0.15em] text-slate-500 [text-shadow:_0_1px_12px_rgb(255_255_255_/_80%)]">
        Topics
      </p>
      <div className="mt-5 flex flex-wrap justify-center gap-2">
        {tags.map((tag) => (
          <button
            key={tag}
            type="button"
            onClick={() => onNavigate("patterns")}
            className="border border-slate-900/15 bg-white/50 backdrop-blur-sm text-slate-700 hover:bg-white/80 hover:text-cyan-700 px-3 py-1.5 text-sm rounded-none cursor-pointer transition-colors"
          >
            {tag}
          </button>
        ))}
      </div>
    </section>
  );
}
