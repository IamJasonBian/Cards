import { AlgoVizFrame } from "./AlgoVizFrame";
import { Edge, Node, Pointer, Sketch, type Tone } from "./paper";
import { useViz, type NonEmpty, type Scenario } from "./useViz";

interface Input {
  /** Node values from head to tail. */
  values: number[];
  /** Index the tail links back to, or -1 when the tail links to None. */
  pos: number;
}

interface Frame {
  /** Indices into values; values.length stands for None. */
  slow: number;
  fast: number;
  note: string;
  meet?: boolean;
}

const SCENARIOS: NonEmpty<Scenario<Input>> = [
  { id: "cycle", label: "has a cycle", input: { values: [1, 2, 3, 4, 5, 6, 7], pos: 2 } },
  { id: "none", label: "no cycle", input: { values: [1, 2, 3, 4, 5], pos: -1 } },
  { id: "bad-pos", label: "pos out of range", malformed: true, input: { values: [1, 2, 3, 4, 5, 6, 7], pos: 9 } },
];

const hasCycle = ({ values, pos }: Input) => pos >= 0 && pos < values.length;
const badPos = (input: Input) => input.pos !== -1 && !hasCycle(input);
/** The index after i. values.length means None (or the node a bad pos points at). */
const nextOf = (input: Input, i: number) =>
  i === input.values.length - 1 && hasCycle(input) ? input.pos : i + 1;

function buildFrames(input: Input): NonEmpty<Frame> {
  const { values, pos } = input;
  const n = values.length;
  const name = (i: number) => (i < n ? `node ${values[i]}` : "None");
  let slow = 0;
  let fast = 0;
  const out: NonEmpty<Frame> = [{ slow, fast, note: `slow and fast both start at the head, ${name(0)}.` }];

  if (badPos(input)) {
    out.push({
      slow,
      fast,
      note: `Bad input: pos = ${pos} says the tail links to index ${pos}, but ${
        n === 0 ? "the list is empty" : `the only indices are 0 to ${n - 1}`
      }.`,
    });
    out.push({
      slow,
      fast,
      note: `That link cannot be built, so there is no list to walk. Real code should reject the input (pos must be -1 or a valid index), not guess.`,
    });
    return out;
  }

  // while fast and fast.next: slow = slow.next; fast = fast.next.next
  while (fast < n && nextOf(input, fast) < n) {
    slow = nextOf(input, slow);
    fast = nextOf(input, nextOf(input, fast));
    out.push({
      slow,
      fast,
      note:
        fast < n
          ? `slow takes one step to ${values[slow]}. fast takes two steps to ${values[fast]}.`
          : `slow takes one step to ${values[slow]}. fast takes two steps and runs off the end.`,
    });
    if (slow === fast) {
      out.push({
        slow,
        fast,
        meet: true,
        note: `slow and fast are both on ${name(slow)}. They can only meet again if the list loops: cycle found, return True.`,
      });
      return out;
    }
  }
  out.push({
    slow,
    fast,
    note: `${fast < n ? "fast.next" : "fast"} is None. A list with a cycle never ends, so there is no cycle: return False.`,
  });
  return out;
}

const R = 22;
const STEP = 76;
const PAD = 30;
const MARGIN = 44;

/** The part before the cycle is a row; the cycle is a ring entered from the left. */
function layout(input: Input) {
  const n = input.values.length;
  const ring = hasCycle(input) ? n - input.pos : 0;
  const r = ring > 0 ? Math.max(40, (ring * STEP) / (2 * Math.PI)) : 0;
  const cy = MARGIN + R + r;
  const rowX = (i: number) => PAD + R + i * STEP;
  const at = (i: number) => {
    if (ring === 0 || i < input.pos) return { x: rowX(i), y: cy };
    const angle = Math.PI + ((i - input.pos) / ring) * 2 * Math.PI;
    return { x: rowX(input.pos) + r + r * Math.cos(angle), y: cy + r * Math.sin(angle) };
  };
  return { at, width: rowX(ring > 0 ? input.pos : n) + 2 * r + R + PAD, height: 2 * cy };
}

export function FloydsCycle() {
  const { input, frame, controls } = useViz(SCENARIOS, buildFrames, 1100);
  const { values, pos } = input;
  const n = values.length;
  const cyclic = hasCycle(input);
  const bad = badPos(input);
  const { at, width, height } = layout(input);
  const slow = at(frame.slow);
  const fast = at(frame.fast);

  const tone = (i: number): Tone => {
    if (bad) return i >= n - 1 ? "active" : "idle";
    if (frame.meet && i === frame.slow) return "done";
    if (i === frame.slow || i === frame.fast) return "active";
    return i === n ? "dim" : "idle";
  };

  return (
    <AlgoVizFrame
      title="Floyd's cycle detection"
      subtitle="slow moves 1 node per step, fast moves 2; inside a cycle fast must catch slow"
      caption={frame.note}
      {...controls}
    >
      <Sketch
        width={width}
        height={height}
        label={`Linked list ${values.join(" to ")}, ${
          cyclic ? `whose tail links back to index ${pos}` : "ending in None"
        }, with a slow and a fast pointer`}
      >
        {values.map((_, i) => {
          const a = at(i);
          const b = at(nextOf(input, i));
          return (
            <Edge
              key={i}
              x1={a.x}
              y1={a.y}
              x2={b.x}
              y2={b.y}
              trim={R + 3}
              arrow
              // Ring links bow outward so they read as a loop.
              bend={cyclic && i >= pos ? -10 : 0}
              tone={bad && i === n - 1 ? "active" : "idle"}
            />
          );
        })}
        {values.map((v, i) => (
          <Node key={i} {...at(i)} r={R} tone={tone(i)} label={v} />
        ))}
        {!cyclic && <Node {...at(n)} r={R} tone={tone(n)} label={bad ? "?" : "None"} />}
        <Pointer x={slow.x} y={slow.y - R - 2} label="slow" />
        <Pointer x={fast.x} y={fast.y + R + 2} label="fast" dir="up" />
      </Sketch>
    </AlgoVizFrame>
  );
}
