"""
Common Data Structures and Algorithms for LeetCode Solutions

This module provides implementations and utilities for frequently used data structures
and algorithms in coding interviews and competitive programming.

Usage:
python3 -c "from ds import TreeNode; help(TreeNode)"

"""

# ==================== Collections ====================

# deque: Double-ended queue with O(1) operations from both ends
# Example:
#   dq = deque([1, 2, 3])
#   dq.append(4)       # Add to end
#   dq.appendleft(0)   # Add to front
#   dq.pop()           # Remove from end
#   dq.popleft()       # Remove from front
from collections import deque, defaultdict, Counter, OrderedDict, namedtuple

# heapq: Min-heap implementation
# Example:
#   import heapq
#   heap = []
#   heapq.heappush(heap, 3)  # Push element
#   heapq.heappop(heap)      # Pop smallest element
#   heapq.heapify([3,1,2])   # Convert list to heap in O(n)
from heapq import heappush, heappop, heapify, heappushpop, heapreplace, nlargest, nsmallest

# bisect: Binary search and insertion in sorted lists
# Example:
#   import bisect
#   arr = [1, 3, 5]
#   bisect.insort(arr, 2)  # Insert maintaining sort order
#   idx = bisect.bisect_left(arr, 2)  # Find insertion point
from bisect import bisect_left, bisect_right, insort_left, insort_right

# Thread-safe queues (useful for BFS/DFS)
# Example:
#   from queue import Queue, LifoQueue, PriorityQueue
#   q = Queue()           # FIFO queue
#   stack = LifoQueue()   # LIFO stack
#   pq = PriorityQueue()  # Min-heap queue
from queue import PriorityQueue, Queue, LifoQueue

# Math
import math
from math import inf, isinf, isqrt, gcd, lcm, log, log2, log10, comb, perm
from functools import lru_cache, cache, reduce, total_ordering
from itertools import (
    accumulate, combinations, combinations_with_replacement,
    count, cycle, groupby, permutations, product, repeat,
    takewhile, zip_longest, chain, compress, dropwhile, filterfalse,
    islice, starmap, tee, product, permutations
)

# Type Hints
from typing import (
    List, Optional, Dict, Set, Tuple, Union, Any, Callable,
    DefaultDict, Deque, Iterator, Generator, Counter, NamedTuple
)

# ==================== Tree Node ====================
class TreeNode:
    """
    Binary Tree Node implementation.
    
    Example:
        # Create a simple binary tree:
        #       1
        #      / \
        #     2   3
        #    /
        #   4
        
        root = TreeNode(1)
        root.left = TreeNode(2)
        root.right = TreeNode(3)
        root.left.left = TreeNode(4)
    """
    def __init__(self, val=0, left=None, right=None):
        self.val = val
        self.left = left
        self.right = right
        
    def __repr__(self):
        return f"TreeNode({self.val}, left={self.left}, right={self.right})"

# ==================== Linked List Node ====================
class ListNode:
    """
    Singly-linked list node implementation.
    
    Example:
        # Create a linked list: 1 -> 2 -> 3
        head = ListNode(1)
        head.next = ListNode(2)
        head.next.next = ListNode(3)
        
        # Iterate through the list:
        current = head
        while current:
            print(current.val)
            current = current.next
    """
    def __init__(self, val=0, next=None):
        self.val = val
        self.next = next
        
    def __repr__(self):
        return f"ListNode({self.val}, next={self.next is not None})"

# ==================== Graph Node ====================
class Node:
    """
    Graph node with adjacency list representation.
    
    Example:
        # Create a simple undirected graph:
        # 1 -- 2
        # |    |
        # 3 -- 4
        
        n1 = Node(1)
        n2 = Node(2)
        n3 = Node(3)
        n4 = Node(4)
        
        n1.neighbors = [n2, n3]
        n2.neighbors = [n1, n4]
        n3.neighbors = [n1, n4]
        n4.neighbors = [n2, n3]
    """
    def __init__(self, val=0, neighbors=None):
        self.val = val
        self.neighbors = neighbors if neighbors is not None else []
        
    def __repr__(self):
        return f"Node({self.val}, neighbors=[...])"

# ==================== Union-Find (Disjoint Set) ====================
class UnionFind:
    """
    Efficient Union-Find data structure with path compression and union by rank.
    
    Example:
        # Initialize with number of elements
        uf = UnionFind(10)  # 10 elements: 0 to 9
        
        # Connect elements
        uf.union(1, 2)  # Connect 1 and 2
        uf.union(2, 5)  # Connect 2 and 5 (1, 2, 5 are now connected)
        
        # Check connectivity
        print(uf.find(1) == uf.find(5))  # True
        print(uf.find(1) == uf.find(3))  # False
        
        # Total number of connected components
        components = len({uf.find(i) for i in range(10)})
    """
    def __init__(self, n):
        self.parent = list(range(n))  # Parent of each element
        self.rank = [0] * n          # Rank for union by rank
    
    def find(self, x):
        """Find the root parent of x with path compression."""
        if self.parent[x] != x:
            self.parent[x] = self.find(self.parent[x])
        return self.parent[x]
    
    def union(self, x, y):
        """Union sets containing x and y. Returns True if they were separate."""
        px, py = self.find(x), self.find(y)
        if px == py:
            return False  # Already in same set
            
        # Union by rank
        if self.rank[px] < self.rank[py]:
            self.parent[px] = py
        elif self.rank[px] > self.rank[py]:
            self.parent[py] = px
        else:
            self.parent[py] = px
            self.rank[px] += 1
        return True
