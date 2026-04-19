import { useState, useEffect } from "react";
import { BookOpen, Code, Filter, Layers, Zap } from "lucide-react";
import { patterns, tags } from "./data/patterns";
import type { Pattern, Problem } from "./data/patterns";
import { StatsGrid } from "./components/StatsGrid";
import { PatternCard } from "./components/PatternCard";
import { InterviewChecklist } from "./components/InterviewChecklist";
import { DSReference } from "./components/DSReference";
import { PatternSidebar } from "./components/PatternSidebar";
import { PracticeSetView } from "./components/PracticeSetView";
import { WordHunt } from "./components/WordHunt";
import { InterviewBinaries } from "./components/InterviewBinaries";
import { RandomProblem } from "./components/RandomProblem";
import { PopularLists } from "./components/PopularLists";
import { Flashcards } from "./components/Flashcards";
import { InterviewDrill } from "./components/InterviewDrill";

function getRelatedProblems(
  selected: Pattern,
  allPatterns: Pattern[],
  count = 5
): Problem[] {
  const coreSlugs = new Set(selected.problems.slice(0, 10).map((p) => p.slug));
  const pool: Problem[] = [];

  for (const pattern of allPatterns) {
    if (pattern.id === selected.id) continue;
    if (pattern.tag !== selected.tag) continue;
    for (const problem of pattern.problems) {
      if (!coreSlugs.has(problem.slug)) {
        pool.push(problem);
      }
    }
  }

  // Fisher-Yates shuffle
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }

  return pool.slice(0, count);
}

function App() {
  const [view, setView] = useState<"patterns" | "speed-apps" | "interview-binaries" | "popular-lists" | "flashcards" | "interview-drill">("patterns");
  const [activeTag, setActiveTag] = useState<string | null>(null);
  const [selectedPatternId, setSelectedPatternId] = useState<number | null>(
    null
  );
  const [relatedProblems, setRelatedProblems] = useState<Problem[]>([]);

  const filtered = activeTag
    ? patterns.filter((p) => p.tag === activeTag)
    : patterns;

  const selectedPattern = selectedPatternId
    ? patterns.find((p) => p.id === selectedPatternId) ?? null
    : null;

  function selectPattern(id: number) {
    const pattern = patterns.find((p) => p.id === id)!;
    setSelectedPatternId(id);
    setRelatedProblems(getRelatedProblems(pattern, patterns, 5));
  }

  function rotateRelatedProblems() {
    if (!selectedPattern) return;
    setRelatedProblems(getRelatedProblems(selectedPattern, patterns, 5));
  }

  function clearSelection() {
    setSelectedPatternId(null);
    setRelatedProblems([]);
  }

  // Check URL hash on mount to enable direct linking
  useEffect(() => {
    if (window.location.hash === "#interview-binaries") {
      setView("interview-binaries");
    } else if (window.location.hash === "#popular-lists") {
      setView("popular-lists");
    } else if (window.location.hash === "#flashcards") {
      setView("flashcards");
    } else if (window.location.hash === "#interview-drill") {
      setView("interview-drill");
    }
  }, []);

  // Update URL hash when view changes
  useEffect(() => {
    if (view === "interview-binaries") {
      window.history.replaceState(null, "", "#interview-binaries");
    } else if (view === "popular-lists") {
      window.history.replaceState(null, "", "#popular-lists");
    } else if (view === "flashcards") {
      window.history.replaceState(null, "", "#flashcards");
    } else if (view === "interview-drill") {
      window.history.replaceState(null, "", "#interview-drill");
    } else if (
      window.location.hash === "#interview-binaries" ||
      window.location.hash === "#popular-lists" ||
      window.location.hash === "#flashcards" ||
      window.location.hash === "#interview-drill"
    ) {
      window.history.replaceState(null, "", window.location.pathname);
    }
  }, [view]);

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="px-6 py-4 flex items-center gap-3">
          <Code size={24} className="text-indigo-600" />
          <h1 className="text-xl font-bold text-gray-900">
            LeetCode Patterns
          </h1>

          <div className="flex gap-1 ml-6">
            <button
              onClick={() => { setView("patterns"); clearSelection(); }}
              className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors cursor-pointer ${
                view === "patterns"
                  ? "bg-indigo-100 text-indigo-700"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              Patterns
            </button>
            <button
              onClick={() => { setView("speed-apps"); clearSelection(); }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-colors cursor-pointer ${
                view === "speed-apps"
                  ? "bg-indigo-100 text-indigo-700"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              <Zap size={14} />
              Speed Apps
            </button>
            <button
              onClick={() => { setView("popular-lists"); clearSelection(); }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-colors cursor-pointer ${
                view === "popular-lists"
                  ? "bg-indigo-100 text-indigo-700"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              <BookOpen size={14} />
              Popular Lists
            </button>
            <button
              onClick={() => { setView("flashcards"); clearSelection(); }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-colors cursor-pointer ${
                view === "flashcards"
                  ? "bg-indigo-100 text-indigo-700"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              <Layers size={14} />
              Flashcards
            </button>
            <button
              onClick={() => { setView("interview-drill"); clearSelection(); }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-colors cursor-pointer ${
                view === "interview-drill"
                  ? "bg-indigo-100 text-indigo-700"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              <Code size={14} />
              Interview Drill
            </button>
          </div>

          <span className="ml-auto text-sm text-gray-400">slenderman73</span>
        </div>
      </nav>

      <div className="flex">
        {view === "patterns" && (
          <PatternSidebar
            patterns={patterns}
            selectedId={selectedPatternId}
            onSelect={selectPattern}
          />
        )}

        <main className="flex-1 min-w-0 px-6 py-8">
          {view === "speed-apps" ? (
            <WordHunt />
          ) : view === "interview-binaries" ? (
            <InterviewBinaries />
          ) : view === "popular-lists" ? (
            <PopularLists />
          ) : view === "flashcards" ? (
            <Flashcards />
          ) : view === "interview-drill" ? (
            <InterviewDrill />
          ) : selectedPattern ? (
            <PracticeSetView
              pattern={selectedPattern}
              relatedProblems={relatedProblems}
              onBack={clearSelection}
              onRotate={rotateRelatedProblems}
            />
          ) : (
            <>
              <RandomProblem />
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
                      onClick={() =>
                        setActiveTag(activeTag === tag ? null : tag)
                      }
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

              <DSReference />

              <InterviewChecklist />

              <footer className="mt-12 pb-8 text-center text-xs text-gray-400">
                639 problems solved | Python3 | Data from LeetCode via
                alfa-leetcode-api
              </footer>
            </>
          )}
        </main>
      </div>
    </div>
  );
}

export default App;
