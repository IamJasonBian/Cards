import { ArrowLeft, ExternalLink, Hash, Clock, Zap, RotateCw } from "lucide-react";
import { useRef, useState } from "react";
import { tagColors } from "../data/patterns";
import type { Pattern, Problem } from "../data/patterns";

export function PracticeSetView({
  pattern,
  relatedProblems,
  onBack,
  onRotate,
}: {
  pattern: Pattern;
  relatedProblems: Problem[];
  onBack: () => void;
  onRotate: () => void;
}) {
  const coreProblems = pattern.problems.slice(0, 10);
  const [spinning, setSpinning] = useState(false);
  const spinTimer = useRef<number | undefined>(undefined);

  // Spin the rotate icon for 500ms on each rotation. Driven by the click handler
  // (an event) rather than an effect reacting to the relatedProblems prop.
  function handleRotate() {
    onRotate();
    setSpinning(true);
    window.clearTimeout(spinTimer.current);
    spinTimer.current = window.setTimeout(() => setSpinning(false), 500);
  }

  return (
    <div>
      <button
        onClick={onBack}
        className="flex items-center gap-1.5 text-sm text-slate-400 hover:text-slate-300 mb-4 cursor-pointer"
      >
        <ArrowLeft size={14} />
        Back to all patterns
      </button>

      <div className="flex items-center gap-3 mb-6">
        <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-slate-800/50 text-slate-400 font-mono text-sm font-bold">
          {pattern.id}
        </div>
        <div>
          <h2 className="text-xl font-bold text-slate-100">{pattern.name}</h2>
          <div className="flex items-center gap-2 mt-0.5">
            <span
              className={`px-2 py-0.5 rounded-full text-xs font-medium ${tagColors[pattern.tag] || "bg-slate-800/50 text-slate-300"}`}
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

      <div className="bg-slate-900/60 backdrop-blur-md rounded-2xl border border-white/10 p-5 mb-4">
        <p className="text-xs font-medium text-slate-400 uppercase tracking-wide mb-3">
          Core Problems ({coreProblems.length})
        </p>
        <div className="flex flex-wrap gap-1.5">
          {coreProblems.map((p) => (
            <a
              key={p.slug}
              href={`https://leetcode.com/problems/${p.slug}/`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 bg-slate-800/50 border border-white/10 rounded-lg text-xs text-slate-300 hover:bg-white/5 hover:border-cyan-400/30 hover:text-cyan-300 transition-colors"
            >
              <span
                className={`inline-block w-1.5 h-1.5 rounded-full ${
                  p.difficulty === "Easy"
                    ? "bg-green-500"
                    : p.difficulty === "Medium"
                    ? "bg-yellow-500"
                    : "bg-red-500"
                }`}
              />
              {p.name}
              <ExternalLink size={10} />
            </a>
          ))}
        </div>
      </div>

      {relatedProblems.length > 0 && (
        <div className="bg-slate-900/60 backdrop-blur-md rounded-2xl border border-white/10 p-5 mb-4">
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-medium text-slate-400 uppercase tracking-wide">
              Related Problems — {pattern.tag} tag ({relatedProblems.length})
            </p>
            <button
              onClick={handleRotate}
              title="Rotate to a new set"
              className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs text-cyan-400 hover:text-cyan-300 hover:bg-white/5 border border-transparent hover:border-cyan-400/30 transition-colors cursor-pointer"
            >
              <RotateCw size={12} className={spinning ? "animate-spin" : ""} />
              Rotate
            </button>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {relatedProblems.map((p) => (
              <a
                key={p.slug}
                href={`https://leetcode.com/problems/${p.slug}/`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-2.5 py-1.5 bg-cyan-500/15 border border-cyan-400/30 rounded-lg text-xs text-cyan-300 hover:bg-cyan-500/25 hover:border-cyan-400/50 transition-colors"
              >
                <span
                  className={`inline-block w-1.5 h-1.5 rounded-full ${
                    p.difficulty === "Easy"
                      ? "bg-green-500"
                      : p.difficulty === "Medium"
                      ? "bg-yellow-500"
                      : "bg-red-500"
                  }`}
                />
                {p.name}
                <ExternalLink size={10} />
              </a>
            ))}
          </div>
        </div>
      )}

      <div className="bg-slate-900/60 backdrop-blur-md rounded-2xl border border-white/10 p-5 mb-4">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-2 mb-3">
          <span className="text-xs font-medium text-slate-400 uppercase tracking-wide">
            Techniques
          </span>
          {pattern.techniques.map((t) => (
            <span
              key={t}
              className="px-2 py-0.5 rounded-full text-xs font-mono bg-cyan-500/15 text-cyan-300 border border-cyan-400/30"
            >
              {t}
            </span>
          ))}
        </div>
        <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
          <span className="text-xs font-medium text-slate-400 uppercase tracking-wide">
            Structures
          </span>
          {pattern.dataStructures.map((d) => (
            <span
              key={d}
              className="px-2 py-0.5 rounded-full text-xs font-mono bg-sky-500/15 text-sky-300 border border-sky-400/30"
            >
              {d}
            </span>
          ))}
        </div>
      </div>

      <div className="bg-slate-900/60 backdrop-blur-md rounded-2xl border border-white/10 p-5 mb-4">
        <div className="flex items-center gap-2 mb-2">
          <p className="text-xs font-medium text-slate-400 uppercase tracking-wide">
            Your Pattern
          </p>
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-blue-500/15 text-blue-300 border border-blue-400/30">
            <Clock size={10} />
            {pattern.runtime}
          </span>
        </div>
        <pre className="bg-slate-950/70 text-slate-100 rounded-lg p-4 text-sm overflow-x-auto font-mono leading-relaxed">
          <code>{pattern.code}</code>
        </pre>
      </div>

      <div className="bg-slate-900/60 backdrop-blur-md rounded-2xl border border-white/10 p-5">
        <div className="flex items-center gap-2 mb-2">
          <p className="text-xs font-medium text-slate-400 uppercase tracking-wide">
            Optimal Pattern
          </p>
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-500/15 text-emerald-300 border border-emerald-400/30">
            <Zap size={10} />
            {pattern.optimalRuntime}
          </span>
        </div>
        <p className="text-xs text-slate-400 mb-2 italic">
          {pattern.optimalNote}
        </p>
        <pre className="bg-slate-950/70 text-slate-100 rounded-lg p-4 text-sm overflow-x-auto font-mono leading-relaxed border border-emerald-500/30">
          <code>{pattern.optimalCode}</code>
        </pre>
      </div>
    </div>
  );
}
