import { useState } from "react";
import { ChevronDown, ChevronUp, Database, ExternalLink } from "lucide-react";
import { dsReference } from "../data/patterns";
import type { DSRefEntry } from "../data/patterns";

function DSCard({ entry }: { entry: DSRefEntry }) {
  const [open, setOpen] = useState(false);
  const [bgClass, textClass, borderClass] = entry.color.split(" ");

  return (
    <div className={`rounded-xl border ${borderClass} bg-white`}>
      <button
        onClick={() => setOpen(!open)}
        className="w-full p-4 flex items-center justify-between text-left cursor-pointer"
      >
        <div className="flex items-center gap-3">
          <span
            className={`px-3 py-1 rounded-lg text-sm font-bold ${bgClass} ${textClass}`}
          >
            {entry.name}
          </span>
          <span className="text-xs text-gray-400">
            {entry.relatedProblems.length} key problems
          </span>
        </div>
        {open ? (
          <ChevronUp size={18} className="text-gray-400" />
        ) : (
          <ChevronDown size={18} className="text-gray-400" />
        )}
      </button>

      {open && (
        <div className="border-t border-gray-100 px-4 pb-4 pt-3 space-y-3">
          <pre className="bg-gray-900 text-gray-100 rounded-lg p-4 text-xs leading-relaxed overflow-x-auto">
            <code>{entry.code}</code>
          </pre>

          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
              Key Problems
            </p>
            <div className="flex flex-wrap gap-1.5">
              {entry.relatedProblems.map((p) => (
                <a
                  key={p.slug}
                  href={`https://leetcode.com/problems/${p.slug}/`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium ${bgClass} ${textClass} hover:opacity-80 transition-opacity`}
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
        <Database size={20} className="text-gray-700" />
        <h2 className="text-lg font-bold text-gray-900">
          Data Structure Quick Reference
        </h2>
      </div>
      <p className="text-sm text-gray-500 mb-4">
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
