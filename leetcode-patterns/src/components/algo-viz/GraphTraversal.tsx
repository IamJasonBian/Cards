import { AlgoVizFrame } from "./AlgoVizFrame";
import { Cell, Edge, Ink, Node, Sketch, type Tone } from "./paper";
import { useViz, type NonEmpty, type Scenario } from "./useViz";

interface GraphNode {
  id: string;
  x: number;
  y: number;
}

interface Input {
  /** Where each node is drawn. */
  nodes: GraphNode[];
  /** Adjacency list, as real code would hold it. A node can be missing its entry. */
  adj: Partial<Record<string, string[]>>;
  start: string;
}

interface Frame {
  queue: string[];
  /** Nodes marked visited, in the order BFS discovered them. */
  visited: string[];
  /** Nodes already popped and fully scanned. */
  done: string[];
  current: string | null;
  /** The neighbor link being checked: [from, to]. */
  edge: [string, string] | null;
  /** Nodes to call out: a broken entry, or nodes BFS never reached. */
  flagged: string[];
  note: string;
}

const SCENARIOS: NonEmpty<Scenario<Input>> = [
  {
    // Not a tree: two cycles, so D and G can each be reached two ways.
    id: "cycles",
    label: "graph with cycles",
    input: {
      start: "A",
      nodes: [
        { id: "A", x: 90, y: 90 },
        { id: "B", x: 250, y: 60 },
        { id: "C", x: 170, y: 200 },
        { id: "D", x: 330, y: 170 },
        { id: "E", x: 470, y: 120 },
        { id: "F", x: 250, y: 300 },
        { id: "G", x: 430, y: 270 },
      ],
      adj: {
        A: ["B", "C"],
        B: ["A", "D"],
        C: ["A", "D", "F"],
        D: ["B", "C", "E"],
        E: ["D", "G"],
        F: ["C", "G"],
        G: ["E", "F"],
      },
    },
  },
  {
    id: "islands",
    label: "two components",
    input: {
      start: "A",
      nodes: [
        { id: "A", x: 90, y: 90 },
        { id: "B", x: 250, y: 60 },
        { id: "C", x: 170, y: 200 },
        { id: "D", x: 330, y: 170 },
        { id: "E", x: 470, y: 90 },
        { id: "F", x: 470, y: 250 },
      ],
      adj: { A: ["B", "C"], B: ["A", "D"], C: ["A", "D"], D: ["B", "C"], E: ["F"], F: ["E"] },
    },
  },
  {
    // B, C and E all list D as a neighbor, but D has no entry of its own.
    id: "missing",
    label: "missing adjacency entry",
    malformed: true,
    input: {
      start: "A",
      nodes: [
        { id: "A", x: 90, y: 90 },
        { id: "B", x: 250, y: 60 },
        { id: "C", x: 170, y: 200 },
        { id: "D", x: 330, y: 170 },
        { id: "E", x: 470, y: 120 },
      ],
      adj: { A: ["B", "C"], B: ["A", "D"], C: ["A", "D"], E: ["D"] },
    },
  },
];

function buildFrames({ nodes, adj, start }: Input): NonEmpty<Frame> {
  const queue = [start];
  const visited = [start];
  const done: string[] = [];
  let current: string | null = null;
  const snap = (note: string, edge: Frame["edge"] = null, flagged: string[] = []): Frame => ({
    queue: [...queue],
    visited: [...visited],
    done: [...done],
    current,
    edge,
    flagged,
    note,
  });

  const out: NonEmpty<Frame> = [snap(`BFS from ${start}: mark ${start} visited and put it in the queue.`)];
  const broken: string[] = [];
  for (let u = queue.shift(); u !== undefined; u = queue.shift()) {
    current = u;
    const neighbors = adj[u];
    if (neighbors === undefined) {
      broken.push(u);
      out.push(snap(`Pop ${u} and look up adj[${u}]. There is no such entry: other lists mention ${u}, but ${u} has no list of its own.`, null, [u]));
      out.push(
        snap(`In Python, adj[${u}] raises KeyError here. Build the list with defaultdict(list) and add both directions of every edge, or read adj.get(${u}, []).`, null, [u])
      );
    } else {
      out.push(snap(`Pop ${u} from the front and scan its neighbors: ${neighbors.join(", ") || "none"}.`));
    }
    for (const v of neighbors ?? []) {
      if (visited.includes(v)) {
        out.push(snap(`${v} is already visited, so skip it. This check is what stops cycles from looping forever.`, [u, v]));
      } else {
        visited.push(v);
        queue.push(v);
        out.push(snap(`${v} is new: mark it visited now and push it to the back of the queue.`, [u, v]));
      }
    }
    done.push(u);
  }

  current = null;
  const missed = nodes.map((n) => n.id).filter((id) => !visited.includes(id));
  const order = visited.join(", ");
  if (missed.length === 0 && broken.length === 0) {
    out.push(snap(`Queue is empty. All ${visited.length} nodes were visited exactly once, in order ${order}.`));
  } else if (broken.length > 0) {
    out.push(
      snap(
        `Queue is empty. Visited ${order}, treating ${broken.join(", ")} as having no neighbors. ${
          missed.length > 0 ? `${missed.join(", ")} was never reached, so the answer is silently incomplete.` : ""
        } Fix the adjacency list instead of hiding the error.`,
        null,
        [...broken, ...missed]
      )
    );
  } else {
    out.push(
      snap(
        `Queue is empty. Visited ${order}, but never reached ${missed.join(", ")}: no path leads there from ${start}. To cover every component, start a new BFS from each unvisited node.`,
        null,
        missed
      )
    );
  }
  return out;
}

const QUEUE_Y = 346;
const CELL = 36;

export function GraphTraversal() {
  const { input, frame, controls } = useViz(SCENARIOS, buildFrames);
  const { nodes, adj } = input;
  const pos = new Map(nodes.map((n) => [n.id, n]));

  // Each undirected edge is drawn once, even if only one endpoint lists it.
  const edges = [
    ...new Set(Object.entries(adj).flatMap(([u, vs]) => (vs ?? []).map((v) => [u, v].sort().join(" ")))),
  ].map((key) => key.split(" "));
  const isChecked = (u: string, v: string) =>
    frame.edge !== null && frame.edge.includes(u) && frame.edge.includes(v);

  const tone = (id: string): Tone => {
    if (frame.flagged.includes(id) || frame.current === id) return "active";
    if (frame.done.includes(id)) return "done";
    return frame.visited.includes(id) ? "idle" : "dim";
  };

  return (
    <AlgoVizFrame
      title="Graph BFS"
      subtitle="adjacency list + queue + visited set"
      caption={frame.note}
      {...controls}
    >
      <Sketch
        width={560}
        height={430}
        label={`Graph with nodes ${nodes.map((n) => n.id).join(", ")}, the BFS queue and the visited set`}
      >
        {edges.map(([u, v]) => {
          const a = pos.get(u);
          const b = pos.get(v);
          if (!a || !b) return null;
          return (
            <Edge key={`${u} ${v}`} x1={a.x} y1={a.y} x2={b.x} y2={b.y} trim={22} tone={isChecked(u, v) ? "active" : "idle"} />
          );
        })}
        {nodes.map((n) => (
          <Node key={n.id} x={n.x} y={n.y} tone={tone(n.id)} label={n.id} />
        ))}

        <Ink x={20} y={QUEUE_Y + CELL / 2} anchor="start">
          queue
        </Ink>
        {frame.queue.map((id, i) => (
          <Cell key={id} x={84 + i * (CELL + 6)} y={QUEUE_Y} w={CELL} label={id} sub={i === 0 ? "front" : undefined} />
        ))}
        {frame.queue.length === 0 && (
          <Ink x={84} y={QUEUE_Y + CELL / 2} anchor="start" tone="dim">
            empty
          </Ink>
        )}
        <Ink x={20} y={412} anchor="start">
          visited = {`{${frame.visited.join(", ")}}`}
        </Ink>
      </Sketch>
    </AlgoVizFrame>
  );
}
