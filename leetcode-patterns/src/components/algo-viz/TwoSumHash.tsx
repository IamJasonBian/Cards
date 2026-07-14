import { AlgoVizFrame } from "./AlgoVizFrame";
import { useFrames } from "./useFrames";

interface Frame {
  i: number;
  seen: Record<number, number>; // value -> index
  lookup: number | null; // complement being checked
  hit: boolean;
  note: string;
}

const NUMS = [3, 8, 11, 7, 4];
const TARGET = 15;

const frames: Frame[] = (() => {
  const out: Frame[] = [];
  const seen: Record<number, number> = {};
  for (let i = 0; i < NUMS.length; i += 1) {
    const x = NUMS[i];
    const c = TARGET - x;
    const hit = c in seen;
    out.push({
      i,
      seen: { ...seen },
      lookup: c,
      hit,
      note: hit
        ? `complement ${c} found at index ${seen[c]} → answer [${seen[c]}, ${i}]`
        : `need ${TARGET} - ${x} = ${c} — not in map`,
    });
    if (hit) return out;
    seen[x] = i;
    out.push({ i, seen: { ...seen }, lookup: null, hit: false, note: `insert ${x} → index ${i}` });
  }
  return out;
})();

export function TwoSumHash() {
  const { step, frame, running, playToggle, stepBy, reset } = useFrames(frames);
  const cellW = 56;
  const entries = Object.entries(frame.seen);

  return (
    <AlgoVizFrame
      title="Complement lookup — Two Sum"
      subtitle={`nums = [${NUMS.join(", ")}], target = ${TARGET}`}
      step={step}
      stepCount={frames.length}
      running={running}
      onPlayToggle={playToggle}
      onStep={stepBy}
      onReset={reset}
      caption={frame.note}
    >
      <svg viewBox={`0 0 ${cellW * NUMS.length + 40} 240`} className="w-full">
        {NUMS.map((v, i) => {
          const x = 20 + i * cellW;
          const isCur = i === frame.i;
          const isMatch = frame.hit && frame.lookup !== null && frame.seen[frame.lookup] === i;
          return (
            <g key={i}>
              <rect
                x={x}
                y={50}
                width={cellW - 8}
                height={60}
                rx={8}
                fill={isMatch ? "#14532d" : isCur ? "#0e3a44" : "#161820"}
                stroke={isMatch ? "#34d399" : isCur ? "#06b6d4" : "rgba(255,255,255,0.06)"}
                style={{ transition: "fill 300ms" }}
              />
              <text
                x={x + (cellW - 8) / 2}
                y={87}
                textAnchor="middle"
                fill="#f1f5f9"
                fontSize={20}
                fontFamily="JetBrains Mono, monospace"
              >
                {v}
              </text>
              <text
                x={x + (cellW - 8) / 2}
                y={132}
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
        <g
          transform={`translate(${20 + frame.i * cellW + (cellW - 8) / 2}, 0)`}
          style={{ transition: "transform 400ms" }}
        >
          <text x={0} y={30} textAnchor="middle" fill="#f87171" fontSize={14} fontFamily="JetBrains Mono, monospace" fontWeight={600}>
            i
          </text>
          <path d="M -6 35 L 6 35 L 0 45 Z" fill="#f87171" />
        </g>
        {/* hash map contents */}
        <g transform="translate(20, 160)">
          <text fill="#64748b" fontSize={11} fontFamily="JetBrains Mono, monospace">
            seen (value → index):
          </text>
          {entries.map(([v, idx], pos) => {
            const isLookupHit = frame.hit && frame.lookup !== null && Number(v) === frame.lookup;
            return (
              <g key={v} transform={`translate(${pos * 76}, 12)`}>
                <rect
                  width={68}
                  height={34}
                  rx={8}
                  fill={isLookupHit ? "#14532d" : "#161820"}
                  stroke={isLookupHit ? "#34d399" : "rgba(255,255,255,0.12)"}
                />
                <text x={34} y={22} textAnchor="middle" fill="#f1f5f9" fontSize={13} fontFamily="JetBrains Mono, monospace">
                  {v} → {idx}
                </text>
              </g>
            );
          })}
          {entries.length === 0 && (
            <text x={0} y={34} fill="#475569" fontSize={12} fontFamily="JetBrains Mono, monospace">
              (empty)
            </text>
          )}
        </g>
      </svg>
    </AlgoVizFrame>
  );
}
