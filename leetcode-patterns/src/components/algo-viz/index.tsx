import type { ComponentType } from "react";
import type { VizKind } from "../../data/flashcards";
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
import { ReverseLinkedList } from "./ReverseLinkedList";

// Keyed by VizKind, so adding a kind without a component is a type error.
const VIZ: Record<VizKind, ComponentType> = {
  "two-pointers": TwoPointers,
  "sliding-window": SlidingWindow,
  "binary-search": BinarySearch,
  "fast-slow-middle": FastSlowMiddle,
  "bst-insert-search": BSTInsertSearch,
  "lcs-dp-table": LcsDpTable,
  "knapsack-01": Knapsack01,
  "coin-change": CoinChange,
  "heap-top-k": HeapTopK,
  "graph-traversal": GraphTraversal,
  "bfs-layer": BFSLayerOrder,
  "floyds-cycle": FloydsCycle,
  "stack-match": StackMatch,
  "reverse-linked-list": ReverseLinkedList,
};

export function AlgoViz({ kind }: { kind: VizKind }) {
  const Viz = VIZ[kind];
  return <Viz />;
}
