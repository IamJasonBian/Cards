import { TwoPointers } from "./TwoPointers";
import { SlidingWindow } from "./SlidingWindow";
import { BinarySearch } from "./BinarySearch";
import { FastSlowMiddle } from "./FastSlowMiddle";
import { BSTInsertSearch } from "./BSTInsertSearch";
import { LcsDpTable } from "./LcsDpTable";
import { HeapTopK } from "./HeapTopK";
import { GraphTraversal } from "./GraphTraversal";
import { BFSLayerOrder } from "./BFSLayerOrder";
import { FloydsCycle } from "./FloydsCycle";
import { StackMatch } from "./StackMatch";

export type VizKind =
  | "two-pointers"
  | "sliding-window"
  | "binary-search"
  | "fast-slow-middle"
  | "bst-insert-search"
  | "lcs-dp-table"
  | "heap-top-k"
  | "graph-traversal"
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
    case "fast-slow-middle":
      return <FastSlowMiddle />;
    case "bst-insert-search":
      return <BSTInsertSearch />;
    case "lcs-dp-table":
      return <LcsDpTable />;
    case "heap-top-k":
      return <HeapTopK />;
    case "graph-traversal":
      return <GraphTraversal />;
    case "bfs-layer":
      return <BFSLayerOrder />;
    case "floyds-cycle":
      return <FloydsCycle />;
    case "stack-match":
      return <StackMatch />;
  }
}
