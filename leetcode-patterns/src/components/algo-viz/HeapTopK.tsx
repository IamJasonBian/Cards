import { AlgoVizFrame } from "./AlgoVizFrame";
import { Cell, Edge, Ink, Node, Sketch, type Tone } from "./paper";
import { useViz, type NonEmpty, type Scenario } from "./useViz";

interface Input {
  stream: number[];
  k: number;
}

interface Frame {
  /** Index into the stream being processed: -1 before the start, stream.length once it is used up. */
  idx: number;
  /** A real binary-heap array: parent of i is (i - 1) >> 1, children are 2i + 1 and 2i + 2. */
  heap: number[];
  /** Heap indices touched by this step. */
  hot: number[];
  popped: number | null;
  note: string;
  done?: boolean;
  /** k does not fit the stream, so the root is not a valid answer. */
  bad?: boolean;
}

const SCENARIOS: NonEmpty<Scenario<Input>> = [
  { id: "k3", label: "k = 3", input: { stream: [5, 1, 9, 3, 7, 6, 8], k: 3 } },
  { id: "k1", label: "k = 1 (the max)", input: { stream: [3, 8, 2, 9, 4], k: 1 } },
  { id: "big-k", label: "k > n", malformed: true, input: { stream: [5, 1, 9], k: 5 } },
];

// Real heapq semantics: push appends and sifts up, pop moves the last element
// to the root and sifts down. One frame per swap, so the bubbling is visible.
function buildFrames({ stream, k }: Input): NonEmpty<Frame> {
  const n = stream.length;
  const valid = k >= 1 && k <= n;
  const heap: number[] = [];
  let idx = -1;
  let popped: number | null = null;
  const snap = (hot: number[], note: string, extra: Partial<Frame> = {}): Frame => ({
    idx,
    heap: [...heap],
    hot,
    popped,
    note,
    ...extra,
  });

  const out: NonEmpty<Frame> = [
    snap([], `Keep a min-heap of at most k = ${k} values. Its root is always the smallest value kept.`),
  ];
  if (!valid) {
    out.push(snap([], `Precondition broken: k = ${k}, but the stream has ${n} values. k must be between 1 and ${n}. Watch what the usual loop does anyway.`, { bad: true }));
  }

  const push = (v: number) => {
    heap.push(v);
    let i = heap.length - 1;
    out.push(snap([i], `Push ${v}: append it at the bottom of the heap.`));
    while (i > 0) {
      const p = (i - 1) >> 1;
      if (heap[i] >= heap[p]) break;
      [heap[i], heap[p]] = [heap[p], heap[i]];
      out.push(snap([i, p], `${heap[p]} is smaller than its parent ${heap[i]}, so swap them (sift up).`));
      i = p;
    }
  };

  const pop = () => {
    const min = heap[0];
    const last = heap.pop();
    if (last === undefined) return;
    popped = min;
    if (heap.length === 0) {
      out.push(snap([], `Size is over k = ${k}: pop the min ${min}. The heap is empty again.`));
    } else {
      heap[0] = last;
      out.push(snap([0], `Size is over k = ${k}: pop the min ${min}, which cannot be in the top ${k}. Move the last value ${last} to the root.`));
    }
    let i = 0;
    for (;;) {
      const l = 2 * i + 1;
      const r = 2 * i + 2;
      let s = i;
      if (l < heap.length && heap[l] < heap[s]) s = l;
      if (r < heap.length && heap[r] < heap[s]) s = r;
      if (s === i) break;
      [heap[i], heap[s]] = [heap[s], heap[i]];
      out.push(snap([i, s], `${heap[s]} is larger than its child ${heap[i]}, so swap them (sift down).`));
      i = s;
    }
    popped = null;
  };

  for (idx = 0; idx < n; idx += 1) {
    push(stream[idx]);
    if (heap.length > k) pop();
  }

  if (valid) {
    const kept = [...heap].sort((a, b) => a - b).join(", ");
    out.push(
      snap([], `Done. The heap holds the top ${k} (${kept}). Its root ${heap[0]} is the smallest of them, so ${heap[0]} is the answer for k = ${k}.`, {
        done: true,
      })
    );
  } else if (heap.length === 0) {
    out.push(snap([], `The stream is used up and the heap is empty, so heap[0] is out of range.`, { bad: true }));
  } else {
    out.push(snap([0], `The stream is used up with only ${heap.length} values in a heap meant to hold ${k}. It never popped once.`, { bad: true }));
    out.push(
      snap([0], `heap[0] = ${heap[0]} is just the overall minimum. You cannot take the ${k} largest of ${n} values, yet the code would return it without complaint.`, {
        bad: true,
      })
    );
  }
  if (!valid) {
    out.push(snap(heap.length > 0 ? [0] : [], `Real code should check 1 <= k <= len(nums) before the loop and raise an error (or return None) when it fails.`, { bad: true }));
  }
  return out;
}

const W = 560;
const R = 22;
const STREAM_X = 96;
const ARRAY_Y = 336;

/** Tree position of heap index i: level by level, evenly spread. */
const slot = (i: number) => {
  const depth = Math.floor(Math.log2(i + 1));
  const inLevel = i + 1 - 2 ** depth;
  return { x: (W * (inLevel + 0.5)) / 2 ** depth, y: 112 + depth * 78 };
};

export function HeapTopK() {
  const { input, frame, controls } = useViz(SCENARIOS, buildFrames, 1100);
  const { stream, k } = input;

  const streamTone = (i: number): Tone => (i === frame.idx ? "active" : i < frame.idx ? "dim" : "idle");
  const heapTone = (i: number): Tone => {
    if (frame.hot.includes(i)) return "active";
    return frame.done ? "done" : "idle";
  };

  return (
    <AlgoVizFrame
      title={`Top K elements: min-heap of size ${k}`}
      subtitle="push sifts up, an over-capacity pop sifts down"
      caption={frame.note}
      {...controls}
    >
      <Sketch
        width={W}
        height={400}
        label={`Stream ${stream.join(", ")} feeding a min-heap capped at ${k} values, drawn as a tree and as an array`}
      >
        <Ink x={20} y={31} anchor="start">
          stream
        </Ink>
        {stream.map((v, i) => (
          <Cell key={i} x={STREAM_X + i * 52} y={14} w={44} h={34} tone={streamTone(i)} label={v} />
        ))}
        <Ink x={W - 20} y={31} anchor="end" tone={frame.bad ? "idle" : "dim"} bold={frame.bad}>
          k = {k}
        </Ink>

        {frame.heap.map((_, i) => {
          if (i === 0) return null;
          const p = (i - 1) >> 1;
          const swapped = frame.hot.includes(i) && frame.hot.includes(p);
          return (
            <Edge key={i} x1={slot(p).x} y1={slot(p).y} x2={slot(i).x} y2={slot(i).y} trim={R} tone={swapped ? "active" : "idle"} />
          );
        })}
        {frame.heap.map((v, i) => (
          <Node key={i} x={slot(i).x} y={slot(i).y} r={R} tone={heapTone(i)} label={v} />
        ))}
        {frame.heap.length > 0 && (
          <Ink x={slot(0).x} y={slot(0).y - R - 14} size={13} tone="dim">
            min (root)
          </Ink>
        )}
        {frame.popped !== null && <Node x={W - 50} y={slot(0).y} r={R} tone="dim" label={frame.popped} sub="popped" />}

        <Ink x={20} y={ARRAY_Y + 18} anchor="start">
          heap[]
        </Ink>
        {frame.heap.map((v, i) => (
          <Cell key={i} x={STREAM_X + i * 44} y={ARRAY_Y} w={36} tone={heapTone(i)} label={v} sub={i} />
        ))}
        {frame.heap.length === 0 && (
          <Ink x={STREAM_X} y={ARRAY_Y + 18} anchor="start" tone="dim">
            empty
          </Ink>
        )}
      </Sketch>
    </AlgoVizFrame>
  );
}
