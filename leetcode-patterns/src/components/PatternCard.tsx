import { useState } from "react";
import { ChevronDown, ChevronUp, ExternalLink, Hash, Clock, Zap } from "lucide-react";
import { tagColors } from "../data/patterns";
import type { Pattern } from "../data/patterns";

export function PatternCard({ pattern }: { pattern: Pattern }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
      <button
        onClick={() => setOpen(!open)}
        className="w-full p-5 flex items-center justify-between text-left cursor-pointer"
      >
        <div className="flex items-center gap-4">
          <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-gray-100 text-gray-500 font-mono text-sm font-bold">
            {pattern.id}
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">
              {pattern.name}
            </h3>
            <div className="flex items-center gap-2 mt-1">
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
        {open ? (
          <ChevronUp size={20} className="text-gray-400" />
        ) : (
          <ChevronDown size={20} className="text-gray-400" />
        )}
      </button>

      {open && (
        <div className="border-t border-gray-100 px-5 pb-5">
          <div className="mt-4">
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">
              Key Problems
            </p>
            <div className="flex flex-wrap gap-1.5">
              {pattern.problems.map((p) => (
                <a
                  key={p.slug}
                  href={`https://leetcode.com/problems/${p.slug}/`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-2 py-1 bg-gray-50 border border-gray-200 rounded text-xs text-gray-600 hover:bg-indigo-50 hover:border-indigo-200 hover:text-indigo-700 transition-colors"
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
          <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-2">
            <span className="text-xs font-medium text-gray-400 uppercase tracking-wide">Techniques</span>
            {pattern.techniques.map((t) => (
              <span
                key={t}
                className="px-2 py-0.5 rounded-full text-xs font-mono bg-violet-50 text-violet-600 border border-violet-200"
              >
                {t}
              </span>
            ))}
          </div>
          <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-2">
            <span className="text-xs font-medium text-gray-400 uppercase tracking-wide">Structures</span>
            {pattern.dataStructures.map((d) => (
              <span
                key={d}
                className="px-2 py-0.5 rounded-full text-xs font-mono bg-sky-50 text-sky-600 border border-sky-200"
              >
                {d}
              </span>
            ))}
          </div>
          <div className="mt-4">
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
          <div className="mt-4">
            <div className="flex items-center gap-2 mb-2">
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                Optimal Pattern
              </p>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-600 border border-emerald-200">
                <Zap size={10} />
                {pattern.optimalRuntime}
              </span>
            </div>
            <p className="text-xs text-gray-500 mb-2 italic">{pattern.optimalNote}</p>
            <pre className="bg-gray-900 text-gray-100 rounded-lg p-4 text-sm overflow-x-auto font-mono leading-relaxed border border-emerald-500/30">
              <code>{pattern.optimalCode}</code>
            </pre>
          </div>
        </div>
      )}
    </div>
  );
}
