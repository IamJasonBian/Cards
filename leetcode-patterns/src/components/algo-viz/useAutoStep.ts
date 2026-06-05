import { useEffect, useRef } from "react";

export function useAutoStep(
  running: boolean,
  onStep: () => void,
  intervalMs: number
): void {
  const cb = useRef(onStep);
  // Keep the latest callback without re-arming the interval. Assigning the ref in
  // an effect (not during render) avoids accessing refs in the render phase.
  useEffect(() => {
    cb.current = onStep;
  });
  useEffect(() => {
    if (!running) return;
    const id = window.setInterval(() => cb.current(), intervalMs);
    return () => window.clearInterval(id);
  }, [running, intervalMs]);
}
