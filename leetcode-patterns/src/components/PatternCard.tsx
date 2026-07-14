import { useState } from "react";
import { ChevronDown, ChevronUp, ExternalLink, Hash, Clock, Zap } from "lucide-react";
import { tagColors } from "../data/patterns";
import type { Pattern } from "../data/patterns";

export function PatternCard({ pattern }: { pattern: Pattern }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="bg-slate-900/85 sm:bg-slate-900/70 backdrop-blur-2xl rounded-none shadow-sm border border-white/10 hover:shadow-md transition-shadow">
      <button
        onClick={() => setOpen(!open)}
        className="w-full p-5 flex items-center justify-between text-left cursor-pointer"
      >
        <div className="flex items-center gap-4">
          <div className="flex items-center justify-center w-9 h-9 rounded-none bg-slate-800/90 sm:bg-slate-800/70 text-slate-400 font-mono text-sm font-bold">
            {pattern.id}
          </div>
          <div>
            <h3 className="text-lg font-semibold text-slate-100">
              {pattern.name}
            </h3>
            <div className="flex items-center gap-2 mt-1">
              <span
                className={`px-2 py-0.5 rounded-none text-xs font-medium ${tagColors[pattern.tag] || "bg-slate-800/90 sm:bg-slate-800/70 text-slate-300"}`}
              >
                {pattern.tag}
              </span>
              <span className="flex items-center gap-1 text-xs text-slate-400">
                <Hash size={12} />
                {pattern.solveCount} solved
              </span>
            </div>
          </div>
        </div>
        {open ? (
          <ChevronUp size={20} className="text-slate-400" />
        ) : (
          <ChevronDown size={20} className="text-slate-400" />
        )}
      </button>

      {open && (
        <div className="border-t border-white/5 px-5 pb-5">
          <div className="mt-4">
            <p className="text-xs font-medium text-slate-400 uppercase tracking-wide mb-2">
              Key Problems
            </p>
            <div className="flex flex-wrap gap-1.5">
              {pattern.problems.map((p) => (
                <a
                  key={p.slug}
                  href={`https://leetcode.com/problems/${p.slug}/`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-2 py-1 bg-slate-800/90 sm:bg-slate-800/70 border border-white/10 rounded text-xs text-slate-300 hover:bg-slate-900/5 hover:border-cyan-500/30 hover:text-cyan-300 transition-colors"
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
            <span className="text-xs font-medium text-slate-400 uppercase tracking-wide">Techniques</span>
            {pattern.techniques.map((t) => (
              <span
                key={t}
                className="px-2 py-0.5 rounded-none text-xs font-mono bg-cyan-500/20 text-cyan-300 border border-cyan-500/30"
              >
                {t}
              </span>
            ))}
          </div>
          <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-2">
            <span className="text-xs font-medium text-slate-400 uppercase tracking-wide">Structures</span>
            {pattern.dataStructures.map((d) => (
              <span
                key={d}
                className="px-2 py-0.5 rounded-none text-xs font-mono bg-sky-500/10 text-sky-300 border border-sky-500/30"
              >
                {d}
              </span>
            ))}
          </div>
          <div className="mt-4">
            <div className="flex items-center gap-2 mb-2">
              <p className="text-xs font-medium text-slate-400 uppercase tracking-wide">
                Your Pattern
              </p>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-none text-xs font-medium bg-blue-500/10 text-blue-300 border border-blue-500/30">
                <Clock size={10} />
                {pattern.runtime}
              </span>
            </div>
            <pre className="bg-slate-800/90 text-slate-100 rounded-none p-4 text-sm overflow-x-auto font-mono leading-relaxed">
              <code>{pattern.code}</code>
            </pre>
          </div>
          <div className="mt-4">
            <div className="flex items-center gap-2 mb-2">
              <p className="text-xs font-medium text-slate-400 uppercase tracking-wide">
                Optimal Pattern
              </p>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-none text-xs font-medium bg-emerald-500/10 text-emerald-300 border border-emerald-500/30">
                <Zap size={10} />
                {pattern.optimalRuntime}
              </span>
            </div>
            <p className="text-xs text-slate-400 mb-2 italic">{pattern.optimalNote}</p>
            <pre className="bg-slate-800/90 text-slate-100 rounded-none p-4 text-sm overflow-x-auto font-mono leading-relaxed border border-emerald-500/30">
              <code>{pattern.optimalCode}</code>
            </pre>
          </div>
        </div>
      )}
    </div>
  );
}
