import { useState, useEffect, useRef } from "react";
import { BookOpen, ChevronDown, Code, Filter, FlaskConical, Layers, Play, Zap } from "lucide-react";
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
import { Blind75Submit } from "./components/Blind75Submit";
import { fetchRandomWallpaper } from "./lib/wallpaper";

type View =
  | "submit"
  | "patterns"
  | "speed-apps"
  | "interview-binaries"
  | "popular-lists"
  | "flashcards"
  | "interview-drill";

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

const EXPERIMENTAL_VIEWS = ["submit", "flashcards", "interview-drill"] as const;
type ExperimentalView = (typeof EXPERIMENTAL_VIEWS)[number];
const isExperimental = (v: View): v is ExperimentalView =>
  (EXPERIMENTAL_VIEWS as readonly string[]).includes(v);

function App() {
  // Default landing = the Blind 75 submit view (Two Sum). Explicit hashes still win on mount.
  const [view, setView] = useState<View>("submit");
  const [wallpaper, setWallpaper] = useState<string | null>(null);
  const [activeTag, setActiveTag] = useState<string | null>(null);
  const [experimentalOpen, setExperimentalOpen] = useState(false);
  const experimentalRef = useRef<HTMLDivElement | null>(null);
  const [selectedPatternId, setSelectedPatternId] = useState<number | null>(
    null
  );
  const [relatedProblems, setRelatedProblems] = useState<Problem[]>([]);

  // Fetch a random nature wallpaper on startup for the abyss backdrop.
  useEffect(() => {
    fetchRandomWallpaper().then(setWallpaper).catch(() => {});
  }, []);

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

  // Check URL hash on mount to enable direct linking. #patterns is a way out of
  // the new default Submit view for users who bookmarked the old landing.
  useEffect(() => {
    const h = window.location.hash;
    if (h === "#interview-binaries") setView("interview-binaries");
    else if (h === "#popular-lists") setView("popular-lists");
    else if (h === "#flashcards") setView("flashcards");
    else if (h === "#interview-drill") setView("interview-drill");
    else if (h === "#patterns") setView("patterns");
    else if (h === "#submit") setView("submit");
  }, []);

  // Close the Experimental dropdown on outside click / Escape.
  useEffect(() => {
    if (!experimentalOpen) return;
    function onMouseDown(e: MouseEvent) {
      if (experimentalRef.current && !experimentalRef.current.contains(e.target as Node)) {
        setExperimentalOpen(false);
      }
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setExperimentalOpen(false);
    }
    document.addEventListener("mousedown", onMouseDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onMouseDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [experimentalOpen]);

  // Update URL hash when view changes
  useEffect(() => {
    const hashable: Record<View, string | null> = {
      submit: null, // default — leave URL clean
      patterns: null,
      "speed-apps": null,
      "interview-binaries": "#interview-binaries",
      "popular-lists": "#popular-lists",
      flashcards: "#flashcards",
      "interview-drill": "#interview-drill",
    };
    const target = hashable[view];
    if (target) {
      window.history.replaceState(null, "", target);
    } else if (window.location.hash) {
      window.history.replaceState(null, "", window.location.pathname);
    }
  }, [view]);

  return (
    <div className="min-h-screen">
      <div
        className="fixed inset-0 -z-10 bg-cover bg-center bg-fixed"
        style={wallpaper ? { backgroundImage: `url(${wallpaper})` } : undefined}
      />
      <div className="fixed inset-0 -z-10 bg-gradient-to-b from-slate-950/70 via-slate-950/80 to-slate-950/90" />

      <nav className="bg-slate-900/60 backdrop-blur-md border-b border-white/10 sticky top-0 z-10">
        <div className="px-4 sm:px-6 py-3 sm:py-4 flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="flex items-center gap-3 min-w-0">
            <Code size={24} className="text-cyan-400 shrink-0" />
            <h1 className="text-lg sm:text-xl font-bold text-slate-100 truncate">
              LeetCode Patterns
            </h1>
            <span className="ml-auto sm:hidden text-sm text-slate-500">slenderman73</span>
          </div>

          <div className="flex flex-wrap gap-1 sm:ml-6">
            <button
              onClick={() => { setView("patterns"); clearSelection(); }}
              className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors cursor-pointer ${
                view === "patterns"
                  ? "bg-cyan-500/15 text-cyan-300"
                  : "bg-white/5 text-slate-300 hover:bg-white/10"
              }`}
            >
              Patterns
            </button>
            <button
              onClick={() => { setView("speed-apps"); clearSelection(); }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-colors cursor-pointer ${
                view === "speed-apps"
                  ? "bg-cyan-500/15 text-cyan-300"
                  : "bg-white/5 text-slate-300 hover:bg-white/10"
              }`}
            >
              <Zap size={14} />
              Speed Apps
            </button>
            <button
              onClick={() => { setView("popular-lists"); clearSelection(); }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-colors cursor-pointer ${
                view === "popular-lists"
                  ? "bg-cyan-500/15 text-cyan-300"
                  : "bg-white/5 text-slate-300 hover:bg-white/10"
              }`}
            >
              <BookOpen size={14} />
              Popular Lists
            </button>

            <div className="relative" ref={experimentalRef}>
              <button
                onClick={() => setExperimentalOpen((o) => !o)}
                aria-haspopup="menu"
                aria-expanded={experimentalOpen}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-colors cursor-pointer ${
                  isExperimental(view)
                    ? "bg-amber-500/15 text-amber-300"
                    : "bg-white/5 text-slate-300 hover:bg-white/10"
                }`}
              >
                <FlaskConical size={14} />
                Experimental
                <ChevronDown size={14} className={experimentalOpen ? "rotate-180 transition-transform" : "transition-transform"} />
              </button>
              {experimentalOpen && (
                <div
                  role="menu"
                  className="absolute left-0 top-full mt-1 w-48 rounded-2xl bg-slate-900/95 backdrop-blur-md border border-white/10 shadow-lg py-1 z-20"
                >
                  <button
                    role="menuitem"
                    onClick={() => { setView("submit"); clearSelection(); setExperimentalOpen(false); }}
                    className={`w-full flex items-center gap-2 px-3 py-1.5 text-sm cursor-pointer ${
                      view === "submit" ? "bg-cyan-500/10 text-cyan-300" : "text-slate-300 hover:bg-white/5"
                    }`}
                  >
                    <Play size={14} />
                    Submit
                  </button>
                  <button
                    role="menuitem"
                    onClick={() => { setView("flashcards"); clearSelection(); setExperimentalOpen(false); }}
                    className={`w-full flex items-center gap-2 px-3 py-1.5 text-sm cursor-pointer ${
                      view === "flashcards" ? "bg-cyan-500/10 text-cyan-300" : "text-slate-300 hover:bg-white/5"
                    }`}
                  >
                    <Layers size={14} />
                    Flashcards
                  </button>
                  <button
                    role="menuitem"
                    onClick={() => { setView("interview-drill"); clearSelection(); setExperimentalOpen(false); }}
                    className={`w-full flex items-center gap-2 px-3 py-1.5 text-sm cursor-pointer ${
                      view === "interview-drill" ? "bg-cyan-500/10 text-cyan-300" : "text-slate-300 hover:bg-white/5"
                    }`}
                  >
                    <Code size={14} />
                    Interview Drill
                  </button>
                </div>
              )}
            </div>
          </div>

          <span className="hidden sm:block ml-auto text-sm text-slate-500 shrink-0">slenderman73</span>
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

        <main className="flex-1 min-w-0 px-4 sm:px-6 py-6 sm:py-8">
          {view === "submit" ? (
            <Blind75Submit />
          ) : view === "speed-apps" ? (
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
                <Filter size={16} className="text-slate-400" />
                <div className="flex gap-1.5 flex-wrap">
                  <button
                    onClick={() => setActiveTag(null)}
                    className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors cursor-pointer ${
                      activeTag === null
                        ? "bg-cyan-500/15 text-cyan-300"
                        : "bg-white/5 text-slate-300 hover:bg-white/10"
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
                          ? "bg-cyan-500/15 text-cyan-300"
                          : "bg-white/5 text-slate-300 hover:bg-white/10"
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

              <footer className="mt-12 pb-8 text-center text-xs text-slate-500">
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
