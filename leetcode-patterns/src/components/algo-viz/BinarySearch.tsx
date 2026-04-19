import { AlgoVizFrame } from "./AlgoVizFrame";
import { useFrames } from "./useFrames";

interface Frame {
  lo: number;
  hi: number;
  mid: number | null;
  note: string;
  resolved?: "found" | "not-found";
}

const NUMS = [2, 5, 8, 12, 16, 23, 38, 45, 56, 72, 91];
const TARGET = 23;

const frames: Frame[] = (() => {
  const out: Frame[] = [];
  let lo = 0;
  let hi = NUMS.length - 1;
  out.push({ lo, hi, mid: null, note: `target = ${TARGET}, lo=${lo}, hi=${hi}` });
  while (lo <= hi) {
    const mid = Math.floor((lo + hi) / 2);
    out.push({ lo, hi, mid, note: `mid = ${mid}, nums[mid] = ${NUMS[mid]}` });
    if (NUMS[mid] === TARGET) {
      out.push({ lo, hi, mid, note: `nums[${mid}] = ${TARGET} ✓ found at index ${mid}`, resolved: "found" });
      break;
    }
    if (NUMS[mid] < TARGET) {
      lo = mid + 1;
      out.push({ lo, hi, mid: null, note: `${NUMS[mid]} < ${TARGET} → lo = ${lo}` });
    } else {
      hi = mid - 1;
      out.push({ lo, hi, mid: null, note: `${NUMS[mid]} > ${TARGET} → hi = ${hi}` });
    }
  }
  return out;
})();

export function BinarySearch() {
  const { step, frame, running, playToggle, stepBy, reset } = useFrames(frames);
  const cellW = 52;

  return (
    <AlgoVizFrame
      title="Binary search"
      subtitle={`target = ${TARGET}`}
      step={step}
      stepCount={frames.length}
      running={running}
      onPlayToggle={playToggle}
      onStep={stepBy}
      onReset={reset}
      caption={frame.note}
    >
      <svg viewBox={`0 0 ${cellW * NUMS.length + 40} 170`} className="w-full">
        {/* active range */}
        {frame.lo <= frame.hi && (
          <rect
            x={20 + frame.lo * cellW - 4}
            y={52}
            width={(frame.hi - frame.lo + 1) * cellW}
            height={76}
            rx={10}
            fill="rgba(52,211,153,0.08)"
            stroke="rgba(52,211,153,0.35)"
            strokeWidth={1.5}
            style={{ transition: "all 400ms" }}
          />
        )}
        {NUMS.map((n, i) => {
          const x = 20 + i * cellW;
          const inRange = i >= frame.lo && i <= frame.hi;
          const isMid = frame.mid === i;
          const foundHit = isMid && frame.resolved === "found";
          return (
            <g key={i}>
              <rect
                x={x}
                y={60}
                width={cellW - 8}
                height={60}
                rx={8}
                fill={foundHit ? "#10b981" : isMid ? "#7c5cbf" : inRange ? "#1e2030" : "#111218"}
                stroke={isMid ? "#a78bfa" : inRange ? "rgba(255,255,255,0.08)" : "rgba(255,255,255,0.03)"}
                style={{ transition: "fill 300ms" }}
                opacity={inRange ? 1 : 0.35}
              />
              <text
                x={x + (cellW - 8) / 2}
                y={97}
                textAnchor="middle"
                fill="#f1f5f9"
                fontSize={15}
                fontFamily="JetBrains Mono, monospace"
                opacity={inRange ? 1 : 0.35}
              >
                {n}
              </text>
              <text
                x={x + (cellW - 8) / 2}
                y={142}
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
        {frame.lo <= frame.hi && (
          <>
            <g transform={`translate(${20 + frame.lo * cellW + (cellW - 8) / 2}, 0)`} style={{ transition: "transform 400ms" }}>
              <text x={0} y={40} textAnchor="middle" fill="#34d399" fontSize={13} fontFamily="JetBrains Mono, monospace" fontWeight={600}>
                lo
              </text>
              <path d="M -6 45 L 6 45 L 0 55 Z" fill="#34d399" />
            </g>
            <g transform={`translate(${20 + frame.hi * cellW + (cellW - 8) / 2}, 0)`} style={{ transition: "transform 400ms" }}>
              <text x={0} y={40} textAnchor="middle" fill="#f87171" fontSize={13} fontFamily="JetBrains Mono, monospace" fontWeight={600}>
                hi
              </text>
              <path d="M -6 45 L 6 45 L 0 55 Z" fill="#f87171" />
            </g>
          </>
        )}
      </svg>
    </AlgoVizFrame>
  );
}
