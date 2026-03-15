from typing import List


class Solution: 
    def maxSumTrionic(self, nums: List[int]) -> int:
        """Return the maximum sum of a trionic subarray.
        A trionic subarray is a contiguous part of ``nums`` that is strictly
        increasing, then strictly decreasing and finally strictly increasing
        again.  Each of the three segments must contain at least two elements.
        If no such subarray exists, ``0`` is returned.
        The algorithm keeps, for each index, the best suffix sums for the three
        phases (increase, decrease and the final increase).  This enables an
        ``O(n)`` scan with ``O(1)`` additional space.
        """
        n = len(nums)
        if n < 4:
            return 0

        inf = float("-inf")

        inc1 = nums[0]      # best suffix sum (len >= 1) in increasing phase
        inc2 = inf          # best suffix sum (len >= 2) in increasing phase
        dec1 = inf          # best suffix sum (len >= 1) after the decrease
        dec2 = inf          # best suffix sum (len >= 2) after the decrease
        tri1 = inf          # best suffix sum (len >= 1) of full pattern
        tri2 = inf          # best suffix sum (len >= 2) of full pattern
        ans = inf

        for i in range(1, n):
            x, prev = nums[i], nums[i - 1]

            # Phase 1: strictly increasing segment
            if prev < x:
                new_inc2 = max(prev + x, inc2 + x)
                new_inc1 = max(x, inc1 + x)
            else:
                new_inc1 = x
                new_inc2 = inf

            # Phase 2: strictly decreasing segment
            if prev > x:
                new_dec1 = max(dec1 + x, inc2 + x)
                new_dec2 = max(dec2 + x, dec1 + x, inc2 + x)
            else:
                new_dec1 = inf
                new_dec2 = inf

            # Phase 3: final strictly increasing segment
            if prev < x:
                new_tri1 = max(tri1 + x, dec2 + x)
                new_tri2 = max(tri2 + x, tri1 + x, dec2 + x)
            else:
                new_tri1 = inf
                new_tri2 = inf

            ans = max(ans, new_tri2)

            inc1, inc2 = new_inc1, new_inc2
            dec1, dec2 = new_dec1, new_dec2
            tri1, tri2 = new_tri1, new_tri2

        return ans if ans != inf else 0


# Test the solution
if __name__ == "__main__":
    sol = Solution()
    
    # Test case 1: Basic trionic array
    test1 = [1, 2, 5, 4, 3, 6, 7]
    result1 = sol.maxSumTrionic(test1)
    print(f"Test 1: {test1} => {result1}")
    
    # Test case 2: Array with multiple trionic subarrays
    test2 = [1, 3, 2, 1, 4, 5, 2, 3, 6, 7]
    result2 = sol.maxSumTrionic(test2)
    print(f"Test 2: {test2} => {result2}")
    
    # Test case 3: Array with no trionic subarray
    test3 = [1, 2, 3, 4, 5]
    result3 = sol.maxSumTrionic(test3)
    print(f"Test 3: {test3} => {result3}")
    
    # Test case 4: Array too short
    test4 = [1, 2, 3]
    result4 = sol.maxSumTrionic(test4)
    print(f"Test 4: {test4} => {result4}")
