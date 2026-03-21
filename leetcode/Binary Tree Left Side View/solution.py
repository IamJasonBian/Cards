from typing import List, Optional
from collections import deque

# Definition for a binary tree node.
class TreeNode:
    def __init__(self, val=0, left=None, right=None):
        self.val = val
        self.left = left
        self.right = right


class Solution:
    """
    Binary Tree Left Side View

    Return the values of nodes visible when looking at the tree from the LEFT side.
    i.e., the first (leftmost) node at each level.

    This is the symmetric counterpart of LC 199 (Right Side View).

    Approach A: BFS — capture the FIRST node of each level.
    Approach B: DFS left-first pre-order — first visit to each depth is the visible node.

    Time: O(n)  Space: O(n)
    """

    # ------------------------------------------------------------------ #
    # BFS approach                                                         #
    # ------------------------------------------------------------------ #
    def leftSideView(self, root: Optional[TreeNode]) -> List[int]:
        if not root:
            return []

        result = []
        queue = deque([root])

        while queue:
            level_size = len(queue)

            for i in range(level_size):
                node = queue.popleft()

                # First node in this level is visible from the left
                if i == 0:
                    result.append(node.val)

                if node.left:
                    queue.append(node.left)
                if node.right:
                    queue.append(node.right)

        return result

    # ------------------------------------------------------------------ #
    # DFS approach (left-first pre-order)                                  #
    # ------------------------------------------------------------------ #
    def leftSideView_dfs(self, root: Optional[TreeNode]) -> List[int]:
        result = []

        def dfs(node: Optional[TreeNode], depth: int) -> None:
            if not node:
                return
            # First visit to this depth (left side first) → visible node
            if depth == len(result):
                result.append(node.val)
            dfs(node.left, depth + 1)
            dfs(node.right, depth + 1)

        dfs(root, 0)
        return result


# ------------------------------------------------------------------ #
# Side-by-side comparison helper                                       #
# ------------------------------------------------------------------ #
def both_views(root: Optional[TreeNode]):
    """Print left and right side views together for visual comparison."""
    from solution import Solution as RightSol  # noqa: F401 - for standalone use
    sol = Solution()
    left_view = sol.leftSideView(root)
    left_dfs  = sol.leftSideView_dfs(root)
    print(f"Left  side view (BFS): {left_view}")
    print(f"Left  side view (DFS): {left_dfs}")


# ------------------------------------------------------------------ #
# Tests                                                                #
# ------------------------------------------------------------------ #
def build_tree(values: list) -> Optional[TreeNode]:
    if not values:
        return None
    root = TreeNode(values[0])
    queue = deque([root])
    i = 1
    while queue and i < len(values):
        node = queue.popleft()
        if i < len(values) and values[i] is not None:
            node.left = TreeNode(values[i])
            queue.append(node.left)
        i += 1
        if i < len(values) and values[i] is not None:
            node.right = TreeNode(values[i])
            queue.append(node.right)
        i += 1
    return root


if __name__ == "__main__":
    sol = Solution()

    #       1
    #      / \
    #     2   3
    #      \   \
    #       5   4
    # Left side: [1, 2, 5]
    root = build_tree([1, 2, 3, None, 5, None, 4])
    assert sol.leftSideView(root) == [1, 2, 5], "Test 1 BFS failed"
    assert sol.leftSideView_dfs(root) == [1, 2, 5], "Test 1 DFS failed"

    # Single node
    root = build_tree([1])
    assert sol.leftSideView(root) == [1], "Test 2 failed"

    # Empty tree
    assert sol.leftSideView(None) == [], "Test 3 failed"

    #   1
    #    \
    #     2
    # Left side: [1, 2]
    root = build_tree([1, None, 2])
    assert sol.leftSideView(root) == [1, 2], "Test 4 failed"
    assert sol.leftSideView_dfs(root) == [1, 2], "Test 4 DFS failed"

    #       1
    #      / \
    #     2   3
    #    /
    #   4
    # Left side: [1, 2, 4]
    root = build_tree([1, 2, 3, 4])
    assert sol.leftSideView(root) == [1, 2, 4], "Test 5 failed"
    assert sol.leftSideView_dfs(root) == [1, 2, 4], "Test 5 DFS failed"

    print("All tests passed!")
