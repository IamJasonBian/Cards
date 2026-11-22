import { useEffect, useMemo, useState } from "react";

/** A non-empty list: every viz has at least one frame and one scenario. */
export type NonEmpty<T> = [T, ...T[]];

export interface Scenario<I> {
  id: string;
  label: string;
  input: I;
  /** Input that breaks the algorithm's precondition; the builder must explain it, not throw. */
  malformed?: boolean;
}

export interface VizControls {
  step: number;
  stepCount: number;
  running: boolean;
  scenarios: readonly { id: string; label: string; malformed?: boolean }[];
  scenarioId: string;
  onScenario: (id: string) => void;
  onPlayToggle: () => void;
  onStep: (delta: 1 | -1) => void;
  onReset: () => void;
}

export interface Viz<I, F> {
  input: I;
  frame: F;
  controls: VizControls;
}

const prefersReducedMotion = (): boolean =>
  typeof window !== "undefined" &&
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/**
 * Drives one visualization: picks a scenario, builds its frames, and steps through them.
 * `build` must be a module-level pure function that returns at least one frame for any
 * input, including malformed ones.
 */
export function useViz<I, F>(
  scenarios: Readonly<NonEmpty<Scenario<I>>>,
  build: (input: I) => NonEmpty<F>,
  intervalMs = 900
): Viz<I, F> {
  const [scenarioIdx, setScenarioIdx] = useState(0);
  const [step, setStep] = useState(0);
  const [running, setRunning] = useState(() => !prefersReducedMotion());

  const scenario = scenarios[scenarioIdx] ?? scenarios[0];
  const frames = useMemo(() => build(scenario.input), [build, scenario]);
  const last = frames.length - 1;
  const playing = running && step < last;

  // One timeout per frame: nothing to keep in sync, and it stops by itself on the last frame.
  useEffect(() => {
    if (!playing) return;
    const id = window.setTimeout(() => setStep((s) => s + 1), intervalMs);
    return () => window.clearTimeout(id);
  }, [playing, step, intervalMs]);

  return {
    input: scenario.input,
    frame: frames[Math.min(step, last)] ?? frames[0],
    controls: {
      step,
      stepCount: frames.length,
      running: playing,
      scenarios,
      scenarioId: scenario.id,
      onScenario: (id) => {
        const next = scenarios.findIndex((s) => s.id === id);
        if (next < 0) return;
        setScenarioIdx(next);
        setStep(0);
        setRunning(true);
      },
      onPlayToggle: () => {
        if (step >= last) {
          setStep(0);
          setRunning(true);
        } else {
          setRunning(!playing);
        }
      },
      onStep: (delta) => {
        setRunning(false);
        setStep(Math.max(0, Math.min(last, step + delta)));
      },
      onReset: () => {
        setStep(0);
        setRunning(true);
      },
    },
  };
}
