import { SquareStack, ArrowRight } from "lucide-react";

export function Hero({ onNavigate }: { onNavigate: (view: string) => void }) {
  return (
    <section className="flex min-h-[60vh] flex-col items-center justify-center px-4 py-20 text-center sm:py-28">
      <p className="text-xs font-semibold uppercase tracking-[0.15em] text-slate-500 [text-shadow:_0_1px_12px_rgb(255_255_255_/_80%)]">
        Daily algorithm practice
      </p>

      <div className="mt-6 flex h-16 w-16 items-center justify-center rounded-none border border-slate-900/15 bg-white/60 backdrop-blur-sm">
        <SquareStack className="h-8 w-8 text-cyan-700" />
      </div>

      <h1 className="mt-8 text-5xl font-bold tracking-tight text-slate-900 sm:text-7xl [text-shadow:_0_2px_24px_rgb(255_255_255_/_70%)]">
        One Card a Day
      </h1>

      <p className="mt-2 text-3xl font-light tracking-tight text-slate-600 sm:text-4xl [text-shadow:_0_2px_18px_rgb(255_255_255_/_70%)]">
        Transform
      </p>

      <p className="mt-6 max-w-xl text-base text-slate-700 [text-shadow:_0_1px_12px_rgb(255_255_255_/_80%)]">
        Daily algorithm flashcards, drills, and pattern practice — one card at a time.
      </p>

      <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
        <button
          type="button"
          onClick={() => onNavigate("submit")}
          className="inline-flex cursor-pointer items-center gap-2 rounded-none bg-cyan-600 px-5 py-2.5 font-medium text-white transition-colors hover:bg-cyan-700"
        >
          Start today's card
          <ArrowRight className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={() => onNavigate("patterns")}
          className="cursor-pointer rounded-none border border-slate-900/15 bg-white/60 px-5 py-2.5 font-medium text-slate-800 backdrop-blur-sm transition-colors hover:bg-white/80"
        >
          Browse patterns
        </button>
      </div>
    </section>
  );
}
