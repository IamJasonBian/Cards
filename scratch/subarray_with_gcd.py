from typing import List
import math

class Solution:
    def subarrayGCD(self, nums: List[int], k: int) -> int:
        """
        Count subarrays where the GCD of all elements equals k.
        
        Args:
            nums: List of integers
            k: Target GCD value
            
        Returns:
            Number of subarrays with GCD equal to k
            
        Example:
            >>> sol = Solution()
            >>> sol.subarrayGCD([9,3,1,2,6,3], 3)
            4
            >>> sol.subarrayGCD([4], 7)
            0
        """
        count = 0
        n = len(nums)
        
        # Iterate through all possible starting points of subarrays
        for i in range(n):
            current_gcd = 0
            # For each starting point, extend the subarray to the right
            for j in range(i, n):
                # Update GCD for the current subarray nums[i..j]
                current_gcd = math.gcd(current_gcd, nums[j])
                
                # If GCD becomes smaller than k, no need to continue this subarray
                if current_gcd < k:
                    break
                    
                # If GCD equals k, increment count
                if current_gcd == k:
                    count += 1
        
        return count

# Example usage
if __name__ == "__main__":
    sol = Solution()
    print(sol.subarrayGCD([9,3,1,2,6,3], 3))  # Output: 4
    print(sol.subarrayGCD([4], 7))            # Output: 0