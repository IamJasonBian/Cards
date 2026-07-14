import { AlgoVizFrame } from "./AlgoVizFrame";
import { useFrames } from "./useFrames";

interface Frame {
  r: number;
  dq: number[]; // indices, values decreasing front→back
  res: number[];
  note: string;
}

const NUMS = [1, 3, -1, -3, 5, 3, 6, 7];
const K = 3;

const frames: Frame[] = (() => {
  const out: Frame[] = [];
  const dq: number[] = [];
  const res: number[] = [];
  for (let r = 0; r < NUMS.length; r += 1) {
    const x = NUMS[r];
    while (dq.length > 0 && NUMS[dq[dq.length - 1]] <= x) {
      const popped = dq.pop()!;
      out.push({
        r,
        dq: [...dq],
        res: [...res],
        note: `pop back: nums[${popped}]=${NUMS[popped]} ≤ ${x} (can never be max)`,
      });
    }
    dq.push(r);
    out.push({ r, dq: [...dq], res: [...res], note: `push index ${r} (value ${x})` });
    if (dq[0] <= r - K) {
      const front = dq.shift()!;
      out.push({
        r,
        dq: [...dq],
        res: [...res],
        note: `pop front: index ${front} fell out of window`,
      });
    }
    if (r >= K - 1) {
      res.push(NUMS[dq[0]]);
      out.push({
        r,
        dq: [...dq],
        res: [...res],
        note: `window max = nums[${dq[0]}] = ${NUMS[dq[0]]}`,
      });
    }
  }
  out.push({
    r: NUMS.length - 1,
    dq: [...dq],
    res: [...res],
    note: `done, answer = [${res.join(", ")}]`,
  });
  return out;
})();

export function MonotonicDeque() {
  const { step, frame, running, playToggle, stepBy, reset } = useFrames(frames);
  const cellW = 50;
  const winL = Math.max(0, frame.r - K + 1);

  return (
    <AlgoVizFrame
      title="Monotonic deque — sliding window maximum (239)"
      subtitle={`nums = [${NUMS.join(", ")}], k = ${K}`}
      step={step}
      stepCount={frames.length}
      running={running}
      onPlayToggle={playToggle}
      onStep={stepBy}
      onReset={reset}
      caption={frame.note}
    >
      <svg viewBox={`0 0 ${cellW * NUMS.length + 40} 260`} className="w-full">
        <rect
          x={20 + winL * cellW - 4}
          y={44}
          width={(frame.r - winL + 1) * cellW}
          height={70}
          rx={10}
          fill="rgba(167,139,250,0.12)"
          stroke="rgba(167,139,250,0.5)"
          strokeWidth={1.5}
          style={{ transition: "all 400ms" }}
        />
        {NUMS.map((v, i) => {
          const x = 20 + i * cellW;
          const inWin = i >= winL && i <= frame.r;
          const inDq = frame.dq.includes(i);
          return (
            <g key={i}>
              <rect
                x={x}
                y={50}
                width={cellW - 8}
                height={54}
                rx={8}
                fill={inDq ? "#0e3a44" : "#161820"}
                stroke={inDq ? "#06b6d4" : inWin ? "rgba(167,139,250,0.5)" : "rgba(255,255,255,0.06)"}
                style={{ transition: "fill 300ms" }}
              />
              <text
                x={x + (cellW - 8) / 2}
                y={83}
                textAnchor="middle"
                fill="#f1f5f9"
                fontSize={17}
                fontFamily="JetBrains Mono, monospace"
              >
                {v}
              </text>
              <text
                x={x + (cellW - 8) / 2}
                y={126}
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
          transform={`translate(${20 + frame.r * cellW + (cellW - 8) / 2}, 0)`}
          style={{ transition: "transform 400ms" }}
        >
          <text x={0} y={30} textAnchor="middle" fill="#f87171" fontSize={14} fontFamily="JetBrains Mono, monospace" fontWeight={600}>
            r
          </text>
          <path d="M -6 35 L 6 35 L 0 45 Z" fill="#f87171" />
        </g>
        {/* deque contents, front → back */}
        <g transform="translate(20, 150)">
          <text fill="#64748b" fontSize={11} fontFamily="JetBrains Mono, monospace">
            deque (front → back, values decreasing):
          </text>
          {frame.dq.map((idx, pos) => (
            <g key={idx} transform={`translate(${pos * 58}, 12)`}>
              <rect
                width={50}
                height={36}
                rx={8}
                fill={pos === 0 ? "#14532d" : "#0e3a44"}
                stroke={pos === 0 ? "#34d399" : "#06b6d4"}
              />
              <text x={25} y={24} textAnchor="middle" fill="#f1f5f9" fontSize={14} fontFamily="JetBrains Mono, monospace">
                {NUMS[idx]}
              </text>
            </g>
          ))}
          {frame.dq.length > 0 && (
            <text x={2} y={62} fill="#34d399" fontSize={10} fontFamily="JetBrains Mono, monospace">
              front = window max
            </text>
          )}
        </g>
        <g transform="translate(20, 240)">
          <text fill="#64748b" fontSize={11} fontFamily="JetBrains Mono, monospace">
            answer: [{frame.res.join(", ")}]
          </text>
        </g>
      </svg>
    </AlgoVizFrame>
  );
}
