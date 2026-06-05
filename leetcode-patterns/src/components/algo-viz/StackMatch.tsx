import { AlgoVizFrame } from "./AlgoVizFrame";
import { useFrames } from "./useFrames";

const INPUT = "{[()]}";
const MATCH: Record<string, string> = { ")": "(", "]": "[", "}": "{" };

interface Frame {
  i: number;
  stack: string[];
  note: string;
  status: "running" | "ok" | "bad";
  popped?: string;
}

const frames: Frame[] = (() => {
  const out: Frame[] = [];
  const stack: string[] = [];
  out.push({ i: -1, stack: [...stack], note: `begin: stack = []`, status: "running" });
  for (let i = 0; i < INPUT.length; i += 1) {
    const c = INPUT[i];
    if ("([{".includes(c)) {
      stack.push(c);
      out.push({ i, stack: [...stack], note: `push '${c}'`, status: "running" });
    } else {
      const top = stack[stack.length - 1];
      if (!top || top !== MATCH[c]) {
        out.push({ i, stack: [...stack], note: `'${c}' does not match '${top ?? "⊥"}' → invalid`, status: "bad" });
        return out;
      }
      const popped = stack.pop()!;
      out.push({ i, stack: [...stack], note: `'${c}' closes '${popped}' → pop`, status: "running", popped });
    }
  }
  out.push({
    i: INPUT.length - 1,
    stack: [...stack],
    note: stack.length === 0 ? "stack empty → valid ✓" : "stack non-empty → invalid",
    status: stack.length === 0 ? "ok" : "bad",
  });
  return out;
})();

export function StackMatch() {
  const { step, frame, running, playToggle, stepBy, reset } = useFrames(frames);
  const cellW = 50;

  return (
    <AlgoVizFrame
      title="Valid parentheses — stack matching"
      subtitle={`input = "${INPUT}"`}
      step={step}
      stepCount={frames.length}
      running={running}
      onPlayToggle={playToggle}
      onStep={stepBy}
      onReset={reset}
      caption={frame.note}
    >
      <svg viewBox={`0 0 ${cellW * INPUT.length + 200} 260`} className="w-full">
        {/* input string */}
        {INPUT.split("").map((c, i) => {
          const x = 20 + i * cellW;
          const isCurrent = i === frame.i;
          return (
            <g key={i}>
              <rect
                x={x}
                y={40}
                width={cellW - 8}
                height={50}
                rx={8}
                fill={isCurrent ? "#06b6d4" : "#1e2030"}
                stroke={isCurrent ? "#22d3ee" : "rgba(255,255,255,0.08)"}
                style={{ transition: "fill 300ms" }}
              />
              <text
                x={x + (cellW - 8) / 2}
                y={74}
                textAnchor="middle"
                fill="#f1f5f9"
                fontSize={20}
                fontFamily="JetBrains Mono, monospace"
              >
                {c}
              </text>
            </g>
          );
        })}
        {frame.i >= 0 && (
          <g transform={`translate(${20 + frame.i * cellW + (cellW - 8) / 2}, 0)`} style={{ transition: "transform 400ms" }}>
            <text x={0} y={20} textAnchor="middle" fill="#22d3ee" fontSize={12} fontFamily="JetBrains Mono, monospace" fontWeight={600}>
              ▼
            </text>
          </g>
        )}

        {/* stack (stacked vertically, rightmost is top) */}
        <g transform={`translate(${cellW * INPUT.length + 60}, 40)`}>
          <text x={0} y={-8} fill="#64748b" fontSize={11} fontFamily="JetBrains Mono, monospace">
            stack
          </text>
          <rect
            x={0}
            y={0}
            width={50}
            height={180}
            rx={6}
            fill="none"
            stroke="rgba(255,255,255,0.08)"
            strokeDasharray="3 3"
          />
          {frame.stack.map((c, idx) => (
            <g key={idx} style={{ transition: "transform 300ms" }}>
              <rect
                x={5}
                y={180 - (idx + 1) * 42}
                width={40}
                height={36}
                rx={6}
                fill="#0e3a44"
                stroke="#06b6d4"
                style={{ transition: "y 300ms" }}
              />
              <text
                x={25}
                y={180 - (idx + 1) * 42 + 24}
                textAnchor="middle"
                fill="#f1f5f9"
                fontSize={18}
                fontFamily="JetBrains Mono, monospace"
              >
                {c}
              </text>
            </g>
          ))}
        </g>

        {/* status chip */}
        <g transform="translate(20, 220)">
          <rect
            width={frame.status === "ok" ? 70 : frame.status === "bad" ? 90 : 80}
            height={22}
            rx={11}
            fill={frame.status === "ok" ? "rgba(52,211,153,0.15)" : frame.status === "bad" ? "rgba(248,113,113,0.15)" : "rgba(167,139,250,0.10)"}
            stroke={frame.status === "ok" ? "#34d399" : frame.status === "bad" ? "#f87171" : "rgba(167,139,250,0.4)"}
          />
          <text
            x={frame.status === "ok" ? 35 : frame.status === "bad" ? 45 : 40}
            y={15}
            textAnchor="middle"
            fill={frame.status === "ok" ? "#34d399" : frame.status === "bad" ? "#f87171" : "#22d3ee"}
            fontSize={11}
            fontFamily="JetBrains Mono, monospace"
            fontWeight={600}
          >
            {frame.status === "ok" ? "VALID" : frame.status === "bad" ? "INVALID" : "running..."}
          </text>
        </g>
      </svg>
    </AlgoVizFrame>
  );
}
