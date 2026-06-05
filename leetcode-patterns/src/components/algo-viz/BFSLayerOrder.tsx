import { AlgoVizFrame } from "./AlgoVizFrame";
import { useFrames } from "./useFrames";

interface Node {
  id: number;
  val: string;
  x: number;
  y: number;
  parent: number | null;
}

//        A(0)
//       /    \
//     B(1)   C(2)
//    /  \     \
//  D(3) E(4) F(5)
//              \
//              G(6)
const NODES: Node[] = [
  { id: 0, val: "A", x: 300, y: 50, parent: null },
  { id: 1, val: "B", x: 180, y: 130, parent: 0 },
  { id: 2, val: "C", x: 420, y: 130, parent: 0 },
  { id: 3, val: "D", x: 110, y: 210, parent: 1 },
  { id: 4, val: "E", x: 250, y: 210, parent: 1 },
  { id: 5, val: "F", x: 420, y: 210, parent: 2 },
  { id: 6, val: "G", x: 500, y: 290, parent: 5 },
];

const CHILDREN: Record<number, number[]> = {};
for (const n of NODES) {
  if (n.parent !== null) {
    (CHILDREN[n.parent] ??= []).push(n.id);
  }
}

interface Frame {
  queue: number[];
  visited: Set<number>;
  current: number | null;
  visiting: Set<number>;
  note: string;
}

const frames: Frame[] = (() => {
  const out: Frame[] = [];
  const queue = [0];
  const visited = new Set<number>([0]);
  out.push({
    queue: [...queue],
    visited: new Set(visited),
    current: null,
    visiting: new Set(),
    note: `enqueue root A, visited = {A}`,
  });
  while (queue.length > 0) {
    const layerSize = queue.length;
    const layer: number[] = [];
    for (let i = 0; i < layerSize; i += 1) {
      const u = queue.shift()!;
      layer.push(u);
      out.push({
        queue: [...queue],
        visited: new Set(visited),
        current: u,
        visiting: new Set(),
        note: `visit ${NODES[u].val}`,
      });
      for (const v of CHILDREN[u] ?? []) {
        if (!visited.has(v)) {
          visited.add(v);
          queue.push(v);
          out.push({
            queue: [...queue],
            visited: new Set(visited),
            current: u,
            visiting: new Set([v]),
            note: `enqueue ${NODES[v].val}`,
          });
        }
      }
    }
    out.push({
      queue: [...queue],
      visited: new Set(visited),
      current: null,
      visiting: new Set(),
      note: `finished layer [${layer.map((i) => NODES[i].val).join(", ")}]`,
    });
  }
  out.push({
    queue: [],
    visited,
    current: null,
    visiting: new Set(),
    note: "BFS complete",
  });
  return out;
})();

export function BFSLayerOrder() {
  const { step, frame, running, playToggle, stepBy, reset } = useFrames(frames);
  const width = 600;
  const height = 340;

  return (
    <AlgoVizFrame
      title="Level-order BFS"
      subtitle="queue + visited set"
      step={step}
      stepCount={frames.length}
      running={running}
      onPlayToggle={playToggle}
      onStep={stepBy}
      onReset={reset}
      caption={frame.note}
    >
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full">
        {/* edges */}
        {NODES.filter((n) => n.parent !== null).map((n) => {
          const p = NODES[n.parent!];
          return (
            <line
              key={n.id}
              x1={p.x}
              y1={p.y}
              x2={n.x}
              y2={n.y}
              stroke="rgba(255,255,255,0.12)"
              strokeWidth={1.5}
            />
          );
        })}
        {NODES.map((n) => {
          const visited = frame.visited.has(n.id);
          const isCurrent = frame.current === n.id;
          const isVisiting = frame.visiting.has(n.id);
          const fill = isCurrent
            ? "#06b6d4"
            : isVisiting
            ? "#0d9e6e"
            : visited
            ? "#1e2030"
            : "#0e0f14";
          const stroke = isCurrent
            ? "#22d3ee"
            : isVisiting
            ? "#34d399"
            : visited
            ? "rgba(255,255,255,0.2)"
            : "rgba(255,255,255,0.08)";
          return (
            <g key={n.id} style={{ transition: "all 300ms" }}>
              <circle
                cx={n.x}
                cy={n.y}
                r={22}
                fill={fill}
                stroke={stroke}
                strokeWidth={2}
                style={{ transition: "fill 300ms, stroke 300ms" }}
              />
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
        {/* queue display */}
        <g transform={`translate(0, ${height - 20})`}>
          <text x={10} y={0} fill="#64748b" fontSize={11} fontFamily="JetBrains Mono, monospace">
            queue:
          </text>
          <text x={60} y={0} fill="#22d3ee" fontSize={12} fontFamily="JetBrains Mono, monospace">
            [{frame.queue.map((i) => NODES[i].val).join(", ")}]
          </text>
        </g>
      </svg>
    </AlgoVizFrame>
  );
}
