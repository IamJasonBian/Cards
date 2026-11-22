import { AlgoVizFrame } from "./AlgoVizFrame";
import { Cell, Edge, Ink, Pointer, Sketch, type Tone } from "./paper";
import { useViz, type NonEmpty, type Scenario } from "./useViz";

interface Input {
  /** Node values from head to tail. */
  values: number[];
  /** Index the tail links back to. Leave out for a proper list that ends in None. */
  cycleTo?: number;
}

interface Frame {
  /** Indices into values; -1 and values.length both stand for None. */
  prev: number;
  curr: number;
  /** null until the loop first assigns it. */
  nxt: number | null;
  /** Nodes 0..reversed-1 already point backward. */
  reversed: number;
  note: string;
  /** Node whose link was flipped in this step. */
  flipped?: number;
  done?: boolean;
  /** The tail links back into the list instead of ending in None. */
  cycle?: { from: number; to: number };
}

const SCENARIOS: NonEmpty<Scenario<Input>> = [
  { id: "four", label: "4 nodes", input: { values: [1, 2, 3, 4] } },
  { id: "empty", label: "empty list", input: { values: [] } },
  { id: "cycle", label: "list with a cycle", malformed: true, input: { values: [1, 2, 3, 4], cycleTo: 1 } },
];

function buildFrames({ values, cycleTo }: Input): NonEmpty<Frame> {
  const n = values.length;
  const name = (i: number) => (i >= 0 && i < n ? `node ${values[i]}` : "None");
  let prev = -1;
  let curr = 0;
  let nxt: number | null = null;

  if (cycleTo !== undefined && cycleTo >= 0 && cycleTo < n) {
    const cycle = { from: n - 1, to: cycleTo };
    const still = { prev, curr, nxt, reversed: 0, cycle };
    return [
      { ...still, note: `prev = None, curr = head (${name(0)}).` },
      {
        ...still,
        note: `Bad input: the tail (${name(n - 1)}) links back to ${name(cycleTo)}, so this list never reaches None.`,
      },
      {
        ...still,
        note: `The loop still ends: it re-enters at ${name(cycleTo)}, follows the links it already flipped back to the head, and returns ${name(0)}, the old head. Check for a cycle first (Floyd), or require a list that ends in None.`,
      },
    ];
  }

  const out: NonEmpty<Frame> = [
    {
      prev,
      curr,
      nxt,
      reversed: 0,
      note:
        n === 0
          ? `head is None, so curr starts at None. prev = None.`
          : `prev = None, curr = head (${name(0)}). Every link points forward.`,
    },
  ];
  while (curr < n) {
    nxt = curr + 1;
    out.push({
      prev,
      curr,
      nxt,
      reversed: curr,
      note: `Save nxt = curr.next (${name(nxt)}) before breaking the link, or the rest of the list is lost.`,
    });
    out.push({
      prev,
      curr,
      nxt,
      reversed: curr + 1,
      flipped: curr,
      note: `Point curr.next at prev: ${name(curr)} now points ${prev < 0 ? "at None, so it becomes the new tail" : `back at ${name(prev)}`}. The old forward link is cut.`,
    });
    prev = curr;
    curr = nxt;
    out.push({ prev, curr, nxt, reversed: curr, note: `Advance both: prev = ${name(prev)}, curr = ${name(curr)}.` });
  }
  out.push({
    prev,
    curr,
    nxt,
    reversed: n,
    done: true,
    note:
      n === 0
        ? `curr is None, so the loop never runs. Return prev, which is None: an empty list reversed is still empty.`
        : `curr is None, so the loop ends. Return prev (${name(prev)}), the new head: ${[...values].reverse().join(" → ")} → None.`,
  });
  return out;
}

const W = 60;
const H = 44;
const STEP = 110;
const PAD = 48;
const Y = 60;
const MID = Y + H / 2;

export function ReverseLinkedList() {
  const { input, frame, controls } = useViz(SCENARIOS, buildFrames, 1100);
  const { values } = input;
  const n = values.length;
  // Slot -1 is the None before the head, slot n the None after the tail.
  const x = (i: number) => PAD + (i + 1) * STEP;
  const { cycle } = frame;

  const tone = (i: number): Tone => {
    if (cycle) return i === cycle.from || i === cycle.to ? "active" : "idle";
    if (frame.done) return "done";
    if (i === frame.curr) return "active";
    return i < frame.reversed ? "done" : "idle";
  };

  return (
    <AlgoVizFrame
      title="Reverse a linked list"
      subtitle="walk once with prev, curr and nxt, turning each link around"
      caption={frame.note}
      {...controls}
    >
      <Sketch
        width={x(n) + PAD}
        height={170}
        label={`Linked list ${values.join(" to ")} being reversed with prev, curr and nxt pointers`}
      >
        <Ink x={x(-1)} y={MID} tone="dim">
          None
        </Ink>
        {!cycle && (
          <Ink x={x(n)} y={MID} tone="dim">
            None
          </Ink>
        )}
        {values.map((v, i) => {
          const turned = i < frame.reversed;
          return (
            <g key={i}>
              {/* Original link: a pen arrow until it is cut, then a dashed gray stub. */}
              {cycle?.from !== i && (
                <Edge
                  x1={x(i) + W / 2 + 4}
                  y1={MID + 7}
                  x2={x(i + 1) - W / 2 - 6}
                  y2={MID + 7}
                  tone={turned ? "dim" : "idle"}
                  arrow={!turned}
                />
              )}
              {turned && (
                <Edge
                  x1={x(i) - W / 2 - 4}
                  y1={MID - 7}
                  x2={x(i - 1) + W / 2 + 6}
                  y2={MID - 7}
                  bend={14}
                  tone={frame.flipped === i ? "active" : "idle"}
                  arrow
                />
              )}
              <Cell x={x(i) - W / 2} y={Y} w={W} h={H} tone={tone(i)} label={v} />
            </g>
          );
        })}
        {cycle && (
          <Edge x1={x(cycle.from)} y1={Y + H + 4} x2={x(cycle.to)} y2={Y + H + 6} bend={-44} tone="active" arrow />
        )}
        <Pointer x={x(frame.prev)} y={Y - 2} label="prev" />
        <Pointer x={x(frame.curr)} y={Y - 2} label="curr" />
        {frame.nxt !== null && <Pointer x={x(frame.nxt)} y={Y + H + 2} label="nxt" dir="up" />}
      </Sketch>
    </AlgoVizFrame>
  );
}
