import { AlgoVizFrame } from "./AlgoVizFrame";
import { Cell, Pointer, Sketch, type Tone } from "./paper";
import { useViz, type NonEmpty, type Scenario } from "./useViz";

interface Input {
  nums: number[];
  target: number;
}

interface Frame {
  l: number;
  r: number;
  note: string;
  found?: boolean;
  /** Index i where nums[i] > nums[i + 1]: the input is not sorted. */
  unsortedAt?: number;
}

const SCENARIOS: NonEmpty<Scenario<Input>> = [
  { id: "found", label: "pair exists", input: { nums: [1, 3, 4, 5, 7, 10, 11], target: 9 } },
  { id: "none", label: "no pair", input: { nums: [1, 2, 4, 8, 16], target: 11 } },
  {
    id: "unsorted",
    label: "unsorted input",
    malformed: true,
    input: { nums: [5, 1, 9, 3, 4], target: 4 },
  },
];

function buildFrames({ nums, target }: Input): NonEmpty<Frame> {
  let l = 0;
  let r = nums.length - 1;
  const out: NonEmpty<Frame> = [{ l, r, note: `target = ${target}. Start l at the left end, r at the right end.` }];

  // Moving a pointer only discards candidates safely when the array is sorted.
  const unsortedAt = nums.findIndex((n, i) => i + 1 < nums.length && n > nums[i + 1]);
  if (unsortedAt >= 0) {
    out.push({
      l,
      r,
      unsortedAt,
      note: `Precondition broken: ${nums[unsortedAt]} comes before ${nums[unsortedAt + 1]}, so the array is not sorted.`,
    });
    out.push({
      l,
      r,
      unsortedAt,
      note: `"sum too big → r--" assumes everything left of r is smaller. Here it is not, so real pairs get skipped. Sort first, or use a hash set.`,
    });
    return out;
  }

  while (l < r) {
    const sum = nums[l] + nums[r];
    if (sum === target) {
      out.push({ l, r, found: true, note: `${nums[l]} + ${nums[r]} = ${target} ✓ found` });
      return out;
    }
    if (sum < target) {
      out.push({ l, r, note: `${nums[l]} + ${nums[r]} = ${sum} < ${target} → need more, l++` });
      l += 1;
    } else {
      out.push({ l, r, note: `${nums[l]} + ${nums[r]} = ${sum} > ${target} → need less, r--` });
      r -= 1;
    }
  }
  out.push({ l, r, note: `l met r with no match → no pair sums to ${target}.` });
  return out;
}

const CELL = 56;
const GAP = 8;
const PAD = 24;

export function TwoPointers() {
  const { input, frame, controls } = useViz(SCENARIOS, buildFrames);
  const { nums } = input;
  const cx = (i: number) => PAD + i * (CELL + GAP) + CELL / 2;

  const tone = (i: number): Tone => {
    if (frame.unsortedAt !== undefined) {
      return i === frame.unsortedAt || i === frame.unsortedAt + 1 ? "active" : "dim";
    }
    if (i === frame.l || i === frame.r) return frame.found ? "done" : "active";
    return i < frame.l || i > frame.r ? "dim" : "idle";
  };

  return (
    <AlgoVizFrame
      title="Two pointers: sorted pair sum"
      subtitle={`find two numbers that add up to ${input.target}`}
      caption={frame.note}
      {...controls}
    >
      <Sketch
        width={PAD * 2 + nums.length * (CELL + GAP) - GAP}
        height={150}
        label={`Array ${nums.join(", ")} with a left and a right pointer`}
      >
        {nums.map((n, i) => (
          <Cell key={i} x={cx(i) - CELL / 2} y={58} w={CELL} tone={tone(i)} label={n} sub={i} />
        ))}
        <Pointer x={cx(frame.l)} y={56} label="l" />
        <Pointer x={cx(frame.r)} y={56} label="r" />
      </Sketch>
    </AlgoVizFrame>
  );
}
