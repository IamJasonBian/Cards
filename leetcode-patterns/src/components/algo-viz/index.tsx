import { TwoPointers } from "./TwoPointers";
import { SlidingWindow } from "./SlidingWindow";
import { FixedWindow } from "./FixedWindow";
import { MinWindow } from "./MinWindow";
import { ExactlyK } from "./ExactlyK";
import { MonotonicDeque } from "./MonotonicDeque";
import { TwoSumHash } from "./TwoSumHash";
import { PrefixSumHash } from "./PrefixSumHash";
import { LRUCache } from "./LRUCache";
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

export type VizKind =
  | "two-pointers"
  | "sliding-window"
  | "fixed-window"
  | "min-window"
  | "exactly-k"
  | "monotonic-deque"
  | "two-sum-hash"
  | "prefix-sum-hash"
  | "lru-cache"
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
  | "stack-match";

export function AlgoViz({ kind }: { kind: VizKind }) {
  switch (kind) {
    case "two-pointers":
      return <TwoPointers />;
    case "sliding-window":
      return <SlidingWindow />;
    case "fixed-window":
      return <FixedWindow />;
    case "min-window":
      return <MinWindow />;
    case "exactly-k":
      return <ExactlyK />;
    case "monotonic-deque":
      return <MonotonicDeque />;
    case "two-sum-hash":
      return <TwoSumHash />;
    case "prefix-sum-hash":
      return <PrefixSumHash />;
    case "lru-cache":
      return <LRUCache />;
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
  }
}
