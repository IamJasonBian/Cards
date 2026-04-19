import { useEffect, useRef } from "react";

export function useAutoStep(
  running: boolean,
  onStep: () => void,
  intervalMs: number
): void {
  const cb = useRef(onStep);
  cb.current = onStep;
  useEffect(() => {
    if (!running) return;
    const id = window.setInterval(() => cb.current(), intervalMs);
    return () => window.clearInterval(id);
  }, [running, intervalMs]);
}
