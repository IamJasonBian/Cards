from typing import List

class Solution:
    def canPartitionGrid(self, grid: List[List[int]]) -> bool:
        m, n = len(grid), len(grid[0])
        
        # Try horizontal cut
        # First calculate prefix sums for rows
        row_sums = [sum(row) for row in grid]
        total_sum = sum(row_sums)
        
        # Try each horizontal cut position
        curr_sum = 0
        for i in range(m - 1):  # Leave at least one row for second section
            curr_sum += row_sums[i]
            if curr_sum == total_sum - curr_sum:
                return True
        
        # Try vertical cut
        # Calculate column sums
        col_sums = [sum(grid[i][j] for i in range(m)) for j in range(n)]
        
        # Try each vertical cut position
        curr_sum = 0
        for j in range(n - 1):  # Leave at least one column for second section
            curr_sum += col_sums[j]
            if curr_sum == total_sum - curr_sum:
                return True
        
        return False