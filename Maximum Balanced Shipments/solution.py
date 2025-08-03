from typing import List

class Solution:
    def maxBalancedShipments(self, weight: List[int]) -> int:
        """Return the maximum number of non-overlapping balanced shipments.

        A shipment is a contiguous subarray where the last element is strictly less
        than the maximum element in that subarray. We greedily form the earliest
        possible balanced shipment and repeat.

        Time Complexity: O(n)
        Space Complexity: O(1)
        """
        n = len(weight)
        count = 0
        start = 0

        while start < n:
            # Need at least two parcels to form a balanced shipment.
            if start == n - 1:
                break

            max_so_far = weight[start]
            end = start + 1
            found = False

            while end < n:
                if weight[end] < max_so_far:
                    count += 1
                    start = end + 1
                    found = True
                    break
                max_so_far = max(max_so_far, weight[end])
                end += 1

            if not found:
                break

        return count
