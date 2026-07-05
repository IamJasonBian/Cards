import { ChevronDown } from "lucide-react";

const FAQ_ITEMS = [
  {
    question: "What is One Card a Day?",
    answer:
      "A simple daily habit: solve or review one algorithm card each day. Small, consistent reps that compound into interview-ready pattern recognition.",
  },
  {
    question: "How do flashcards work?",
    answer:
      "Spaced-repetition cards quiz you on patterns and their optimal approaches. Grade yourself and the deck resurfaces weak spots more often.",
  },
  {
    question: "What is an interview drill?",
    answer:
      "A timed, three-phase mock: restate the problem, talk through an approach, then code it — with a verification checklist at the end.",
  },
  {
    question: "Which problem lists are included?",
    answer:
      "Curated favorites like Blind 75, NeetCode 150, and Grind 75, plus pattern-grouped sets you can practice by topic.",
  },
];

export function Faq() {
  return (
    <section className="mx-auto w-full max-w-3xl px-4 sm:px-6 py-16 sm:py-24">
      <div className="text-center mb-8">
        <div className="inline-block bg-white/95 px-4 py-3 sm:bg-transparent sm:px-0 sm:py-0">
          <p className="text-xs font-semibold uppercase tracking-[0.15em] text-slate-500 sm:[text-shadow:_0_1px_6px_rgb(0_0_0_/_45%)]">
            FAQ
          </p>
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-slate-900 sm:[text-shadow:_0_1px_6px_rgb(0_0_0_/_45%)]">
            How it works
          </h2>
        </div>
      </div>
      <div className="border-t border-slate-900/10">
        {FAQ_ITEMS.map((item) => (
          <details
            key={item.question}
            className="group border-b border-slate-900/10 bg-white/95 sm:bg-white/50 backdrop-blur-sm"
          >
            <summary className="flex items-center justify-between gap-4 px-5 py-4 cursor-pointer list-none text-slate-900 font-medium [&::-webkit-details-marker]:hidden">
              {item.question}
              <ChevronDown
                size={18}
                className="text-slate-500 transition-transform group-open:rotate-180 shrink-0"
              />
            </summary>
            <div className="px-5 pb-4 text-sm text-slate-600">{item.answer}</div>
          </details>
        ))}
      </div>
    </section>
  );
}
