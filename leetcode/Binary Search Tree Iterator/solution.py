from typing import Optional

# Definition for a binary tree node.
class TreeNode:
    def __init__(self, val=0, left=None, right=None):
        self.val = val
        self.left = left
        self.right = right


# ======================================================================== #
#  LC 173 - Binary Search Tree Iterator                                     #
#                                                                           #
#  Implement an in-order iterator over a BST:                               #
#    next()    → return next smallest integer  O(1) amortized               #
#    hasNext() → return True if more nodes     O(1)                         #
#                                                                           #
#  Space: O(h) where h = tree height (stack holds one path to a leaf)       #
# ======================================================================== #

class BSTIterator:
    """
    Key insight: simulate recursive in-order traversal with an explicit stack.
    Push left spine of the current subtree; each call to next() pops the top,
    then pushes the left spine of the popped node's right child.

    Amortized O(1) next() because each node is pushed and popped exactly once
    across all n calls, giving O(n) total work → O(1) average per call.
    """

    def __init__(self, root: Optional[TreeNode]):
        self._stack: list[TreeNode] = []
        self._push_left_spine(root)

    def _push_left_spine(self, node: Optional[TreeNode]) -> None:
        """Push all nodes on the path from node down to its leftmost child."""
        while node:
            self._stack.append(node)
            node = node.left

    def next(self) -> int:
        node = self._stack.pop()           # smallest remaining node
        self._push_left_spine(node.right)  # prepare its right subtree
        return node.val

    def hasNext(self) -> bool:
        return bool(self._stack)


# ======================================================================== #
#  Bonus: Bidirectional BST Iterator (next + prev)                          #
#  Uses two stacks: one for ascending, one for descending traversal.        #
# ======================================================================== #

class BSTIteratorBidirectional:
    """
    Supports both next() (in-order ascending) and prev() (reverse in-order).
    Two stacks mirror each other:
      _asc_stack  → drives ascending  iteration (left-first)
      _desc_stack → drives descending iteration (right-first)
    """

    def __init__(self, root: Optional[TreeNode]):
        self._asc: list[TreeNode] = []
        self._desc: list[TreeNode] = []
        self._push_left(root)
        self._push_right(root)

    def _push_left(self, node: Optional[TreeNode]) -> None:
        while node:
            self._asc.append(node)
            node = node.left

    def _push_right(self, node: Optional[TreeNode]) -> None:
        while node:
            self._desc.append(node)
            node = node.right

    def hasNext(self) -> bool:
        return bool(self._asc)

    def next(self) -> int:
        node = self._asc.pop()
        self._push_left(node.right)
        return node.val

    def hasPrev(self) -> bool:
        return bool(self._desc)

    def prev(self) -> int:
        node = self._desc.pop()
        self._push_right(node.left)
        return node.val


# ======================================================================== #
#  Tests                                                                    #
# ======================================================================== #
def build_bst_from_sorted(values: list) -> Optional[TreeNode]:
    """Build a balanced BST from a sorted list (for testing)."""
    if not values:
        return None
    mid = len(values) // 2
    root = TreeNode(values[mid])
    root.left  = build_bst_from_sorted(values[:mid])
    root.right = build_bst_from_sorted(values[mid + 1:])
    return root


if __name__ == "__main__":
    #        7
    #       / \
    #      3   15
    #         /  \
    #        9   20
    root = TreeNode(7)
    root.left  = TreeNode(3)
    root.right = TreeNode(15)
    root.right.left  = TreeNode(9)
    root.right.right = TreeNode(20)

    # --- LC 173 basic tests ---
    it = BSTIterator(root)
    out = []
    while it.hasNext():
        out.append(it.next())
    assert out == [3, 7, 9, 15, 20], f"Expected [3,7,9,15,20], got {out}"
    print(f"LC 173 in-order: {out}")

    # --- Bidirectional iterator ---
    values = list(range(1, 8))  # 1..7
    bst = build_bst_from_sorted(values)

    bi = BSTIteratorBidirectional(bst)
    asc = []
    while bi.hasNext():
        asc.append(bi.next())
    assert asc == values, f"Ascending failed: {asc}"

    desc = []
    while bi.hasPrev():
        desc.append(bi.prev())
    assert desc == values[::-1], f"Descending failed: {desc}"

    print(f"Bidirectional ascending:  {asc}")
    print(f"Bidirectional descending: {desc}")

    # --- Interleaved next/hasNext (LC 173 example) ---
    it2 = BSTIterator(root)
    assert it2.next() == 3
    assert it2.next() == 7
    assert it2.hasNext() == True
    assert it2.next() == 9
    assert it2.hasNext() == True
    assert it2.next() == 15
    assert it2.hasNext() == True
    assert it2.next() == 20
    assert it2.hasNext() == False

    print("All tests passed!")
