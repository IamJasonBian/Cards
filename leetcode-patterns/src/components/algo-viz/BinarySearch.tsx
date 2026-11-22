import { AlgoVizFrame } from "./AlgoVizFrame";
import { Cell, Pointer, Sketch, type Tone } from "./paper";
import { useViz, type NonEmpty, type Scenario } from "./useViz";

interface Input {
  nums: number[];
  target: number;
}

interface Frame {
  lo: number;
  hi: number;
  /** Last index probed; null before the first probe. */
  mid: number | null;
  note: string;
  found?: boolean;
  /** Cells that show what is wrong with the input. */
  flagged?: number[];
}

const SCENARIOS: NonEmpty<Scenario<Input>> = [
  { id: "found", label: "target present", input: { nums: [2, 5, 8, 12, 16, 23, 38, 45, 56, 72, 91], target: 23 } },
  { id: "missing", label: "target missing", input: { nums: [2, 5, 8, 12, 16, 23, 38, 45, 56, 72, 91], target: 40 } },
  {
    id: "unsorted",
    label: "unsorted input",
    malformed: true,
    input: { nums: [2, 5, 8, 23, 16, 12, 38, 45, 56, 72, 91], target: 23 },
  },
];

const UNSORTED_FIX = "Throwing away half the array is only safe when it is sorted. Sort first, or scan linearly.";

function buildFrames({ nums, target }: Input): NonEmpty<Frame> {
  let lo = 0;
  let hi = nums.length - 1;
  let mid: number | null = null;
  const out: NonEmpty<Frame> = [
    { lo, hi, mid, note: `target = ${target}. lo = ${lo} and hi = ${hi} bracket the whole array.` },
  ];

  // The search still runs on unsorted input (real code would not notice), so show where it goes wrong.
  const unsortedAt = nums.findIndex((n, i) => i + 1 < nums.length && n > nums[i + 1]);
  const unsorted = unsortedAt >= 0;
  if (unsorted) {
    out.push({
      lo,
      hi,
      mid,
      flagged: [unsortedAt, unsortedAt + 1],
      note: `Precondition broken: ${nums[unsortedAt]} comes before ${nums[unsortedAt + 1]}, so the array is not sorted. Watch the search run anyway.`,
    });
  }

  while (lo <= hi) {
    mid = Math.floor((lo + hi) / 2);
    const v = nums[mid];
    out.push({ lo, hi, mid, note: `mid = (${lo} + ${hi}) // 2 = ${mid}. Compare nums[${mid}] = ${v} with ${target}.` });
    if (v === target) {
      out.push({
        lo,
        hi,
        mid,
        found: true,
        note: unsorted
          ? `Found at index ${mid}, but only by luck. ${UNSORTED_FIX}`
          : `${v} = ${target} ✓ found at index ${mid}.`,
      });
      return out;
    }
    if (v < target) {
      lo = mid + 1;
      out.push({ lo, hi, mid, note: `${v} < ${target}, so the target can only be to the right: lo = mid + 1 = ${lo}.` });
    } else {
      hi = mid - 1;
      out.push({ lo, hi, mid, note: `${v} > ${target}, so the target can only be to the left: hi = mid - 1 = ${hi}.` });
    }
  }

  const missedAt = nums.indexOf(target);
  if (unsorted && missedAt >= 0) {
    out.push({
      lo,
      hi,
      mid,
      flagged: [missedAt],
      note: `The search says "not found", yet ${target} sits at index ${missedAt}. ${UNSORTED_FIX}`,
    });
  } else if (unsorted) {
    out.push({ lo, hi, mid, note: `The search says "not found", but that answer cannot be trusted here. ${UNSORTED_FIX}` });
  } else {
    out.push({ lo, hi, mid, note: `lo (${lo}) passed hi (${hi}): the range is empty, so ${target} is not in the array. Return -1.` });
  }
  return out;
}

const CELL = 56;
const GAP = 8;
// Wide enough that lo and hi stay on the paper when they cross past either end.
const PAD = 60;

export function BinarySearch() {
  const { input, frame, controls } = useViz(SCENARIOS, buildFrames);
  const { nums } = input;
  const cx = (i: number) => PAD + i * (CELL + GAP) + CELL / 2;

  const tone = (i: number): Tone => {
    if (frame.flagged) return frame.flagged.includes(i) ? "active" : "dim";
    if (frame.found && i === frame.mid) return "done";
    if (i < frame.lo || i > frame.hi) return "dim";
    return i === frame.mid ? "active" : "idle";
  };

  return (
    <AlgoVizFrame
      title="Binary search"
      subtitle={`find ${input.target} in a sorted array by halving the range`}
      caption={frame.note}
      {...controls}
    >
      <Sketch
        width={PAD * 2 + nums.length * (CELL + GAP) - GAP}
        height={190}
        label={`Array ${nums.join(", ")} with lo, hi and mid pointers`}
      >
        {nums.map((n, i) => (
          <Cell key={i} x={cx(i) - CELL / 2} y={58} w={CELL} tone={tone(i)} label={n} sub={i} />
        ))}
        {/* lo and hi can share a cell, so each takes one half of it; mid points from below. */}
        <Pointer x={cx(frame.lo) - 14} y={56} label="lo" />
        <Pointer x={cx(frame.hi) + 14} y={56} label="hi" />
        {frame.mid !== null && <Pointer x={cx(frame.mid)} y={138} label="mid" dir="up" />}
      </Sketch>
    </AlgoVizFrame>
  );
}
