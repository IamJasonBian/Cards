# OG Binary Tree Problems — Early LeetCode Essentials

Classic problems that appear in nearly every interview and cover the core
binary-tree toolkit. Mastering these builds intuition for every harder variant.

---

## Foundation — Traversals

| # | Problem | Key idea | Difficulty |
|---|---------|----------|------------|
| 94 | Binary Tree Inorder Traversal | Stack / Morris traversal | Easy |
| 144 | Binary Tree Preorder Traversal | Stack (root→left→right) | Easy |
| 145 | Binary Tree Postorder Traversal | Two-stack trick or reverse preorder | Easy |
| 102 | Binary Tree Level Order Traversal | BFS deque, level-by-level | Medium |
| 107 | Binary Tree Level Order Traversal II | Same + reverse result | Medium |
| 103 | Binary Tree Zigzag Level Order Traversal | BFS + alternating direction | Medium |

---

## Views (Visible Nodes)

| # | Problem | Key idea | Difficulty |
|---|---------|----------|------------|
| 199 | Binary Tree Right Side View | BFS last node per level / DFS right-first | Medium |
| —  | Binary Tree Left Side View  | BFS first node per level / DFS left-first | Medium |

---

## Tree Properties

| # | Problem | Key idea | Difficulty |
|---|---------|----------|------------|
| 104 | Maximum Depth of Binary Tree | DFS height | Easy |
| 111 | Minimum Depth of Binary Tree | BFS first leaf | Easy |
| 110 | Balanced Binary Tree | Post-order height check | Easy |
| 100 | Same Tree | Recursive equality | Easy |
| 101 | Symmetric Tree | Mirror check (recursive / iterative) | Easy |
| 226 | Invert Binary Tree | Swap children recursively | Easy |
| 543 | Diameter of Binary Tree | Max left_height + right_height | Easy |
| 563 | Binary Tree Tilt | Post-order sum, accumulate tilt | Easy |

---

## Paths & Sums

| # | Problem | Key idea | Difficulty |
|---|---------|----------|------------|
| 112 | Path Sum | DFS, subtract target | Easy |
| 113 | Path Sum II | DFS + backtracking, collect paths | Medium |
| 124 | Binary Tree Maximum Path Sum | Post-order, track global max | Hard |
| 129 | Sum Root to Leaf Numbers | DFS, carry running number | Medium |
| 257 | Binary Tree Paths | DFS, build path string | Easy |

---

## Construction / Serialization

| # | Problem | Key idea | Difficulty |
|---|---------|----------|------------|
| 105 | Construct from Preorder + Inorder | Divide by root in inorder | Medium |
| 106 | Construct from Inorder + Postorder | Divide by root in inorder | Medium |
| 108 | Convert Sorted Array to BST | Mid as root, recurse | Easy |
| 297 | Serialize and Deserialize BT | BFS or preorder with nulls | Hard |

---

## Lowest Common Ancestor (LCA)

| # | Problem | Key idea | Difficulty |
|---|---------|----------|------------|
| 235 | LCA of a BST | Use BST ordering (no extra space) | Medium |
| 236 | LCA of a Binary Tree | Post-order, check left/right | Medium |

---

## BST Operations

| # | Problem | Key idea | Difficulty |
|---|---------|----------|------------|
| 98  | Validate Binary Search Tree | In-order must be strictly increasing | Medium |
| 173 | Binary Search Tree Iterator | Stack + push-left-spine trick | Medium |
| 230 | Kth Smallest Element in BST | In-order traversal, count k | Medium |
| 700 | Search in a BST | Compare val, go left/right | Easy |
| 701 | Insert into a BST | Find null spot, insert leaf | Medium |
| 450 | Delete Node in a BST | Three cases: leaf / one child / two children | Medium |
| 669 | Trim a BST | Recurse, skip out-of-range nodes | Medium |

---

## Advanced / Classic Hard

| # | Problem | Key idea | Difficulty |
|---|---------|----------|------------|
| 114 | Flatten BT to Linked List | Morris / pre-order rewire | Medium |
| 116 | Populating Next Right Pointers | BFS or O(1) space with `next` links | Medium |
| 117 | Populating Next Right Pointers II | Same but imperfect tree | Medium |
| 222 | Count Complete Tree Nodes | Binary search on last level O(log²n) | Medium |
| 314 | Binary Tree Vertical Order Traversal | BFS + column tracking | Medium |
| 437 | Path Sum III | Prefix sum + hashmap | Medium |

---

## Recommended Study Order

```
Week 1 — Core traversals (94, 144, 145, 102)
Week 2 — Tree properties (104, 110, 100, 101, 226, 543)
Week 3 — Paths & sums (112, 113, 257, 129)
Week 4 — Views & level tricks (199, left-side, 103, 107)
Week 5 — BST (98, 173, 230, 235, 236)
Week 6 — Construction & hard (105, 106, 297, 114, 437, 124)
```

---

## Pattern Cheat-Sheet

| Pattern | When to use |
|---------|-------------|
| **BFS (deque)** | Level-order, views, minimum depth |
| **DFS pre-order** | Serialize, path building, flatten |
| **DFS in-order** | BST problems (sorted order) |
| **DFS post-order** | Height, diameter, LCA, path sum max |
| **Stack (iterative)** | When recursion stack may overflow; BST iterator |
| **Morris traversal** | O(1) space in-order / pre-order |
| **Prefix sum map** | Path sum counting (LC 437) |
| **Divide & conquer** | Tree construction from traversal arrays |
