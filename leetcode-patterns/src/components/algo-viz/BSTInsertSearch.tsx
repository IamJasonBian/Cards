import { AlgoVizFrame } from "./AlgoVizFrame";
import { useFrames } from "./useFrames";

//         8
//       /   \
//      3     10
//     / \      \
//    1   6      14
// insert(7) walks 8 → 3 → 6 → new right leaf
// search(14) walks 8 → 10 → 14
interface Node {
  id: number;
  val: number;
  x: number;
  y: number;
  parent: number | null;
}

const NODES: Node[] = [
  { id: 0, val: 8, x: 300, y: 50, parent: null },
  { id: 1, val: 3, x: 180, y: 130, parent: 0 },
  { id: 2, val: 10, x: 420, y: 130, parent: 0 },
  { id: 3, val: 1, x: 110, y: 210, parent: 1 },
  { id: 4, val: 6, x: 250, y: 210, parent: 1 },
  { id: 5, val: 14, x: 490, y: 210, parent: 2 },
];

const INSERTED: Node = { id: 6, val: 7, x: 300, y: 290, parent: 4 };

interface Frame {
  cur: number | null;
  inserted: boolean;
  found?: boolean;
  note: string;
}

const frames: Frame[] = [
  { cur: 0, inserted: false, note: "insert(7): start at root 8" },
  { cur: 1, inserted: false, note: "7 < 8 → go left to 3" },
  { cur: 4, inserted: false, note: "7 > 3 → go right to 6" },
  { cur: 6, inserted: true, note: "7 > 6, right child empty → insert leaf 7" },
  { cur: 0, inserted: true, note: "search(14): start at root 8" },
  { cur: 2, inserted: true, note: "14 > 8 → go right to 10" },
  { cur: 5, inserted: true, note: "14 > 10 → go right to 14" },
  { cur: 5, inserted: true, found: true, note: "14 == 14 ✓ found — O(h) walk, no other subtree touched" },
];

export function BSTInsertSearch() {
  const { step, frame, running, playToggle, stepBy, reset } = useFrames(frames, 1100);
  const all = frame.inserted ? [...NODES, INSERTED] : NODES;

  return (
    <AlgoVizFrame
      title="BST insert / search"
      subtitle="compare at each node, descend one side"
      step={step}
      stepCount={frames.length}
      running={running}
      onPlayToggle={playToggle}
      onStep={stepBy}
      onReset={reset}
      caption={frame.note}
    >
      <svg viewBox="0 0 600 340" className="w-full">
        {all
          .filter((n) => n.parent !== null)
          .map((n) => {
            const p = all.find((m) => m.id === n.parent)!;
            return (
              <line
                key={n.id}
                x1={p.x}
                y1={p.y}
                x2={n.x}
                y2={n.y}
                stroke={n.id === INSERTED.id ? "rgba(52,211,153,0.5)" : "rgba(255,255,255,0.12)"}
                strokeWidth={1.5}
              />
            );
          })}
        {all.map((n) => {
          const isCur = frame.cur === n.id;
          const isFound = frame.found && isCur;
          const isNew = n.id === INSERTED.id;
          const fill = isFound ? "#10b981" : isCur ? "#06b6d4" : isNew ? "#0d9e6e" : "#1e2030";
          const stroke = isFound || isNew ? "#34d399" : isCur ? "#22d3ee" : "rgba(255,255,255,0.1)";
          return (
            <g key={n.id} style={{ transition: "all 300ms" }}>
              <circle cx={n.x} cy={n.y} r={22} fill={fill} stroke={stroke} strokeWidth={2} style={{ transition: "fill 300ms, stroke 300ms" }} />
              <text
                x={n.x}
                y={n.y + 5}
                textAnchor="middle"
                fill="#f1f5f9"
                fontSize={14}
                fontFamily="JetBrains Mono, monospace"
                fontWeight={600}
              >
                {n.val}
              </text>
            </g>
          );
        })}
      </svg>
    </AlgoVizFrame>
  );
}
