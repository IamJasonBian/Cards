export type FlashcardTag =
  | "linked list"
  | "tree"
  | "graph"
  | "array"
  | "dp"
  | "heap"
  | "str";

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
  | "stack-match";

export interface Flashcard {
  id: string;
  tag: FlashcardTag;
  q: string;
  hint: string;
  code: string;
  note: string;
  vizPath?: string;
  viz?: VizKind;
}

export const flashcards: Flashcard[] = [
  {
    id: "reverse-linked-list",
    tag: "linked list",
    q: "Reverse a linked list",
    hint: "iterative & recursive",
    code: `def reverse_list(head):
    prev, curr = None, head
    while curr:
        nxt = curr.next
        curr.next = prev
        prev = curr
        curr = nxt
    return prev

# Recursive
def reverse_list(head):
    if not head or not head.next:
        return head
    new_head = reverse_list(head.next)
    head.next.next = head
    head.next = None
    return new_head`,
    note: "Iterative: 3-pointer walk. Recursive: trust the base + wire backward.",
    vizPath: "/viz/reverse-linked-list.html",
  },
  {
    id: "detect-cycle-floyd",
    tag: "linked list",
    q: "Detect a cycle (Floyd's)",
    hint: "fast & slow pointers",
    code: `def has_cycle(head):
    slow = fast = head
    while fast and fast.next:
        slow = slow.next
        fast = fast.next.next
        if slow == fast:
            return True
    return False

def cycle_start(head):
    slow = fast = head
    while fast and fast.next:
        slow, fast = slow.next, fast.next.next
        if slow == fast:
            slow = head
            while slow != fast:
                slow, fast = slow.next, fast.next
            return slow
    return None`,
    note: "Meeting point → reset one to head → advance both 1 step → meet at cycle start.",
    viz: "floyds-cycle",
  },
  {
    id: "merge-two-sorted-lists",
    tag: "linked list",
    q: "Merge two sorted lists",
    hint: "classic pointer merge",
    code: `def merge(l1, l2):
    dummy = cur = ListNode(0)
    while l1 and l2:
        if l1.val <= l2.val:
            cur.next = l1; l1 = l1.next
        else:
            cur.next = l2; l2 = l2.next
        cur = cur.next
    cur.next = l1 or l2
    return dummy.next`,
    note: "Dummy head avoids edge case. Append remaining tail directly.",
  },
  {
    id: "middle-of-linked-list",
    tag: "linked list",
    q: "Find middle of linked list",
    hint: "slow/fast pointers",
    code: `def middle_node(head):
    slow = fast = head
    while fast and fast.next:
        slow = slow.next
        fast = fast.next.next
    return slow   # for even-length: 2nd middle`,
    note: "When fast reaches end, slow is at middle. Used in merge sort on LL.",
    viz: "fast-slow-middle",
  },
  {
    id: "bst-insert-search",
    tag: "tree",
    q: "BST insert / search",
    hint: "recursive + iterative",
    code: `def insert(root, val):
    if not root:
        return TreeNode(val)
    if val < root.val:
        root.left = insert(root.left, val)
    else:
        root.right = insert(root.right, val)
    return root

def search(root, val):
    while root:
        if val == root.val: return root
        root = root.left if val < root.val else root.right
    return None`,
    note: "Always return root on insert — re-wires parent's child pointer.",
    viz: "bst-insert-search",
  },
  {
    id: "bst-delete",
    tag: "tree",
    q: "BST delete node",
    hint: "find in-order successor",
    code: `def delete_node(root, key):
    if not root: return None
    if key < root.val:
        root.left = delete_node(root.left, key)
    elif key > root.val:
        root.right = delete_node(root.right, key)
    else:
        if not root.left: return root.right
        if not root.right: return root.left
        succ = root.right
        while succ.left:
            succ = succ.left
        root.val = succ.val
        root.right = delete_node(root.right, succ.val)
    return root`,
    note: "3 cases: leaf, one child, two children. Two-child → replace with successor.",
  },
  {
    id: "level-order-bfs",
    tag: "tree",
    q: "Level-order traversal (BFS)",
    hint: "queue, layer by layer",
    code: `from collections import deque

def level_order(root):
    if not root: return []
    res, q = [], deque([root])
    while q:
        level = []
        for _ in range(len(q)):   # snapshot size = current layer
            node = q.popleft()
            level.append(node.val)
            if node.left:  q.append(node.left)
            if node.right: q.append(node.right)
        res.append(level)
    return res`,
    note: "Snapshot len(q) before loop to isolate each layer. Works on any tree/graph.",
    viz: "bfs-layer",
  },
  {
    id: "lca-bst",
    tag: "tree",
    q: "Lowest common ancestor (BST)",
    hint: "exploit BST ordering",
    code: `# BST — O(h)
def lca_bst(root, p, q):
    while root:
        if p.val < root.val and q.val < root.val:
            root = root.left
        elif p.val > root.val and q.val > root.val:
            root = root.right
        else:
            return root  # split point = LCA

# Generic binary tree — O(n)
def lca(root, p, q):
    if not root or root in (p, q): return root
    L = lca(root.left, p, q)
    R = lca(root.right, p, q)
    return root if L and R else L or R`,
    note: "BST: walk toward both nodes — first split is LCA. Generic: post-order, two non-null children → root is LCA.",
  },
  {
    id: "validate-bst",
    tag: "tree",
    q: "Validate BST",
    hint: "pass min/max bounds",
    code: `def is_valid_bst(root, lo=float('-inf'), hi=float('inf')):
    if not root: return True
    if not (lo < root.val < hi): return False
    return (is_valid_bst(root.left,  lo, root.val) and
            is_valid_bst(root.right, root.val, hi))`,
    note: "Pass narrowing (lo, hi) window down. Don't just compare to parent — that misses ancestor violations.",
  },
  {
    id: "dfs-bfs-graph",
    tag: "graph",
    q: "DFS / BFS on a graph",
    hint: "adjacency list, visited set",
    code: `# DFS — recursive
def dfs(graph, node, visited=None):
    if visited is None: visited = set()
    visited.add(node)
    for nb in graph[node]:
        if nb not in visited:
            dfs(graph, nb, visited)

# BFS — iterative
from collections import deque
def bfs(graph, start):
    visited = {start}
    q = deque([start])
    while q:
        node = q.popleft()
        for nb in graph[node]:
            if nb not in visited:
                visited.add(nb)
                q.append(nb)`,
    note: "Always mark visited on enqueue (BFS) or on entry (DFS) to avoid re-processing.",
    viz: "graph-traversal",
  },
  {
    id: "topo-sort-kahn",
    tag: "graph",
    q: "Topological sort (Kahn's)",
    hint: "BFS + in-degree array",
    code: `from collections import deque, defaultdict

def topo_sort(n, edges):
    graph = defaultdict(list)
    indegree = [0] * n
    for u, v in edges:
        graph[u].append(v)
        indegree[v] += 1
    q = deque(i for i in range(n) if indegree[i] == 0)
    order = []
    while q:
        node = q.popleft()
        order.append(node)
        for nb in graph[node]:
            indegree[nb] -= 1
            if indegree[nb] == 0:
                q.append(nb)
    return order if len(order) == n else []  # [] = cycle`,
    note: "Empty result → cycle detected. DFS variant: post-order reverse.",
  },
  {
    id: "union-find-dsu",
    tag: "graph",
    q: "Union-Find (DSU)",
    hint: "path compression + rank",
    code: `class DSU:
    def __init__(self, n):
        self.parent = list(range(n))
        self.rank = [0] * n

    def find(self, x):
        if self.parent[x] != x:
            self.parent[x] = self.find(self.parent[x])  # path compress
        return self.parent[x]

    def union(self, x, y):
        rx, ry = self.find(x), self.find(y)
        if rx == ry: return False
        if self.rank[rx] < self.rank[ry]: rx, ry = ry, rx
        self.parent[ry] = rx
        if self.rank[rx] == self.rank[ry]: self.rank[rx] += 1
        return True`,
    note: "find is O(α(n)) amortized. union returns False if already connected (cycle check).",
    viz: "bfs-layer",
  },
  {
    id: "sliding-window",
    tag: "array",
    q: "Sliding window (variable size)",
    hint: "expand right, shrink left",
    code: `def longest_substring_k_distinct(s, k):
    count = {}
    l = res = 0
    for r, c in enumerate(s):
        count[c] = count.get(c, 0) + 1
        while len(count) > k:
            count[s[l]] -= 1
            if count[s[l]] == 0:
                del count[s[l]]
            l += 1
        res = max(res, r - l + 1)
    return res`,
    note: "Template: expand r → violates condition? → shrink l until valid → update answer.",
    viz: "sliding-window",
  },
  {
    id: "two-pointers",
    tag: "array",
    q: "Two pointers — sorted array pair sum",
    hint: "converge from both ends",
    code: `def two_sum_sorted(nums, target):
    l, r = 0, len(nums) - 1
    while l < r:
        s = nums[l] + nums[r]
        if s == target:   return [l, r]
        elif s < target:  l += 1
        else:             r -= 1
    return []

# 3Sum variant
def three_sum(nums):
    nums.sort(); res = []
    for i, v in enumerate(nums):
        if i > 0 and nums[i] == nums[i-1]: continue
        l, r = i+1, len(nums)-1
        while l < r:
            s = v + nums[l] + nums[r]
            if s == 0:
                res.append([v, nums[l], nums[r]])
                while l < r and nums[l] == nums[l+1]: l += 1
                while l < r and nums[r] == nums[r-1]: r -= 1
                l += 1; r -= 1
            elif s < 0: l += 1
            else: r -= 1
    return res`,
    note: "Sort first. Skip duplicates explicitly in 3Sum to avoid duplicate triplets.",
    viz: "two-pointers",
  },
  {
    id: "binary-search-bisect",
    tag: "array",
    q: "Binary search (left / right bisect)",
    hint: "lo=0, hi=n-1, lo<=hi",
    code: `# Exact match
def binary_search(nums, target):
    lo, hi = 0, len(nums) - 1
    while lo <= hi:
        mid = lo + (hi - lo) // 2
        if nums[mid] == target:   return mid
        elif nums[mid] < target:  lo = mid + 1
        else:                     hi = mid - 1
    return -1

# Left-most insertion index (bisect_left)
def bisect_left(nums, target):
    lo, hi = 0, len(nums)
    while lo < hi:
        mid = (lo + hi) // 2
        if nums[mid] < target: lo = mid + 1
        else: hi = mid
    return lo`,
    note: "bisect_left: loop condition hi=n (not n-1), strict < for lo update.",
    viz: "binary-search",
  },
  {
    id: "knapsack-01",
    tag: "dp",
    q: "0/1 Knapsack",
    hint: "2-D DP, iterate reverse for 1-D",
    code: `def knapsack(weights, values, W):
    n = len(weights)
    # 1-D space-optimized (iterate W in reverse)
    dp = [0] * (W + 1)
    for i in range(n):
        for w in range(W, weights[i] - 1, -1):
            dp[w] = max(dp[w], dp[w - weights[i]] + values[i])
    return dp[W]`,
    note: "Reverse inner loop prevents item reuse. Forward loop → unbounded knapsack.",
    viz: "knapsack-01",
  },
  {
    id: "lcs",
    tag: "dp",
    q: "Longest common subsequence",
    hint: "2-D DP on two strings",
    code: `def lcs(s, t):
    m, n = len(s), len(t)
    dp = [[0]*(n+1) for _ in range(m+1)]
    for i in range(1, m+1):
        for j in range(1, n+1):
            if s[i-1] == t[j-1]:
                dp[i][j] = dp[i-1][j-1] + 1
            else:
                dp[i][j] = max(dp[i-1][j], dp[i][j-1])
    return dp[m][n]`,
    note: "Match → diagonal + 1. No match → max of left / up.",
    viz: "lcs-dp-table",
  },
  {
    id: "coin-change",
    tag: "dp",
    q: "Coin change (min coins)",
    hint: "bottom-up DP",
    code: `def coin_change(coins, amount):
    dp = [float('inf')] * (amount + 1)
    dp[0] = 0
    for coin in coins:
        for x in range(coin, amount + 1):
            dp[x] = min(dp[x], dp[x - coin] + 1)
    return dp[amount] if dp[amount] != float('inf') else -1`,
    note: "Unbounded (reuse coins) → forward inner loop. Initialize dp[0]=0, rest inf.",
    viz: "coin-change",
  },
  {
    id: "k-largest",
    tag: "heap",
    q: "K largest elements / top-K",
    hint: "min-heap of size K",
    code: `import heapq

def k_largest(nums, k):
    heap = []
    for n in nums:
        heapq.heappush(heap, n)
        if len(heap) > k:
            heapq.heappop(heap)
    return list(heap)   # heap[0] = k-th largest

# Or: nlargest (O(n log k))
heapq.nlargest(k, nums)`,
    note: "Min-heap of size k: every element that enters forces the smallest out → remaining are top-k.",
    viz: "heap-top-k",
  },
  {
    id: "merge-k-lists",
    tag: "heap",
    q: "Merge K sorted lists",
    hint: "heap with (val, list_idx, node)",
    code: `import heapq

def merge_k_lists(lists):
    dummy = cur = ListNode(0)
    heap = []
    for i, node in enumerate(lists):
        if node:
            heapq.heappush(heap, (node.val, i, node))
    while heap:
        val, i, node = heapq.heappop(heap)
        cur.next = node
        cur = cur.next
        if node.next:
            heapq.heappush(heap, (node.next.val, i, node.next))
    return dummy.next`,
    note: "Push (val, list_idx, node) — list_idx breaks ties so node objects never compare.",
  },
  {
    id: "valid-parens",
    tag: "str",
    q: "Valid parentheses / stack matching",
    hint: "push open, match on close",
    code: `def is_valid(s):
    stack = []
    match = {')': '(', ']': '[', '}': '{'}
    for c in s:
        if c in '([{':
            stack.append(c)
        elif not stack or stack[-1] != match[c]:
            return False
        else:
            stack.pop()
    return len(stack) == 0`,
    note: "Map each closer to its opener. Stack must be empty at end.",
    viz: "stack-match",
  },
  {
    id: "anagram-freq",
    tag: "str",
    q: "Anagram / character frequency",
    hint: "Counter or array[26]",
    code: `from collections import Counter

def is_anagram(s, t):
    return Counter(s) == Counter(t)   # O(n)

def group_anagrams(strs):
    groups = {}
    for s in strs:
        key = tuple(sorted(s))
        groups.setdefault(key, []).append(s)
    return list(groups.values())

# Fixed-size array (lowercase only)
def freq(s):
    a = [0] * 26
    for c in s: a[ord(c) - ord('a')] += 1
    return a`,
    note: "sorted key is O(k log k) per word. Counter equality is O(n) total.",
  },
  {
    id: "implement-trie",
    tag: "str",
    q: "Implement trie",
    hint: "TrieNode with children dict + is_end",
    code: `class TrieNode:
    def __init__(self):
        self.children = {}
        self.is_end = False

class Trie:
    def __init__(self): self.root = TrieNode()

    def insert(self, word):
        cur = self.root
        for c in word:
            cur = cur.children.setdefault(c, TrieNode())
        cur.is_end = True

    def search(self, word):
        cur = self.root
        for c in word:
            if c not in cur.children: return False
            cur = cur.children[c]
        return cur.is_end

    def starts_with(self, prefix):
        cur = self.root
        for c in prefix:
            if c not in cur.children: return False
            cur = cur.children[c]
        return True`,
    note: "setdefault is idiomatic for insert. is_end distinguishes full word from prefix.",
  },
];

export const flashcardTags: FlashcardTag[] = [
  "linked list",
  "tree",
  "graph",
  "array",
  "dp",
  "heap",
  "str",
];

export const tagStyles: Record<FlashcardTag, string> = {
  "linked list": "bg-indigo-50 text-indigo-700 border border-indigo-200",
  tree: "bg-emerald-50 text-emerald-700 border border-emerald-200",
  graph: "bg-orange-50 text-orange-700 border border-orange-200",
  array: "bg-blue-50 text-blue-700 border border-blue-200",
  dp: "bg-lime-50 text-lime-700 border border-lime-200",
  heap: "bg-amber-50 text-amber-700 border border-amber-200",
  str: "bg-pink-50 text-pink-700 border border-pink-200",
};
