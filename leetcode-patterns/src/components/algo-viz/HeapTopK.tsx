import { AlgoVizFrame } from "./AlgoVizFrame";
import { useFrames } from "./useFrames";

const STREAM = [5, 1, 9, 3, 7, 6, 8];
const K = 3;

interface Frame {
  idx: number; // index into STREAM being processed, -1 = none
  heap: number[]; // ascending — heap[0] is the min
  popped: number | null;
  note: string;
  done?: boolean;
}

const frames: Frame[] = (() => {
  const out: Frame[] = [];
  const heap: number[] = [];
  out.push({ idx: -1, heap: [], popped: null, note: `min-heap of size K=${K} — stream the array in` });
  STREAM.forEach((v, idx) => {
    heap.push(v);
    heap.sort((a, b) => a - b);
    out.push({ idx, heap: [...heap], popped: null, note: `push ${v}` });
    if (heap.length > K) {
      const popped = heap.shift()!;
      out.push({ idx, heap: [...heap], popped, note: `size > ${K} → pop min ${popped} (can't be top-${K})` });
    }
  });
  out.push({
    idx: STREAM.length - 1,
    heap: [...heap],
    popped: null,
    done: true,
    note: `done — heap holds the ${K} largest; heap[0] = ${heap[0]} is the ${K}rd largest`,
  });
  return out;
})();

const CELL = 56;

export function HeapTopK() {
  const { step, frame, running, playToggle, stepBy, reset } = useFrames(frames, 1000);

  return (
    <AlgoVizFrame
      title={`Top-K elements — min-heap of size ${K}`}
      subtitle={`every push over capacity evicts the smallest`}
      step={step}
      stepCount={frames.length}
      running={running}
      onPlayToggle={playToggle}
      onStep={stepBy}
      onReset={reset}
      caption={frame.note}
    >
      <svg viewBox={`0 0 ${40 + STREAM.length * CELL} 260`} className="w-full">
        <text x={20} y={40} fill="#64748b" fontSize={11} fontFamily="JetBrains Mono, monospace">
          stream:
        </text>
        {STREAM.map((v, i) => {
          const isCur = frame.idx === i;
          const consumed = frame.idx >= i;
          return (
            <g key={i}>
              <rect
                x={20 + i * CELL}
                y={50}
                width={CELL - 8}
                height={44}
                rx={8}
                fill={isCur ? "#06b6d4" : "#1e2030"}
                stroke={isCur ? "#22d3ee" : "rgba(255,255,255,0.08)"}
                style={{ transition: "fill 300ms" }}
                opacity={consumed && !isCur ? 0.35 : 1}
              />
              <text
                x={20 + i * CELL + (CELL - 8) / 2}
                y={77}
                textAnchor="middle"
                fill="#f1f5f9"
                fontSize={15}
                fontFamily="JetBrains Mono, monospace"
                opacity={consumed && !isCur ? 0.35 : 1}
              >
                {v}
              </text>
            </g>
          );
        })}
        <text x={20} y={150} fill="#64748b" fontSize={11} fontFamily="JetBrains Mono, monospace">
          heap (min first):
        </text>
        {frame.heap.map((v, i) => (
          <g key={`${v}-${i}`} style={{ transition: "all 300ms" }}>
            <rect
              x={20 + i * CELL}
              y={160}
              width={CELL - 8}
              height={44}
              rx={8}
              fill={frame.done ? "#10b981" : i === 0 ? "#0d9e6e" : "#1e2030"}
              stroke={frame.done || i === 0 ? "#34d399" : "rgba(255,255,255,0.12)"}
              strokeWidth={1.5}
              style={{ transition: "fill 300ms" }}
            />
            <text
              x={20 + i * CELL + (CELL - 8) / 2}
              y={187}
              textAnchor="middle"
              fill="#f1f5f9"
              fontSize={15}
              fontFamily="JetBrains Mono, monospace"
            >
              {v}
            </text>
            {i === 0 && !frame.done && (
              <text
                x={20 + i * CELL + (CELL - 8) / 2}
                y={222}
                textAnchor="middle"
                fill="#34d399"
                fontSize={10}
                fontFamily="JetBrains Mono, monospace"
              >
                min
              </text>
            )}
          </g>
        ))}
        {frame.popped !== null && (
          <g>
            <rect
              x={20 + (K + 1) * CELL + 30}
              y={160}
              width={CELL - 8}
              height={44}
              rx={8}
              fill="#1e2030"
              stroke="#f87171"
              strokeWidth={1.5}
              opacity={0.8}
            />
            <text
              x={20 + (K + 1) * CELL + 30 + (CELL - 8) / 2}
              y={187}
              textAnchor="middle"
              fill="#f87171"
              fontSize={15}
              fontFamily="JetBrains Mono, monospace"
            >
              {frame.popped}
            </text>
            <text
              x={20 + (K + 1) * CELL + 30 + (CELL - 8) / 2}
              y={222}
              textAnchor="middle"
              fill="#f87171"
              fontSize={10}
              fontFamily="JetBrains Mono, monospace"
            >
              popped
            </text>
          </g>
        )}
      </svg>
    </AlgoVizFrame>
  );
}
