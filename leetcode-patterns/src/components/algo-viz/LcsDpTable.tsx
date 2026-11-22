import { AlgoVizFrame } from "./AlgoVizFrame";
import { Cell, Edge, Ink, Sketch, type Tone } from "./paper";
import { useViz, type NonEmpty, type Scenario } from "./useViz";

interface Input {
  /** Rows of the table. */
  s: string;
  /** Columns of the table. */
  t: string;
}

interface Pos {
  i: number;
  j: number;
}

interface Frame {
  /** Cell being written (prefix lengths); 0,0 = only the base row and column exist. */
  i: number;
  j: number;
  dp: number[][];
  /** Cells the current write reads from. */
  reads: Pos[];
  note: string;
  done?: boolean;
  /** One string is empty: the table is only its base row or column. */
  collapsed?: boolean;
}

const SCENARIOS: NonEmpty<Scenario<Input>> = [
  { id: "normal", label: "ACE vs ABCDE", input: { s: "ACE", t: "ABCDE" } },
  { id: "disjoint", label: "nothing in common", input: { s: "AB", t: "XYZ" } },
  { id: "empty", label: "empty string", malformed: true, input: { s: "", t: "ABCDE" } },
];

function buildFrames({ s, t }: Input): NonEmpty<Frame> {
  const m = s.length;
  const n = t.length;
  const dp = Array.from({ length: m + 1 }, () => Array.from({ length: n + 1 }, () => 0));
  const snap = () => dp.map((row) => [...row]);
  const out: NonEmpty<Frame> = [
    { i: 0, j: 0, dp: snap(), reads: [], note: "Row 0 and column 0 are 0: an empty prefix has nothing in common with anything." },
  ];

  if (m === 0 || n === 0) {
    const [name, missing, base] = m === 0 ? ["s", "rows", "row"] : ["t", "columns", "column"];
    out.push({
      i: 0,
      j: 0,
      dp: snap(),
      reads: [],
      collapsed: true,
      note: `Degenerate input: ${name} is empty, so there are no ${missing} to fill. The table is only its base ${base} and the loops never run.`,
    });
    out.push({
      i: m,
      j: n,
      dp: snap(),
      reads: [],
      done: true,
      note: `dp[${m}][${n}] = 0: nothing is common with an empty string. Real code should return 0 early, or at least still allocate the base ${base} so dp[m][n] exists.`,
    });
    return out;
  }

  for (let i = 1; i <= m; i += 1) {
    for (let j = 1; j <= n; j += 1) {
      const a = s[i - 1];
      const b = t[j - 1];
      if (a === b) {
        const diag = dp[i - 1][j - 1];
        dp[i][j] = diag + 1;
        out.push({
          i,
          j,
          dp: snap(),
          reads: [{ i: i - 1, j: j - 1 }],
          note: `'${a}' = '${b}': dp[${i}][${j}] = dp[${i - 1}][${j - 1}] + 1 = ${diag} + 1 = ${dp[i][j]}`,
        });
      } else {
        const up = dp[i - 1][j];
        const left = dp[i][j - 1];
        dp[i][j] = Math.max(up, left);
        out.push({
          i,
          j,
          dp: snap(),
          reads: [
            { i: i - 1, j },
            { i, j: j - 1 },
          ],
          note: `'${a}' ≠ '${b}': dp[${i}][${j}] = max(dp[${i - 1}][${j}], dp[${i}][${j - 1}]) = max(${up}, ${left}) = ${dp[i][j]}`,
        });
      }
    }
  }
  out.push({
    i: m,
    j: n,
    dp: snap(),
    reads: [],
    done: true,
    note: `Done: dp[${m}][${n}] = ${dp[m][n]}, so the LCS of "${s}" and "${t}" has length ${dp[m][n]}.`,
  });
  return out;
}

const CELL = 44;
const GAP = 16;
const PAD = 24;
const HEAD = 30;
const STEP = CELL + GAP;
const EMPTY = "∅";

export function LcsDpTable() {
  const { input, frame, controls } = useViz(SCENARIOS, buildFrames, 1000);
  const { s, t } = input;
  const m = s.length;
  const n = t.length;
  const cx = (j: number) => PAD + HEAD + j * STEP + CELL / 2;
  const cy = (i: number) => PAD + HEAD + i * STEP + CELL / 2;

  const tone = (i: number, j: number): Tone => {
    if (frame.done) return i === m && j === n ? "done" : "idle";
    if (frame.collapsed) return "active";
    if (frame.i > 0 && i === frame.i && j === frame.j) return "active";
    if (frame.reads.some((p) => p.i === i && p.j === j)) return "done";
    const filled = i === 0 || j === 0 || i < frame.i || (i === frame.i && j < frame.j);
    return filled ? "idle" : "dim";
  };

  return (
    <AlgoVizFrame
      title="Longest common subsequence: DP table"
      subtitle={`s = "${s}" (rows), t = "${t}" (columns)`}
      caption={frame.note}
      {...controls}
    >
      <Sketch
        width={PAD * 2 + HEAD + (n + 1) * STEP - GAP}
        height={PAD * 2 + HEAD + (m + 1) * STEP - GAP}
        label={`LCS table for "${s}" and "${t}"`}
      >
        {[EMPTY, ...t].map((c, j) => (
          <Ink key={`t${j}`} x={cx(j)} y={PAD + HEAD / 2} size={18} tone={j === 0 ? "dim" : "idle"} bold={j > 0 && j === frame.j}>
            {c}
          </Ink>
        ))}
        {[EMPTY, ...s].map((c, i) => (
          <Ink key={`s${i}`} x={PAD + HEAD / 2} y={cy(i)} size={18} tone={i === 0 ? "dim" : "idle"} bold={i > 0 && i === frame.i}>
            {c}
          </Ink>
        ))}
        {frame.dp.map((row, i) =>
          row.map((v, j) => {
            const cellTone = tone(i, j);
            return (
              <Cell
                key={`${i}-${j}`}
                x={cx(j) - CELL / 2}
                y={cy(i) - CELL / 2}
                w={CELL}
                tone={cellTone}
                label={cellTone === "dim" ? undefined : v}
              />
            );
          })
        )}
        {/* Arrows cross only the gap between a read cell and the written cell. */}
        {frame.reads.map((p) => {
          const dx = frame.j - p.j;
          const dy = frame.i - p.i;
          return (
            <Edge
              key={`${p.i}-${p.j}`}
              x1={cx(p.j) + (dx * CELL) / 2}
              y1={cy(p.i) + (dy * CELL) / 2}
              x2={cx(frame.j) - (dx * CELL) / 2}
              y2={cy(frame.i) - (dy * CELL) / 2}
              arrow
            />
          );
        })}
      </Sketch>
    </AlgoVizFrame>
  );
}
