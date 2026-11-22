import { AlgoVizFrame } from "./AlgoVizFrame";
import { Cell, Edge, Ink, Node, Sketch, type Tone } from "./paper";
import { useViz, type NonEmpty, type Scenario } from "./useViz";

interface TreeNode {
  val: string;
  x: number;
  y: number;
  /** Index of the parent in `nodes`, null for the root. Children are listed left to right. */
  parent: number | null;
}

interface Input {
  nodes: TreeNode[];
  /** Index of the root in `nodes`, or null for an empty tree. */
  root: number | null;
}

interface Frame {
  queue: number[];
  /** Nodes already popped and placed in a level. */
  done: number[];
  current: number | null;
  /** Children pushed onto the queue in this step. */
  added: number[];
  levels: string[][];
  note: string;
  /** The root is None: there is no tree to walk. */
  nullRoot?: boolean;
}

//        A
//      /   \
//     B     C
//    / \     \
//   D   E     F
//              \
//               G
const SCENARIOS: NonEmpty<Scenario<Input>> = [
  {
    id: "tree",
    label: "4 levels",
    input: {
      root: 0,
      nodes: [
        { val: "A", x: 300, y: 50, parent: null },
        { val: "B", x: 180, y: 130, parent: 0 },
        { val: "C", x: 420, y: 130, parent: 0 },
        { val: "D", x: 110, y: 210, parent: 1 },
        { val: "E", x: 250, y: 210, parent: 1 },
        { val: "F", x: 420, y: 210, parent: 2 },
        { val: "G", x: 500, y: 290, parent: 5 },
      ],
    },
  },
  {
    id: "chain",
    label: "one node per level",
    input: {
      root: 0,
      nodes: [
        { val: "A", x: 180, y: 50, parent: null },
        { val: "B", x: 260, y: 130, parent: 0 },
        { val: "C", x: 340, y: 210, parent: 1 },
        { val: "D", x: 420, y: 290, parent: 2 },
      ],
    },
  },
  { id: "empty", label: "empty tree", malformed: true, input: { root: null, nodes: [] } },
];

const showLevels = (levels: string[][]) => `[${levels.map((l) => `[${l.join(", ")}]`).join(", ")}]`;

function buildFrames({ nodes, root }: Input): NonEmpty<Frame> {
  if (root === null) {
    const empty = { queue: [], done: [], current: null, added: [], levels: [], nullRoot: true };
    return [
      { ...empty, note: "root is None: the tree has no nodes at all." },
      {
        ...empty,
        note: "Code that starts with queue = [root] would pop None and crash on None.left. Check for it first: if not root, return [].",
      },
      { ...empty, note: "Nothing is enqueued and the loop never runs. Result: [] (zero levels)." },
    ];
  }

  const kids = nodes.map((_, i) => nodes.flatMap((n, j) => (n.parent === i ? [j] : [])));
  const name = (i: number) => nodes[i].val;
  const queue = [root];
  const done: number[] = [];
  const levels: string[][] = [];
  let current: number | null = null;
  let added: number[] = [];
  const snap = (note: string): Frame => ({
    queue: [...queue],
    done: [...done],
    current,
    added,
    levels: levels.map((l) => [...l]),
    note,
  });

  const out: NonEmpty<Frame> = [snap(`Put the root ${name(root)} in the queue.`)];
  while (queue.length > 0) {
    // Everything in the queue right now is one full level, so pop exactly that many.
    const size = queue.length;
    const depth = levels.length;
    const level: string[] = [];
    levels.push(level);
    current = null;
    added = [];
    out.push(
      snap(`The queue holds ${size} ${size === 1 ? "node" : "nodes"}: that is all of level ${depth}. Pop exactly ${size}.`)
    );
    for (let i = 0; i < size; i += 1) {
      const u = queue.shift();
      if (u === undefined) break;
      current = u;
      added = [];
      level.push(name(u));
      const leaf = kids[u].length === 0 ? " It has no children." : "";
      out.push(snap(`Pop ${name(u)} from the front and add it to level ${depth}.${leaf}`));
      if (kids[u].length > 0) {
        queue.push(...kids[u]);
        added = kids[u];
        out.push(snap(`Push ${name(u)}'s children (${kids[u].map(name).join(", ")}) to the back. They wait for level ${depth + 1}.`));
      }
      done.push(u);
    }
  }
  current = null;
  added = [];
  out.push(snap(`The queue is empty, so every node is placed. Level order: ${showLevels(levels)}.`));
  return out;
}

const W = 600;
const QUEUE_Y = 338;
const CELL = 36;

export function BFSLayerOrder() {
  const { input, frame, controls } = useViz(SCENARIOS, buildFrames);
  const { nodes } = input;

  const tone = (i: number): Tone => {
    if (frame.current === i) return "active";
    if (frame.done.includes(i)) return "done";
    return frame.queue.includes(i) ? "idle" : "dim";
  };

  return (
    <AlgoVizFrame
      title="Level-order BFS"
      subtitle="a queue, drained one level at a time"
      caption={frame.note}
      {...controls}
    >
      <Sketch
        width={W}
        height={430}
        label={
          nodes.length > 0
            ? `Binary tree with nodes ${nodes.map((n) => n.val).join(", ")} and the BFS queue`
            : "An empty tree and an empty BFS queue"
        }
      >
        {nodes.map((n, i) => {
          if (n.parent === null) return null;
          const p = nodes[n.parent];
          const edgeTone = frame.added.includes(i) ? "active" : tone(i) === "dim" ? "dim" : "idle";
          return <Edge key={i} x1={p.x} y1={p.y} x2={n.x} y2={n.y} trim={22} tone={edgeTone} />;
        })}
        {nodes.map((n, i) => (
          <Node key={i} x={n.x} y={n.y} tone={tone(i)} label={n.val} />
        ))}
        {frame.nullRoot && <Node x={W / 2} y={130} r={30} tone="active" label="None" sub="root" />}

        <Ink x={20} y={QUEUE_Y + CELL / 2} anchor="start">
          queue
        </Ink>
        {frame.queue.map((id, i) => (
          <Cell
            key={id}
            x={84 + i * (CELL + 6)}
            y={QUEUE_Y}
            w={CELL}
            tone={frame.added.includes(id) ? "active" : "idle"}
            label={nodes[id].val}
            sub={i === 0 ? "front" : undefined}
          />
        ))}
        {frame.queue.length === 0 && (
          <Ink x={84} y={QUEUE_Y + CELL / 2} anchor="start" tone="dim">
            empty
          </Ink>
        )}
        <Ink x={20} y={410} anchor="start">
          levels = {showLevels(frame.levels)}
        </Ink>
      </Sketch>
    </AlgoVizFrame>
  );
}
