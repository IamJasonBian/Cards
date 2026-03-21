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
    LC 199 - Binary Tree Right Side View

    Return the values of nodes visible when looking at the tree from the right side.
    i.e., the last (rightmost) node at each level.

    Approach: BFS level-order traversal, capture the last node of each level.
    Time: O(n)  Space: O(n)
    """

    def rightSideView(self, root: Optional[TreeNode]) -> List[int]:
        if not root:
            return []

        result = []
        queue = deque([root])

        while queue:
            level_size = len(queue)

            for i in range(level_size):
                node = queue.popleft()

                # Last node in this level is visible from the right
                if i == level_size - 1:
                    result.append(node.val)

                if node.left:
                    queue.append(node.left)
                if node.right:
                    queue.append(node.right)

        return result

    # ------------------------------------------------------------------ #
    # Alternative: DFS (right-first pre-order), track depth               #
    # ------------------------------------------------------------------ #
    def rightSideView_dfs(self, root: Optional[TreeNode]) -> List[int]:
        result = []

        def dfs(node: Optional[TreeNode], depth: int) -> None:
            if not node:
                return
            # First visit to this depth (right side first) → visible node
            if depth == len(result):
                result.append(node.val)
            dfs(node.right, depth + 1)
            dfs(node.left, depth + 1)

        dfs(root, 0)
        return result


# ------------------------------------------------------------------ #
# Tests                                                                #
# ------------------------------------------------------------------ #
def build_tree(values: list) -> Optional[TreeNode]:
    """Build tree from level-order list (None = missing node)."""
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
    # Right side: [1, 3, 4]
    root = build_tree([1, 2, 3, None, 5, None, 4])
    assert sol.rightSideView(root) == [1, 3, 4], "Test 1 failed"
    assert sol.rightSideView_dfs(root) == [1, 3, 4], "Test 1 DFS failed"

    # Single node
    root = build_tree([1])
    assert sol.rightSideView(root) == [1], "Test 2 failed"

    # Empty tree
    assert sol.rightSideView(None) == [], "Test 3 failed"

    #   1
    #  /
    # 2
    # Right side: [1, 2]
    root = build_tree([1, 2])
    assert sol.rightSideView(root) == [1, 2], "Test 4 failed"
    assert sol.rightSideView_dfs(root) == [1, 2], "Test 4 DFS failed"

    print("All tests passed!")
