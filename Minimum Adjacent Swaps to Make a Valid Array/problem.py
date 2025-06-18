from typing import List

class Solution:
    def minimumSwaps(self, nums: List[int]) -> int:
        """Return the minimum adjacent swaps to make array valid."""
        n = len(nums)
        if n <= 1:
            return 0

        min_val = min(nums)
        max_val = max(nums)
        min_idx = nums.index(min_val)           # first occurrence of smallest
        max_idx = n - 1 - nums[::-1].index(max_val)  # last occurrence of largest

        swaps = min_idx + (n - 1 - max_idx)
        if min_idx > max_idx:
            swaps -= 1
        return swaps

