import { TwoPointers } from "./TwoPointers";
import { SlidingWindow } from "./SlidingWindow";
import { BinarySearch } from "./BinarySearch";
import { BFSLayerOrder } from "./BFSLayerOrder";
import { FloydsCycle } from "./FloydsCycle";
import { StackMatch } from "./StackMatch";

export type VizKind =
  | "two-pointers"
  | "sliding-window"
  | "binary-search"
  | "bfs-layer"
  | "floyds-cycle"
  | "stack-match";

export function AlgoViz({ kind }: { kind: VizKind }) {
  switch (kind) {
    case "two-pointers":
      return <TwoPointers />;
    case "sliding-window":
      return <SlidingWindow />;
    case "binary-search":
      return <BinarySearch />;
    case "bfs-layer":
      return <BFSLayerOrder />;
    case "floyds-cycle":
      return <FloydsCycle />;
    case "stack-match":
      return <StackMatch />;
  }
}
