import { Hash } from "lucide-react";
import { tagColors } from "../data/patterns";
import type { Pattern } from "../data/patterns";

export function PatternSidebar({
  patterns,
  selectedId,
  onSelect,
}: {
  patterns: Pattern[];
  selectedId: number | null;
  onSelect: (id: number) => void;
}) {
  return (
    <aside className="hidden md:block w-64 shrink-0 sticky top-16 h-[calc(100vh-64px)] overflow-y-auto bg-white border-r border-gray-200">
      <div className="p-4">
        <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">
          Patterns
        </h2>
        <div className="space-y-0.5">
          {patterns.map((p) => (
            <button
              key={p.id}
              onClick={() => onSelect(p.id)}
              className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors cursor-pointer ${
                selectedId === p.id
                  ? "bg-indigo-50 text-indigo-700 border-l-2 border-indigo-500"
                  : "text-gray-700 hover:bg-gray-50"
              }`}
            >
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs text-gray-400 w-5 shrink-0">
                  {p.id}
                </span>
                <span className="font-medium truncate">{p.name}</span>
              </div>
              <div className="flex items-center gap-2 mt-0.5 ml-7">
                <span
                  className={`px-1.5 py-0 rounded-full text-[10px] font-medium ${tagColors[p.tag] || "bg-gray-100 text-gray-700"}`}
                >
                  {p.tag}
                </span>
                <span className="flex items-center gap-0.5 text-[10px] text-gray-400">
                  <Hash size={8} />
                  {p.solveCount}
                </span>
              </div>
            </button>
          ))}
        </div>
      </div>
    </aside>
  );
}
