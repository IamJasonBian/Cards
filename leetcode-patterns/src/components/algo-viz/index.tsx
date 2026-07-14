import { TwoPointers } from "./TwoPointers";
import { SlidingWindow } from "./SlidingWindow";
import { BinarySearch } from "./BinarySearch";
import { FastSlowMiddle } from "./FastSlowMiddle";
import { BSTInsertSearch } from "./BSTInsertSearch";
import { LcsDpTable } from "./LcsDpTable";
import { Knapsack01 } from "./Knapsack01";
import { CoinChange } from "./CoinChange";
import { HeapTopK } from "./HeapTopK";
import { GraphTraversal } from "./GraphTraversal";
import { BFSLayerOrder } from "./BFSLayerOrder";
import { FloydsCycle } from "./FloydsCycle";
import { StackMatch } from "./StackMatch";
import { UnionFind } from "./UnionFind";

export type VizKind =
  | "two-pointers"
  | "sliding-window"
  | "binary-search"
  | "fast-slow-middle"
  | "bst-insert-search"
  | "lcs-dp-table"
  | "knapsack-01"
  | "coin-change"
  | "heap-top-k"
  | "graph-traversal"
  | "bfs-layer"
  | "floyds-cycle"
  | "stack-match"
  | "union-find";

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
    case "knapsack-01":
      return <Knapsack01 />;
    case "coin-change":
      return <CoinChange />;
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
    case "union-find":
      return <UnionFind />;
  }
}
