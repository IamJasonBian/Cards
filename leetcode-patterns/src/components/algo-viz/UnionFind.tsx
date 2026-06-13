import { AlgoVizFrame } from "./AlgoVizFrame";
import { useFrames } from "./useFrames";

const N = 5;
const NODE_X = [80, 170, 260, 350, 440];
const NODE_Y = 140;
const R = 20;
const W = 520;
const H = 295;

const COMP_COLORS = ["#0d9e6e", "#06b6d4", "#8b5cf6", "#e05d6f", "#f59e0b"];

interface Frame {
  parent: number[];
  rank: number[];
  highlight: Set<number>;
  note: string;
}

const frames: Frame[] = (() => {
  const parent = Array.from({ length: N }, (_, i) => i);
  const rank = new Array<number>(N).fill(0);
  const out: Frame[] = [];

  function snap(note: string, hl: number[] = []): void {
    out.push({ parent: [...parent], rank: [...rank], highlight: new Set(hl), note });
  }

  function findRoot(x: number): number {
    while (parent[x] !== x) x = parent[x];
    return x;
  }

  snap("Initial — each node is its own root (5 separate components)");

  // union(0, 1)
  let px = findRoot(0), py = findRoot(1);
  snap(`union(0,1) — root(0)=${px}, root(1)=${py}`, [0, 1]);
  parent[py] = px; rank[px]++;
  snap(`connected: parent[${py}]=${px}  rank[${px}]=${rank[px]}`, [px, py]);

  // union(2, 3)
  px = findRoot(2); py = findRoot(3);
  snap(`union(2,3) — root(2)=${px}, root(3)=${py}`, [2, 3]);
  parent[py] = px; rank[px]++;
  snap(`connected: parent[${py}]=${px}  rank[${px}]=${rank[px]}`, [px, py]);

  // union(0, 2)
  px = findRoot(0); py = findRoot(2);
  snap(`union(0,2) — root(0)=${px}, root(2)=${py}`, [0, 2]);
  parent[py] = px; rank[px]++;
  snap(`merged: parent[${py}]=${px}  rank[${px}]=${rank[px]}`, [px, py]);

  // find(3) with path compression
  const old3 = parent[3]; // 2
  snap(`find(3): walk 3→${old3}→${parent[old3]}  (root = ${findRoot(3)})`, [3]);
  parent[3] = findRoot(3);
  snap(`path compress: parent[3] ${old3}→${parent[3]} (direct to root)`, [3]);

  snap("Done — {0,1,2,3} one component · {4} isolated");
  return out;
})();

export function UnionFind() {
  const { step, frame, running, playToggle, stepBy, reset } = useFrames(frames);

  // Assign a stable color to each root based on its node index
  const rootOrder: number[] = [];
  for (let i = 0; i < N; i++) {
    if (frame.parent[i] === i && !rootOrder.includes(i)) rootOrder.push(i);
  }
  const rootColor = new Map<number, string>(rootOrder.map((r, idx) => [r, COMP_COLORS[idx]]));

  function getRoot(x: number): number {
    let cur = x;
    while (frame.parent[cur] !== cur) cur = frame.parent[cur];
    return cur;
  }

  function compColor(i: number): string {
    return rootColor.get(getRoot(i)) ?? "#1e2030";
  }

  return (
    <AlgoVizFrame
      title="Union Find (DSU)"
      subtitle="path compression + union by rank"
      step={step}
      stepCount={frames.length}
      running={running}
      onPlayToggle={playToggle}
      onStep={stepBy}
      onReset={reset}
      caption={frame.note}
    >
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full">
        <defs>
          <marker id="uf-arrow" markerWidth="8" markerHeight="7" refX="7" refY="3.5" orient="auto">
            <path d="M0,0 L0,7 L8,3.5 z" fill="rgba(255,255,255,0.45)" />
          </marker>
        </defs>

        {/* Parent-pointer arcs */}
        {Array.from({ length: N }, (_, i) => {
          const p = frame.parent[i];
          if (p === i) return null;
          const x1 = NODE_X[i];
          const x2 = NODE_X[p];
          const y1 = NODE_Y - R;
          const y2 = NODE_Y - R;
          const mx = (x1 + x2) / 2;
          const arcH = Math.max(38, Math.abs(x2 - x1) * 0.48);
          const cy = NODE_Y - R - arcH;
          const isHl = frame.highlight.has(i);
          const color = isHl ? "#f59e0b" : compColor(i);
          return (
            <path
              key={`arc-${i}`}
              d={`M ${x1} ${y1} Q ${mx} ${cy} ${x2} ${y2}`}
              fill="none"
              stroke={color}
              strokeWidth={1.8}
              strokeOpacity={0.75}
              markerEnd="url(#uf-arrow)"
              style={{ transition: "d 400ms, stroke 300ms" }}
            />
          );
        })}

        {/* Nodes */}
        {Array.from({ length: N }, (_, i) => {
          const isRoot = frame.parent[i] === i;
          const isHl = frame.highlight.has(i);
          const fill = isHl ? "#f59e0b" : compColor(i);
          const stroke = isHl ? "#fbbf24" : isRoot ? "rgba(255,255,255,0.45)" : "rgba(255,255,255,0.12)";
          return (
            <g key={i}>
              {isRoot && (
                <circle
                  cx={NODE_X[i]}
                  cy={NODE_Y}
                  r={R + 7}
                  fill="none"
                  stroke={isHl ? "#fbbf24" : compColor(i)}
                  strokeWidth={1}
                  strokeDasharray="3 2"
                  strokeOpacity={0.55}
                  style={{ transition: "stroke 300ms" }}
                />
              )}
              <circle
                cx={NODE_X[i]}
                cy={NODE_Y}
                r={R}
                fill={fill}
                stroke={stroke}
                strokeWidth={2}
                style={{ transition: "fill 300ms, stroke 300ms" }}
              />
              <text
                x={NODE_X[i]}
                y={NODE_Y + 5}
                textAnchor="middle"
                fill="#f1f5f9"
                fontSize={14}
                fontFamily="JetBrains Mono, monospace"
                fontWeight={600}
              >
                {i}
              </text>
            </g>
          );
        })}

        {/* Legend: dashed circle = root */}
        <text x={10} y={H - 70} fill="#475569" fontSize={10} fontFamily="JetBrains Mono, monospace">
          ○ = root
        </text>

        {/* parent[] row */}
        <text x={10} y={H - 50} fill="#64748b" fontSize={11} fontFamily="JetBrains Mono, monospace">
          parent:
        </text>
        {Array.from({ length: N }, (_, i) => (
          <text
            key={`par-${i}`}
            x={NODE_X[i]}
            y={H - 50}
            textAnchor="middle"
            fill={frame.highlight.has(i) ? "#f59e0b" : "#94a3b8"}
            fontSize={12}
            fontFamily="JetBrains Mono, monospace"
            style={{ transition: "fill 300ms" }}
          >
            {frame.parent[i]}
          </text>
        ))}

        {/* rank[] row */}
        <text x={10} y={H - 30} fill="#64748b" fontSize={11} fontFamily="JetBrains Mono, monospace">
          rank:{"  "}
        </text>
        {Array.from({ length: N }, (_, i) => (
          <text
            key={`rank-${i}`}
            x={NODE_X[i]}
            y={H - 30}
            textAnchor="middle"
            fill="#64748b"
            fontSize={12}
            fontFamily="JetBrains Mono, monospace"
          >
            {frame.rank[i]}
          </text>
        ))}

        {/* index row */}
        <text x={10} y={H - 10} fill="#334155" fontSize={10} fontFamily="JetBrains Mono, monospace">
          index:{"  "}
        </text>
        {Array.from({ length: N }, (_, i) => (
          <text
            key={`idx-${i}`}
            x={NODE_X[i]}
            y={H - 10}
            textAnchor="middle"
            fill="#334155"
            fontSize={10}
            fontFamily="JetBrains Mono, monospace"
          >
            [{i}]
          </text>
        ))}
      </svg>
    </AlgoVizFrame>
  );
}
