import type { ReactNode } from "react";
import { Play, Pause, SkipBack, SkipForward, RotateCcw } from "lucide-react";
import { HAND, INK, PAPER } from "./paper";
import type { VizControls } from "./useViz";

interface Props extends VizControls {
  title: string;
  subtitle?: string;
  caption?: ReactNode;
  children: ReactNode;
}

const BTN =
  "border-2 border-[#1e1e1e] bg-[#fffdf7] rounded-md shadow-[2px_2px_0_#1e1e1e] " +
  "hover:bg-[#f1ede0] active:translate-x-[1px] active:translate-y-[1px] active:shadow-[1px_1px_0_#1e1e1e] " +
  "disabled:opacity-30 disabled:pointer-events-none cursor-pointer";

export function AlgoVizFrame({
  title,
  subtitle,
  caption,
  children,
  step,
  stepCount,
  running,
  scenarios,
  scenarioId,
  onScenario,
  onPlayToggle,
  onStep,
  onReset,
}: Props) {
  const atEnd = step >= stepCount - 1;
  return (
    <div
      className="h-full w-full flex flex-col"
      style={{ background: PAPER, color: INK, fontFamily: HAND }}
    >
      <div className="px-5 pt-4 pb-3 pr-12 border-b-2 border-dashed border-[#1e1e1e]/30">
        <h3 className="text-2xl leading-tight">{title}</h3>
        {subtitle && <p className="text-base text-[#1e1e1e]/60">{subtitle}</p>}
        {scenarios.length > 1 && (
          <div className="flex flex-wrap gap-2 mt-2.5" role="tablist" aria-label="Input scenario">
            {scenarios.map((s) => {
              const selected = s.id === scenarioId;
              return (
                <button
                  key={s.id}
                  role="tab"
                  aria-selected={selected}
                  onClick={() => onScenario(s.id)}
                  className={`px-2.5 py-0.5 text-sm rounded-md border-2 cursor-pointer ${
                    s.malformed ? "border-dashed" : ""
                  } ${
                    selected
                      ? "bg-[#1e1e1e] text-[#fffdf7] border-[#1e1e1e]"
                      : "border-[#1e1e1e] hover:bg-[#f1ede0]"
                  }`}
                >
                  {s.malformed ? "⚠ " : ""}
                  {s.label}
                </button>
              );
            })}
          </div>
        )}
      </div>

      <div className="flex-1 min-h-0 flex items-center justify-center overflow-auto p-5">
        <div className="w-full max-w-3xl">{children}</div>
      </div>

      <div className="border-t-2 border-dashed border-[#1e1e1e]/30 px-5 py-3 flex flex-col gap-2.5">
        <div className="text-lg leading-snug min-h-[3rem]" aria-live="polite">
          {caption}
        </div>
        <div className="flex items-center gap-2.5">
          <button
            onClick={() => onStep(-1)}
            disabled={step === 0}
            className={`p-2 ${BTN}`}
            aria-label="Previous step"
          >
            <SkipBack size={14} />
          </button>
          <button
            onClick={onPlayToggle}
            className={`px-3 py-1.5 flex items-center gap-1.5 text-base ${BTN}`}
          >
            {running ? <Pause size={14} /> : <Play size={14} />}
            {running ? "Pause" : atEnd ? "Replay" : "Play"}
          </button>
          <button
            onClick={() => onStep(1)}
            disabled={atEnd}
            className={`p-2 ${BTN}`}
            aria-label="Next step"
          >
            <SkipForward size={14} />
          </button>
          <button onClick={onReset} className={`p-2 ${BTN}`} aria-label="Reset">
            <RotateCcw size={14} />
          </button>
          <div className="ml-auto text-base text-[#1e1e1e]/60">
            step {step + 1} / {stepCount}
          </div>
        </div>
      </div>
    </div>
  );
}
