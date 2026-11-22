import { AlgoVizFrame } from "./AlgoVizFrame";
import { Cell, Edge, Ink, Sketch, type Tone } from "./paper";
import { useViz, type NonEmpty, type Scenario } from "./useViz";

interface Item {
  wt: number;
  val: number;
}

interface Input {
  items: Item[];
  capacity: number;
}

interface Frame {
  /** Index of the item being placed; -1 = none yet, items.length = all placed. */
  item: number;
  /** dp cell being written. */
  w?: number;
  /** dp cell being read: w - wt. Past the end of dp when the weight is negative. */
  src?: number;
  dp: number[];
  note: string;
  done?: boolean;
}

const SCENARIOS: NonEmpty<Scenario<Input>> = [
  {
    id: "normal",
    label: "3 items, W = 8",
    input: { items: [{ wt: 3, val: 4 }, { wt: 4, val: 5 }, { wt: 5, val: 6 }], capacity: 8 },
  },
  {
    id: "too-heavy",
    label: "one item too heavy",
    input: { items: [{ wt: 2, val: 3 }, { wt: 9, val: 20 }, { wt: 3, val: 4 }], capacity: 5 },
  },
  {
    id: "negative-weight",
    label: "negative weight",
    malformed: true,
    input: { items: [{ wt: 3, val: 4 }, { wt: -2, val: 5 }, { wt: 4, val: 6 }], capacity: 6 },
  },
];

function buildFrames({ items, capacity }: Input): NonEmpty<Frame> {
  if (capacity < 0) {
    return [{ item: -1, dp: [], note: `Capacity ${capacity} is negative, so dp[0..W] cannot be built. Nothing fits: real code should return 0 or reject the input.` }];
  }
  const dp = Array.from({ length: capacity + 1 }, () => 0);
  const snap = () => [...dp];
  const out: NonEmpty<Frame> = [
    { item: -1, dp: snap(), note: `dp[w] = best value with total weight at most w. No items yet, so dp[0..${capacity}] = 0.` },
  ];

  // dp[w - wt] is only a valid, already-solved cell when wt >= 0.
  const bad = items.findIndex((it) => it.wt < 0);
  if (bad >= 0) {
    const { wt } = items[bad];
    const src = capacity - wt;
    out.push({ item: bad, dp: snap(), note: `Precondition broken: item ${bad + 1} has weight ${wt}. Weights must be 0 or more.` });
    out.push({
      item: bad,
      w: capacity,
      src,
      dp: snap(),
      note: `dp[${capacity}] would read dp[${capacity} - (${wt})] = dp[${src}], past the end of dp[0..${capacity}]. The loop bound w >= ${wt} then runs into negative indexes.`,
    });
    out.push({
      item: bad,
      w: capacity,
      src,
      dp: snap(),
      note: "No answer. Real code should validate the weights first and reject the input instead of indexing out of bounds.",
    });
    return out;
  }

  items.forEach(({ wt, val }, i) => {
    out.push({
      item: i,
      dp: snap(),
      note:
        wt > capacity
          ? `Item ${i + 1} weighs ${wt}, more than capacity ${capacity}. It never fits, so skip it.`
          : `Item ${i + 1} (wt ${wt}, val ${val}): sweep w from ${capacity} down to ${wt}. Right to left, so dp[w - ${wt}] has not used this item yet.`,
    });
    for (let w = capacity; w >= wt; w -= 1) {
      const skip = dp[w];
      const rest = dp[w - wt];
      dp[w] = Math.max(skip, rest + val);
      out.push({
        item: i,
        w,
        src: w - wt,
        dp: snap(),
        note: `dp[${w}] = max(dp[${w}], dp[${w - wt}] + ${val}) = max(${skip}, ${rest} + ${val}) = ${dp[w]}. ${rest + val > skip ? "Take" : "Skip"} item ${i + 1}.`,
      });
    }
  });
  out.push({
    item: items.length,
    w: capacity,
    dp: snap(),
    done: true,
    note: `Done: dp[${capacity}] = ${dp[capacity]} is the best value that fits in capacity ${capacity}.`,
  });
  return out;
}

const CELL = 48;
const GAP = 8;
const PAD = 24;
const LABEL = 56;
const ITEM_W = 112;
const ITEM_Y = 16;
const DP_Y = 136;

export function Knapsack01() {
  const { input, frame, controls } = useViz(SCENARIOS, buildFrames, 1000);
  const { items, capacity } = input;
  // A negative weight reads past the end of dp; leave room to draw that slot.
  const slots = Math.max(0, capacity + 1) + Math.max(0, ...items.map((it) => -it.wt));
  const cx = (w: number) => PAD + LABEL + w * (CELL + GAP) + CELL / 2;
  const { w, src } = frame;

  const itemTone = (i: number): Tone => (i === frame.item ? "active" : i < frame.item ? "dim" : "idle");
  const dpTone = (i: number): Tone => {
    if (i === w) return frame.done ? "done" : "active";
    return i === src ? "done" : "idle";
  };

  return (
    <AlgoVizFrame
      title="0/1 knapsack: one dp row"
      subtitle={`capacity W = ${capacity}; each item used at most once`}
      caption={frame.note}
      {...controls}
    >
      <Sketch
        width={PAD * 2 + LABEL + Math.max(items.length * (ITEM_W + GAP), slots * (CELL + GAP)) - GAP}
        height={DP_Y + CELL + 36}
        label={`Knapsack dp row for capacity ${capacity} and ${items.length} items`}
      >
        <Ink x={PAD} y={ITEM_Y + 20} anchor="start" tone="dim">
          items
        </Ink>
        {items.map(({ wt, val }, i) => (
          <Cell
            key={i}
            x={PAD + LABEL + i * (ITEM_W + GAP)}
            y={ITEM_Y}
            w={ITEM_W}
            h={40}
            size={16}
            tone={itemTone(i)}
            label={`wt ${wt} · val ${val}`}
            sub={`item ${i + 1}`}
          />
        ))}

        <Ink x={PAD} y={DP_Y + CELL / 2} anchor="start" tone="dim">
          dp
        </Ink>
        {frame.dp.map((v, i) => (
          <Cell key={i} x={cx(i) - CELL / 2} y={DP_Y} w={CELL} tone={dpTone(i)} label={v} sub={i} />
        ))}
        {/* Slots past the end of dp, up to the one a negative weight reads. */}
        {Array.from({ length: Math.max(0, (src ?? 0) - capacity) }, (_, k) => capacity + 1 + k).map((i) => (
          <Cell key={i} x={cx(i) - CELL / 2} y={DP_Y} w={CELL} tone="dim" label="?" sub={i} />
        ))}
        {w !== undefined && src !== undefined && src !== w && (
          <Edge
            x1={cx(src)}
            y1={DP_Y - 4}
            x2={cx(w)}
            y2={DP_Y - 4}
            bend={src < w ? -34 : 34}
            tone={src > capacity ? "dim" : "idle"}
            arrow
          />
        )}
      </Sketch>
    </AlgoVizFrame>
  );
}
