import { AlgoVizFrame } from "./AlgoVizFrame";
import { useFrames } from "./useFrames";

const COINS = [1, 3, 4];
const AMOUNT = 6;
const INF = Number.POSITIVE_INFINITY;

interface Frame {
  coin: number; // index into COINS, -1 = none
  x: number | null; // dp cell being written
  src: number | null; // dp[x - coin] source cell
  dp: number[];
  updated: boolean;
  note: string;
  done?: boolean;
}

const frames: Frame[] = (() => {
  const out: Frame[] = [];
  const dp = Array(AMOUNT + 1).fill(INF);
  dp[0] = 0;
  const snap = () => [...dp];
  out.push({
    coin: -1,
    x: null,
    src: null,
    dp: snap(),
    updated: false,
    note: "dp[0] = 0, rest ∞ — min coins to make each amount",
  });
  COINS.forEach((coin, i) => {
    out.push({
      coin: i,
      x: null,
      src: null,
      dp: snap(),
      updated: false,
      note: `coin ${coin} — sweep x from ${coin} UP to ${AMOUNT} (forward → unlimited reuse)`,
    });
    for (let x = coin; x <= AMOUNT; x += 1) {
      const cand = dp[x - coin] + 1;
      if (cand < dp[x]) {
        dp[x] = cand;
        out.push({
          coin: i,
          x,
          src: x - coin,
          dp: snap(),
          updated: true,
          note: `dp[${x}] = min(dp[${x}], dp[${x - coin}] + 1) = ${cand}`,
        });
      } else {
        out.push({
          coin: i,
          x,
          src: x - coin,
          dp: snap(),
          updated: false,
          note: `dp[${x - coin}] + 1 = ${cand === INF ? "∞" : cand} ≥ dp[${x}] = ${dp[x] === INF ? "∞" : dp[x]} — keep`,
        });
      }
    }
  });
  out.push({
    coin: -1,
    x: AMOUNT,
    src: null,
    dp: snap(),
    updated: false,
    done: true,
    note: `done — dp[${AMOUNT}] = ${dp[AMOUNT]} coins (3 + 3 = ${AMOUNT})`,
  });
  return out;
})();

const CELL = 58;
const X0 = 40;

export function CoinChange() {
  const { step, frame, running, playToggle, stepBy, reset } = useFrames(frames, 1000);

  return (
    <AlgoVizFrame
      title="Coin change — min coins"
      subtitle={`coins = [${COINS.join(", ")}], amount = ${AMOUNT}`}
      step={step}
      stepCount={frames.length}
      running={running}
      onPlayToggle={playToggle}
      onStep={stepBy}
      onReset={reset}
      caption={frame.note}
    >
      <svg viewBox={`0 0 ${X0 * 2 + (AMOUNT + 1) * CELL} 250`} className="w-full">
        {/* coins row */}
        <text x={X0} y={30} fill="#64748b" fontSize={11} fontFamily="JetBrains Mono, monospace">
          coins:
        </text>
        {COINS.map((c, i) => {
          const active = frame.coin === i;
          return (
            <g key={i}>
              <circle
                cx={X0 + 90 + i * 64}
                cy={26}
                r={17}
                fill={active ? "#06b6d4" : "#1e2030"}
                stroke={active ? "#22d3ee" : "rgba(255,255,255,0.12)"}
                strokeWidth={1.5}
                style={{ transition: "fill 300ms" }}
              />
              <text
                x={X0 + 90 + i * 64}
                y={31}
                textAnchor="middle"
                fill="#f1f5f9"
                fontSize={13}
                fontFamily="JetBrains Mono, monospace"
              >
                {c}
              </text>
            </g>
          );
        })}

        {/* dp row */}
        <text x={X0} y={100} fill="#64748b" fontSize={11} fontFamily="JetBrains Mono, monospace">
          dp:
        </text>
        {frame.dp.map((v, i) => {
          const isCur = frame.x === i;
          const isSrc = frame.src === i;
          const isAnswer = frame.done && i === AMOUNT;
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
                y={115}
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
                y={148}
                textAnchor="middle"
                fill={v === INF ? "#64748b" : "#f1f5f9"}
                fontSize={15}
                fontFamily="JetBrains Mono, monospace"
              >
                {v === INF ? "∞" : v}
              </text>
              <text
                x={X0 + i * CELL + (CELL - 8) / 2}
                y={190}
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
        <text x={X0} y={230} fill="#64748b" fontSize={11} fontFamily="JetBrains Mono, monospace">
          forward sweep → dp[x - coin] may already use this coin (reuse OK)
        </text>
      </svg>
    </AlgoVizFrame>
  );
}
