import { useCallback, useState } from "react";
import { useAutoStep } from "./useAutoStep";

export interface FrameControls<T> {
  step: number;
  frame: T;
  running: boolean;
  playToggle: () => void;
  stepBy: (delta: 1 | -1) => void;
  reset: () => void;
}

export function useFrames<T>(frames: T[], intervalMs = 900): FrameControls<T> {
  const [step, setStep] = useState(0);
  const [running, setRunning] = useState(true);

  useAutoStep(
    running,
    () => {
      setStep((s) => {
        if (s >= frames.length - 1) {
          setRunning(false);
          return s;
        }
        return s + 1;
      });
    },
    intervalMs
  );

  const playToggle = useCallback(() => {
    setRunning((r) => {
      if (!r && step >= frames.length - 1) setStep(0);
      return !r;
    });
  }, [step, frames.length]);

  const stepBy = useCallback(
    (delta: 1 | -1) => {
      setRunning(false);
      setStep((s) => Math.max(0, Math.min(frames.length - 1, s + delta)));
    },
    [frames.length]
  );

  const reset = useCallback(() => {
    setStep(0);
    setRunning(true);
  }, []);

  return { step, frame: frames[step], running, playToggle, stepBy, reset };
}
