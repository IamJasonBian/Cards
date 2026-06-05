import { Code } from "lucide-react";

const linkClass =
  "block text-left text-sm text-slate-600 hover:text-cyan-700 cursor-pointer transition-colors py-0.5";

const headingClass =
  "text-xs font-semibold uppercase tracking-[0.15em] text-slate-500 mb-3";

export function SiteFooter({ onNavigate }: { onNavigate: (view: string) => void }) {
  return (
    <footer className="w-full border-t border-slate-900/10 bg-white/60 backdrop-blur-sm rounded-none">
      <div className="mx-auto w-full max-w-5xl px-4 sm:px-6 py-12">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
          <div>
            <div className="flex items-center gap-2">
              <Code className="text-cyan-700" size={22} />
              <span className="font-bold text-slate-900">LeetCode Patterns</span>
            </div>
            <p className="mt-3 text-sm text-slate-600">
              One card a day. Transform your pattern recognition.
            </p>
          </div>

          <div>
            <h3 className={headingClass}>Practice</h3>
            <button type="button" className={linkClass} onClick={() => onNavigate("patterns")}>
              Patterns
            </button>
            <button type="button" className={linkClass} onClick={() => onNavigate("speed-apps")}>
              Speed Apps
            </button>
            <button type="button" className={linkClass} onClick={() => onNavigate("popular-lists")}>
              Popular Lists
            </button>
          </div>

          <div>
            <h3 className={headingClass}>Study</h3>
            <button type="button" className={linkClass} onClick={() => onNavigate("flashcards")}>
              Flashcards
            </button>
            <button type="button" className={linkClass} onClick={() => onNavigate("interview-drill")}>
              Interview Drill
            </button>
            <button type="button" className={linkClass} onClick={() => onNavigate("submit")}>
              Submit
            </button>
          </div>
        </div>
      </div>
    </footer>
  );
}
