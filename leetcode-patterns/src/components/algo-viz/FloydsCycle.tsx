import { AlgoVizFrame } from "./AlgoVizFrame";
import { useFrames } from "./useFrames";

// 1 → 2 → 3 → 4 → 5 → 6 → 7 → 3 (back to node 3, cycle of length 5)
const NODES = [1, 2, 3, 4, 5, 6, 7];
const CYCLE_INTO = 2; // nodes[6].next = nodes[2]

interface Frame {
  slow: number;
  fast: number;
  note: string;
  meet?: boolean;
}

const frames: Frame[] = (() => {
  const next = (i: number) => (i === NODES.length - 1 ? CYCLE_INTO : i + 1);
  const out: Frame[] = [];
  let slow = 0;
  let fast = 0;
  out.push({ slow, fast, note: "slow = fast = head" });
  for (let i = 0; i < 12; i += 1) {
    slow = next(slow);
    fast = next(next(fast));
    out.push({
      slow,
      fast,
      note: `slow → ${NODES[slow]}, fast → ${NODES[fast]}`,
      meet: slow === fast,
    });
    if (slow === fast) {
      out.push({
        slow,
        fast,
        note: `slow == fast at node ${NODES[slow]} → cycle detected`,
        meet: true,
      });
      break;
    }
  }
  return out;
})();

export function FloydsCycle() {
  const { step, frame, running, playToggle, stepBy, reset } = useFrames(frames, 1100);

  // layout: first 3 nodes in a row, then cycle in a circle
  const linearX = [60, 140, 220];
  const cycleNodes = NODES.slice(CYCLE_INTO);
  const cx = 380;
  const cy = 170;
  const r = 90;
  const positions: { x: number; y: number }[] = NODES.map((_, i) => {
    if (i < CYCLE_INTO) return { x: linearX[i], y: 170 };
    const k = i - CYCLE_INTO;
    const angle = (-Math.PI / 2) + (k / cycleNodes.length) * Math.PI * 2;
    return { x: cx + r * Math.cos(angle), y: cy + r * Math.sin(angle) };
  });

  return (
    <AlgoVizFrame
      title="Floyd's cycle detection"
      subtitle="slow (×1) / fast (×2) pointers"
      step={step}
      stepCount={frames.length}
      running={running}
      onPlayToggle={playToggle}
      onStep={stepBy}
      onReset={reset}
      caption={frame.note}
    >
      <svg viewBox="0 0 560 320" className="w-full">
        {/* edges */}
        {NODES.map((_, i) => {
          const from = positions[i];
          const toIdx = i === NODES.length - 1 ? CYCLE_INTO : i + 1;
          const to = positions[toIdx];
          return (
            <line
              key={i}
              x1={from.x}
              y1={from.y}
              x2={to.x}
              y2={to.y}
              stroke="rgba(255,255,255,0.15)"
              strokeWidth={1.5}
              markerEnd="url(#arrow)"
            />
          );
        })}
        <defs>
          <marker id="arrow" markerWidth="10" markerHeight="10" refX="14" refY="3" orient="auto">
            <path d="M0,0 L0,6 L6,3 z" fill="rgba(255,255,255,0.35)" />
          </marker>
        </defs>

        {NODES.map((v, i) => {
          const { x, y } = positions[i];
          const onSlow = frame.slow === i;
          const onFast = frame.fast === i;
          const meet = frame.meet && onSlow && onFast;
          const fill = meet ? "#10b981" : onSlow ? "#0d9e6e" : onFast ? "#06b6d4" : "#1e2030";
          const stroke = meet ? "#34d399" : onSlow ? "#34d399" : onFast ? "#22d3ee" : "rgba(255,255,255,0.1)";
          return (
            <g key={i} style={{ transition: "all 400ms" }}>
              <circle cx={x} cy={y} r={20} fill={fill} stroke={stroke} strokeWidth={2} style={{ transition: "fill 300ms" }} />
              <text x={x} y={y + 5} textAnchor="middle" fill="#f1f5f9" fontSize={13} fontFamily="JetBrains Mono, monospace">
                {v}
              </text>
              {onSlow && (
                <text x={x} y={y - 30} textAnchor="middle" fill="#34d399" fontSize={11} fontFamily="JetBrains Mono, monospace" fontWeight={600}>
                  slow
                </text>
              )}
              {onFast && (
                <text x={x} y={y + (onSlow ? 42 : -30)} textAnchor="middle" fill="#22d3ee" fontSize={11} fontFamily="JetBrains Mono, monospace" fontWeight={600}>
                  fast
                </text>
              )}
            </g>
          );
        })}
      </svg>
    </AlgoVizFrame>
  );
}
