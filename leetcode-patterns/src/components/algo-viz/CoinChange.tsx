import { AlgoVizFrame } from "./AlgoVizFrame";
import { Cell, Edge, Ink, Node, Sketch, type Tone } from "./paper";
import { useViz, type NonEmpty, type Scenario } from "./useViz";

interface Input {
  coins: number[];
  amount: number;
}

interface Frame {
  /** Index of the coin being swept; -1 = none yet, coins.length = all swept. */
  coin: number;
  /** dp cell being written. */
  x?: number;
  /** dp cell being read: x - coin. */
  src?: number;
  dp: number[];
  note: string;
  done?: boolean;
}

const SCENARIOS: NonEmpty<Scenario<Input>> = [
  { id: "normal", label: "coins 1, 3, 4", input: { coins: [1, 3, 4], amount: 6 } },
  { id: "unreachable", label: "unreachable amount", input: { coins: [2, 4], amount: 5 } },
  { id: "zero-coin", label: "coin of value 0", malformed: true, input: { coins: [0, 3], amount: 6 } },
];

const INF = Number.POSITIVE_INFINITY;
const fmt = (v: number): string => (v === INF ? "∞" : String(v));

function buildFrames({ coins, amount }: Input): NonEmpty<Frame> {
  if (amount < 0) {
    return [{ coin: -1, dp: [], note: `Amount ${amount} is negative, so dp[0..amount] cannot be built. Real code should return -1.` }];
  }
  const dp = Array.from({ length: amount + 1 }, (_, x) => (x === 0 ? 0 : INF));
  const last = dp.map(() => 0); // coin that produced the current dp[x]
  const snap = () => [...dp];
  const out: NonEmpty<Frame> = [
    { coin: -1, dp: snap(), note: "dp[x] = fewest coins that make x. dp[0] = 0, everything else ∞ (not reachable yet)." },
  ];

  // dp[x - coin] must be a smaller, already-solved amount: that needs coin > 0.
  const bad = coins.findIndex((c) => c <= 0);
  if (bad >= 0) {
    const c = coins[bad];
    const src = amount - c;
    out.push({ coin: bad, dp: snap(), note: `Precondition broken: coin ${c} is not a positive value.` });
    out.push({
      coin: bad,
      x: amount,
      src,
      dp: snap(),
      note:
        c === 0
          ? `dp[${amount}] = min(dp[${amount}], dp[${amount} - 0] + 1) reads itself, and dp[${amount}] + 1 is never smaller. A 0 coin makes no progress; a recursive version would loop forever.`
          : `dp[${amount}] would read dp[${amount} - (${c})] = dp[${src}], past the end of dp[0..${amount}].`,
    });
    out.push({ coin: bad, x: amount, src, dp: snap(), note: "No answer. Real code should drop or reject coins <= 0 before the loop." });
    return out;
  }

  coins.forEach((coin, i) => {
    out.push({
      coin: i,
      dp: snap(),
      note:
        coin > amount
          ? `Coin ${coin} is larger than amount ${amount}. It can never be used, so skip it.`
          : `Coin ${coin}: sweep x from ${coin} up to ${amount}. Left to right, so dp[x - ${coin}] may already use this coin (reuse allowed).`,
    });
    for (let x = coin; x <= amount; x += 1) {
      const keep = dp[x];
      const rest = dp[x - coin];
      const better = rest + 1 < keep;
      if (better) {
        dp[x] = rest + 1;
        last[x] = coin;
      }
      out.push({
        coin: i,
        x,
        src: x - coin,
        dp: snap(),
        note: `dp[${x}] = min(dp[${x}], dp[${x - coin}] + 1) = min(${fmt(keep)}, ${fmt(rest)} + 1) = ${fmt(dp[x])}. ${better ? `Use coin ${coin}` : "Keep"}.`,
      });
    }
  });

  let note = `dp[${amount}] is still ∞: no combination of [${coins.join(", ")}] makes ${amount}. Return -1.`;
  if (dp[amount] !== INF) {
    const used: number[] = [];
    for (let x = amount; x > 0; x -= last[x]) used.push(last[x]);
    note = `Done: dp[${amount}] = ${dp[amount]} coins${used.length > 0 ? ` (${used.join(" + ")} = ${amount})` : ""}.`;
  }
  out.push({ coin: coins.length, x: amount, dp: snap(), done: true, note });
  return out;
}

const CELL = 52;
const GAP = 8;
const PAD = 24;
const LABEL = 60;
const COIN_R = 20;
const COIN_STEP = 58;
const COIN_Y = 40;
const DP_Y = 128;

export function CoinChange() {
  const { input, frame, controls } = useViz(SCENARIOS, buildFrames, 1000);
  const { coins, amount } = input;
  const cx = (x: number) => PAD + LABEL + x * (CELL + GAP) + CELL / 2;
  const { x, src } = frame;
  const srcInTable = src !== undefined && src >= 0 && src <= amount;

  const coinTone = (i: number): Tone => (i === frame.coin ? "active" : i < frame.coin ? "dim" : "idle");
  const dpTone = (i: number, v: number): Tone => {
    if (i === x) return frame.done ? "done" : "active";
    if (i === src) return "done";
    return v === INF ? "dim" : "idle";
  };

  return (
    <AlgoVizFrame
      title="Coin change: fewest coins"
      subtitle={`coins = [${coins.join(", ")}], amount = ${amount}`}
      caption={frame.note}
      {...controls}
    >
      <Sketch
        width={PAD * 2 + LABEL + Math.max(coins.length * COIN_STEP, (amount + 1) * (CELL + GAP)) - GAP}
        height={DP_Y + CELL + 36}
        label={`Coin change dp row for coins ${coins.join(", ")} and amount ${amount}`}
      >
        <Ink x={PAD} y={COIN_Y} anchor="start" tone="dim">
          coins
        </Ink>
        {coins.map((c, i) => (
          <Node key={i} x={PAD + LABEL + COIN_R + i * COIN_STEP} y={COIN_Y} r={COIN_R} tone={coinTone(i)} label={c} />
        ))}

        <Ink x={PAD} y={DP_Y + CELL / 2} anchor="start" tone="dim">
          dp
        </Ink>
        {frame.dp.map((v, i) => (
          <Cell key={i} x={cx(i) - CELL / 2} y={DP_Y} w={CELL} tone={dpTone(i, v)} label={fmt(v)} sub={i} />
        ))}
        {x !== undefined && src !== undefined && srcInTable && src !== x && (
          <Edge x1={cx(src)} y1={DP_Y - 4} x2={cx(x)} y2={DP_Y - 4} bend={src < x ? -34 : 34} arrow />
        )}
      </Sketch>
    </AlgoVizFrame>
  );
}
