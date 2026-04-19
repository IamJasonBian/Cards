import { useCallback, useEffect, useMemo, useState } from "react";
import { Layers, Eye, EyeOff, Sparkles, RotateCcw, X } from "lucide-react";
import {
  flashcards,
  flashcardTags,
  tagStyles,
  type Flashcard,
  type FlashcardTag,
  type VizKind,
} from "../data/flashcards";
import { AlgoViz } from "./algo-viz";

type VizOpen = { kind: "path"; value: string } | { kind: "algo"; value: VizKind } | null;

type Grade = "again" | "hard" | "good" | "easy";

interface ReviewState {
  cardId: string;
  ease: number;
  interval: number;
  reps: number;
  lapses: number;
  due: number;
  lastReviewed: number | null;
}

interface Stats {
  total: number;
  due: number;
  learning: number;
  mature: number;
  lapsed: number;
}

type Mode = "all" | "due";

function formatInterval(days: number): string {
  if (days < 1 / 24) return `${Math.max(1, Math.round(days * 24 * 60))}m`;
  if (days < 1) return `${Math.round(days * 24)}h`;
  if (days < 30) return `${Math.round(days)}d`;
  if (days < 365) return `${Math.round(days / 30)}mo`;
  return `${(days / 365).toFixed(1)}y`;
}

const gradeMeta: Record<
  Grade,
  { label: string; hint: string; cls: string; key: string }
> = {
  again: {
    label: "Again",
    hint: "< 10m",
    cls: "bg-red-50 text-red-700 border-red-200 hover:bg-red-100",
    key: "1",
  },
  hard: {
    label: "Hard",
    hint: "~1d",
    cls: "bg-orange-50 text-orange-700 border-orange-200 hover:bg-orange-100",
    key: "2",
  },
  good: {
    label: "Good",
    hint: "3d+",
    cls: "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100",
    key: "3",
  },
  easy: {
    label: "Easy",
    hint: "4d+",
    cls: "bg-sky-50 text-sky-700 border-sky-200 hover:bg-sky-100",
    key: "4",
  },
};

export function Flashcards() {
  const [reviews, setReviews] = useState<Record<string, ReviewState>>({});
  const [stats, setStats] = useState<Stats | null>(null);
  const [serverUp, setServerUp] = useState<boolean | null>(null);
  const [activeTag, setActiveTag] = useState<FlashcardTag | "all">("all");
  const [mode, setMode] = useState<Mode>("all");
  const [idx, setIdx] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [vizOpen, setVizOpen] = useState<VizOpen>(null);

  const refreshReviews = useCallback(async () => {
    try {
      const [rRes, sRes] = await Promise.all([
        fetch("/api/reviews"),
        fetch("/api/stats"),
      ]);
      if (!rRes.ok || !sRes.ok) throw new Error("bad status");
      const rData = (await rRes.json()) as { reviews: ReviewState[] };
      const sData = (await sRes.json()) as Stats;
      const map: Record<string, ReviewState> = {};
      for (const r of rData.reviews) map[r.cardId] = r;
      setReviews(map);
      setStats(sData);
      setServerUp(true);
    } catch {
      setServerUp(false);
    }
  }, []);

  useEffect(() => {
    void refreshReviews();
  }, [refreshReviews]);

  const pool = useMemo<Flashcard[]>(() => {
    let base = flashcards;
    if (activeTag !== "all") base = base.filter((c) => c.tag === activeTag);
    if (mode === "due") {
      const now = Date.now();
      base = base.filter((c) => {
        const r = reviews[c.id];
        return !r || r.due <= now;
      });
    }
    return base;
  }, [activeTag, mode, reviews]);

  useEffect(() => {
    if (idx >= pool.length) setIdx(0);
  }, [pool.length, idx]);

  const card = pool[idx] ?? null;
  const cardReview = card ? reviews[card.id] ?? null : null;

  const grade = useCallback(
    async (g: Grade) => {
      if (!card) return;
      // optimistic: move forward
      const nextIdx = Math.min(pool.length - 1, idx + 1);
      setFlipped(false);
      setIdx(idx + 1 >= pool.length ? 0 : nextIdx);
      try {
        const res = await fetch("/api/reviews", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ cardId: card.id, grade: g }),
        });
        if (!res.ok) throw new Error("bad");
        const data = (await res.json()) as { state: ReviewState };
        setReviews((prev) => ({ ...prev, [card.id]: data.state }));
        // refresh stats lazily
        void fetch("/api/stats")
          .then((r) => r.json())
          .then((s) => setStats(s as Stats))
          .catch(() => {});
      } catch {
        setServerUp(false);
      }
    },
    [card, idx, pool.length]
  );

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (vizOpen) {
        if (e.key === "Escape") setVizOpen(null);
        return;
      }
      if (e.key === " " || e.key === "Enter") {
        e.preventDefault();
        setFlipped((f) => !f);
      } else if (e.key === "ArrowLeft") {
        setFlipped(false);
        setIdx((i) => (i - 1 + pool.length) % Math.max(1, pool.length));
      } else if (e.key === "ArrowRight") {
        setFlipped(false);
        setIdx((i) => (i + 1) % Math.max(1, pool.length));
      } else if (flipped && ["1", "2", "3", "4"].includes(e.key)) {
        const map: Record<string, Grade> = { "1": "again", "2": "hard", "3": "good", "4": "easy" };
        void grade(map[e.key]);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [flipped, pool.length, grade, vizOpen]);

  return (
    <div className="max-w-4xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2 flex items-center gap-3">
          <Layers className="text-indigo-600" size={28} />
          Flashcards
        </h1>
        <p className="text-gray-600 text-sm">
          Anki-style spaced-repetition deck. Rate each card to schedule the next
          review. Linked to local backend at <code className="bg-gray-100 px-1 rounded text-xs">/api</code>.
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
        <StatPill label="Deck" value={flashcards.length} color="text-gray-700" />
        <StatPill label="Reviewed" value={stats?.total ?? 0} color="text-indigo-600" />
        <StatPill label="Due" value={stats?.due ?? 0} color="text-red-600" />
        <StatPill label="Learning" value={stats?.learning ?? 0} color="text-amber-600" />
        <StatPill label="Mature" value={stats?.mature ?? 0} color="text-emerald-600" />
      </div>

      {serverUp === false && (
        <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
          Backend unreachable at <code>/api</code>. Run{" "}
          <code className="bg-amber-100 px-1 rounded">npm run server</code> in a separate terminal — reviews won't persist without it.
        </div>
      )}

      {/* Filter row */}
      <div className="flex flex-wrap items-center gap-2 mb-4">
        <button
          onClick={() => {
            setMode(mode === "due" ? "all" : "due");
            setIdx(0);
          }}
          className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-colors cursor-pointer ${
            mode === "due"
              ? "bg-red-100 text-red-700 border-red-200"
              : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50"
          }`}
        >
          {mode === "due" ? "Due only" : "All cards"}
        </button>
        <div className="w-px h-5 bg-gray-200 mx-1" />
        <button
          onClick={() => {
            setActiveTag("all");
            setIdx(0);
          }}
          className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors cursor-pointer ${
            activeTag === "all"
              ? "bg-indigo-100 text-indigo-700 border-indigo-200"
              : "bg-white text-gray-500 border-gray-200 hover:bg-gray-50"
          }`}
        >
          all
        </button>
        {flashcardTags.map((t) => (
          <button
            key={t}
            onClick={() => {
              setActiveTag(activeTag === t ? "all" : t);
              setIdx(0);
            }}
            className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors cursor-pointer ${
              activeTag === t
                ? tagStyles[t]
                : "bg-white text-gray-500 border-gray-200 hover:bg-gray-50"
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {/* Card */}
      {card ? (
        <>
          <div
            className="relative mx-auto mb-3"
            style={{ perspective: "1200px", maxWidth: "720px", minHeight: "360px" }}
          >
            <div
              onClick={() => setFlipped((f) => !f)}
              className="relative w-full cursor-pointer transition-transform duration-500"
              style={{
                transformStyle: "preserve-3d",
                transform: flipped ? "rotateY(180deg)" : "rotateY(0deg)",
                minHeight: "360px",
              }}
            >
              {/* Front */}
              <div
                className="absolute inset-0 bg-white rounded-2xl border border-gray-200 shadow-sm flex flex-col items-center justify-center p-8"
                style={{ backfaceVisibility: "hidden" }}
              >
                <span
                  className={`px-3 py-1 rounded-full text-xs font-semibold mb-4 border ${tagStyles[card.tag]}`}
                >
                  {card.tag}
                </span>
                <h2 className="text-2xl font-semibold text-gray-900 text-center mb-2">
                  {card.q}
                </h2>
                <p className="text-sm text-gray-500 text-center">{card.hint}</p>
                <div className="mt-6 flex items-center gap-2 text-xs text-gray-400">
                  <EyeOff size={12} />
                  click / space to flip
                </div>
              </div>

              {/* Back */}
              <div
                className="absolute inset-0 bg-white rounded-2xl border border-gray-200 shadow-sm p-5 overflow-auto"
                style={{
                  backfaceVisibility: "hidden",
                  transform: "rotateY(180deg)",
                }}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-medium text-gray-400 uppercase tracking-wide">
                    Implementation
                  </span>
                  <div className="flex items-center gap-2">
                    {(card.vizPath || card.viz) && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (card.viz) setVizOpen({ kind: "algo", value: card.viz });
                          else if (card.vizPath) setVizOpen({ kind: "path", value: card.vizPath });
                        }}
                        className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs text-violet-600 hover:bg-violet-50 border border-violet-200 transition-colors cursor-pointer"
                      >
                        <Sparkles size={12} />
                        Visualize
                      </button>
                    )}
                    <Eye size={12} className="text-gray-400" />
                  </div>
                </div>
                <pre className="bg-gray-900 text-gray-100 rounded-lg p-3 text-xs overflow-auto font-mono leading-relaxed">
                  <code>{card.code}</code>
                </pre>
                <p className="text-xs text-gray-500 mt-3 italic">{card.note}</p>
              </div>
            </div>
          </div>

          {/* Controls */}
          <div className="max-w-[720px] mx-auto">
            <div className="flex items-center justify-between mb-3 text-xs text-gray-500">
              <span>
                {idx + 1} / {pool.length}
              </span>
              <span>
                {cardReview
                  ? `reps ${cardReview.reps} · ease ${cardReview.ease.toFixed(2)} · next ${formatInterval(cardReview.interval)}`
                  : "new card"}
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    setFlipped(false);
                    setIdx((i) => (i - 1 + pool.length) % pool.length);
                  }}
                  className="px-2 py-1 rounded border border-gray-200 hover:bg-gray-50 cursor-pointer"
                >
                  ←
                </button>
                <button
                  onClick={() => {
                    setFlipped(false);
                    setIdx((i) => (i + 1) % pool.length);
                  }}
                  className="px-2 py-1 rounded border border-gray-200 hover:bg-gray-50 cursor-pointer"
                >
                  →
                </button>
              </div>
            </div>

            {flipped ? (
              <div className="grid grid-cols-4 gap-2">
                {(Object.keys(gradeMeta) as Grade[]).map((g) => (
                  <button
                    key={g}
                    onClick={() => grade(g)}
                    className={`flex flex-col items-center justify-center gap-0.5 py-3 rounded-lg border text-sm font-medium transition-colors cursor-pointer ${gradeMeta[g].cls}`}
                  >
                    <span>{gradeMeta[g].label}</span>
                    <span className="text-[10px] opacity-70">
                      {gradeMeta[g].key} · {gradeMeta[g].hint}
                    </span>
                  </button>
                ))}
              </div>
            ) : (
              <button
                onClick={() => setFlipped(true)}
                className="w-full py-3 rounded-lg bg-indigo-600 text-white font-medium hover:bg-indigo-700 transition-colors cursor-pointer flex items-center justify-center gap-2"
              >
                <RotateCcw size={16} />
                Show answer
              </button>
            )}
          </div>
        </>
      ) : (
        <div className="text-center text-sm text-gray-500 py-12 bg-white rounded-xl border border-gray-200">
          Nothing to review here.{" "}
          <button
            onClick={() => {
              setMode("all");
              setActiveTag("all");
              setIdx(0);
            }}
            className="text-indigo-600 hover:underline cursor-pointer"
          >
            Show all cards
          </button>
        </div>
      )}

      {/* Viz modal */}
      {vizOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4"
          onClick={() => setVizOpen(null)}
        >
          <div
            className="bg-white rounded-xl shadow-2xl w-full max-w-4xl h-[85vh] flex flex-col overflow-hidden relative"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setVizOpen(null)}
              className="absolute top-2 right-2 z-10 p-1.5 rounded hover:bg-white/10 text-white/70 hover:text-white cursor-pointer"
              aria-label="Close"
            >
              <X size={18} />
            </button>
            {vizOpen.kind === "path" ? (
              <iframe
                src={vizOpen.value}
                title="visualization"
                className="flex-1 w-full border-0"
              />
            ) : (
              <AlgoViz kind={vizOpen.value} />
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function StatPill({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="bg-white rounded-lg border border-gray-200 px-3 py-2">
      <p className="text-[10px] uppercase tracking-wide text-gray-400 font-medium">
        {label}
      </p>
      <p className={`text-xl font-bold ${color}`}>{value}</p>
    </div>
  );
}
