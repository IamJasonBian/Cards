import { AlgoVizFrame } from "./AlgoVizFrame";
import { useFrames } from "./useFrames";

const S = "ACE"; // rows (i)
const T = "ABCDE"; // cols (j)

type Src = "diag" | "maxUpLeft" | null;

interface Frame {
  i: number; // 1-indexed current cell row, 0 = none
  j: number;
  dp: number[][];
  src: Src;
  note: string;
  done?: boolean;
}

const frames: Frame[] = (() => {
  const m = S.length;
  const n = T.length;
  const dp: number[][] = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0));
  const snap = () => dp.map((row) => [...row]);
  const out: Frame[] = [
    { i: 0, j: 0, dp: snap(), src: null, note: "row 0 and column 0 start at 0 (empty prefix)" },
  ];
  for (let i = 1; i <= m; i += 1) {
    for (let j = 1; j <= n; j += 1) {
      if (S[i - 1] === T[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1] + 1;
        out.push({
          i,
          j,
          dp: snap(),
          src: "diag",
          note: `'${S[i - 1]}' == '${T[j - 1]}' → diagonal + 1 = ${dp[i][j]}`,
        });
      } else {
        dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1]);
        out.push({
          i,
          j,
          dp: snap(),
          src: "maxUpLeft",
          note: `'${S[i - 1]}' != '${T[j - 1]}' → max(up, left) = ${dp[i][j]}`,
        });
      }
    }
  }
  out.push({
    i: m,
    j: n,
    dp: snap(),
    src: null,
    done: true,
    note: `dp[${m}][${n}] = ${dp[m][n]} — LCS of "${S}" and "${T}" has length ${dp[m][n]}`,
  });
  return out;
})();

const CELL = 52;
const X0 = 70;
const Y0 = 60;

export function LcsDpTable() {
  const { step, frame, running, playToggle, stepBy, reset } = useFrames(frames, 1000);
  const m = S.length;
  const n = T.length;

  return (
    <AlgoVizFrame
      title="Longest common subsequence — DP table"
      subtitle={`s = "${S}", t = "${T}"`}
      step={step}
      stepCount={frames.length}
      running={running}
      onPlayToggle={playToggle}
      onStep={stepBy}
      onReset={reset}
      caption={frame.note}
    >
      <svg viewBox={`0 0 ${X0 + (n + 1) * CELL + 20} ${Y0 + (m + 1) * CELL + 20}`} className="w-full">
        {/* column header: chars of T */}
        {T.split("").map((c, j) => (
          <text
            key={`th-${j}`}
            x={X0 + (j + 1) * CELL + CELL / 2}
            y={Y0 - 14}
            textAnchor="middle"
            fill="#22d3ee"
            fontSize={14}
            fontFamily="JetBrains Mono, monospace"
            fontWeight={600}
          >
            {c}
          </text>
        ))}
        {/* row header: chars of S */}
        {S.split("").map((c, i) => (
          <text
            key={`sh-${i}`}
            x={X0 - 16}
            y={Y0 + (i + 1) * CELL + CELL / 2 + 5}
            textAnchor="middle"
            fill="#34d399"
            fontSize={14}
            fontFamily="JetBrains Mono, monospace"
            fontWeight={600}
          >
            {c}
          </text>
        ))}
        {frame.dp.map((row, i) =>
          row.map((v, j) => {
            const filled = i === 0 || j === 0 || i < frame.i || (i === frame.i && j <= frame.j);
            const isCur = i === frame.i && j === frame.j && frame.i > 0;
            const isSrc =
              frame.src === "diag"
                ? i === frame.i - 1 && j === frame.j - 1
                : frame.src === "maxUpLeft"
                ? (i === frame.i - 1 && j === frame.j) || (i === frame.i && j === frame.j - 1)
                : false;
            const isAnswer = frame.done && i === m && j === n;
            const fill = isAnswer
              ? "#10b981"
              : isCur
              ? "#06b6d4"
              : isSrc
              ? "#0d9e6e"
              : filled
              ? "#1e2030"
              : "#111218";
            return (
              <g key={`${i}-${j}`}>
                <rect
                  x={X0 + j * CELL}
                  y={Y0 + i * CELL}
                  width={CELL - 6}
                  height={CELL - 6}
                  rx={8}
                  fill={fill}
                  stroke={isCur || isAnswer ? "#22d3ee" : "rgba(255,255,255,0.08)"}
                  strokeWidth={isCur || isAnswer ? 2 : 1}
                  style={{ transition: "fill 300ms" }}
                  opacity={filled ? 1 : 0.4}
                />
                <text
                  x={X0 + j * CELL + (CELL - 6) / 2}
                  y={Y0 + i * CELL + (CELL - 6) / 2 + 5}
                  textAnchor="middle"
                  fill="#f1f5f9"
                  fontSize={15}
                  fontFamily="JetBrains Mono, monospace"
                  opacity={filled ? 1 : 0.35}
                >
                  {filled ? v : ""}
                </text>
              </g>
            );
          })
        )}
      </svg>
    </AlgoVizFrame>
  );
}
