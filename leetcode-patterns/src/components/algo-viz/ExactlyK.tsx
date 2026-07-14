import { AlgoVizFrame } from "./AlgoVizFrame";
import { useFrames } from "./useFrames";

interface Frame {
  l: number;
  r: number;
  count: number;
  added: number;
  note: string;
}

const NUMS = [1, 2, 1, 2, 3];
const K = 2;

const frames: Frame[] = (() => {
  const out: Frame[] = [];
  let l = 0;
  let count = 0;
  const freq: Record<number, number> = {};
  for (let r = 0; r < NUMS.length; r += 1) {
    const x = NUMS[r];
    freq[x] = (freq[x] ?? 0) + 1;
    out.push({ l, r, count, added: 0, note: `expand r: add ${x}` });
    while (Object.keys(freq).length > K) {
      const lx = NUMS[l];
      freq[lx] -= 1;
      if (freq[lx] === 0) delete freq[lx];
      l += 1;
      out.push({ l, r, count, added: 0, note: `> ${K} distinct → shrink, l = ${l}` });
    }
    const added = r - l + 1;
    count += added;
    out.push({
      l,
      r,
      count,
      added,
      note: `count += r - l + 1 = ${added} (windows ending at r) → ${count}`,
    });
  }
  out.push({
    l,
    r: NUMS.length - 1,
    count,
    added: 0,
    note: `atMost(${K}) = ${count}; exactly(K) = atMost(K) - atMost(K-1)`,
  });
  return out;
})();

export function ExactlyK() {
  const { step, frame, running, playToggle, stepBy, reset } = useFrames(frames);
  const cellW = 56;

  return (
    <AlgoVizFrame
      title={`Counting subarrays — atMost(${K}) distinct`}
      subtitle={`nums = [${NUMS.join(", ")}] · exactly(K) = atMost(K) - atMost(K-1)`}
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
          width={(frame.r - frame.l + 1) * cellW}
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
            count = {frame.count}
            {frame.added > 0 ? `  (+${frame.added} this step)` : ""}
          </text>
        </g>
      </svg>
    </AlgoVizFrame>
  );
}
