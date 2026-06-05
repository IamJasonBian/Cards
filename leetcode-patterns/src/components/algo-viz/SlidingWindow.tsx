import { AlgoVizFrame } from "./AlgoVizFrame";
import { useFrames } from "./useFrames";

interface Frame {
  l: number;
  r: number;
  count: Record<string, number>;
  note: string;
  best: number;
}

const S = "eceba";
const K = 2;

const frames: Frame[] = (() => {
  const out: Frame[] = [];
  let l = 0;
  let best = 0;
  const count: Record<string, number> = {};
  for (let r = 0; r < S.length; r += 1) {
    const c = S[r];
    count[c] = (count[c] ?? 0) + 1;
    out.push({ l, r, count: { ...count }, note: `expand r: add '${c}'`, best });
    while (Object.keys(count).length > K) {
      const lc = S[l];
      count[lc] -= 1;
      if (count[lc] === 0) delete count[lc];
      l += 1;
      out.push({
        l,
        r,
        count: { ...count },
        note: `shrink: |distinct| > ${K} → drop '${lc}', l=${l}`,
        best,
      });
    }
    if (r - l + 1 > best) {
      best = r - l + 1;
      out.push({ l, r, count: { ...count }, note: `new best = ${best}`, best });
    }
  }
  out.push({ l, r: S.length - 1, count, note: `done, answer = ${best}`, best });
  return out;
})();

export function SlidingWindow() {
  const { step, frame, running, playToggle, stepBy, reset } = useFrames(frames);
  const cellW = 56;

  return (
    <AlgoVizFrame
      title="Sliding window — longest substring ≤ K distinct"
      subtitle={`s = "${S}", K = ${K}`}
      step={step}
      stepCount={frames.length}
      running={running}
      onPlayToggle={playToggle}
      onStep={stepBy}
      onReset={reset}
      caption={frame.note}
    >
      <svg viewBox={`0 0 ${cellW * S.length + 40} 220`} className="w-full">
        {/* window shading */}
        <rect
          x={20 + frame.l * cellW - 4}
          y={52}
          width={(frame.r - frame.l + 1) * cellW}
          height={76}
          rx={10}
          fill="rgba(167,139,250,0.12)"
          stroke="rgba(167,139,250,0.5)"
          strokeWidth={1.5}
          style={{ transition: "all 400ms" }}
        />
        {S.split("").map((c, i) => {
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
                {c}
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
        <g transform={`translate(${20 + frame.l * cellW + (cellW - 8) / 2}, 0)`} style={{ transition: "transform 400ms" }}>
          <text x={0} y={40} textAnchor="middle" fill="#34d399" fontSize={14} fontFamily="JetBrains Mono, monospace" fontWeight={600}>
            l
          </text>
          <path d="M -6 45 L 6 45 L 0 55 Z" fill="#34d399" />
        </g>
        <g transform={`translate(${20 + frame.r * cellW + (cellW - 8) / 2}, 0)`} style={{ transition: "transform 400ms" }}>
          <text x={0} y={40} textAnchor="middle" fill="#f87171" fontSize={14} fontFamily="JetBrains Mono, monospace" fontWeight={600}>
            r
          </text>
          <path d="M -6 45 L 6 45 L 0 55 Z" fill="#f87171" />
        </g>
        {/* counter */}
        <g transform="translate(20, 170)">
          <text fill="#64748b" fontSize={11} fontFamily="JetBrains Mono, monospace">
            count: {JSON.stringify(frame.count)} · best = {frame.best}
          </text>
        </g>
      </svg>
    </AlgoVizFrame>
  );
}
