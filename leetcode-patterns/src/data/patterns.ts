export interface Problem {
  name: string;
  slug: string;
}

export interface Pattern {
  id: number;
  name: string;
  solveCount: number;
  tag: string;
  problems: Problem[];
  techniques: string[];
  dataStructures: string[];
  code: string;
  runtime: string;
  optimalCode: string;
  optimalRuntime: string;
  optimalNote: string;
}

export const patterns: Pattern[] = [
  {
    id: 1,
    name: "DFS on Graph",
    solveCount: 84,
    tag: "Graph",
    problems: [
      { name: "Number of Islands", slug: "number-of-islands" },
      { name: "Clone Graph", slug: "clone-graph" },
      { name: "Course Schedule", slug: "course-schedule" },
      { name: "Pacific Atlantic Water Flow", slug: "pacific-atlantic-water-flow" },
    ],
    techniques: ["recursive traversal", "iterative traversal", "connected components", "cycle detection", "path tracking"],
    dataStructures: ["set()", "defaultdict(list)", "stack (iterative)", "visited array"],
    code: `def dfs(graph, node, visited):
    if node in visited:
        return
    visited.add(node)
    for nei in graph[node]:
        dfs(graph, nei, visited)

# Setup
graph = defaultdict(list)
for u, v in edges:
    graph[u].append(v)
    graph[v].append(u)
visited = set()
dfs(graph, start, visited)`,
    runtime: "O(V + E) time, O(V) space",
    optimalCode: `def dfs(graph, node, visited):
    visited.add(node)
    for nei in graph[node]:
        if nei not in visited:
            dfs(graph, nei, visited)

# Iterative DFS avoids stack overflow on deep graphs
def dfs_iterative(graph, start):
    stack, visited = [start], set()
    while stack:
        node = stack.pop()
        if node in visited:
            continue
        visited.add(node)
        stack.extend(graph[node])
    return visited`,
    optimalRuntime: "O(V + E) time, O(V) space",
    optimalNote: "Iterative DFS avoids Python's ~1000-frame recursion limit. Check membership before recursing instead of at entry to reduce call overhead.",
  },
  {
    id: 2,
    name: "BFS",
    solveCount: 53,
    tag: "Graph",
    problems: [
      { name: "Rotting Oranges", slug: "rotting-oranges" },
      { name: "Walls and Gates", slug: "walls-and-gates" },
      { name: "Word Ladder", slug: "word-ladder" },
      { name: "Binary Tree Level Order Traversal", slug: "binary-tree-level-order-traversal" },
    ],
    techniques: ["level-order traversal", "multi-source BFS", "bidirectional search", "shortest unweighted path", "visit before enqueue"],
    dataStructures: ["deque", "set()", "dict()", "level counter"],
    code: `def bfs(graph, start):
    queue = deque([start])
    visited = {start}
    level = 0
    while queue:
        for _ in range(len(queue)):
            node = queue.popleft()
            for nei in graph[node]:
                if nei not in visited:
                    visited.add(nei)
                    queue.append(nei)
        level += 1
    return level`,
    runtime: "O(V + E) time, O(V) space",
    optimalCode: `def bfs_bidirectional(begin, end, word_list):
    words = set(word_list)
    if end not in words:
        return 0
    front, back = {begin}, {end}
    visited = {begin, end}
    steps = 1
    while front and back:
        if len(front) > len(back):
            front, back = back, front
        nxt = set()
        for word in front:
            for i in range(len(word)):
                for c in 'abcdefghijklmnopqrstuvwxyz':
                    w = word[:i] + c + word[i+1:]
                    if w in back:
                        return steps + 1
                    if w in words and w not in visited:
                        visited.add(w)
                        nxt.add(w)
        front = nxt
        steps += 1
    return 0`,
    optimalRuntime: "O(V + E) time, O(V) space -- but ~2x faster in practice",
    optimalNote: "Bidirectional BFS meets in the middle, reducing explored nodes from O(b^d) to O(b^(d/2)). Always expand the smaller frontier.",
  },
  {
    id: 3,
    name: "1-D Dynamic Programming",
    solveCount: 109,
    tag: "DP",
    problems: [
      { name: "House Robber", slug: "house-robber" },
      { name: "Coin Change", slug: "coin-change" },
      { name: "Climbing Stairs", slug: "climbing-stairs" },
      { name: "Longest Increasing Subsequence", slug: "longest-increasing-subsequence" },
    ],
    techniques: ["bottom-up tabulation", "top-down memoization", "rolling variables (O(1) space)", "state compression", "patience sort"],
    dataStructures: ["dp[] array", "@cache / @lru_cache", "bisect_left", "prefix sum[]"],
    code: `# Bottom-up
dp = [0] * (n + 1)
dp[1] = nums[0]
for i in range(2, n + 1):
    dp[i] = max(dp[i-1], dp[i-2] + nums[i-1])

# Top-down
@cache
def solve(i):
    if i < 0:
        return 0
    return max(solve(i-1), solve(i-2) + nums[i])`,
    runtime: "O(n) time, O(n) space",
    optimalCode: `# Space-optimized: O(1) space
prev2, prev1 = 0, 0
for num in nums:
    prev2, prev1 = prev1, max(prev1, prev2 + num)
return prev1

# LIS in O(n log n) with patience sort
from bisect import bisect_left
def lis(nums):
    tails = []
    for num in nums:
        i = bisect_left(tails, num)
        if i == len(tails):
            tails.append(num)
        else:
            tails[i] = num
    return len(tails)`,
    optimalRuntime: "O(n) time, O(1) space / LIS: O(n log n)",
    optimalNote: "Rolling two variables eliminates the dp array. For LIS, patience sort with bisect beats the O(n^2) DP.",
  },
  {
    id: 4,
    name: "Two Pointers",
    solveCount: 75,
    tag: "Array",
    problems: [
      { name: "3Sum", slug: "3sum" },
      { name: "Container With Most Water", slug: "container-with-most-water" },
      { name: "Two Sum II", slug: "two-sum-ii-input-array-is-sorted" },
      { name: "Valid Palindrome", slug: "valid-palindrome" },
      { name: "Trapping Rain Water", slug: "trapping-rain-water" },
      { name: "4Sum", slug: "4sum" },
    ],
    techniques: ["opposite-end convergence", "skip duplicates", "early termination", "k-sum reduction", "sorted input required", "monotonically increasing/decreasing", "binary search on sorted half", "move min-bound pointer inward (bottleneck = shorter side)"],
    dataStructures: ["sort()", "two index variables", "set() (dedup alt)", "left/right max arrays"],
    code: `nums.sort()
l, r = 0, len(nums) - 1
while l < r:
    total = nums[l] + nums[r]
    if total == target:
        return [l, r]
    elif total < target:
        l += 1
    else:
        r -= 1`,
    runtime: "O(n) time (O(n log n) with sort), O(1) space",
    optimalCode: `# 3Sum with duplicate skipping
def threeSum(nums):
    nums.sort()
    res = []
    for i in range(len(nums) - 2):
        if i > 0 and nums[i] == nums[i-1]:
            continue
        if nums[i] > 0:
            break  # early termination
        l, r = i + 1, len(nums) - 1
        while l < r:
            s = nums[i] + nums[l] + nums[r]
            if s == 0:
                res.append([nums[i], nums[l], nums[r]])
                while l < r and nums[l] == nums[l+1]: l += 1
                while l < r and nums[r] == nums[r-1]: r -= 1
                l += 1; r -= 1
            elif s < 0: l += 1
            else: r -= 1
    return res`,
    optimalRuntime: "O(n^2) time, O(1) space",
    optimalNote: "Early break when nums[i] > 0 and skip duplicates at both outer and inner loops. Avoids set-based dedup overhead.",
  },
  {
    id: 5,
    name: "Sliding Window",
    solveCount: 28,
    tag: "Array",
    problems: [
      { name: "Longest Substring Without Repeating Characters", slug: "longest-substring-without-repeating-characters" },
      { name: "Longest Repeating Character Replacement", slug: "longest-repeating-character-replacement" },
      { name: "Permutation in String", slug: "permutation-in-string" },
    ],
    techniques: ["expand/shrink window", "constant-space index tracking", "last-seen index jump", "fixed-size window", "at most K distinct"],
    dataStructures: ["defaultdict(int)", "Counter()", "dict() (last index)", "left/right pointers"],
    code: `l = 0
window = defaultdict(int)
res = 0
for r in range(len(s)):
    window[s[r]] += 1
    while not valid(window):
        window[s[l]] -= 1
        if window[s[l]] == 0:
            del window[s[l]]
        l += 1
    res = max(res, r - l + 1)`,
    runtime: "O(n) time, O(k) space (k = charset size)",
    optimalCode: `# Jump-ahead: track last seen index to skip
def lengthOfLongestSubstring(s):
    last = {}
    l = res = 0
    for r, c in enumerate(s):
        if c in last and last[c] >= l:
            l = last[c] + 1
        last[c] = r
        res = max(res, r - l + 1)
    return res`,
    optimalRuntime: "O(n) time, O(k) space",
    optimalNote: "Tracking last-seen index lets l jump directly past the duplicate instead of shrinking one step at a time. Fewer iterations on strings with repeated chars.",
  },
  {
    id: 6,
    name: "Binary Search",
    solveCount: 50,
    tag: "Search",
    problems: [
      { name: "Koko Eating Bananas", slug: "koko-eating-bananas" },
      { name: "Search in Rotated Sorted Array", slug: "search-in-rotated-sorted-array" },
      { name: "Find Minimum in Rotated Sorted Array", slug: "find-minimum-in-rotated-sorted-array" },
    ],
    techniques: ["search on answer space", "lower/upper bound", "rotated array halving", "condition function", "ceiling division trick"],
    dataStructures: ["bisect_left / bisect_right", "lo/hi/mid indices", "sorted array"],
    code: `lo, hi = min_val, max_val
while lo < hi:
    mid = (lo + hi) // 2
    if condition(mid):
        hi = mid
    else:
        lo = mid + 1
return lo`,
    runtime: "O(log n) time, O(1) space",
    optimalCode: `# bisect from stdlib is faster (C implementation)
from bisect import bisect_left, bisect_right

# Find insertion point
i = bisect_left(arr, target)
found = i < len(arr) and arr[i] == target

# Search on answer space with ceiling division
def minEatingSpeed(piles, h):
    lo, hi = 1, max(piles)
    while lo < hi:
        mid = (lo + hi) // 2
        if sum((p + mid - 1) // mid for p in piles) <= h:
            hi = mid
        else:
            lo = mid + 1
    return lo`,
    optimalRuntime: "O(log n) time, O(1) space",
    optimalNote: "Use stdlib bisect (C-level speed) for sorted array lookups. For search-on-answer, use ceiling division (p + mid - 1) // mid instead of math.ceil to avoid float overhead.",
  },
  {
    id: 7,
    name: "Backtracking",
    solveCount: 36,
    tag: "Recursion",
    problems: [
      { name: "Subsets", slug: "subsets" },
      { name: "Combination Sum", slug: "combination-sum" },
      { name: "Permutations", slug: "permutations" },
      { name: "Word Search", slug: "word-search" },
      { name: "N-Queens", slug: "n-queens" },
    ],
    techniques: ["choose/explore/unchoose", "pruning with sort()", "start index (subsets)", "swap-based (permutations)", "bitmask enumeration"],
    dataStructures: ["path[:] (copy)", "set() (seen)", "sorted input", "bitmask int"],
    code: `def backtrack(start, path):
    result.append(path[:])
    for i in range(start, len(nums)):
        # if i > start and nums[i] == nums[i-1]: continue
        path.append(nums[i])
        backtrack(i + 1, path)
        path.pop()

result = []
backtrack(0, [])`,
    runtime: "O(2^n) time, O(n) space",
    optimalCode: `# Bitmask enumeration: no recursion overhead
def subsets_bitmask(nums):
    n = len(nums)
    return [
        [nums[j] for j in range(n) if mask >> j & 1]
        for mask in range(1 << n)
    ]

# Prune early in Word Search
def exist(board, word):
    rows, cols = len(board), len(board[0])
    # Frequency prune: start from rarer end
    from collections import Counter
    freq = Counter(c for row in board for c in row)
    if any(word.count(c) > freq.get(c, 0) for c in set(word)):
        return False
    if freq[word[0]] > freq[word[-1]]:
        word = word[::-1]
    # ... then backtrack`,
    optimalRuntime: "O(2^n) time -- same asymptotic, faster constant",
    optimalNote: "Bitmask enumeration avoids recursion overhead for subsets. For Word Search, reverse the word if the last char is rarer -- dramatically prunes the search tree.",
  },
  {
    id: 8,
    name: "Monotonic Stack",
    solveCount: 17,
    tag: "Stack",
    problems: [
      { name: "Daily Temperatures", slug: "daily-temperatures" },
      { name: "Next Greater Element I", slug: "next-greater-element-i" },
      { name: "Largest Rectangle in Histogram", slug: "largest-rectangle-in-histogram" },
    ],
    techniques: ["next greater/smaller element", "span calculation", "sentinel trick (avoid edge cases)", "index-based popping", "area under histogram"],
    dataStructures: ["stack (list)", "index array", "sentinel values [0]+arr+[0]"],
    code: `stack = []  # indices
res = [0] * len(nums)
for i, num in enumerate(nums):
    while stack and nums[stack[-1]] < num:
        j = stack.pop()
        res[j] = i - j
    stack.append(i)`,
    runtime: "O(n) time, O(n) space",
    optimalCode: `# Largest Rectangle: sentinel trick avoids edge cases
def largestRectangleArea(heights):
    heights = [0] + heights + [0]  # sentinels
    stack = [0]
    max_area = 0
    for i in range(1, len(heights)):
        while heights[i] < heights[stack[-1]]:
            h = heights[stack.pop()]
            w = i - stack[-1] - 1
            max_area = max(max_area, h * w)
        stack.append(i)
    return max_area`,
    optimalRuntime: "O(n) time, O(n) space",
    optimalNote: "Adding sentinel values (0 at both ends) eliminates all edge-case handling for empty stack and remaining elements. Cleaner and fewer branches.",
  },
  {
    id: 9,
    name: "Heap / Top-K",
    solveCount: 37,
    tag: "Heap",
    problems: [
      { name: "Top K Frequent Elements", slug: "top-k-frequent-elements" },
      { name: "K Closest Points to Origin", slug: "k-closest-points-to-origin" },
      { name: "Merge K Sorted Lists", slug: "merge-k-sorted-lists" },
      { name: "Task Scheduler", slug: "task-scheduler" },
    ],
    techniques: ["maintain size-k heap", "frequency counting", "bucket sort (O(n))", "quickselect (avg O(n))", "negate for max-heap"],
    dataStructures: ["heapq", "Counter()", "tuple (-freq, val)", "bucket[] array"],
    code: `# Top K
count = Counter(nums)
return heapq.nlargest(k, count, key=count.get)

# Running K smallest
heap = []
for val in stream:
    heapq.heappush(heap, val)
    if len(heap) > k:
        heapq.heappop(heap)`,
    runtime: "O(n log k) time, O(k) space",
    optimalCode: `# Bucket sort: O(n) for top-k frequent
def topKFrequent(nums, k):
    count = Counter(nums)
    buckets = [[] for _ in range(len(nums) + 1)]
    for num, freq in count.items():
        buckets[freq].append(num)
    res = []
    for i in range(len(buckets) - 1, -1, -1):
        res.extend(buckets[i])
        if len(res) >= k:
            return res[:k]

# Quickselect for kth largest: avg O(n)
import random
def quickselect(nums, k):
    pivot = random.choice(nums)
    lo = [x for x in nums if x < pivot]
    eq = [x for x in nums if x == pivot]
    hi = [x for x in nums if x > pivot]
    if k <= len(hi): return quickselect(hi, k)
    elif k <= len(hi) + len(eq): return pivot
    else: return quickselect(lo, k - len(hi) - len(eq))`,
    optimalRuntime: "O(n) time, O(n) space",
    optimalNote: "Bucket sort beats heap for top-k frequency. Quickselect finds kth element in average O(n) vs O(n log n) sort or O(n log k) heap.",
  },
  {
    id: 10,
    name: "Union-Find",
    solveCount: 15,
    tag: "Graph",
    problems: [
      { name: "Redundant Connection", slug: "redundant-connection" },
      { name: "Graph Valid Tree", slug: "graph-valid-tree" },
      { name: "Number of Connected Components", slug: "number-of-connected-components-in-an-undirected-graph" },
    ],
    techniques: ["path compression", "union by rank", "union by size", "cycle detection (return False)", "component counting"],
    dataStructures: ["parent[] array", "rank[] / size[]", "set comprehension (roots)", "dict (dynamic nodes)"],
    code: `parent = list(range(n))
rank = [0] * n

def find(x):
    while parent[x] != x:
        parent[x] = parent[parent[x]]
        x = parent[x]
    return x

def union(x, y):
    px, py = find(x), find(y)
    if px == py:
        return False
    if rank[px] < rank[py]:
        px, py = py, px
    parent[py] = px
    rank[px] += rank[px] == rank[py]
    return True`,
    runtime: "O(alpha(n)) per op -- effectively O(1)",
    optimalCode: `# Full path compression (recursive, slightly cleaner)
class DSU:
    def __init__(self, n):
        self.parent = list(range(n))
        self.size = [1] * n
        self.components = n

    def find(self, x):
        if self.parent[x] != x:
            self.parent[x] = self.find(self.parent[x])
        return self.parent[x]

    def union(self, x, y):
        px, py = self.find(x), self.find(y)
        if px == py:
            return False
        if self.size[px] < self.size[py]:
            px, py = py, px
        self.parent[py] = px
        self.size[px] += self.size[py]
        self.components -= 1
        return True`,
    optimalRuntime: "O(alpha(n)) per op -- effectively O(1)",
    optimalNote: "Full recursive path compression flattens the tree completely. Tracking size instead of rank enables counting component sizes. Track component count for 'number of islands' variants.",
  },
  {
    id: 11,
    name: "2-D Dynamic Programming",
    solveCount: 109,
    tag: "DP",
    problems: [
      { name: "Unique Paths", slug: "unique-paths" },
      { name: "Longest Common Subsequence", slug: "longest-common-subsequence" },
      { name: "Edit Distance", slug: "edit-distance" },
      { name: "Coin Change II", slug: "coin-change-ii" },
    ],
    techniques: ["rolling single row (space opt)", "diagonal prev variable", "iterate shorter dimension", "knapsack reduction", "min/max/count transitions"],
    dataStructures: ["2D dp[][] grid", "1D dp[] + prev", "string indices"],
    code: `dp = [[0] * (n + 1) for _ in range(m + 1)]
for i in range(1, m + 1):
    for j in range(1, n + 1):
        if match(i, j):
            dp[i][j] = dp[i-1][j-1] + 1
        else:
            dp[i][j] = max(dp[i-1][j], dp[i][j-1])`,
    runtime: "O(m * n) time, O(m * n) space",
    optimalCode: `# Space-optimized: single row + prev variable
def lcs(text1, text2):
    if len(text1) < len(text2):
        text1, text2 = text2, text1  # iterate over shorter
    dp = [0] * (len(text2) + 1)
    for c1 in text1:
        prev = 0
        for j, c2 in enumerate(text2, 1):
            tmp = dp[j]
            dp[j] = prev + 1 if c1 == c2 else max(dp[j], dp[j-1])
            prev = tmp
    return dp[-1]`,
    optimalRuntime: "O(m * n) time, O(min(m, n)) space",
    optimalNote: "Roll the 2D grid into a single row, tracking the diagonal (prev) manually. Always iterate over the longer string as outer loop to minimize the dp array size.",
  },
  {
    id: 12,
    name: "Topological Sort",
    solveCount: 5,
    tag: "Graph",
    problems: [
      { name: "Course Schedule", slug: "course-schedule" },
      { name: "Course Schedule II", slug: "course-schedule-ii" },
      { name: "Alien Dictionary", slug: "alien-dictionary" },
    ],
    techniques: ["Kahn's algorithm (BFS)", "DFS 3-color cycle detection", "dependency ordering", "post-order reversal"],
    dataStructures: ["indegree[] array", "deque", "defaultdict(list)", "color[] (WHITE/GRAY/BLACK)"],
    code: `indegree = [0] * n
graph = defaultdict(list)
for u, v in edges:
    graph[u].append(v)
    indegree[v] += 1

queue = deque(i for i in range(n) if indegree[i] == 0)
order = []
while queue:
    node = queue.popleft()
    order.append(node)
    for nei in graph[node]:
        indegree[nei] -= 1
        if indegree[nei] == 0:
            queue.append(nei)
return order if len(order) == n else []`,
    runtime: "O(V + E) time, O(V + E) space",
    optimalCode: `# DFS-based topo sort with 3-color cycle detection
def topo_dfs(n, edges):
    graph = defaultdict(list)
    for u, v in edges:
        graph[u].append(v)
    WHITE, GRAY, BLACK = 0, 1, 2
    color = [WHITE] * n
    order = []

    def dfs(u):
        color[u] = GRAY
        for v in graph[u]:
            if color[v] == GRAY:
                return False  # cycle
            if color[v] == WHITE and not dfs(v):
                return False
        color[u] = BLACK
        order.append(u)
        return True

    if not all(dfs(i) for i in range(n) if color[i] == WHITE):
        return []
    return order[::-1]`,
    optimalRuntime: "O(V + E) time, O(V + E) space",
    optimalNote: "DFS topo sort with 3-color marking detects cycles and builds order in one pass. Useful when you also need cycle detection (Alien Dictionary).",
  },
  {
    id: 13,
    name: "Tree DFS",
    solveCount: 74,
    tag: "Tree",
    problems: [
      { name: "Maximum Depth of Binary Tree", slug: "maximum-depth-of-binary-tree" },
      { name: "Diameter of Binary Tree", slug: "diameter-of-binary-tree" },
      { name: "Binary Tree Maximum Path Sum", slug: "binary-tree-maximum-path-sum" },
      { name: "Validate Binary Search Tree", slug: "validate-binary-search-tree" },
    ],
    techniques: ["postorder return value", "global state update (self.ans)", "boundary passing (min/max)", "Morris threading (O(1) space)", "inorder/preorder/postorder"],
    dataStructures: ["recursion stack", "threaded pointers", "tuple return (val, depth)"],
    code: `def dfs(node):
    if not node:
        return 0
    left = dfs(node.left)
    right = dfs(node.right)
    self.ans = max(self.ans, left + right)
    return max(left, right) + 1`,
    runtime: "O(n) time, O(h) space (h = height)",
    optimalCode: `# Morris Traversal: O(1) space inorder
def inorder_morris(root):
    result = []
    curr = root
    while curr:
        if not curr.left:
            result.append(curr.val)
            curr = curr.right
        else:
            pred = curr.left
            while pred.right and pred.right != curr:
                pred = pred.right
            if not pred.right:
                pred.right = curr  # thread
                curr = curr.left
            else:
                pred.right = None  # unthread
                result.append(curr.val)
                curr = curr.right
    return result`,
    optimalRuntime: "O(n) time, O(1) space",
    optimalNote: "Morris traversal threads the tree to eliminate the recursion stack. O(1) space inorder -- useful when you can't afford O(h) stack space (e.g., Validate BST, Kth Smallest).",
  },
  {
    id: 14,
    name: "Dijkstra's Shortest Path",
    solveCount: 4,
    tag: "Graph",
    problems: [
      { name: "Network Delay Time", slug: "network-delay-time" },
      { name: "Cheapest Flights Within K Stops", slug: "cheapest-flights-within-k-stops" },
      { name: "Swim in Rising Water", slug: "swim-in-rising-water" },
    ],
    techniques: ["lazy deletion (skip stale)", "0-1 BFS (binary weights)", "Bellman-Ford (k stops)", "modified weights (min-bottleneck)", "early termination"],
    dataStructures: ["heapq (min-heap)", "deque (0-1 BFS)", "dist[] array", "adjacency list + weights"],
    code: `def dijkstra(graph, src, n):
    dist = [float('inf')] * n
    dist[src] = 0
    heap = [(0, src)]
    while heap:
        d, u = heapq.heappop(heap)
        if d > dist[u]:
            continue
        for v, w in graph[u]:
            if dist[u] + w < dist[v]:
                dist[v] = dist[u] + w
                heapq.heappush(heap, (dist[v], v))
    return dist`,
    runtime: "O((V + E) log V) time, O(V) space",
    optimalCode: `# 0-1 BFS for binary-weight graphs: O(V + E)
def bfs_01(graph, src, n):
    dist = [float('inf')] * n
    dist[src] = 0
    dq = deque([src])
    while dq:
        u = dq.popleft()
        for v, w in graph[u]:  # w is 0 or 1
            if dist[u] + w < dist[v]:
                dist[v] = dist[u] + w
                if w == 0:
                    dq.appendleft(v)
                else:
                    dq.append(v)
    return dist`,
    optimalRuntime: "O(V + E) time, O(V) space",
    optimalNote: "When edge weights are 0 or 1, use 0-1 BFS with a deque instead of Dijkstra's heap. O(V+E) vs O((V+E) log V). For k-stop limits, use Bellman-Ford (k relaxation rounds).",
  },
  {
    id: 15,
    name: "Linked List Patterns",
    solveCount: 36,
    tag: "Linked List",
    problems: [
      { name: "Reorder List", slug: "reorder-list" },
      { name: "Linked List Cycle", slug: "linked-list-cycle" },
      { name: "Find the Duplicate Number", slug: "find-the-duplicate-number" },
      { name: "Reverse Linked List", slug: "reverse-linked-list" },
    ],
    techniques: ["slow/fast pointer (find middle)", "reverse in-place", "dummy node (avoid edge cases)", "reverse in k-groups", "merge two sorted lists"],
    dataStructures: ["ListNode", "prev/curr/nxt pointers", "dummy ListNode(0)"],
    code: `# Find middle (slow/fast)
slow = fast = head
while fast and fast.next:
    slow = slow.next
    fast = fast.next.next

# Reverse
prev = None
curr = head
while curr:
    nxt = curr.next
    curr.next = prev
    prev = curr
    curr = nxt
return prev`,
    runtime: "O(n) time, O(1) space",
    optimalCode: `# Reverse K-group (generalized pattern)
def reverseKGroup(head, k):
    dummy = ListNode(0, head)
    prev_group = dummy
    while True:
        kth = prev_group
        for _ in range(k):
            kth = kth.next
            if not kth:
                return dummy.next
        next_group = kth.next
        prev, curr = next_group, prev_group.next
        for _ in range(k):
            nxt = curr.next
            curr.next = prev
            prev = curr
            curr = nxt
        tmp = prev_group.next
        prev_group.next = kth
        prev_group = tmp`,
    optimalRuntime: "O(n) time, O(1) space",
    optimalNote: "Dummy node eliminates head edge cases. The reverse-k-group pattern generalizes to all linked list reversal problems -- reorder list is just reverse-2nd-half + merge.",
  },
  {
    id: 16,
    name: "Grid DFS / BFS (Matrix Traversal)",
    solveCount: 62,
    tag: "Matrix",
    problems: [
      { name: "Number of Islands", slug: "number-of-islands" },
      { name: "Max Area of Island", slug: "max-area-of-island" },
      { name: "Surrounded Regions", slug: "surrounded-regions" },
      { name: "Flood Fill", slug: "flood-fill" },
      { name: "Shortest Path in Binary Matrix", slug: "shortest-path-in-binary-matrix" },
    ],
    techniques: ["in-place marking (no visited set)", "4-directional traversal", "8-directional traversal", "boundary-first DFS", "BFS shortest path", "connected components"],
    dataStructures: ["directions[] array", "set() (visited)", "deque (BFS)", "grid mutation (mark '#')"],
    code: `def numIslands(grid):
    rows, cols = len(grid), len(grid[0])
    visited = set()
    count = 0

    def dfs(r, c):
        if (r < 0 or r >= rows or c < 0 or c >= cols
                or grid[r][c] == '0' or (r, c) in visited):
            return
        visited.add((r, c))
        for dr, dc in [(0,1),(0,-1),(1,0),(-1,0)]:
            dfs(r + dr, c + dc)

    for r in range(rows):
        for c in range(cols):
            if grid[r][c] == '1' and (r, c) not in visited:
                dfs(r, c)
                count += 1
    return count`,
    runtime: "O(m * n) time, O(m * n) space",
    optimalCode: `# In-place marking: no visited set needed
def numIslands(grid):
    rows, cols = len(grid), len(grid[0])
    count = 0

    def dfs(r, c):
        if r < 0 or r >= rows or c < 0 or c >= cols or grid[r][c] != '1':
            return
        grid[r][c] = '#'  # mark visited in-place
        dfs(r+1, c); dfs(r-1, c); dfs(r, c+1); dfs(r, c-1)

    for r in range(rows):
        for c in range(cols):
            if grid[r][c] == '1':
                dfs(r, c)
                count += 1
    return count

# BFS for shortest path (8-directional)
def shortestPathBinaryMatrix(grid):
    n = len(grid)
    if grid[0][0] or grid[n-1][n-1]:
        return -1
    q = deque([(0, 0, 1)])
    grid[0][0] = 1
    for r, c, dist in q:
        if r == n-1 and c == n-1:
            return dist
        for dr in [-1, 0, 1]:
            for dc in [-1, 0, 1]:
                nr, nc = r+dr, c+dc
                if 0 <= nr < n and 0 <= nc < n and not grid[nr][nc]:
                    grid[nr][nc] = 1
                    q.append((nr, nc, dist+1))
    return -1`,
    optimalRuntime: "O(m * n) time, O(min(m, n)) space for DFS stack",
    optimalNote: "Mark cells in-place ('1' -> '#') to eliminate the visited set entirely. For shortest path problems, use BFS with distance tracking. 8-directional for binary matrix.",
  },
  {
    id: 17,
    name: "Matrix Connected Components",
    solveCount: 21,
    tag: "Matrix",
    problems: [
      { name: "Most Stones Removed with Same Row or Column", slug: "most-stones-removed-with-same-row-or-column" },
      { name: "Number of Provinces", slug: "number-of-provinces" },
      { name: "Accounts Merge", slug: "accounts-merge" },
      { name: "Making A Large Island", slug: "making-a-large-island" },
    ],
    techniques: ["~c coordinate trick (row/col union)", "label + expand (try flipping)", "component counting", "DFS adjacency grouping", "total - components = removable"],
    dataStructures: ["Union-Find (dict)", "adjacency list", "label grid", "size{} map"],
    code: `# Most Stones Removed -- group by shared row/col
def removeStones(stones):
    parent = {}

    def find(x):
        parent.setdefault(x, x)
        while parent[x] != x:
            parent[x] = parent[parent[x]]
            x = parent[x]
        return x

    def union(a, b):
        parent[find(a)] = find(b)

    for r, c in stones:
        union(r, ~c)  # ~c maps col to negative space

    # answer = total stones - number of components
    return len(stones) - len({find(r) for r, c in stones})`,
    runtime: "O(n * alpha(n)) time, O(n) space",
    optimalCode: `# DFS approach: fewer lines, same idea
def removeStones(stones):
    adj = defaultdict(list)
    for i, (r1, c1) in enumerate(stones):
        for j in range(i+1, len(stones)):
            r2, c2 = stones[j]
            if r1 == r2 or c1 == c2:
                adj[i].append(j)
                adj[j].append(i)

    visited = set()
    components = 0
    def dfs(i):
        visited.add(i)
        for j in adj[i]:
            if j not in visited:
                dfs(j)

    for i in range(len(stones)):
        if i not in visited:
            dfs(i)
            components += 1
    return len(stones) - components

# Making A Large Island: label + expand
def largestIsland(grid):
    n = len(grid)
    label, size = 2, {}

    def dfs(r, c, lbl):
        if r<0 or r>=n or c<0 or c>=n or grid[r][c]!=1:
            return 0
        grid[r][c] = lbl
        return 1 + sum(dfs(r+d, c+e, lbl)
            for d, e in [(0,1),(0,-1),(1,0),(-1,0)])

    for r in range(n):
        for c in range(n):
            if grid[r][c] == 1:
                size[label] = dfs(r, c, label)
                label += 1

    res = max(size.values(), default=0)
    for r in range(n):
        for c in range(n):
            if grid[r][c] == 0:
                seen = set()
                total = 1
                for dr, dc in [(0,1),(0,-1),(1,0),(-1,0)]:
                    nr, nc = r+dr, c+dc
                    if 0<=nr<n and 0<=nc<n and grid[nr][nc]>1:
                        lbl = grid[nr][nc]
                        if lbl not in seen:
                            seen.add(lbl)
                            total += size[lbl]
                res = max(res, total)
    return res`,
    optimalRuntime: "O(n^2) time, O(n^2) space",
    optimalNote: "For Most Stones: Union-Find with ~c trick maps rows and cols to the same space. For Making A Large Island: label components first, then try flipping each 0 and summing adjacent unique labels.",
  },
  {
    id: 18,
    name: "Anagram / Frequency Counting",
    solveCount: 31,
    tag: "String",
    problems: [
      { name: "Group Anagrams", slug: "group-anagrams" },
      { name: "Valid Anagram", slug: "valid-anagram" },
      { name: "Find All Anagrams in a String", slug: "find-all-anagrams-in-a-string" },
      { name: "Minimum Window Substring", slug: "minimum-window-substring" },
    ],
    techniques: ["sorted key grouping", "frequency array (26-slot)", "sliding window + counter match", "counter diff tracking", "tuple as dict key"],
    dataStructures: ["Counter()", "defaultdict(list)", "sorted()", "freq[26] array", "tuple(sorted(s))"],
    code: `# Group Anagrams
def groupAnagrams(strs):
    groups = defaultdict(list)
    for s in strs:
        key = tuple(sorted(s))
        groups[key].append(s)
    return list(groups.values())

# Find All Anagrams (sliding window)
def findAnagrams(s, p):
    if len(p) > len(s):
        return []
    p_count = Counter(p)
    window = Counter(s[:len(p)])
    res = []
    if window == p_count:
        res.append(0)
    for i in range(len(p), len(s)):
        window[s[i]] += 1
        window[s[i - len(p)]] -= 1
        if window[s[i - len(p)]] == 0:
            del window[s[i - len(p)]]
        if window == p_count:
            res.append(i - len(p) + 1)
    return res`,
    runtime: "O(n * k log k) grouping / O(n) sliding window",
    optimalCode: `# O(n * k) grouping with frequency tuple key
def groupAnagrams(strs):
    groups = defaultdict(list)
    for s in strs:
        count = [0] * 26
        for c in s:
            count[ord(c) - ord('a')] += 1
        groups[tuple(count)].append(s)
    return list(groups.values())

# Minimum Window Substring with counter diff
def minWindow(s, t):
    need = Counter(t)
    missing = len(t)
    l = start = 0
    min_len = float('inf')
    for r, c in enumerate(s):
        if need[c] > 0:
            missing -= 1
        need[c] -= 1
        while missing == 0:
            if r - l + 1 < min_len:
                min_len = r - l + 1
                start = l
            need[s[l]] += 1
            if need[s[l]] > 0:
                missing += 1
            l += 1
    return "" if min_len == float('inf') else s[start:start + min_len]`,
    optimalRuntime: "O(n * k) grouping / O(n) min window",
    optimalNote: "Frequency tuple key avoids O(k log k) sorting per string. For min window, track 'missing' count instead of comparing two Counter objects each step.",
  },
  {
    id: 19,
    name: "Trie (Prefix Tree)",
    solveCount: 12,
    tag: "String",
    problems: [
      { name: "Implement Trie", slug: "implement-trie-prefix-tree" },
      { name: "Word Search II", slug: "word-search-ii" },
      { name: "Design Add and Search Words", slug: "design-add-and-search-words-data-structure" },
      { name: "Word Break", slug: "word-break" },
    ],
    techniques: ["prefix lookup", "wildcard DFS ('.' matching)", "backtracking + trie pruning", "word termination flag", "node deletion after match"],
    dataStructures: ["dict-of-dicts (children)", "TrieNode class", "set() (word list)", "boolean end flag"],
    code: `class TrieNode:
    def __init__(self):
        self.children = {}
        self.is_end = False

class Trie:
    def __init__(self):
        self.root = TrieNode()

    def insert(self, word):
        node = self.root
        for c in word:
            if c not in node.children:
                node.children[c] = TrieNode()
            node = node.children[c]
        node.is_end = True

    def search(self, word):
        node = self.root
        for c in word:
            if c not in node.children:
                return False
            node = node.children[c]
        return node.is_end

    def startsWith(self, prefix):
        node = self.root
        for c in prefix:
            if c not in node.children:
                return False
            node = node.children[c]
        return True`,
    runtime: "O(m) per insert/search (m = word length)",
    optimalCode: `# defaultdict trie (fewer lines)
Trie = lambda: defaultdict(Trie)
trie = Trie()

def insert(word):
    node = trie
    for c in word:
        node = node[c]
    node['#'] = True  # end marker

# Word Search II: trie + backtracking with pruning
def findWords(board, words):
    trie = Trie()
    for w in words:
        node = trie
        for c in w:
            node = node[c]
        node['#'] = w  # store full word at leaf

    rows, cols = len(board), len(board[0])
    res = []

    def dfs(r, c, node):
        c_val = board[r][c]
        if c_val not in node:
            return
        nxt = node[c_val]
        if '#' in nxt:
            res.append(nxt.pop('#'))  # dedup + prune
        board[r][c] = '.'
        for dr, dc in [(0,1),(0,-1),(1,0),(-1,0)]:
            nr, nc = r+dr, c+dc
            if 0 <= nr < rows and 0 <= nc < cols and board[nr][nc] != '.':
                dfs(nr, nc, nxt)
        board[r][c] = c_val
        if not nxt:
            del node[c_val]  # prune empty branches

    for r in range(rows):
        for c in range(cols):
            dfs(r, c, trie)
    return res`,
    optimalRuntime: "O(m) per op / Word Search II: O(m*n * 4^L)",
    optimalNote: "defaultdict(Trie) is a one-liner trie. For Word Search II, store the full word at the leaf (no reconstruction), pop on find (dedup), and prune empty branches to shrink the trie as words are found.",
  },
  {
    id: 20,
    name: "Palindrome Patterns",
    solveCount: 18,
    tag: "String",
    problems: [
      { name: "Longest Palindromic Substring", slug: "longest-palindromic-substring" },
      { name: "Palindromic Substrings", slug: "palindromic-substrings" },
      { name: "Valid Palindrome II", slug: "valid-palindrome-ii" },
      { name: "Longest Palindrome", slug: "longest-palindrome" },
    ],
    techniques: ["expand from center", "two pointer inward check", "odd/even center handling", "skip one char (k-tolerance)", "frequency counting (build palindrome)"],
    dataStructures: ["two index variables (l, r)", "Counter()", "string slicing", "dp[][] (interval DP)"],
    code: `# Expand from center
def longestPalindrome(s):
    res = ""
    for i in range(len(s)):
        for l, r in [(i, i), (i, i+1)]:  # odd + even
            while l >= 0 and r < len(s) and s[l] == s[r]:
                if r - l + 1 > len(res):
                    res = s[l:r+1]
                l -= 1
                r += 1
    return res

# Count palindromic substrings
def countSubstrings(s):
    count = 0
    for i in range(len(s)):
        for l, r in [(i, i), (i, i+1)]:
            while l >= 0 and r < len(s) and s[l] == s[r]:
                count += 1
                l -= 1
                r += 1
    return count`,
    runtime: "O(n^2) time, O(1) space",
    optimalCode: `# Manacher's Algorithm: O(n) longest palindrome
def manacher(s):
    t = '#' + '#'.join(s) + '#'
    n = len(t)
    p = [0] * n
    c = r = 0
    for i in range(n):
        mirror = 2 * c - i
        if i < r:
            p[i] = min(r - i, p[mirror])
        while (i + p[i] + 1 < n and i - p[i] - 1 >= 0
               and t[i + p[i] + 1] == t[i - p[i] - 1]):
            p[i] += 1
        if i + p[i] > r:
            c, r = i, i + p[i]
    max_len = max(p)
    center = p.index(max_len)
    start = (center - max_len) // 2
    return s[start:start + max_len]

# Build longest palindrome from chars
def longestPalindromeBuild(s):
    counts = Counter(s)
    length = 0
    odd_found = False
    for cnt in counts.values():
        length += cnt // 2 * 2
        if cnt % 2 == 1:
            odd_found = True
    return length + (1 if odd_found else 0)`,
    optimalRuntime: "O(n) time (Manacher's), O(n) space",
    optimalNote: "Manacher's uses previously computed palindromes to skip redundant comparisons. For building a palindrome from chars, just count pairs + at most one odd center.",
  },
];

export const tags = [...new Set(patterns.map((p) => p.tag))];

export const stats = {
  totalSolved: 639,
  easy: 156,
  medium: 384,
  hard: 99,
  primaryLang: "Python3",
  problemsSolvedInPython: 502,
};
