import { ArrowRight } from "lucide-react";
import { chapters } from "../../data/systemsDesign";

export function SystemsDesignChapterList({
  onNavigate,
  onOpenChapter,
}: {
  onNavigate: (view: string) => void;
  onOpenChapter: (chapterId: string) => void;
}) {
  return (
    <section className="mx-auto w-full max-w-5xl px-4 sm:px-6 py-16 sm:py-24">
      <div className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-baseline sm:justify-between">
        <div>
          <p className="text-sm font-semibold text-slate-500 sm:[text-shadow:_0_1px_6px_rgb(0_0_0_/_45%)]">
            Study cards
          </p>
          <h2 className="mt-1 inline-block rounded-xl bg-white/95 px-3 py-1 sm:bg-transparent sm:px-0 sm:py-0 text-2xl sm:text-3xl font-bold text-slate-900 sm:[text-shadow:_0_1px_6px_rgb(0_0_0_/_45%)]">
            System design in a hurry
          </h2>
        </div>
        <button
          type="button"
          onClick={() => onNavigate("systems-design")}
          className="self-start rounded-xl bg-white/95 px-3 py-1 sm:bg-transparent sm:px-0 sm:py-0 text-sm font-medium text-cyan-700 hover:text-cyan-800 inline-flex items-center gap-1 cursor-pointer sm:[text-shadow:_0_1px_6px_rgb(0_0_0_/_45%)]"
        >
          Open reader
          <ArrowRight size={14} />
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
        {chapters.map((chapter, i) => {
          const sampleTerms = chapter.sections[0]?.terms.slice(0, 3) ?? [];
          return (
            <button
              key={chapter.id}
              type="button"
              onClick={() => onOpenChapter(chapter.id)}
              className="rounded-2xl border border-slate-900/10 bg-white/95 sm:bg-white/60 backdrop-blur-sm hover:bg-white/80 p-6 text-left transition-colors cursor-pointer flex flex-col gap-3"
            >
              <span className="text-sm font-semibold text-slate-500">
                Chapter {i + 1} · {chapter.sections.length} sections
              </span>
              <span className="text-lg font-semibold text-slate-900">{chapter.title}</span>
              <span className="text-sm text-slate-600">{chapter.description}</span>
              {sampleTerms.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {sampleTerms.map((tag) => (
                    <span
                      key={tag}
                      className="border border-slate-900/15 text-slate-600 px-2 py-0.5 text-xs rounded-full"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              )}
            </button>
          );
        })}
      </div>
    </section>
  );
}