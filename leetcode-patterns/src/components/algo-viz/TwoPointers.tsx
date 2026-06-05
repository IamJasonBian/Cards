import { AlgoVizFrame } from "./AlgoVizFrame";
import { useFrames } from "./useFrames";

interface Frame {
  l: number;
  r: number;
  note: string;
  found?: boolean;
}

const NUMS = [1, 3, 4, 5, 7, 10, 11];
const TARGET = 9;

const frames: Frame[] = (() => {
  const out: Frame[] = [];
  let l = 0;
  let r = NUMS.length - 1;
  out.push({ l, r, note: `target = ${TARGET}, l=${l}, r=${r}` });
  while (l < r) {
    const s = NUMS[l] + NUMS[r];
    if (s === TARGET) {
      out.push({ l, r, note: `${NUMS[l]} + ${NUMS[r]} = ${TARGET} ✓ found`, found: true });
      break;
    }
    if (s < TARGET) {
      out.push({ l, r, note: `${NUMS[l]} + ${NUMS[r]} = ${s} < ${TARGET} → l++` });
      l += 1;
    } else {
      out.push({ l, r, note: `${NUMS[l]} + ${NUMS[r]} = ${s} > ${TARGET} → r--` });
      r -= 1;
    }
    out.push({ l, r, note: `l=${l}, r=${r}` });
  }
  return out;
})();

export function TwoPointers() {
  const { step, frame, running, playToggle, stepBy, reset } = useFrames(frames);
  const cellW = 60;

  return (
    <AlgoVizFrame
      title="Two pointers — sorted pair sum"
      subtitle={`target = ${TARGET}`}
      step={step}
      stepCount={frames.length}
      running={running}
      onPlayToggle={playToggle}
      onStep={stepBy}
      onReset={reset}
      caption={frame.note}
    >
      <svg viewBox={`0 0 ${cellW * NUMS.length + 40} 160`} className="w-full">
        {NUMS.map((n, i) => {
          const x = 20 + i * cellW;
          const active = i === frame.l || i === frame.r;
          const found = frame.found && active;
          return (
            <g key={i}>
              <rect
                x={x}
                y={60}
                width={cellW - 8}
                height={60}
                rx={8}
                fill={found ? "#10b981" : active ? "#06b6d4" : "#1e2030"}
                stroke={active ? "#22d3ee" : "rgba(255,255,255,0.08)"}
                strokeWidth={active ? 2 : 1}
                style={{ transition: "fill 300ms, stroke 300ms" }}
              />
              <text
                x={x + (cellW - 8) / 2}
                y={95}
                textAnchor="middle"
                fill="#f1f5f9"
                fontSize={18}
                fontFamily="JetBrains Mono, monospace"
              >
                {n}
              </text>
              <text
                x={x + (cellW - 8) / 2}
                y={140}
                textAnchor="middle"
                fill="#64748b"
                fontSize={11}
                fontFamily="JetBrains Mono, monospace"
              >
                {i}
              </text>
            </g>
          );
        })}
        {/* pointer labels */}
        <PointerLabel x={20 + frame.l * cellW + (cellW - 8) / 2} label="l" color="#34d399" />
        <PointerLabel x={20 + frame.r * cellW + (cellW - 8) / 2} label="r" color="#f87171" />
      </svg>
    </AlgoVizFrame>
  );
}

function PointerLabel({ x, label, color }: { x: number; label: string; color: string }) {
  return (
    <g style={{ transition: "transform 400ms" }} transform={`translate(${x}, 0)`}>
      <text
        x={0}
        y={40}
        textAnchor="middle"
        fill={color}
        fontSize={14}
        fontFamily="JetBrains Mono, monospace"
        fontWeight={600}
      >
        {label}
      </text>
      <path d="M -6 45 L 6 45 L 0 55 Z" fill={color} />
    </g>
  );
}
