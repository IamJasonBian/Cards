import type { ReactNode } from "react";
import { Play, Pause, SkipBack, SkipForward, RotateCcw } from "lucide-react";

interface Props {
  title: string;
  subtitle?: string;
  step: number;
  stepCount: number;
  running: boolean;
  caption?: ReactNode;
  onPlayToggle: () => void;
  onStep: (delta: 1 | -1) => void;
  onReset: () => void;
  children: ReactNode;
}

export function AlgoVizFrame({
  title,
  subtitle,
  step,
  stepCount,
  running,
  caption,
  onPlayToggle,
  onStep,
  onReset,
  children,
}: Props) {
  return (
    <div className="h-full w-full flex flex-col bg-[#0e0f14] text-slate-100">
      <div className="px-5 py-4 border-b border-white/5">
        <h3 className="text-lg font-semibold tracking-tight">{title}</h3>
        {subtitle && (
          <p className="text-xs text-slate-400 mt-0.5 font-mono">{subtitle}</p>
        )}
      </div>

      <div className="flex-1 flex items-center justify-center overflow-auto p-6">
        <div className="w-full max-w-3xl">{children}</div>
      </div>

      <div className="border-t border-white/5 px-5 py-3 flex flex-col gap-2">
        {caption && (
          <div className="text-sm text-slate-300 font-mono min-h-[1.25rem]">
            {caption}
          </div>
        )}
        <div className="flex items-center gap-2">
          <button
            onClick={() => onStep(-1)}
            disabled={step === 0}
            className="p-2 rounded-md border border-white/10 hover:bg-white/5 disabled:opacity-30 cursor-pointer"
            aria-label="Previous step"
          >
            <SkipBack size={14} />
          </button>
          <button
            onClick={onPlayToggle}
            className="px-3 py-2 rounded-md bg-cyan-500/20 border border-cyan-400/30 text-cyan-200 hover:bg-cyan-500/30 flex items-center gap-1.5 text-sm cursor-pointer"
          >
            {running ? <Pause size={14} /> : <Play size={14} />}
            {running ? "Pause" : "Play"}
          </button>
          <button
            onClick={() => onStep(1)}
            disabled={step >= stepCount - 1}
            className="p-2 rounded-md border border-white/10 hover:bg-white/5 disabled:opacity-30 cursor-pointer"
            aria-label="Next step"
          >
            <SkipForward size={14} />
          </button>
          <button
            onClick={onReset}
            className="p-2 rounded-md border border-white/10 hover:bg-white/5 cursor-pointer"
            aria-label="Reset"
          >
            <RotateCcw size={14} />
          </button>
          <div className="ml-auto text-xs text-slate-400 font-mono">
            step {step + 1} / {stepCount}
          </div>
        </div>
      </div>
    </div>
  );
}
