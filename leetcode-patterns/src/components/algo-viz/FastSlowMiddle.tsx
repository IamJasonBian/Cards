import { AlgoVizFrame } from "./AlgoVizFrame";
import { Edge, Node, Pointer, Sketch, type Tone } from "./paper";
import { useViz, type NonEmpty, type Scenario } from "./useViz";

interface Input {
  /** Node values from head to tail; an empty array is head = None. */
  values: number[];
}

interface Frame {
  /** Indices into values; values.length stands for None. */
  slow: number;
  fast: number;
  note: string;
  done?: boolean;
}

const SCENARIOS: NonEmpty<Scenario<Input>> = [
  { id: "odd", label: "odd length", input: { values: [1, 2, 3, 4, 5, 6, 7] } },
  { id: "even", label: "even length", input: { values: [1, 2, 3, 4, 5, 6] } },
  { id: "empty", label: "empty list", malformed: true, input: { values: [] } },
];

function buildFrames({ values }: Input): NonEmpty<Frame> {
  const n = values.length;
  if (n === 0) {
    return [
      { slow: 0, fast: 0, note: `head is None: the list has no nodes, so slow and fast both start at None.` },
      { slow: 0, fast: 0, note: `"while fast and fast.next" is false right away, so the loop never touches a missing node.` },
      {
        slow: 0,
        fast: 0,
        done: true,
        note: `There is no middle. Return None, and make the caller check for it before reading .val.`,
      },
    ];
  }

  let slow = 0;
  let fast = 0;
  const out: NonEmpty<Frame> = [{ slow, fast, note: `slow and fast both start at the head, node ${values[0]}.` }];
  // while fast and fast.next: slow = slow.next; fast = fast.next.next
  while (fast < n && fast + 1 < n) {
    slow += 1;
    fast += 2;
    out.push({
      slow,
      fast,
      note:
        fast < n
          ? `slow takes one step to ${values[slow]}. fast takes two steps to ${values[fast]}.`
          : `slow takes one step to ${values[slow]}. fast takes two steps and runs off the end.`,
    });
  }
  out.push({
    slow,
    fast,
    done: true,
    note:
      fast < n
        ? `fast.next is None, so stop. slow is on node ${values[slow]}, the middle.`
        : `fast is None, so stop. slow is on node ${values[slow]}, the second of the two middle nodes.`,
  });
  return out;
}

const R = 22;
const STEP = 76;
const PAD = 30;
const Y = 78;

export function FastSlowMiddle() {
  const { input, frame, controls } = useViz(SCENARIOS, buildFrames, 1100);
  const { values } = input;
  const n = values.length;
  // Slot n is the None after the tail.
  const x = (i: number) => PAD + R + i * STEP;

  const tone = (i: number): Tone => {
    if (frame.done && i === frame.slow && i < n) return "done";
    if (i === frame.slow || i === frame.fast) return "active";
    return i === n ? "dim" : "idle";
  };

  return (
    <AlgoVizFrame
      title="Middle of a linked list"
      subtitle="slow moves 1 node per step, fast moves 2; when fast runs out, slow is halfway"
      caption={frame.note}
      {...controls}
    >
      <Sketch
        width={x(n) + R + PAD}
        height={Y * 2}
        label={`Linked list ${values.join(" to ")} ending in None, with a slow and a fast pointer`}
      >
        {values.map((_, i) => (
          <Edge key={i} x1={x(i)} y1={Y} x2={x(i + 1)} y2={Y} trim={R + 3} arrow />
        ))}
        {values.map((v, i) => (
          <Node key={i} x={x(i)} y={Y} r={R} tone={tone(i)} label={v} />
        ))}
        <Node x={x(n)} y={Y} r={R} tone={tone(n)} label="None" />
        <Pointer x={x(frame.slow)} y={Y - R - 2} label="slow" />
        <Pointer x={x(frame.fast)} y={Y + R + 2} label="fast" dir="up" />
      </Sketch>
    </AlgoVizFrame>
  );
}
