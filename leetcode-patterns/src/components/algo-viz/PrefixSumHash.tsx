import { AlgoVizFrame } from "./AlgoVizFrame";
import { useFrames } from "./useFrames";

interface Frame {
  i: number;
  total: number;
  res: number;
  seen: Record<number, number>; // prefix sum -> count
  lookup: number | null;
  hit: boolean;
  note: string;
}

const NUMS = [1, 2, 1, 2, 1];
const K = 3;

const frames: Frame[] = (() => {
  const out: Frame[] = [];
  const seen: Record<number, number> = { 0: 1 };
  let total = 0;
  let res = 0;
  out.push({
    i: -1,
    total,
    res,
    seen: { ...seen },
    lookup: null,
    hit: false,
    note: "seed map with {0: 1} — empty prefix",
  });
  for (let i = 0; i < NUMS.length; i += 1) {
    total += NUMS[i];
    const need = total - K;
    const hits = seen[need] ?? 0;
    res += hits;
    out.push({
      i,
      total,
      res,
      seen: { ...seen },
      lookup: need,
      hit: hits > 0,
      note:
        hits > 0
          ? `prefix = ${total}; ${total} - ${K} = ${need} seen ×${hits} → res = ${res}`
          : `prefix = ${total}; ${need} not seen`,
    });
    seen[total] = (seen[total] ?? 0) + 1;
    out.push({
      i,
      total,
      res,
      seen: { ...seen },
      lookup: null,
      hit: false,
      note: `record prefix ${total} in map`,
    });
  }
  out.push({
    i: NUMS.length - 1,
    total,
    res,
    seen: { ...seen },
    lookup: null,
    hit: false,
    note: `done, answer = ${res}`,
  });
  return out;
})();

export function PrefixSumHash() {
  const { step, frame, running, playToggle, stepBy, reset } = useFrames(frames);
  const cellW = 56;
  const entries = Object.entries(frame.seen);

  return (
    <AlgoVizFrame
      title="Prefix sum + hash map — subarray sum equals K (560)"
      subtitle={`nums = [${NUMS.join(", ")}], k = ${K}`}
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
          const done = i <= frame.i;
          const isCur = i === frame.i;
          return (
            <g key={i}>
              <rect
                x={x}
                y={50}
                width={cellW - 8}
                height={60}
                rx={8}
                fill={isCur ? "#0e3a44" : done ? "#1a2030" : "#161820"}
                stroke={isCur ? "#06b6d4" : "rgba(255,255,255,0.06)"}
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
        {frame.i >= 0 && (
          <g
            transform={`translate(${20 + frame.i * cellW + (cellW - 8) / 2}, 0)`}
            style={{ transition: "transform 400ms" }}
          >
            <text x={0} y={30} textAnchor="middle" fill="#f87171" fontSize={14} fontFamily="JetBrains Mono, monospace" fontWeight={600}>
              i
            </text>
            <path d="M -6 35 L 6 35 L 0 45 Z" fill="#f87171" />
          </g>
        )}
        {/* map contents */}
        <g transform="translate(20, 160)">
          <text fill="#64748b" fontSize={11} fontFamily="JetBrains Mono, monospace">
            seen (prefix → count) · prefix = {frame.total} · res = {frame.res}
          </text>
          {entries.map(([p, c], pos) => {
            const isHit = frame.hit && frame.lookup !== null && Number(p) === frame.lookup;
            return (
              <g key={p} transform={`translate(${pos * 76}, 12)`}>
                <rect
                  width={68}
                  height={34}
                  rx={8}
                  fill={isHit ? "#14532d" : "#161820"}
                  stroke={isHit ? "#34d399" : "rgba(255,255,255,0.12)"}
                />
                <text x={34} y={22} textAnchor="middle" fill="#f1f5f9" fontSize={13} fontFamily="JetBrains Mono, monospace">
                  {p} → {c}
                </text>
              </g>
            );
          })}
        </g>
      </svg>
    </AlgoVizFrame>
  );
}
