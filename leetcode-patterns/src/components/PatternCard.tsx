import { useState } from "react";
import { ChevronDown, ChevronUp, ExternalLink, Hash, Clock, Zap } from "lucide-react";
import { tagColors } from "../data/patterns";
import type { Pattern } from "../data/patterns";

export function PatternCard({ pattern }: { pattern: Pattern }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="bg-white/85 sm:bg-white/65 backdrop-blur-2xl rounded-none shadow-sm border border-slate-900/10 hover:shadow-md transition-shadow">
      <button
        onClick={() => setOpen(!open)}
        className="w-full p-5 flex items-center justify-between text-left cursor-pointer"
      >
        <div className="flex items-center gap-4">
          <div className="flex items-center justify-center w-9 h-9 rounded-none bg-slate-100/90 sm:bg-slate-100/70 text-slate-500 font-mono text-sm font-bold">
            {pattern.id}
          </div>
          <div>
            <h3 className="text-lg font-semibold text-slate-900">
              {pattern.name}
            </h3>
            <div className="flex items-center gap-2 mt-1">
              <span
                className={`px-2 py-0.5 rounded-none text-xs font-medium ${tagColors[pattern.tag] || "bg-slate-100/90 sm:bg-slate-100/70 text-slate-700"}`}
              >
                {pattern.tag}
              </span>
              <span className="flex items-center gap-1 text-xs text-slate-500">
                <Hash size={12} />
                {pattern.solveCount} solved
              </span>
            </div>
          </div>
        </div>
        {open ? (
          <ChevronUp size={20} className="text-slate-500" />
        ) : (
          <ChevronDown size={20} className="text-slate-500" />
        )}
      </button>

      {open && (
        <div className="border-t border-slate-900/5 px-5 pb-5">
          <div className="mt-4">
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-2">
              Key Problems
            </p>
            <div className="flex flex-wrap gap-1.5">
              {pattern.problems.map((p) => (
                <a
                  key={p.slug}
                  href={`https://leetcode.com/problems/${p.slug}/`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-2 py-1 bg-slate-100/90 sm:bg-slate-100/70 border border-slate-900/10 rounded text-xs text-slate-700 hover:bg-slate-900/5 hover:border-cyan-500/30 hover:text-cyan-700 transition-colors"
                >
                  <span
                    className={`inline-block w-1.5 h-1.5 rounded-none ${
                      p.difficulty === "Easy"
                        ? "bg-emerald-500"
                        : p.difficulty === "Medium"
                        ? "bg-amber-500"
                        : "bg-rose-500"
                    }`}
                  />
                  {p.name}
                  <ExternalLink size={10} />
                </a>
              ))}
            </div>
          </div>
          <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-2">
            <span className="text-xs font-medium text-slate-500 uppercase tracking-wide">Techniques</span>
            {pattern.techniques.map((t) => (
              <span
                key={t}
                className="px-2 py-0.5 rounded-none text-xs font-mono bg-cyan-100 text-cyan-700 border border-cyan-500/30"
              >
                {t}
              </span>
            ))}
          </div>
          <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-2">
            <span className="text-xs font-medium text-slate-500 uppercase tracking-wide">Structures</span>
            {pattern.dataStructures.map((d) => (
              <span
                key={d}
                className="px-2 py-0.5 rounded-none text-xs font-mono bg-sky-50 text-sky-700 border border-sky-200"
              >
                {d}
              </span>
            ))}
          </div>
          <div className="mt-4">
            <div className="flex items-center gap-2 mb-2">
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">
                Your Pattern
              </p>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-none text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200">
                <Clock size={10} />
                {pattern.runtime}
              </span>
            </div>
            <pre className="bg-slate-100/90 text-slate-900 rounded-none p-4 text-sm overflow-x-auto font-mono leading-relaxed">
              <code>{pattern.code}</code>
            </pre>
          </div>
          <div className="mt-4">
            <div className="flex items-center gap-2 mb-2">
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">
                Optimal Pattern
              </p>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-none text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                <Zap size={10} />
                {pattern.optimalRuntime}
              </span>
            </div>
            <p className="text-xs text-slate-500 mb-2 italic">{pattern.optimalNote}</p>
            <pre className="bg-slate-100/90 text-slate-900 rounded-none p-4 text-sm overflow-x-auto font-mono leading-relaxed border border-emerald-200">
              <code>{pattern.optimalCode}</code>
            </pre>
          </div>
        </div>
      )}
    </div>
  );
}
