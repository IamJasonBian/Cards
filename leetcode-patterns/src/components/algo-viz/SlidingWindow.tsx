import { AlgoVizFrame } from "./AlgoVizFrame";
import { Cell, Ink, Pointer, Sketch, type Tone } from "./paper";
import { useViz, type NonEmpty, type Scenario } from "./useViz";

interface Input {
  s: string;
  k: number;
}

interface Frame {
  l: number;
  /** Right end of the window, inclusive. -1 until the window has a letter. */
  r: number;
  /** Letter counts inside the window. */
  count: Record<string, number>;
  best: number;
  note: string;
  /** The window shown is the final answer. */
  done?: boolean;
  /** k allows no letters at all. */
  badK?: boolean;
}

const SCENARIOS: NonEmpty<Scenario<Input>> = [
  { id: "shrink", label: "must shrink", input: { s: "eceba", k: 2 } },
  { id: "roomy", label: "k covers all", input: { s: "abcab", k: 3 } },
  { id: "zero-k", label: "k = 0", malformed: true, input: { s: "eceba", k: 0 } },
];

function buildFrames({ s, k }: Input): NonEmpty<Frame> {
  const count = new Map<string, number>();
  let l = 0;
  let best = 0;
  let bestL = 0;
  const snap = (r: number, note: string): Frame => ({
    l,
    r,
    count: Object.fromEntries(count),
    best,
    note,
  });
  const out: NonEmpty<Frame> = [
    snap(-1, `Grow the window with r. When it holds more than ${k} distinct letters, shrink it with l.`),
  ];

  // With k <= 0 every letter is evicted the moment it is added: l would run past r.
  if (k <= 0) {
    out.push({
      ...snap(-1, `Bad input: k = ${k}. A window with at most ${k} distinct letters cannot hold even one letter.`),
      badK: true,
    });
    out.push({
      ...snap(-1, `The loop would add each letter and drop it right away. Real code should return 0 up front, or reject a negative k.`),
      badK: true,
    });
    return out;
  }

  for (let r = 0; r < s.length; r += 1) {
    const c = s[r];
    count.set(c, (count.get(c) ?? 0) + 1);
    const seen = `Add '${c}'. Window "${s.slice(l, r + 1)}" has ${count.size} distinct`;
    if (count.size > k) {
      out.push(snap(r, `${seen}, more than k = ${k}. Shrink from the left.`));
    } else if (r - l + 1 > best) {
      best = r - l + 1;
      bestL = l;
      out.push(snap(r, `${seen}, which is allowed. New best length: ${best}.`));
    } else {
      out.push(snap(r, `${seen}, which is allowed. Best stays ${best}.`));
    }
    // A shrunk window is never longer than the valid one before it, so best cannot change here.
    while (count.size > k) {
      const lc = s[l];
      const left = (count.get(lc) ?? 0) - 1;
      if (left > 0) count.set(lc, left);
      else count.delete(lc);
      l += 1;
      out.push(
        snap(
          r,
          `Drop '${lc}', l = ${l}. Window "${s.slice(l, r + 1)}" has ${count.size} distinct, ${
            count.size > k ? "still too many." : "valid again."
          }`
        )
      );
    }
  }

  out.push({
    l: bestL,
    r: bestL + best - 1,
    count: {},
    best,
    done: true,
    note:
      best === 0
        ? `The string is empty, so there is no window. Answer = 0.`
        : `r reached the end. The longest valid window is "${s.slice(bestL, bestL + best)}". Answer = ${best}.`,
  });
  return out;
}

const CELL = 56;
const GAP = 8;
const PAD = 24;
const K_BOX = 68;

export function SlidingWindow() {
  const { input, frame, controls } = useViz(SCENARIOS, buildFrames);
  const letters = input.s.split("");
  const cx = (i: number) => PAD + i * (CELL + GAP) + CELL / 2;

  const tone = (i: number): Tone => {
    if (frame.badK) return "dim";
    const inWindow = i >= frame.l && i <= frame.r;
    if (frame.done) return inWindow ? "done" : "dim";
    if (inWindow) return "active";
    return i < frame.l ? "dim" : "idle";
  };

  const counts = Object.entries(frame.count)
    .map(([c, n]) => `${c}:${n}`)
    .join("  ");

  return (
    <AlgoVizFrame
      title="Sliding window: longest substring with at most k distinct"
      subtitle={`s = "${input.s}", k = ${input.k}`}
      caption={frame.note}
      {...controls}
    >
      <Sketch
        // At least five cells wide so the status line under the array always fits.
        width={PAD * 2 + Math.max(letters.length, 5) * (CELL + GAP) - GAP}
        height={190}
        label={`String ${input.s} with a window between a left and a right pointer`}
      >
        {letters.map((c, i) => (
          <Cell key={i} x={cx(i) - CELL / 2} y={58} w={CELL} tone={tone(i)} label={c} sub={i} />
        ))}
        {/* l and r often share a cell, so each takes one half of it. */}
        {letters.length > 0 && <Pointer x={cx(frame.l) - 12} y={56} label="l" />}
        {frame.r >= 0 && <Pointer x={cx(frame.r) + 12} y={56} label="r" />}
        <Cell
          x={PAD}
          y={146}
          w={K_BOX}
          h={30}
          size={16}
          tone={frame.badK ? "active" : "idle"}
          label={`k = ${input.k}`}
        />
        <Ink x={PAD + K_BOX + 14} y={161} anchor="start">
          {frame.done ? `best = ${frame.best}` : `window ${counts || "empty"}, best = ${frame.best}`}
        </Ink>
      </Sketch>
    </AlgoVizFrame>
  );
}
