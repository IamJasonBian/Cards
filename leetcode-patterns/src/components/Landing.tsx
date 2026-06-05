import {
  SquareStack,
  Hash,
  Zap,
  BookOpen,
  Play,
  Layers,
  Code,
  ArrowUpRight,
  type LucideIcon,
} from "lucide-react";

export type LandingView =
  | "patterns"
  | "speed-apps"
  | "popular-lists"
  | "submit"
  | "flashcards"
  | "interview-drill";

const BLOCKS: {
  id: LandingView;
  label: string;
  desc: string;
  icon: LucideIcon;
}[] = [
  { id: "patterns", label: "Patterns", desc: "Browse algorithm patterns", icon: Hash },
  { id: "speed-apps", label: "Speed Apps", desc: "Timed word & pattern drills", icon: Zap },
  { id: "popular-lists", label: "Popular Lists", desc: "Blind 75, NeetCode & more", icon: BookOpen },
  { id: "submit", label: "Submit", desc: "Solve & run against tests", icon: Play },
  { id: "flashcards", label: "Flashcards", desc: "Spaced-repetition review", icon: Layers },
  { id: "interview-drill", label: "Interview Drill", desc: "Mock interview practice", icon: Code },
];

export function Landing({
  onNavigate,
}: {
  onNavigate: (view: LandingView) => void;
}) {
  return (
    <div>
      {/* Hero — full-bleed wallpaper shows through; minimal scrim */}
      <section className="flex min-h-[58vh] flex-col items-center justify-center px-4 py-20 text-center sm:py-28">
        <div className="mb-7 flex h-16 w-16 items-center justify-center border border-slate-900/15 bg-white/55 backdrop-blur-md">
          <SquareStack size={30} className="text-cyan-700" strokeWidth={1.75} />
        </div>
        <h1 className="text-5xl font-bold tracking-tight text-slate-900 sm:text-7xl [text-shadow:_0_2px_24px_rgb(255_255_255_/_70%)]">
          One Card a Day
        </h1>
        <p className="mt-2 text-2xl font-light tracking-tight text-slate-700 sm:text-4xl [text-shadow:_0_2px_18px_rgb(255_255_255_/_70%)]">
          Transform
        </p>
        <p className="mt-6 max-w-md text-sm text-slate-600 [text-shadow:_0_1px_12px_rgb(255_255_255_/_80%)]">
          Daily algorithm flashcards, drills, and pattern practice — one card at a time.
        </p>
      </section>

      {/* Top-level section blocks — galaxy-style hairline grid */}
      <section className="mx-auto max-w-5xl border-l border-t border-slate-900/10">
        <div className="grid grid-cols-2 md:grid-cols-3">
          {BLOCKS.map((b) => {
            const Icon = b.icon;
            return (
              <button
                key={b.id}
                onClick={() => onNavigate(b.id)}
                className="group flex flex-col items-start gap-3 border-r border-b border-slate-900/10 bg-white/50 p-6 text-left backdrop-blur-sm transition-colors hover:bg-white/80 cursor-pointer sm:p-8"
              >
                <div className="flex w-full items-center justify-between">
                  <Icon size={22} className="text-cyan-700" strokeWidth={1.75} />
                  <ArrowUpRight
                    size={16}
                    className="text-slate-400 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-cyan-700"
                  />
                </div>
                <span className="text-lg font-semibold text-slate-900">
                  {b.label}
                </span>
                <span className="text-sm text-slate-600">{b.desc}</span>
              </button>
            );
          })}
        </div>
      </section>

      <footer className="py-10 text-center text-xs text-slate-500 [text-shadow:_0_1px_10px_rgb(255_255_255_/_80%)]">
        639 problems solved · Python3
      </footer>
    </div>
  );
}
