import { AlgoVizFrame } from "./AlgoVizFrame";
import { useFrames } from "./useFrames";

const STREAM = [5, 1, 9, 3, 7, 6, 8];
const K = 3;

interface Frame {
  idx: number; // index into STREAM being processed, -1 = none
  heap: number[]; // real binary-heap array — parent (i-1)//2, children 2i+1 / 2i+2
  hot: number[]; // heap indices involved in the current op (swap / insert / root)
  popped: number | null;
  note: string;
  done?: boolean;
}

// Real heapq semantics: push appends + sifts up, pop moves the last
// element to the root + sifts down. One frame per swap, so the bubble
// is visible in the tree.
const frames: Frame[] = (() => {
  const out: Frame[] = [];
  const heap: number[] = [];
  const snap = () => [...heap];
  let idx = -1;
  let popped: number | null = null;
  const emit = (hot: number[], note: string) =>
    out.push({ idx, heap: snap(), hot, popped, note });

  const push = (v: number) => {
    heap.push(v);
    let i = heap.length - 1;
    emit([i], `push ${v} — append at the bottom`);
    while (i > 0) {
      const p = (i - 1) >> 1;
      if (heap[i] >= heap[p]) break;
      [heap[i], heap[p]] = [heap[p], heap[i]];
      emit([i, p], `${heap[p]} < parent ${heap[i]} → sift up (swap)`);
      i = p;
    }
  };

  const pop = () => {
    const min = heap[0];
    const last = heap.pop()!;
    popped = min;
    if (heap.length > 0) {
      heap[0] = last;
      emit([0], `size > ${K} → pop min ${min}; move last (${last}) to root`);
      let i = 0;
      for (;;) {
        const l = 2 * i + 1;
        const r = 2 * i + 2;
        let s = i;
        if (l < heap.length && heap[l] < heap[s]) s = l;
        if (r < heap.length && heap[r] < heap[s]) s = r;
        if (s === i) break;
        [heap[i], heap[s]] = [heap[s], heap[i]];
        emit([i, s], `${heap[s]} > child ${heap[i]} → sift down (swap)`);
        i = s;
      }
    }
    popped = null;
  };

  out.push({ idx, heap: [], hot: [], popped: null, note: `min-heap of size K=${K} — stream the array in` });
  for (idx = 0; idx < STREAM.length; idx += 1) {
    push(STREAM[idx]);
    if (heap.length > K) pop();
  }
  out.push({
    idx: STREAM.length - 1,
    heap: snap(),
    hot: [],
    popped: null,
    done: true,
    note: `done — heap holds the ${K} largest; root heap[0] = ${heap[0]} is the ${K}rd largest`,
  });
  return out;
})();

// tree layout by heap index (up to 4 slots live during push-then-pop)
const TREE_POS: { x: number; y: number }[] = [
  { x: 290, y: 150 }, // 0 — root
  { x: 200, y: 240 }, // 1
  { x: 380, y: 240 }, // 2
  { x: 155, y: 320 }, // 3 (transient before the pop)
];

export function HeapTopK() {
  const { step, frame, running, playToggle, stepBy, reset } = useFrames(frames, 1100);

  return (
    <AlgoVizFrame
      title={`Top-K elements — min-heap of size ${K}`}
      subtitle="push sifts up, over-capacity pop sifts down"
      step={step}
      stepCount={frames.length}
      running={running}
      onPlayToggle={playToggle}
      onStep={stepBy}
      onReset={reset}
      caption={frame.note}
    >
      <svg viewBox="0 0 560 360" className="w-full">
        {/* stream row */}
        <text x={20} y={30} fill="#64748b" fontSize={11} fontFamily="JetBrains Mono, monospace">
          stream:
        </text>
        {STREAM.map((v, i) => {
          const isCur = frame.idx === i;
          const consumed = frame.idx >= i;
          return (
            <g key={i}>
              <rect
                x={90 + i * 52}
                y={14}
                width={44}
                height={34}
                rx={7}
                fill={isCur ? "#06b6d4" : "#1e2030"}
                stroke={isCur ? "#22d3ee" : "rgba(255,255,255,0.08)"}
                style={{ transition: "fill 300ms" }}
                opacity={consumed && !isCur ? 0.35 : 1}
              />
              <text
                x={90 + i * 52 + 22}
                y={36}
                textAnchor="middle"
                fill="#f1f5f9"
                fontSize={14}
                fontFamily="JetBrains Mono, monospace"
                opacity={consumed && !isCur ? 0.35 : 1}
              >
                {v}
              </text>
            </g>
          );
        })}

        {/* heap edges — parent (i-1)>>1 → i */}
        {frame.heap.map((_, i) => {
          if (i === 0) return null;
          const p = (i - 1) >> 1;
          return (
            <line
              key={`e-${i}`}
              x1={TREE_POS[p].x}
              y1={TREE_POS[p].y}
              x2={TREE_POS[i].x}
              y2={TREE_POS[i].y}
              stroke="rgba(255,255,255,0.15)"
              strokeWidth={1.5}
            />
          );
        })}
        {/* heap nodes */}
        {frame.heap.map((v, i) => {
          const hot = frame.hot.includes(i);
          const isRoot = i === 0;
          const fill = frame.done ? "#10b981" : hot ? "#06b6d4" : isRoot ? "#0d9e6e" : "#1e2030";
          const stroke = frame.done ? "#34d399" : hot ? "#22d3ee" : isRoot ? "#34d399" : "rgba(255,255,255,0.12)";
          return (
            <g key={`n-${i}`} style={{ transition: "all 300ms" }}>
              <circle
                cx={TREE_POS[i].x}
                cy={TREE_POS[i].y}
                r={24}
                fill={fill}
                stroke={stroke}
                strokeWidth={2}
                style={{ transition: "fill 300ms, stroke 300ms" }}
              />
              <text
                x={TREE_POS[i].x}
                y={TREE_POS[i].y + 5}
                textAnchor="middle"
                fill="#f1f5f9"
                fontSize={15}
                fontFamily="JetBrains Mono, monospace"
                fontWeight={600}
              >
                {v}
              </text>
              {isRoot && (
                <text
                  x={TREE_POS[i].x}
                  y={TREE_POS[i].y - 34}
                  textAnchor="middle"
                  fill="#34d399"
                  fontSize={10}
                  fontFamily="JetBrains Mono, monospace"
                >
                  min (root)
                </text>
              )}
            </g>
          );
        })}

        {/* popped indicator */}
        {frame.popped !== null && (
          <g>
            <circle cx={490} cy={240} r={24} fill="#1e2030" stroke="#f87171" strokeWidth={2} opacity={0.85} />
            <text x={490} y={245} textAnchor="middle" fill="#f87171" fontSize={15} fontFamily="JetBrains Mono, monospace">
              {frame.popped}
            </text>
            <text x={490} y={282} textAnchor="middle" fill="#f87171" fontSize={10} fontFamily="JetBrains Mono, monospace">
              popped
            </text>
          </g>
        )}

        {/* array view of the same heap */}
        <text x={20} y={352} fill="#64748b" fontSize={11} fontFamily="JetBrains Mono, monospace">
          as array:
        </text>
        <text x={100} y={352} fill="#22d3ee" fontSize={12} fontFamily="JetBrains Mono, monospace">
          [{frame.heap.join(", ")}]
        </text>
      </svg>
    </AlgoVizFrame>
  );
}
