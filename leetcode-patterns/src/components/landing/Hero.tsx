import { SquareStack, ArrowRight } from "lucide-react";

export function Hero({ onNavigate }: { onNavigate: (view: string) => void }) {
  return (
    <section className="flex min-h-[60vh] flex-col items-center justify-center px-4 py-20 text-center sm:py-28">
      <div className="flex h-16 w-16 items-center justify-center rounded-none border border-slate-900/15 bg-white/60 backdrop-blur-sm">
        <SquareStack className="h-8 w-8 text-cyan-700" />
      </div>

      <div className="mt-8 w-full bg-white px-5 py-6 sm:mt-6 sm:bg-white/65 sm:py-8">
        <h1 className="text-4xl font-bold tracking-tight text-slate-900 sm:mt-8 sm:text-7xl sm:[text-shadow:_0_2px_20px_rgb(255_255_255_/_55%)]">
          One Card a Day
        </h1>

        <p className="mt-2 text-3xl font-normal tracking-tight text-slate-700 sm:text-4xl sm:[text-shadow:_0_2px_16px_rgb(255_255_255_/_55%)]">
          Transform
        </p>

        <p className="mt-6 mx-auto max-w-xl text-base font-bold text-slate-800 sm:[text-shadow:_0_1px_10px_rgb(255_255_255_/_65%)]">
          Daily algorithm flashcards, drills, and pattern practice — one card at a time.
        </p>
      </div>

      <div className="mt-8 flex w-full flex-col items-stretch justify-center gap-3 sm:w-auto sm:flex-row sm:flex-wrap sm:items-center">
        <button
          type="button"
          onClick={() => onNavigate("submit")}
          className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-none bg-cyan-600 px-5 py-2.5 font-medium text-white transition-colors hover:bg-cyan-700"
        >
          Start today's card
          <ArrowRight className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={() => onNavigate("patterns")}
          className="cursor-pointer rounded-none border border-slate-900/15 bg-white/95 sm:bg-white/60 px-5 py-2.5 text-center font-medium text-slate-800 backdrop-blur-sm transition-colors hover:bg-white/80"
        >
          Browse patterns
        </button>
      </div>
    </section>
  );
}
