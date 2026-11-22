import { AlgoVizFrame } from "./AlgoVizFrame";
import { Cell, Edge, Ink, Pointer, Sketch, type Tone } from "./paper";
import { useViz, type NonEmpty, type Scenario } from "./useViz";

interface Input {
  text: string;
}

interface Frame {
  /** Index of the character being read; -1 before the scan, text.length after it. */
  i: number;
  stack: string[];
  note: string;
  valid?: boolean;
  /** The top of the stack is what makes the input invalid. */
  blameTop?: boolean;
}

const SCENARIOS: NonEmpty<Scenario<Input>> = [
  { id: "valid", label: "balanced", input: { text: "{[()]}" } },
  { id: "extra-closer", label: "closer on empty stack", input: { text: "())" } },
  { id: "not-a-bracket", label: "non-bracket character", malformed: true, input: { text: "{[x]}" } },
];

const OPENERS = "([{";
const OPENER_FOR = new Map([
  [")", "("],
  ["]", "["],
  ["}", "{"],
]);

function buildFrames({ text }: Input): NonEmpty<Frame> {
  const stack: string[] = [];
  const out: NonEmpty<Frame> = [{ i: -1, stack: [], note: "Start with an empty stack. Openers get pushed, closers must match the top." }];

  for (const [i, c] of [...text].entries()) {
    if (OPENERS.includes(c)) {
      stack.push(c);
      out.push({ i, stack: [...stack], note: `'${c}' is an opener: push it.` });
      continue;
    }
    const want = OPENER_FOR.get(c);
    const top = stack.at(-1);
    if (want === undefined) {
      out.push({ i, stack: [...stack], note: `Precondition broken: '${c}' at index ${i} is not one of ()[]{}.` });
      out.push({
        i,
        stack: [...stack],
        note: `It is neither an opener nor a closer, so there is nothing to compare it with. No answer: real code should reject the input, or skip such characters if the spec says to ignore them.`,
      });
      return out;
    }
    if (top === undefined) {
      out.push({
        i,
        stack: [],
        valid: false,
        note: `'${c}' needs '${want}' on top, but the stack is empty. Invalid. Check for an empty stack before popping.`,
      });
      return out;
    }
    if (top !== want) {
      out.push({
        i,
        stack: [...stack],
        valid: false,
        blameTop: true,
        note: `'${c}' needs '${want}' on top, but the top is '${top}'. Invalid.`,
      });
      return out;
    }
    stack.pop();
    out.push({ i, stack: [...stack], note: `'${c}' closes the top '${top}': pop it.` });
  }

  out.push(
    stack.length === 0
      ? { i: text.length, stack: [], valid: true, note: "End of input and the stack is empty: every opener was closed. Valid." }
      : {
          i: text.length,
          stack: [...stack],
          valid: false,
          blameTop: true,
          note: `End of input but ${stack.length} opener${stack.length === 1 ? " is" : "s are"} still on the stack, never closed. Invalid.`,
        }
  );
  return out;
}

const CELL = 48;
const GAP = 8;
const PAD = 24;
const SLOT = CELL + GAP;
const ROW_Y = 58;
const BIN_TOP = 36;

export function StackMatch() {
  const { input, frame, controls } = useViz(SCENARIOS, buildFrames);
  const chars = [...input.text];
  // The stack can never be deeper than the number of openers in the input.
  const depth = Math.max(1, chars.filter((c) => OPENERS.includes(c)).length);
  const cx = (i: number) => PAD + i * SLOT + CELL / 2;
  const binX = PAD + Math.max(chars.length, 1) * SLOT + 40;
  const binBottom = BIN_TOP + depth * SLOT + GAP / 2;
  const binW = CELL + GAP * 2;

  const charTone = (i: number): Tone => {
    if (frame.valid) return "done";
    if (i === frame.i) return "active";
    return i < frame.i ? "dim" : "idle";
  };
  const stackTone = (idx: number): Tone => {
    if (idx < frame.stack.length - 1) return "idle";
    return frame.blameTop ? "active" : "done";
  };

  return (
    <AlgoVizFrame
      title="Valid parentheses: stack matching"
      subtitle={`input = "${input.text}"`}
      caption={frame.note}
      {...controls}
    >
      <Sketch
        width={binX + binW + PAD}
        height={Math.max(ROW_Y + CELL + 30, binBottom + 20)}
        label={`Characters of "${input.text}" and the stack of open brackets`}
      >
        {chars.map((c, i) => (
          <Cell key={i} x={cx(i) - CELL / 2} y={ROW_Y} w={CELL} tone={charTone(i)} label={c} sub={i} />
        ))}
        {frame.i >= 0 && frame.i < chars.length && <Pointer x={cx(frame.i)} y={ROW_Y - 2} label="i" />}

        <Ink x={binX + binW / 2} y={16} tone="dim">
          {frame.stack.length === 0 ? "stack (empty)" : "stack"}
        </Ink>
        {/* Open-topped bin: left wall, floor, right wall. */}
        <Edge x1={binX} y1={BIN_TOP} x2={binX} y2={binBottom} />
        <Edge x1={binX} y1={binBottom} x2={binX + binW} y2={binBottom} />
        <Edge x1={binX + binW} y1={BIN_TOP} x2={binX + binW} y2={binBottom} />
        {frame.stack.map((c, idx) => (
          <Cell key={idx} x={binX + GAP} y={binBottom - (idx + 1) * SLOT} w={CELL} tone={stackTone(idx)} label={c} />
        ))}
      </Sketch>
    </AlgoVizFrame>
  );
}
