from heapq import heappush, heappop, heapreplace
from typing import List, Any

class MinHeapItem:
    __slots__ = ('name', 'score')
    def __init__(self, name: str, score: int):
        self.name = name
        self.score = score
    def __lt__(self, other: 'MinHeapItem') -> bool:
        return self.score < other.score or (self.score == other.score and self.name > other.name)

class MaxHeapItem:
    __slots__ = ('name', 'score')
    def __init__(self, name: str, score: int):
        self.name = name
        self.score = score
    def __lt__(self, other: 'MaxHeapItem') -> bool:
        return self.score > other.score or (self.score == other.score and self.name < other.name)

class SORTracker:
    """Track locations ranked by score then name.

    The tracker maintains two heaps:
    - ``min_heap`` keeps the top ``i`` locations so ``get`` can return the
      ``i``-th ranked location.
    - ``max_heap`` stores the remaining locations.
    """

    def __init__(self) -> None:
        self.min_heap: List[MinHeapItem] = []
        self.max_heap: List[MaxHeapItem] = []
        self.i = 1  # next rank to query

    def add(self, name: str, score: int) -> None:
        cur = MinHeapItem(name, score)
        if len(self.min_heap) < self.i:
            heappush(self.min_heap, cur)
        elif cur > self.min_heap[0]:
            temp = heapreplace(self.min_heap, cur)
            heappush(self.max_heap, MaxHeapItem(temp.name, temp.score))
        else:
            heappush(self.max_heap, MaxHeapItem(name, score))

    def get(self) -> str:
        ans = self.min_heap[0].name
        self.i += 1
        if self.max_heap:
            temp = heappop(self.max_heap)
            heappush(self.min_heap, MinHeapItem(temp.name, temp.score))
        return ans

class Solution:
    def solve(self, operations: List[str], arguments: List[List[Any]]) -> List[Any]:
        """Utility method for executing a sequence of tracker operations."""
        res = []
        obj = None
        for op, arg in zip(operations, arguments):
            if op == "SORTracker":
                obj = SORTracker()
                res.append(None)
            elif op == "add" and obj is not None:
                obj.add(arg[0], arg[1])
                res.append(None)
            elif op == "get" and obj is not None:
                res.append(obj.get())
        return res
