import { useState } from "react";
import { Code, Filter } from "lucide-react";
import { patterns, tags } from "./data/patterns";
import { StatsGrid } from "./components/StatsGrid";
import { PatternCard } from "./components/PatternCard";
import { InterviewChecklist } from "./components/InterviewChecklist";

function App() {
  const [activeTag, setActiveTag] = useState<string | null>(null);

  const filtered = activeTag
    ? patterns.filter((p) => p.tag === activeTag)
    : patterns;

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center gap-3">
          <Code size={24} className="text-indigo-600" />
          <h1 className="text-xl font-bold text-gray-900">
            LeetCode Patterns
          </h1>
          <span className="ml-auto text-sm text-gray-400">slenderman73</span>
        </div>
      </nav>

      <main className="max-w-5xl mx-auto px-4 py-8">
        <StatsGrid />

        <div className="flex items-center gap-2 mb-6">
          <Filter size={16} className="text-gray-400" />
          <div className="flex gap-1.5 flex-wrap">
            <button
              onClick={() => setActiveTag(null)}
              className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors cursor-pointer ${
                activeTag === null
                  ? "bg-indigo-100 text-indigo-700"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              All
            </button>
            {tags.map((tag) => (
              <button
                key={tag}
                onClick={() => setActiveTag(activeTag === tag ? null : tag)}
                className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors cursor-pointer ${
                  activeTag === tag
                    ? "bg-indigo-100 text-indigo-700"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                {tag}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-3">
          {filtered.map((pattern) => (
            <PatternCard key={pattern.id} pattern={pattern} />
          ))}
        </div>

        <InterviewChecklist />

        <footer className="mt-12 pb-8 text-center text-xs text-gray-400">
          639 problems solved | Python3 | Data from LeetCode via alfa-leetcode-api
        </footer>
      </main>
    </div>
  );
}

export default App;
