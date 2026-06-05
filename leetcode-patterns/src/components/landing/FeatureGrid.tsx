import {
  Hash,
  Zap,
  BookOpen,
  Play,
  Layers,
  Code,
  ArrowUpRight,
  type LucideIcon,
} from "lucide-react";

type FeatureBlock = {
  id: string;
  label: string;
  desc: string;
  icon: LucideIcon;
};

const blocks: FeatureBlock[] = [
  { id: "patterns", label: "Patterns", desc: "Browse algorithm patterns", icon: Hash },
  { id: "speed-apps", label: "Speed Apps", desc: "Timed word & pattern drills", icon: Zap },
  { id: "popular-lists", label: "Popular Lists", desc: "Blind 75, NeetCode & more", icon: BookOpen },
  { id: "submit", label: "Submit", desc: "Solve & run against tests", icon: Play },
  { id: "flashcards", label: "Flashcards", desc: "Spaced-repetition review", icon: Layers },
  { id: "interview-drill", label: "Interview Drill", desc: "Mock interview practice", icon: Code },
];

export function FeatureGrid({ onNavigate }: { onNavigate: (view: string) => void }) {
  return (
    <section>
      <div className="mx-auto w-full max-w-5xl px-4 sm:px-6 pt-16 sm:pt-24 pb-8 text-center">
        <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-slate-900 [text-shadow:_0_2px_18px_rgb(255_255_255_/_70%)]">
          Everything in one place
        </h2>
      </div>
      <div className="mx-auto w-full max-w-5xl border-l border-t border-slate-900/10">
        <div className="grid grid-cols-2 md:grid-cols-3">
          {blocks.map((block) => (
            <button
              key={block.id}
              type="button"
              onClick={() => onNavigate(block.id)}
              className="border-r border-b border-slate-900/10 bg-white/50 backdrop-blur-sm hover:bg-white/80 p-6 sm:p-8 text-left transition-colors cursor-pointer group flex flex-col items-start gap-3"
            >
              <div className="flex w-full items-center justify-between">
                <block.icon className="text-cyan-700" size={24} />
                <ArrowUpRight
                  className="text-slate-400 group-hover:text-cyan-700 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
                  size={20}
                />
              </div>
              <span className="text-lg font-semibold text-slate-900">{block.label}</span>
              <span className="text-sm text-slate-600">{block.desc}</span>
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}
