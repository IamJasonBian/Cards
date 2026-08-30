import { useState } from "react";
import { ChevronDown, ExternalLink, FlaskConical } from "lucide-react";
import { sicpCards, SICP_PDF_URL, type SicpCard } from "../data/sicpCards";

// A deliberately plain companion to the main deck: no flip animation, no
// grading, no review state. Each card just opens in place.
function Card({ card }: { card: SicpCard }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="bg-white/85 sm:bg-white/65 backdrop-blur-2xl rounded-none border border-slate-900/10">
      <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1 px-4 pt-3">
        <span className="font-mono text-sm font-semibold text-violet-700">
          {card.exercise}
        </span>
        <span className="text-xs text-slate-500 flex-1 min-w-0">{card.section}</span>
        <a
          href={`${SICP_PDF_URL}#page=${card.page}`}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 font-mono text-xs text-slate-500 hover:text-cyan-700 transition-colors"
        >
          p.{card.page}
          <ExternalLink size={10} className="opacity-60" />
        </a>
      </div>

      {/* The exercise as the book prints it. */}
      <div className="px-4 pt-2 flex flex-col gap-2">
        {card.prompt.map((b, i) =>
          b.kind === "p" ? (
            <p key={i} className="text-sm text-slate-800">
              {b.text}
            </p>
          ) : (
            <pre
              key={i}
              className="bg-slate-100/90 text-slate-900 rounded-none p-3 text-xs overflow-x-auto font-mono leading-relaxed border border-slate-900/5"
            >
              <code>{b.text}</code>
            </pre>
          )
        )}
        {card.footnote && (
          <p className="text-xs text-slate-500 italic">{card.footnote}</p>
        )}
      </div>

      <button
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="mt-3 mb-3 mx-4 px-3 py-1.5 rounded-none border border-slate-900/10 bg-slate-100/90 sm:bg-slate-100/70 text-xs font-medium text-slate-700 hover:bg-cyan-50 hover:border-cyan-500/30 hover:text-cyan-700 transition-colors cursor-pointer"
      >
        {open ? "Hide solutions" : "Show solutions"}
      </button>

      {open && (
        <div className="px-4 pb-4 border-t border-slate-900/10 pt-3">
          <p className="text-[10px] uppercase tracking-wide text-slate-500 font-medium mb-2">
            Reader-written — SICP publishes no solutions
          </p>
          <ul className="flex flex-col gap-2">
            {card.solutions.map((sol) => (
              <li key={sol.url}>
                <a
                  href={sol.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-sm text-cyan-700 hover:underline"
                >
                  {sol.label}
                  <ExternalLink size={11} className="opacity-60" />
                </a>
                {sol.caveat && (
                  <p className="text-xs text-slate-500 mt-0.5">{sol.caveat}</p>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

export function SicpCards() {
  const [open, setOpen] = useState(false);

  return (
    <section className="mt-10 pt-6 border-t border-slate-900/10">
      <button
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="w-full flex items-center gap-2 text-left cursor-pointer group"
      >
        <FlaskConical size={16} className="text-violet-600 shrink-0" />
        <span className="text-sm font-semibold text-slate-900">SICP exercises</span>
        <span className="px-1.5 py-0.5 rounded-none border border-violet-200 bg-violet-50 text-[10px] font-semibold uppercase tracking-wide text-violet-700">
          experimental
        </span>
        <span className="font-mono text-xs text-slate-500">{sicpCards.length}</span>
        <ChevronDown
          size={14}
          className={`ml-auto text-slate-500 transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>

      <p className="mt-1.5 text-xs text-slate-500">
        Exercises quoted from the Theory copy of SICP, with a page link into the
        PDF. Not part of the review schedule — these never count toward due cards.
      </p>

      {open && (
        <div className="mt-4 flex flex-col gap-3">
          {sicpCards.map((c) => (
            <Card key={c.id} card={c} />
          ))}
        </div>
      )}
    </section>
  );
}
