import { AlgoVizFrame } from "./AlgoVizFrame";
import { useFrames } from "./useFrames";

interface Frame {
  l: number;
  r: number;
  sum: number;
  best: number;
  note: string;
}

const NUMS = [2, 1, 5, 1, 3, 2];
const K = 3;

const frames: Frame[] = (() => {
  const out: Frame[] = [];
  let sum = 0;
  for (let i = 0; i < K; i += 1) sum += NUMS[i];
  let best = sum;
  out.push({ l: 0, r: K - 1, sum, best, note: `seed: sum of first ${K} = ${sum}` });
  for (let r = K; r < NUMS.length; r += 1) {
    const l = r - K + 1;
    sum += NUMS[r] - NUMS[r - K];
    out.push({
      l,
      r,
      sum,
      best,
      note: `slide: +${NUMS[r]} (enter), -${NUMS[r - K]} (leave) → sum = ${sum}`,
    });
    if (sum > best) {
      best = sum;
      out.push({ l, r, sum, best, note: `new best = ${best}` });
    }
  }
  out.push({
    l: NUMS.length - K,
    r: NUMS.length - 1,
    sum,
    best,
    note: `done, answer = ${best}`,
  });
  return out;
})();

export function FixedWindow() {
  const { step, frame, running, playToggle, stepBy, reset } = useFrames(frames);
  const cellW = 56;

  return (
    <AlgoVizFrame
      title="Fixed-size window — max sum of size k"
      subtitle={`nums = [${NUMS.join(", ")}], k = ${K}`}
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
          width={K * cellW}
          height={76}
          rx={10}
          fill="rgba(167,139,250,0.12)"
          stroke="rgba(167,139,250,0.5)"
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
            sum = {frame.sum} · best = {frame.best}
          </text>
        </g>
      </svg>
    </AlgoVizFrame>
  );
}
