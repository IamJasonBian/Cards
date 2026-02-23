import { ArrowLeft, ExternalLink, Hash, Clock, Zap } from "lucide-react";
import { tagColors } from "../data/patterns";
import type { Pattern, Problem } from "../data/patterns";

export function PracticeSetView({
  pattern,
  relatedProblems,
  onBack,
}: {
  pattern: Pattern;
  relatedProblems: Problem[];
  onBack: () => void;
}) {
  const coreProblems = pattern.problems.slice(0, 10);

  return (
    <div>
      <button
        onClick={onBack}
        className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 mb-4 cursor-pointer"
      >
        <ArrowLeft size={14} />
        Back to all patterns
      </button>

      <div className="flex items-center gap-3 mb-6">
        <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-gray-100 text-gray-500 font-mono text-sm font-bold">
          {pattern.id}
        </div>
        <div>
          <h2 className="text-xl font-bold text-gray-900">{pattern.name}</h2>
          <div className="flex items-center gap-2 mt-0.5">
            <span
              className={`px-2 py-0.5 rounded-full text-xs font-medium ${tagColors[pattern.tag] || "bg-gray-100 text-gray-700"}`}
            >
              {pattern.tag}
            </span>
            <span className="flex items-center gap-1 text-xs text-gray-400">
              <Hash size={12} />
              {pattern.solveCount} solved
            </span>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-5 mb-4">
        <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-3">
          Core Problems ({coreProblems.length})
        </p>
        <div className="flex flex-wrap gap-1.5">
          {coreProblems.map((p) => (
            <a
              key={p.slug}
              href={`https://leetcode.com/problems/${p.slug}/`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-xs text-gray-600 hover:bg-indigo-50 hover:border-indigo-200 hover:text-indigo-700 transition-colors"
            >
              {p.name}
              <ExternalLink size={10} />
            </a>
          ))}
        </div>
      </div>

      {relatedProblems.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-5 mb-4">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-3">
            Related Problems — {pattern.tag} tag ({relatedProblems.length})
          </p>
          <div className="flex flex-wrap gap-1.5">
            {relatedProblems.map((p) => (
              <a
                key={p.slug}
                href={`https://leetcode.com/problems/${p.slug}/`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-violet-50 border border-violet-200 rounded-lg text-xs text-violet-600 hover:bg-violet-100 hover:border-violet-300 transition-colors"
              >
                {p.name}
                <ExternalLink size={10} />
              </a>
            ))}
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl border border-gray-200 p-5 mb-4">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-2 mb-3">
          <span className="text-xs font-medium text-gray-400 uppercase tracking-wide">
            Techniques
          </span>
          {pattern.techniques.map((t) => (
            <span
              key={t}
              className="px-2 py-0.5 rounded-full text-xs font-mono bg-violet-50 text-violet-600 border border-violet-200"
            >
              {t}
            </span>
          ))}
        </div>
        <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
          <span className="text-xs font-medium text-gray-400 uppercase tracking-wide">
            Structures
          </span>
          {pattern.dataStructures.map((d) => (
            <span
              key={d}
              className="px-2 py-0.5 rounded-full text-xs font-mono bg-sky-50 text-sky-600 border border-sky-200"
            >
              {d}
            </span>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-5 mb-4">
        <div className="flex items-center gap-2 mb-2">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
            Your Pattern
          </p>
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-600 border border-blue-200">
            <Clock size={10} />
            {pattern.runtime}
          </span>
        </div>
        <pre className="bg-gray-900 text-gray-100 rounded-lg p-4 text-sm overflow-x-auto font-mono leading-relaxed">
          <code>{pattern.code}</code>
        </pre>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <div className="flex items-center gap-2 mb-2">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
            Optimal Pattern
          </p>
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-600 border border-emerald-200">
            <Zap size={10} />
            {pattern.optimalRuntime}
          </span>
        </div>
        <p className="text-xs text-gray-500 mb-2 italic">
          {pattern.optimalNote}
        </p>
        <pre className="bg-gray-900 text-gray-100 rounded-lg p-4 text-sm overflow-x-auto font-mono leading-relaxed border border-emerald-500/30">
          <code>{pattern.optimalCode}</code>
        </pre>
      </div>
    </div>
  );
}
