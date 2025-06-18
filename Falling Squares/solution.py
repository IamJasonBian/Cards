from typing import List

class Node:
    __slots__ = ['l', 'r', 'left', 'right', 'height', 'lazy']
    def __init__(self, l, r):
        self.l = l
        self.r = r
        self.left = None
        self.right = None
        self.height = 0
        self.lazy = 0  # For lazy propagation

class SegmentTree:
    def __init__(self, l, r):
        self.root = self.build(l, r)
    
    def build(self, l, r):
        node = Node(l, r)
        if l + 1 < r:
            mid = (l + r) // 2
            node.left = self.build(l, mid)
            node.right = self.build(mid, r)
        return node
    
    def push_down(self, node):
        if node.lazy > 0:
            node.height = node.lazy
            if node.left:
                node.left.lazy = node.lazy
                node.right.lazy = node.lazy
            node.lazy = 0
    
    def update_range(self, node, l, r, h):
        if node.r <= l or node.l >= r:
            self.push_down(node)
            return node.height
        
        if l <= node.l and node.r <= r:
            node.lazy = h
            self.push_down(node)
            return node.height
        
        self.push_down(node)
        left_max = self.update_range(node.left, l, r, h)
        right_max = self.update_range(node.right, l, r, h)
        node.height = max(left_max, right_max)
        return node.height
    
    def query_range(self, node, l, r):
        if node.r <= l or node.l >= r:
            return 0
        
        self.push_down(node)
        if l <= node.l and node.r <= r:
            return node.height
        
        return max(self.query_range(node.left, l, r), 
                   self.query_range(node.right, l, r))

class Solution:
    def fallingSquares(self, positions: List[List[int]]) -> List[int]:
        """
        Simulate falling squares and return the height of the tallest stack after each drop.
        
        Args:
        positions: List of [left, side_length] where:
                 - left is the x-coordinate of the left edge of the square
                 - side_length is the length of the square's side
        
        Returns:
        List of integers representing the height of the tallest stack after each drop
        """
        if not positions:
            return []
        
        # Find the maximum right boundary to determine the range of our segment tree
        max_right = 0
        for left, size in positions:
            max_right = max(max_right, left + size)
        
        st = SegmentTree(0, max_right)
        res = []
        max_h = 0
        
        for left, size in positions:
            right = left + size
            # Find the maximum height in the current range [left, right)
            current_h = st.query_range(st.root, left, right)
            # The new height will be current_h + size
            new_h = current_h + size
            # Update the height in the range [left, right)
            st.update_range(st.root, left, right, new_h)
            # Update the maximum height
            max_h = max(max_h, new_h)
            res.append(max_h)
        
        return res

def test():
    sol = Solution()
    
    # Test case 1
    positions1 = [[1, 2], [2, 3], [6, 1]]
    expected1 = [2, 5, 5]
    result1 = sol.fallingSquares(positions1)
    assert result1 == expected1, f"Test case 1 failed: expected {expected1}, got {result1}"
    
    # Test case 2: Overlapping squares
    positions2 = [[100, 100], [200, 100]]
    expected2 = [100, 100]
    result2 = sol.fallingSquares(positions2)
    assert result2 == expected2, f"Test case 2 failed: expected {expected2}, got {result2}"
    
    # Test case 3: Stacked squares
    positions3 = [[1, 2], [1, 3]]
    expected3 = [2, 5]
    result3 = sol.fallingSquares(positions3)
    assert result3 == expected3, f"Test case 3 failed: expected {expected3}, got {result3}"
    
    # Test case 4: Single square
    positions4 = [[5, 10]]
    expected4 = [10]
    result4 = sol.fallingSquares(positions4)
    assert result4 == expected4, f"Test case 4 failed: expected {expected4}, got {result4}"
    
    print("All test cases passed!")

if __name__ == "__main__":
    test()
