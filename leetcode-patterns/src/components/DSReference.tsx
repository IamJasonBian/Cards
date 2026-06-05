import { useState, useCallback } from "react";
import { ChevronDown, ChevronUp, Database, ExternalLink, RotateCw } from "lucide-react";
import { dsReference } from "../data/patterns";
import type { DSRefEntry } from "../data/patterns";

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

const VISIBLE_COUNT = 5;

function DSCard({ entry }: { entry: DSRefEntry }) {
  const [open, setOpen] = useState(false);
  const [bgClass, textClass, borderClass] = entry.color.split(" ");
  const [problems, setProblems] = useState(entry.relatedProblems.slice(0, VISIBLE_COUNT));
  const [spinning, setSpinning] = useState(false);

  const handleRotate = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      setSpinning(true);
      setProblems(shuffle(entry.relatedProblems).slice(0, VISIBLE_COUNT));
      setTimeout(() => setSpinning(false), 500);
    },
    [entry.relatedProblems],
  );

  return (
    <div className={`rounded-none border ${borderClass} bg-white/85 sm:bg-white/65 backdrop-blur-2xl`}>
      <button
        onClick={() => setOpen(!open)}
        className="w-full p-4 flex items-center justify-between text-left cursor-pointer"
      >
        <div className="flex items-center gap-3">
          <span
            className={`px-3 py-1 rounded-none text-sm font-bold ${bgClass} ${textClass}`}
          >
            {entry.name}
          </span>
          <span className="text-xs text-slate-500">
            {entry.relatedProblems.length} key problems
          </span>
        </div>
        <div className="flex items-center gap-2">
          <a
            href={entry.docUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="inline-flex items-center gap-1 px-2 py-1 rounded-none text-xs font-medium text-cyan-600 hover:bg-cyan-50 transition-colors"
          >
            Python Docs
            <ExternalLink size={10} />
          </a>
          {open ? (
            <ChevronUp size={18} className="text-slate-500" />
          ) : (
            <ChevronDown size={18} className="text-slate-500" />
          )}
        </div>
      </button>

      {open && (
        <div className="border-t border-slate-900/5 px-4 pb-4 pt-3 space-y-3">
          <pre className="bg-slate-100/90 text-slate-900 rounded-none p-4 text-xs leading-relaxed overflow-x-auto">
            <code>{entry.code}</code>
          </pre>

          <div>
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                Key Problems
              </p>
              {entry.relatedProblems.length > VISIBLE_COUNT && (
                <button
                  onClick={handleRotate}
                  title="Shuffle to a new set"
                  className="flex items-center gap-1 px-2 py-1 rounded-none text-xs text-cyan-600 hover:text-cyan-700 hover:bg-cyan-50 border border-transparent hover:border-cyan-500/30 transition-colors cursor-pointer"
                >
                  <RotateCw size={12} className={spinning ? "animate-spin" : ""} />
                  Refresh
                </button>
              )}
            </div>
            <div className="flex flex-wrap gap-1.5">
              {problems.map((p) => (
                <a
                  key={p.slug}
                  href={`https://leetcode.com/problems/${p.slug}/`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`inline-flex items-center gap-1 px-2 py-1 rounded-none text-xs font-medium ${bgClass} ${textClass} hover:opacity-80 transition-opacity`}
                >
                  {p.name}
                  <ExternalLink size={10} />
                </a>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export function DSReference() {
  return (
    <div className="mt-12">
      <div className="flex items-center gap-2 mb-4">
        <Database size={20} className="text-slate-700" />
        <h2 className="text-lg font-bold text-slate-900">
          Data Structure Quick Reference
        </h2>
      </div>
      <p className="text-sm text-slate-500 mb-4">
        Python sample calls and usage patterns for each core data structure,
        linked to the problems where they matter most.
      </p>
      <div className="space-y-3">
        {dsReference.map((entry) => (
          <DSCard key={entry.name} entry={entry} />
        ))}
      </div>
    </div>
  );
}
