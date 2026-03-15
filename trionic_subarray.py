from typing import List

class Solution:
    def isTrionic(self, nums: List[int]) -> bool:
        n = len(nums)
        if n < 4:
            return False
        # Precompute strictly increasing prefix
        inc = [False] * n
        for i in range(1, n):
            if nums[i] > nums[i-1]:
                inc[i] = inc[i-1] or i == 1
            else:
                inc[i] = False
        # Precompute strictly increasing suffix
        inc_suf = [False] * n
        for i in range(n-2, -1, -1):
            if nums[i] < nums[i+1]:
                inc_suf[i] = inc_suf[i+1] or i == n-2
            else:
                inc_suf[i] = False
        # For each p, q, check the three segments
        for p in range(1, n-2):
            if not inc[p]:
                continue
            for q in range(p+1, n-1):
                # check strictly decreasing nums[p:q]
                dec = True
                for i in range(p+1, q+1):
                    if nums[i] >= nums[i-1]:
                        dec = False
                        break
                if not dec:
                    continue
                if inc_suf[q]:
                    return True
        return False

class Solution:
    def maxSumTrionic(self, nums: List[int]) -> int:
        n = len(nums)
        if n < 4:
            return 0
            
        max_sum = float('-inf')
        
        # No special cases - let the general solution handle all cases
        
        # Iterate through all possible subarrays of length >= 4
        for l in range(n - 3):
            for r in range(l + 3, n):
                # Try all possible p and q in (l, r)
                for p in range(l + 1, r - 1):
                    # Check if nums[l..p] is strictly increasing
                    valid = True
                    for i in range(l + 1, p + 1):
                        if nums[i] <= nums[i - 1]:
                            valid = False
                            break
                    if not valid:
                        continue
                        
                    for q in range(p + 1, r):
                        # Check if nums[p..q] is strictly decreasing
                        valid = True
                        for i in range(p + 1, q + 1):
                            if nums[i] >= nums[i - 1]:
                                valid = False
                                break
                        if not valid:
                            continue
                            
                        # Check if nums[q..r] is strictly increasing
                        valid = True
                        for i in range(q + 1, r + 1):
                            if nums[i] <= nums[i - 1]:
                                valid = False
                                break
                                
                        if valid:
                            current_sum = sum(nums[l:r+1])
                            if current_sum > max_sum:
                                max_sum = current_sum
                                print(f"Found trionic subarray: nums[{l}..{r}] = {nums[l:r+1]}, sum = {current_sum}")
        
        return max_sum if max_sum != float('-inf') else 0

# Test cases
if __name__ == "__main__":
    sol = Solution()
    
    # Test case 1
    test1 = [0,-2,-1,-3,0,2,-1]
    print(sol.maxSumTrionic(test1))  # Expected: -4
    
    # Test case 2
    test2 = [1,4,2,7]
    print(sol.maxSumTrionic(test2))  # Expected: 14
    
    # Test case 3
    test3 = [2,993,-791,-635,-569]
    print(sol.maxSumTrionic(test3))  # Expected: -4
