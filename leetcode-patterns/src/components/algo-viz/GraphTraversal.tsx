import { AlgoVizFrame } from "./AlgoVizFrame";
import { useFrames } from "./useFrames";

// A real graph (not a tree): cross edges and two cycles, so the visited
// set actually earns its keep — D and G are each reachable two ways.
//
//   A ── B          A: (90, 90)   B: (250, 60)
//   │    │          C: (170, 200) D: (330, 170)
//   C ── D ── E     E: (470, 120) F: (250, 300)
//   │         │     G: (430, 270)
//   F ─────── G ────┘
const NODES = ["A", "B", "C", "D", "E", "F", "G"] as const;
const POS: { x: number; y: number }[] = [
  { x: 90, y: 90 },
  { x: 250, y: 60 },
  { x: 170, y: 200 },
  { x: 330, y: 170 },
  { x: 470, y: 120 },
  { x: 250, y: 300 },
  { x: 430, y: 270 },
];
const EDGES: [number, number][] = [
  [0, 1], // A-B
  [0, 2], // A-C
  [1, 3], // B-D
  [2, 3], // C-D  (cycle A-B-D-C-A)
  [3, 4], // D-E
  [2, 5], // C-F
  [4, 6], // E-G
  [5, 6], // F-G  (cycle C-D-E-G-F-C)
];

const ADJ: number[][] = NODES.map(() => []);
for (const [u, v] of EDGES) {
  ADJ[u].push(v);
  ADJ[v].push(u);
}

interface Frame {
  queue: number[];
  visited: Set<number>;
  current: number | null;
  enqueuing: number | null;
  activeEdge: [number, number] | null;
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
    enqueuing: null,
    activeEdge: null,
    note: "BFS from A — enqueue A, visited = {A}",
  });
  while (queue.length > 0) {
    const u = queue.shift()!;
    out.push({
      queue: [...queue],
      visited: new Set(visited),
      current: u,
      enqueuing: null,
      activeEdge: null,
      note: `pop ${NODES[u]} — scan its neighbors`,
    });
    for (const v of ADJ[u]) {
      if (!visited.has(v)) {
        visited.add(v);
        queue.push(v);
        out.push({
          queue: [...queue],
          visited: new Set(visited),
          current: u,
          enqueuing: v,
          activeEdge: [u, v],
          note: `${NODES[v]} unvisited → mark + enqueue`,
        });
      } else {
        out.push({
          queue: [...queue],
          visited: new Set(visited),
          current: u,
          enqueuing: null,
          activeEdge: [u, v],
          note: `${NODES[v]} already visited → skip (no re-processing)`,
        });
      }
    }
  }
  out.push({
    queue: [],
    visited,
    current: null,
    enqueuing: null,
    activeEdge: null,
    note: "queue empty — all 7 nodes visited exactly once",
  });
  return out;
})();

export function GraphTraversal() {
  const { step, frame, running, playToggle, stepBy, reset } = useFrames(frames);

  return (
    <AlgoVizFrame
      title="Graph BFS"
      subtitle="adjacency list + queue + visited set (cycles won't loop)"
      step={step}
      stepCount={frames.length}
      running={running}
      onPlayToggle={playToggle}
      onStep={stepBy}
      onReset={reset}
      caption={frame.note}
    >
      <svg viewBox="0 0 560 360" className="w-full">
        {EDGES.map(([u, v], i) => {
          const isActive =
            frame.activeEdge &&
            ((frame.activeEdge[0] === u && frame.activeEdge[1] === v) ||
              (frame.activeEdge[0] === v && frame.activeEdge[1] === u));
          return (
            <line
              key={i}
              x1={POS[u].x}
              y1={POS[u].y}
              x2={POS[v].x}
              y2={POS[v].y}
              stroke={isActive ? "#22d3ee" : "rgba(255,255,255,0.15)"}
              strokeWidth={isActive ? 2.5 : 1.5}
              style={{ transition: "stroke 300ms" }}
            />
          );
        })}
        {NODES.map((name, i) => {
          const visited = frame.visited.has(i);
          const isCurrent = frame.current === i;
          const isEnqueuing = frame.enqueuing === i;
          const fill = isCurrent
            ? "#06b6d4"
            : isEnqueuing
            ? "#0d9e6e"
            : visited
            ? "#1e2030"
            : "#0e0f14";
          const stroke = isCurrent
            ? "#22d3ee"
            : isEnqueuing
            ? "#34d399"
            : visited
            ? "rgba(255,255,255,0.25)"
            : "rgba(255,255,255,0.08)";
          return (
            <g key={i} style={{ transition: "all 300ms" }}>
              <circle
                cx={POS[i].x}
                cy={POS[i].y}
                r={22}
                fill={fill}
                stroke={stroke}
                strokeWidth={2}
                style={{ transition: "fill 300ms, stroke 300ms" }}
              />
              <text
                x={POS[i].x}
                y={POS[i].y + 5}
                textAnchor="middle"
                fill="#f1f5f9"
                fontSize={14}
                fontFamily="JetBrains Mono, monospace"
                fontWeight={600}
              >
                {name}
              </text>
            </g>
          );
        })}
        <g transform="translate(0, 348)">
          <text x={10} y={0} fill="#64748b" fontSize={11} fontFamily="JetBrains Mono, monospace">
            queue:
          </text>
          <text x={62} y={0} fill="#22d3ee" fontSize={12} fontFamily="JetBrains Mono, monospace">
            [{frame.queue.map((i) => NODES[i]).join(", ")}]
          </text>
          <text x={210} y={0} fill="#64748b" fontSize={11} fontFamily="JetBrains Mono, monospace">
            visited:
          </text>
          <text x={272} y={0} fill="#34d399" fontSize={12} fontFamily="JetBrains Mono, monospace">
            {"{"}
            {NODES.filter((_, i) => frame.visited.has(i)).join(", ")}
            {"}"}
          </text>
        </g>
      </svg>
    </AlgoVizFrame>
  );
}
