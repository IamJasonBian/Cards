// Authoritative Blind 75 registry. Adds the LeetCode problem numbers that
// drive the path lookup in `neetcode-gh/leetcode` (e.g. python/0001-two-sum.py).
// Source: blind-75 list as published on teamblind / yangshun, cross-referenced
// with leetcode.com problem numbers.

export interface RegistryEntry {
  slug: string;
  number: number; // LeetCode problem number, used for neetcode-gh path padding
  title: string;
  difficulty: "Easy" | "Medium" | "Hard";
  category: string;
}

export const blind75Registry: RegistryEntry[] = [
  // Array
  { slug: "two-sum", number: 1, title: "Two Sum", difficulty: "Easy", category: "Array" },
  { slug: "best-time-to-buy-and-sell-stock", number: 121, title: "Best Time to Buy and Sell Stock", difficulty: "Easy", category: "Array" },
  { slug: "contains-duplicate", number: 217, title: "Contains Duplicate", difficulty: "Easy", category: "Array" },
  { slug: "product-of-array-except-self", number: 238, title: "Product of Array Except Self", difficulty: "Medium", category: "Array" },
  { slug: "maximum-subarray", number: 53, title: "Maximum Subarray", difficulty: "Medium", category: "Array" },
  { slug: "maximum-product-subarray", number: 152, title: "Maximum Product Subarray", difficulty: "Medium", category: "Array" },
  { slug: "find-minimum-in-rotated-sorted-array", number: 153, title: "Find Minimum in Rotated Sorted Array", difficulty: "Medium", category: "Array" },
  { slug: "search-in-rotated-sorted-array", number: 33, title: "Search in Rotated Sorted Array", difficulty: "Medium", category: "Array" },
  { slug: "3sum", number: 15, title: "3Sum", difficulty: "Medium", category: "Array" },
  { slug: "container-with-most-water", number: 11, title: "Container With Most Water", difficulty: "Medium", category: "Array" },
  // Binary
  { slug: "sum-of-two-integers", number: 371, title: "Sum of Two Integers", difficulty: "Medium", category: "Binary" },
  { slug: "number-of-1-bits", number: 191, title: "Number of 1 Bits", difficulty: "Easy", category: "Binary" },
  { slug: "counting-bits", number: 338, title: "Counting Bits", difficulty: "Easy", category: "Binary" },
  { slug: "missing-number", number: 268, title: "Missing Number", difficulty: "Easy", category: "Binary" },
  { slug: "reverse-bits", number: 190, title: "Reverse Bits", difficulty: "Easy", category: "Binary" },
  // DP
  { slug: "climbing-stairs", number: 70, title: "Climbing Stairs", difficulty: "Easy", category: "DP" },
  { slug: "coin-change", number: 322, title: "Coin Change", difficulty: "Medium", category: "DP" },
  { slug: "longest-increasing-subsequence", number: 300, title: "Longest Increasing Subsequence", difficulty: "Medium", category: "DP" },
  { slug: "longest-common-subsequence", number: 1143, title: "Longest Common Subsequence", difficulty: "Medium", category: "DP" },
  { slug: "word-break", number: 139, title: "Word Break", difficulty: "Medium", category: "DP" },
  { slug: "combination-sum-iv", number: 377, title: "Combination Sum IV", difficulty: "Medium", category: "DP" },
  { slug: "house-robber", number: 198, title: "House Robber", difficulty: "Medium", category: "DP" },
  { slug: "house-robber-ii", number: 213, title: "House Robber II", difficulty: "Medium", category: "DP" },
  { slug: "decode-ways", number: 91, title: "Decode Ways", difficulty: "Medium", category: "DP" },
  { slug: "unique-paths", number: 62, title: "Unique Paths", difficulty: "Medium", category: "DP" },
  { slug: "jump-game", number: 55, title: "Jump Game", difficulty: "Medium", category: "DP" },
  // Graph
  { slug: "clone-graph", number: 133, title: "Clone Graph", difficulty: "Medium", category: "Graph" },
  { slug: "course-schedule", number: 207, title: "Course Schedule", difficulty: "Medium", category: "Graph" },
  { slug: "pacific-atlantic-water-flow", number: 417, title: "Pacific Atlantic Water Flow", difficulty: "Medium", category: "Graph" },
  { slug: "number-of-islands", number: 200, title: "Number of Islands", difficulty: "Medium", category: "Graph" },
  { slug: "longest-consecutive-sequence", number: 128, title: "Longest Consecutive Sequence", difficulty: "Medium", category: "Graph" },
  { slug: "alien-dictionary", number: 269, title: "Alien Dictionary", difficulty: "Hard", category: "Graph" },
  { slug: "graph-valid-tree", number: 261, title: "Graph Valid Tree", difficulty: "Medium", category: "Graph" },
  { slug: "number-of-connected-components-in-an-undirected-graph", number: 323, title: "Number of Connected Components in an Undirected Graph", difficulty: "Medium", category: "Graph" },
  // Interval
  { slug: "insert-interval", number: 57, title: "Insert Interval", difficulty: "Medium", category: "Interval" },
  { slug: "merge-intervals", number: 56, title: "Merge Intervals", difficulty: "Medium", category: "Interval" },
  { slug: "non-overlapping-intervals", number: 435, title: "Non-overlapping Intervals", difficulty: "Medium", category: "Interval" },
  { slug: "meeting-rooms", number: 252, title: "Meeting Rooms", difficulty: "Easy", category: "Interval" },
  { slug: "meeting-rooms-ii", number: 253, title: "Meeting Rooms II", difficulty: "Medium", category: "Interval" },
  // Linked List
  { slug: "reverse-linked-list", number: 206, title: "Reverse Linked List", difficulty: "Easy", category: "Linked List" },
  { slug: "linked-list-cycle", number: 141, title: "Linked List Cycle", difficulty: "Easy", category: "Linked List" },
  { slug: "merge-two-sorted-lists", number: 21, title: "Merge Two Sorted Lists", difficulty: "Easy", category: "Linked List" },
  { slug: "merge-k-sorted-lists", number: 23, title: "Merge k Sorted Lists", difficulty: "Hard", category: "Linked List" },
  { slug: "remove-nth-node-from-end-of-list", number: 19, title: "Remove Nth Node From End of List", difficulty: "Medium", category: "Linked List" },
  { slug: "reorder-list", number: 143, title: "Reorder List", difficulty: "Medium", category: "Linked List" },
  // Matrix
  { slug: "set-matrix-zeroes", number: 73, title: "Set Matrix Zeroes", difficulty: "Medium", category: "Matrix" },
  { slug: "spiral-matrix", number: 54, title: "Spiral Matrix", difficulty: "Medium", category: "Matrix" },
  { slug: "rotate-image", number: 48, title: "Rotate Image", difficulty: "Medium", category: "Matrix" },
  { slug: "word-search", number: 79, title: "Word Search", difficulty: "Medium", category: "Matrix" },
  // String
  { slug: "longest-substring-without-repeating-characters", number: 3, title: "Longest Substring Without Repeating Characters", difficulty: "Medium", category: "String" },
  { slug: "longest-repeating-character-replacement", number: 424, title: "Longest Repeating Character Replacement", difficulty: "Medium", category: "String" },
  { slug: "minimum-window-substring", number: 76, title: "Minimum Window Substring", difficulty: "Hard", category: "String" },
  { slug: "valid-anagram", number: 242, title: "Valid Anagram", difficulty: "Easy", category: "String" },
  { slug: "group-anagrams", number: 49, title: "Group Anagrams", difficulty: "Medium", category: "String" },
  { slug: "valid-parentheses", number: 20, title: "Valid Parentheses", difficulty: "Easy", category: "String" },
  { slug: "valid-palindrome", number: 125, title: "Valid Palindrome", difficulty: "Easy", category: "String" },
  { slug: "longest-palindromic-substring", number: 5, title: "Longest Palindromic Substring", difficulty: "Medium", category: "String" },
  { slug: "palindromic-substrings", number: 647, title: "Palindromic Substrings", difficulty: "Medium", category: "String" },
  { slug: "encode-and-decode-strings", number: 271, title: "Encode and Decode Strings", difficulty: "Medium", category: "String" },
  // Tree
  { slug: "maximum-depth-of-binary-tree", number: 104, title: "Maximum Depth of Binary Tree", difficulty: "Easy", category: "Tree" },
  { slug: "same-tree", number: 100, title: "Same Tree", difficulty: "Easy", category: "Tree" },
  { slug: "invert-binary-tree", number: 226, title: "Invert Binary Tree", difficulty: "Easy", category: "Tree" },
  { slug: "binary-tree-maximum-path-sum", number: 124, title: "Binary Tree Maximum Path Sum", difficulty: "Hard", category: "Tree" },
  { slug: "binary-tree-level-order-traversal", number: 102, title: "Binary Tree Level Order Traversal", difficulty: "Medium", category: "Tree" },
  { slug: "serialize-and-deserialize-binary-tree", number: 297, title: "Serialize and Deserialize Binary Tree", difficulty: "Hard", category: "Tree" },
  { slug: "subtree-of-another-tree", number: 572, title: "Subtree of Another Tree", difficulty: "Easy", category: "Tree" },
  { slug: "construct-binary-tree-from-preorder-and-inorder-traversal", number: 105, title: "Construct Binary Tree from Preorder and Inorder Traversal", difficulty: "Medium", category: "Tree" },
  { slug: "validate-binary-search-tree", number: 98, title: "Validate Binary Search Tree", difficulty: "Medium", category: "Tree" },
  { slug: "kth-smallest-element-in-a-bst", number: 230, title: "Kth Smallest Element in a BST", difficulty: "Medium", category: "Tree" },
  { slug: "lowest-common-ancestor-of-a-binary-search-tree", number: 235, title: "Lowest Common Ancestor of a Binary Search Tree", difficulty: "Medium", category: "Tree" },
  { slug: "implement-trie-prefix-tree", number: 208, title: "Implement Trie (Prefix Tree)", difficulty: "Medium", category: "Tree" },
  { slug: "design-add-and-search-words-data-structure", number: 211, title: "Design Add and Search Words Data Structure", difficulty: "Medium", category: "Tree" },
  { slug: "word-search-ii", number: 212, title: "Word Search II", difficulty: "Hard", category: "Tree" },
  // Heap
  { slug: "top-k-frequent-elements", number: 347, title: "Top K Frequent Elements", difficulty: "Medium", category: "Heap" },
  { slug: "find-median-from-data-stream", number: 295, title: "Find Median from Data Stream", difficulty: "Hard", category: "Heap" },
];

export function pad4(n: number): string {
  return String(n).padStart(4, "0");
}
