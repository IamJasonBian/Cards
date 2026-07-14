import { AlgoVizFrame } from "./AlgoVizFrame";
import { useFrames } from "./useFrames";

interface Frame {
  l: number;
  r: number;
  total: number;
  best: number | null;
  note: string;
}

const NUMS = [2, 3, 1, 2, 4, 3];
const TARGET = 7;

const frames: Frame[] = (() => {
  const out: Frame[] = [];
  let l = 0;
  let total = 0;
  let best: number | null = null;
  for (let r = 0; r < NUMS.length; r += 1) {
    total += NUMS[r];
    out.push({ l, r, total, best, note: `expand r: +${NUMS[r]} → total = ${total}` });
    while (total >= TARGET) {
      const len = r - l + 1;
      if (best === null || len < best) {
        best = len;
        out.push({ l, r, total, best, note: `VALID (total ≥ ${TARGET}) → new best = ${best}` });
      } else {
        out.push({ l, r, total, best, note: `VALID (total ≥ ${TARGET}), len = ${len}` });
      }
      total -= NUMS[l];
      l += 1;
      out.push({ l, r, total, best, note: `shrink: -${NUMS[l - 1]} → total = ${total}, l = ${l}` });
    }
  }
  out.push({ l, r: NUMS.length - 1, total, best, note: `done, answer = ${best ?? 0}` });
  return out;
})();

export function MinWindow() {
  const { step, frame, running, playToggle, stepBy, reset } = useFrames(frames);
  const cellW = 56;

  return (
    <AlgoVizFrame
      title="Shortest valid window — min size subarray sum ≥ target"
      subtitle={`nums = [${NUMS.join(", ")}], target = ${TARGET}`}
      step={step}
      stepCount={frames.length}
      running={running}
      onPlayToggle={playToggle}
      onStep={stepBy}
      onReset={reset}
      caption={frame.note}
    >
      <svg viewBox={`0 0 ${cellW * NUMS.length + 40} 220`} className="w-full">
        <rect
          x={20 + frame.l * cellW - 4}
          y={52}
          width={Math.max(frame.r - frame.l + 1, 0) * cellW}
          height={76}
          rx={10}
          fill={frame.total >= TARGET ? "rgba(52,211,153,0.12)" : "rgba(167,139,250,0.12)"}
          stroke={frame.total >= TARGET ? "rgba(52,211,153,0.55)" : "rgba(167,139,250,0.5)"}
          strokeWidth={1.5}
          style={{ transition: "all 400ms" }}
        />
        {NUMS.map((v, i) => {
          const x = 20 + i * cellW;
          const inWin = i >= frame.l && i <= frame.r;
          return (
            <g key={i}>
              <rect
                x={x}
                y={60}
                width={cellW - 8}
                height={60}
                rx={8}
                fill={inWin ? "#0e3a44" : "#161820"}
                stroke={inWin ? "#06b6d4" : "rgba(255,255,255,0.06)"}
                style={{ transition: "fill 300ms" }}
              />
              <text
                x={x + (cellW - 8) / 2}
                y={97}
                textAnchor="middle"
                fill="#f1f5f9"
                fontSize={20}
                fontFamily="JetBrains Mono, monospace"
              >
                {v}
              </text>
              <text
                x={x + (cellW - 8) / 2}
                y={142}
                textAnchor="middle"
                fill="#64748b"
                fontSize={11}
                fontFamily="JetBrains Mono, monospace"
              >
                {i}
              </text>
            </g>
          );
        })}
        <g
          transform={`translate(${20 + frame.l * cellW + (cellW - 8) / 2}, 0)`}
          style={{ transition: "transform 400ms" }}
        >
          <text x={0} y={40} textAnchor="middle" fill="#34d399" fontSize={14} fontFamily="JetBrains Mono, monospace" fontWeight={600}>
            l
          </text>
          <path d="M -6 45 L 6 45 L 0 55 Z" fill="#34d399" />
        </g>
        <g
          transform={`translate(${20 + frame.r * cellW + (cellW - 8) / 2}, 0)`}
          style={{ transition: "transform 400ms" }}
        >
          <text x={0} y={40} textAnchor="middle" fill="#f87171" fontSize={14} fontFamily="JetBrains Mono, monospace" fontWeight={600}>
            r
          </text>
          <path d="M -6 45 L 6 45 L 0 55 Z" fill="#f87171" />
        </g>
        <g transform="translate(20, 170)">
          <text fill="#64748b" fontSize={11} fontFamily="JetBrains Mono, monospace">
            total = {frame.total} · best = {frame.best ?? "∞"} · shrink while VALID (green)
          </text>
        </g>
      </svg>
    </AlgoVizFrame>
  );
}
