import { ArrowRight } from "lucide-react";

export function SplitFeature({ onNavigate }: { onNavigate: (view: string) => void }) {
  return (
    <section className="mx-auto w-full max-w-5xl px-4 sm:px-6 py-16 sm:py-24">
      <div className="rounded-none border border-slate-900/10 bg-white/95 sm:bg-transparent sm:bg-gradient-to-b sm:from-[#171b22]/85 sm:to-[#171b22]/60 backdrop-blur-sm p-8 sm:p-14 text-center">
        <p className="text-xs font-semibold uppercase tracking-[0.15em] text-slate-500">
          Instant feedback
        </p>
        <h2 className="mt-4 text-3xl sm:text-5xl font-bold tracking-tight text-slate-900">
          Submit &amp; run — see results in seconds
        </h2>
        <p className="mt-5 mx-auto max-w-2xl text-base sm:text-lg text-slate-600">
          Write your solution, run it against the real test cases, and get
          accepted/wrong-answer feedback with the failing case — right in the
          browser.
        </p>
        <div className="mt-8 flex justify-center">
          <button
            type="button"
            onClick={() => onNavigate("submit")}
            className="bg-cyan-600 text-white hover:bg-cyan-700 px-5 py-2.5 rounded-none font-medium inline-flex items-center gap-2 cursor-pointer transition-colors"
          >
            Try the judge
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    </section>
  );
}
