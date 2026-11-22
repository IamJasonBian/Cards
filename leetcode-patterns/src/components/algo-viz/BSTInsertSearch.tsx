import { AlgoVizFrame } from "./AlgoVizFrame";
import { Edge, Node, Sketch, type Tone } from "./paper";
import { useViz, type NonEmpty, type Scenario } from "./useViz";

type Side = "left" | "right";

interface Op {
  kind: "insert" | "search";
  key: number;
}

interface Input {
  /** Keys inserted, in this order, before the animation starts. */
  keys: number[];
  ops: Op[];
}

interface TreeNode {
  key: number;
  parent: number | null;
  left: number | null;
  right: number | null;
  x: number;
  y: number;
}

interface Frame {
  /** The tree as it exists at this step; a node's id is its index. */
  nodes: TreeNode[];
  /** Node ids compared so far, root first. The last one is the current node. */
  path: number[];
  note: string;
  /** The current node is the answer: the key was found or just inserted. */
  hit?: boolean;
  /** The empty child slot of the current node where a search fell off the tree. */
  hole?: Side;
}

const SCENARIOS: NonEmpty<Scenario<Input>> = [
  {
    id: "basic",
    label: "insert, then search",
    input: {
      keys: [8, 3, 10, 1, 6, 14],
      ops: [
        { kind: "insert", key: 7 },
        { kind: "search", key: 14 },
      ],
    },
  },
  {
    id: "miss",
    label: "search miss",
    input: { keys: [8, 3, 10, 1, 6, 14], ops: [{ kind: "search", key: 9 }] },
  },
  {
    id: "duplicate",
    label: "duplicate key",
    malformed: true,
    input: { keys: [8, 3, 10, 1, 6, 14], ops: [{ kind: "insert", key: 6 }] },
  },
];

const W = 560;
const PAD = 40;
const TOP = 40;
const ROW = 72;

/** Walk down from the root. `side` is the empty slot where `key` belongs, or null if the walk ended on `key`. */
function walk(nodes: TreeNode[], key: number): { path: number[]; side: Side | null } {
  const path: number[] = [];
  let cur: number | null = nodes.length > 0 ? 0 : null;
  while (cur !== null) {
    path.push(cur);
    const node: TreeNode = nodes[cur];
    if (key === node.key) return { path, side: null };
    const side: Side = key < node.key ? "left" : "right";
    if (node[side] === null) return { path, side };
    cur = node[side];
  }
  return { path, side: null };
}

function buildFrames({ keys, ops }: Input): NonEmpty<Frame> {
  // An in-order walk of a BST is sorted, so a key's rank among all keys gives its column.
  const inserts = ops.filter((op) => op.kind === "insert").map((op) => op.key);
  const sorted = [...new Set([...keys, ...inserts])].sort((a, b) => a - b);
  const gap = (W - PAD * 2) / Math.max(1, sorted.length - 1);

  const nodes: TreeNode[] = [];
  /** Hang `key` under `parent` (or make it the root) and return its id. */
  const attach = (key: number, parent: number | null, side: Side | null): number => {
    const id = nodes.length;
    const x = PAD + sorted.indexOf(key) * gap;
    const y = parent === null ? TOP : nodes[parent].y + ROW;
    nodes.push({ key, parent, left: null, right: null, x, y });
    if (parent !== null && side !== null) nodes[parent][side] = id;
    return id;
  };

  for (const key of keys) {
    const { path, side } = walk(nodes, key);
    if (path.length === 0) attach(key, null, null);
    else if (side !== null) attach(key, path[path.length - 1], side);
  }

  const out: NonEmpty<Frame> = [
    {
      nodes: [...nodes],
      path: [],
      note: "BST rule: everything left of a node is smaller, everything right of it is larger.",
    },
  ];
  const emit = (path: number[], note: string, extra: Partial<Frame> = {}) =>
    out.push({ nodes: [...nodes], path, note, ...extra });

  for (const { kind, key } of ops) {
    const { path, side } = walk(nodes, key);
    if (path.length === 0) {
      if (kind === "search") {
        emit([], `search(${key}): the tree is empty, so ${key} is not here. Return null.`);
      } else {
        emit([attach(key, null, null)], `insert(${key}): the tree is empty, so ${key} becomes the root.`, { hit: true });
      }
      continue;
    }

    path.forEach((id, i) => {
      if (i === 0) {
        emit([id], `${kind}(${key}): start at the root, ${nodes[id].key}.`);
        return;
      }
      const from = nodes[path[i - 1]].key;
      const turn = key < from ? `${key} < ${from}, so go left` : `${key} > ${from}, so go right`;
      emit(path.slice(0, i + 1), `${turn} to ${nodes[id].key}. The other subtree cannot hold ${key}.`);
    });

    const end = nodes[path[path.length - 1]].key;
    const cmp = key < end ? "<" : ">";
    const steps = `${path.length} ${path.length === 1 ? "comparison" : "comparisons"}`;
    if (side === null && kind === "search") {
      emit(path, `${key} == ${end}: found after ${steps}. Each step dropped a whole subtree, so the cost is O(height).`, {
        hit: true,
      });
    } else if (side === null) {
      emit(path, `${key} == ${end}: the key is already in the tree. A BST holds each key once.`);
      emit(
        path,
        `A second ${key} would have to sit left or right of this one, and "left < node < right" would no longer hold for it.`
      );
      emit(
        path,
        `Real code stops here: return the existing node, overwrite its value, or bump a count on it. The tree stays at ${nodes.length} nodes.`
      );
    } else if (kind === "search") {
      emit(path, `${key} ${cmp} ${end}, but ${end} has no ${side} child. ${key} is not in the tree: return null after ${steps}.`, {
        hole: side,
      });
    } else {
      const id = attach(key, path[path.length - 1], side);
      emit([...path, id], `${key} ${cmp} ${end} and ${end} has no ${side} child, so ${key} becomes its ${side} leaf.`, {
        hit: true,
      });
    }
  }
  return out;
}

export function BSTInsertSearch() {
  const { input, frame, controls } = useViz(SCENARIOS, buildFrames, 1100);
  const { nodes, path } = frame;
  const cur = path.length > 0 ? path[path.length - 1] : null;

  const inSubtree = (id: number): boolean => {
    for (let a: number | null = id; a !== null; a = nodes[a].parent) if (a === cur) return true;
    return false;
  };
  // Subtrees the walk turned away from are dimmed: the algorithm never looks at them.
  const tone = (id: number): Tone => {
    if (id === cur) return frame.hit ? "done" : "active";
    return cur === null || path.includes(id) || inSubtree(id) ? "idle" : "dim";
  };
  const edgeTone = (id: number, parent: number): "idle" | "active" | "dim" => {
    if (path.includes(id) && path.includes(parent)) return "active";
    return tone(id) === "dim" ? "dim" : "idle";
  };

  const at = cur === null ? null : nodes[cur];
  const hole = at && frame.hole ? { x: at.x + (frame.hole === "left" ? -40 : 40), y: at.y + ROW } : null;

  return (
    <AlgoVizFrame
      title="BST insert / search"
      subtitle={input.ops.map((op) => `${op.kind}(${op.key})`).join(", then ")}
      caption={frame.note}
      {...controls}
    >
      <Sketch
        width={W}
        height={TOP + ROW * 3 + 40}
        label={`Binary search tree holding ${nodes.map((n) => n.key).join(", ")}`}
      >
        {nodes.map((n, id) => {
          if (n.parent === null) return null;
          const p = nodes[n.parent];
          return <Edge key={id} x1={p.x} y1={p.y} x2={n.x} y2={n.y} trim={22} tone={edgeTone(id, n.parent)} />;
        })}
        {at && hole && <Edge x1={at.x} y1={at.y} x2={hole.x} y2={hole.y} trim={22} tone="dim" />}
        {hole && <Node x={hole.x} y={hole.y} tone="dim" label="null" />}
        {nodes.map((n, id) => (
          <Node key={id} x={n.x} y={n.y} tone={tone(id)} label={n.key} />
        ))}
      </Sketch>
    </AlgoVizFrame>
  );
}
