import { AlgoVizFrame } from "./AlgoVizFrame";
import { useFrames } from "./useFrames";

// 1 → 2 → 3 → 4 → 5 → 6 → 7 (no cycle — slow lands on the middle)
const NODES = [1, 2, 3, 4, 5, 6, 7];

interface Frame {
  slow: number;
  fast: number;
  note: string;
  done?: boolean;
}

const frames: Frame[] = (() => {
  const out: Frame[] = [];
  let slow = 0;
  let fast = 0;
  out.push({ slow, fast, note: "slow = fast = head" });
  // while fast and fast.next: slow = slow.next; fast = fast.next.next
  while (fast + 2 <= NODES.length - 1) {
    slow += 1;
    fast += 2;
    out.push({ slow, fast, note: `slow → ${NODES[slow]} (×1), fast → ${NODES[fast]} (×2)` });
  }
  out.push({
    slow,
    fast,
    note: `fast.next is None → stop. slow is at node ${NODES[slow]} — the middle`,
    done: true,
  });
  return out;
})();

export function FastSlowMiddle() {
  const { step, frame, running, playToggle, stepBy, reset } = useFrames(frames, 1100);

  const cellGap = 76;
  const y = 120;
  const positions = NODES.map((_, i) => ({ x: 50 + i * cellGap, y }));
  const midIdx = Math.floor(NODES.length / 2);

  return (
    <AlgoVizFrame
      title="Middle of linked list"
      subtitle="slow (×1) / fast (×2) — slow stops at the middle"
      step={step}
      stepCount={frames.length}
      running={running}
      onPlayToggle={playToggle}
      onStep={stepBy}
      onReset={reset}
      caption={frame.note}
    >
      <svg viewBox="0 0 560 240" className="w-full">
        <defs>
          <marker id="mid-arrow" markerWidth="10" markerHeight="10" refX="14" refY="3" orient="auto">
            <path d="M0,0 L0,6 L6,3 z" fill="rgba(255,255,255,0.35)" />
          </marker>
        </defs>
        {NODES.slice(0, -1).map((_, i) => (
          <line
            key={i}
            x1={positions[i].x}
            y1={positions[i].y}
            x2={positions[i + 1].x}
            y2={positions[i + 1].y}
            stroke="rgba(255,255,255,0.15)"
            strokeWidth={1.5}
            markerEnd="url(#mid-arrow)"
          />
        ))}
        {NODES.map((v, i) => {
          const { x } = positions[i];
          const onSlow = frame.slow === i;
          const onFast = frame.fast === i;
          const isMiddle = frame.done && i === midIdx;
          const fill = isMiddle ? "#10b981" : onSlow ? "#0d9e6e" : onFast ? "#06b6d4" : "#1e2030";
          const stroke = isMiddle || onSlow ? "#34d399" : onFast ? "#22d3ee" : "rgba(255,255,255,0.1)";
          return (
            <g key={i} style={{ transition: "all 400ms" }}>
              <circle cx={x} cy={y} r={20} fill={fill} stroke={stroke} strokeWidth={2} style={{ transition: "fill 300ms" }} />
              <text x={x} y={y + 5} textAnchor="middle" fill="#f1f5f9" fontSize={13} fontFamily="JetBrains Mono, monospace">
                {v}
              </text>
              {onSlow && (
                <text x={x} y={y - 32} textAnchor="middle" fill="#34d399" fontSize={11} fontFamily="JetBrains Mono, monospace" fontWeight={600}>
                  slow
                </text>
              )}
              {onFast && (
                <text x={x} y={y + (onSlow ? 44 : -32)} textAnchor="middle" fill="#22d3ee" fontSize={11} fontFamily="JetBrains Mono, monospace" fontWeight={600}>
                  fast
                </text>
              )}
              {isMiddle && (
                <text x={x} y={y + 44} textAnchor="middle" fill="#34d399" fontSize={11} fontFamily="JetBrains Mono, monospace" fontWeight={600}>
                  middle
                </text>
              )}
            </g>
          );
        })}
      </svg>
    </AlgoVizFrame>
  );
}
