from typing import List, Optional

# Definition for a binary tree node.
class TreeNode:
    def __init__(self, val=0, left=None, right=None):
        self.val = val
        self.left = left
        self.right = right

class Solution:
    def boundaryOfBinaryTree(self, root: Optional[TreeNode]) -> List[int]:
        """Return the boundary traversal of a binary tree.

        The boundary consists of the root, the left boundary (excluding leaves),
        all leaves from left to right, and the right boundary (excluding leaves)
        in reverse order.

        Time Complexity: O(n) where n is the number of nodes in the tree.
        Space Complexity: O(h) for recursion stack where h is the tree height.
        """
        if not root:
            return []

        def is_leaf(node: TreeNode) -> bool:
            return node.left is None and node.right is None

        boundary = [root.val]

        # Add left boundary excluding leaves
        node = root.left
        while node:
            if not is_leaf(node):
                boundary.append(node.val)
            node = node.left if node.left else node.right

        # Add leaves
        def add_leaves(node: Optional[TreeNode]):
            if not node:
                return
            if is_leaf(node):
                boundary.append(node.val)
            else:
                add_leaves(node.left)
                add_leaves(node.right)

        add_leaves(root.left)
        add_leaves(root.right)

        # Add right boundary excluding leaves (collected then reversed)
        stack = []
        node = root.right
        while node:
            if not is_leaf(node):
                stack.append(node.val)
            node = node.right if node.right else node.left
        boundary.extend(reversed(stack))

        return boundary
