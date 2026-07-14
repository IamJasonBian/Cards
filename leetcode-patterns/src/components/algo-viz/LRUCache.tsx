import { AlgoVizFrame } from "./AlgoVizFrame";
import { useFrames } from "./useFrames";

interface Frame {
  op: string;
  cache: number[]; // keys, LRU → MRU
  touched: number | null;
  evicted: number | null;
  note: string;
}

const CAP = 2;

const frames: Frame[] = (() => {
  const out: Frame[] = [];
  const cache: number[] = []; // front = LRU, back = MRU

  const touch = (key: number) => {
    const idx = cache.indexOf(key);
    if (idx !== -1) cache.splice(idx, 1);
    cache.push(key);
  };

  const put = (key: number) => {
    touch(key);
    let evicted: number | null = null;
    if (cache.length > CAP) evicted = cache.shift()!;
    out.push({
      op: `put(${key})`,
      cache: [...cache],
      touched: key,
      evicted,
      note: evicted !== null ? `over capacity → evict LRU key ${evicted}` : `insert ${key} at MRU end`,
    });
  };

  const get = (key: number) => {
    const hit = cache.includes(key);
    if (hit) touch(key);
    out.push({
      op: `get(${key})`,
      cache: [...cache],
      touched: hit ? key : null,
      evicted: null,
      note: hit ? `hit → move ${key} to MRU end` : `miss → return -1`,
    });
  };

  put(1);
  put(2);
  get(1);
  put(3);
  get(2);
  put(4);
  get(3);
  out.push({
    op: "done",
    cache: [...cache],
    touched: null,
    evicted: null,
    note: "map gives O(1) lookup; recency list gives O(1) eviction",
  });
  return out;
})();

export function LRUCache() {
  const { step, frame, running, playToggle, stepBy, reset } = useFrames(frames);

  return (
    <AlgoVizFrame
      title="LRU cache — hash map + recency order (146)"
      subtitle={`capacity = ${CAP} · front = LRU, back = MRU`}
      step={step}
      stepCount={frames.length}
      running={running}
      onPlayToggle={playToggle}
      onStep={stepBy}
      onReset={reset}
      caption={frame.note}
    >
      <svg viewBox="0 0 480 200" className="w-full">
        <text x={20} y={36} fill="#f1f5f9" fontSize={16} fontFamily="JetBrains Mono, monospace">
          {frame.op}
        </text>
        {/* recency list */}
        <text x={20} y={72} fill="#64748b" fontSize={11} fontFamily="JetBrains Mono, monospace">
          LRU
        </text>
        <text x={20 + CAP * 90 + 20} y={72} fill="#64748b" fontSize={11} fontFamily="JetBrains Mono, monospace">
          MRU
        </text>
        {Array.from({ length: CAP }).map((_, slot) => {
          const key = frame.cache[slot];
          const filled = key !== undefined;
          const isTouched = filled && key === frame.touched;
          return (
            <g key={slot} transform={`translate(${20 + slot * 90}, 84)`}>
              <rect
                width={80}
                height={56}
                rx={10}
                fill={isTouched ? "#0e3a44" : filled ? "#161820" : "transparent"}
                stroke={isTouched ? "#06b6d4" : filled ? "rgba(255,255,255,0.15)" : "rgba(255,255,255,0.08)"}
                strokeDasharray={filled ? undefined : "5 4"}
                style={{ transition: "fill 300ms" }}
              />
              <text x={40} y={38} textAnchor="middle" fill={filled ? "#f1f5f9" : "#475569"} fontSize={18} fontFamily="JetBrains Mono, monospace">
                {filled ? key : "·"}
              </text>
            </g>
          );
        })}
        {frame.evicted !== null && (
          <g transform="translate(20, 160)">
            <text fill="#f87171" fontSize={13} fontFamily="JetBrains Mono, monospace">
              evicted: {frame.evicted} ✕
            </text>
          </g>
        )}
        {/* hash map keys */}
        <g transform={`translate(${20 + CAP * 90 + 70}, 84)`}>
          <text y={-8} fill="#64748b" fontSize={11} fontFamily="JetBrains Mono, monospace">
            map keys
          </text>
          {frame.cache.map((k, pos) => (
            <g key={k} transform={`translate(${pos * 46}, 4)`}>
              <rect width={38} height={32} rx={8} fill="#161820" stroke="rgba(255,255,255,0.12)" />
              <text x={19} y={21} textAnchor="middle" fill="#f1f5f9" fontSize={13} fontFamily="JetBrains Mono, monospace">
                {k}
              </text>
            </g>
          ))}
        </g>
      </svg>
    </AlgoVizFrame>
  );
}
