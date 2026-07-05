import { AlgoVizFrame } from "./AlgoVizFrame";
import { useFrames } from "./useFrames";

const ITEMS: { wt: number; val: number }[] = [
  { wt: 3, val: 4 },
  { wt: 4, val: 5 },
  { wt: 5, val: 6 },
];
const W = 8;

interface Frame {
  item: number; // index into ITEMS, -1 = none
  w: number | null; // dp cell being written
  src: number | null; // dp[w - wt] source cell
  dp: number[];
  updated: boolean;
  note: string;
  done?: boolean;
}

const frames: Frame[] = (() => {
  const out: Frame[] = [];
  const dp = Array(W + 1).fill(0);
  const snap = () => [...dp];
  out.push({ item: -1, w: null, src: null, dp: snap(), updated: false, note: `dp[0..${W}] = 0 — no items considered yet` });
  ITEMS.forEach(({ wt, val }, i) => {
    out.push({
      item: i,
      w: null,
      src: null,
      dp: snap(),
      updated: false,
      note: `item ${i + 1} (wt=${wt}, val=${val}) — sweep w from ${W} DOWN to ${wt} (reverse → used once)`,
    });
    for (let w = W; w >= wt; w -= 1) {
      const cand = dp[w - wt] + val;
      if (cand > dp[w]) {
        dp[w] = cand;
        out.push({
          item: i,
          w,
          src: w - wt,
          dp: snap(),
          updated: true,
          note: `dp[${w}] = max(dp[${w}], dp[${w - wt}] + ${val}) = ${cand} — take item`,
        });
      } else {
        out.push({
          item: i,
          w,
          src: w - wt,
          dp: snap(),
          updated: false,
          note: `dp[${w - wt}] + ${val} = ${cand} ≤ dp[${w}] = ${dp[w]} — skip item`,
        });
      }
    }
  });
  out.push({
    item: -1,
    w: W,
    src: null,
    dp: snap(),
    updated: false,
    done: true,
    note: `done — dp[${W}] = ${dp[W]} is the best value within capacity ${W}`,
  });
  return out;
})();

const CELL = 52;
const X0 = 20;

export function Knapsack01() {
  const { step, frame, running, playToggle, stepBy, reset } = useFrames(frames, 1000);

  return (
    <AlgoVizFrame
      title="0/1 Knapsack — 1-D dp"
      subtitle={`capacity W = ${W}; reverse sweep keeps each item 0/1`}
      step={step}
      stepCount={frames.length}
      running={running}
      onPlayToggle={playToggle}
      onStep={stepBy}
      onReset={reset}
      caption={frame.note}
    >
      <svg viewBox={`0 0 ${X0 * 2 + (W + 1) * CELL} 260`} className="w-full">
        {/* items row */}
        <text x={X0} y={30} fill="#64748b" fontSize={11} fontFamily="JetBrains Mono, monospace">
          items:
        </text>
        {ITEMS.map(({ wt, val }, i) => {
          const active = frame.item === i;
          return (
            <g key={i}>
              <rect
                x={X0 + 70 + i * 118}
                y={12}
                width={106}
                height={30}
                rx={7}
                fill={active ? "#06b6d4" : "#1e2030"}
                stroke={active ? "#22d3ee" : "rgba(255,255,255,0.08)"}
                style={{ transition: "fill 300ms" }}
              />
              <text
                x={X0 + 70 + i * 118 + 53}
                y={32}
                textAnchor="middle"
                fill="#f1f5f9"
                fontSize={12}
                fontFamily="JetBrains Mono, monospace"
              >
                wt {wt} · val {val}
              </text>
            </g>
          );
        })}

        {/* dp row */}
        <text x={X0} y={105} fill="#64748b" fontSize={11} fontFamily="JetBrains Mono, monospace">
          dp:
        </text>
        {frame.dp.map((v, i) => {
          const isCur = frame.w === i;
          const isSrc = frame.src === i;
          const isAnswer = frame.done && i === W;
          const fill = isAnswer
            ? "#10b981"
            : isCur
            ? frame.updated
              ? "#0d9e6e"
              : "#06b6d4"
            : isSrc
            ? "#1e3a34"
            : "#1e2030";
          const stroke = isAnswer
            ? "#34d399"
            : isCur
            ? "#22d3ee"
            : isSrc
            ? "#34d399"
            : "rgba(255,255,255,0.08)";
          return (
            <g key={i}>
              <rect
                x={X0 + i * CELL}
                y={120}
                width={CELL - 8}
                height={54}
                rx={8}
                fill={fill}
                stroke={stroke}
                strokeWidth={isCur || isSrc || isAnswer ? 2 : 1}
                style={{ transition: "fill 300ms, stroke 300ms" }}
              />
              <text
                x={X0 + i * CELL + (CELL - 8) / 2}
                y={153}
                textAnchor="middle"
                fill="#f1f5f9"
                fontSize={15}
                fontFamily="JetBrains Mono, monospace"
              >
                {v}
              </text>
              <text
                x={X0 + i * CELL + (CELL - 8) / 2}
                y={195}
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
        {/* sweep direction hint */}
        <text x={X0} y={235} fill="#64748b" fontSize={11} fontFamily="JetBrains Mono, monospace">
          w sweeps ← right to left, so dp[w - wt] still holds the PREVIOUS item row
        </text>
      </svg>
    </AlgoVizFrame>
  );
}
