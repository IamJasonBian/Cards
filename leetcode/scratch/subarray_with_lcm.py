from typing import List
import math

class Solution:
    def subarrayLCM(self, nums: List[int], k: int) -> int:
        """
        Count subarrays where the LCM of all elements equals k.
        
        Args:
            nums: List of integers
            k: Target LCM value
            
        Returns:
            Number of subarrays with LCM equal to k
            
        Example:
            >>> sol = Solution()
            >>> sol.subarrayLCM([3,6,2,7,1], 6)
            4
            >>> sol.subarrayLCM([3], 2)
            0
        """
        def lcm(a: int, b: int) -> int:
            """Helper function to compute LCM of two numbers."""
            return a * b // math.gcd(a, b) if a and b else 0
        
        count = 0
        n = len(nums)
        
        # Iterate through all possible starting points of subarrays
        for i in range(n):
            current_lcm = 1  # LCM identity element
            # For each starting point, extend the subarray to the right
            for j in range(i, n):
                # Update LCM for the current subarray nums[i..j]
                current_lcm = lcm(current_lcm, nums[j])
                
                # If LCM becomes larger than k, no need to continue this subarray
                if current_lcm > k:
                    break
                    
                # If LCM equals k, increment count
                if current_lcm == k:
                    count += 1
        
        return count

# Example usage
if __name__ == "__main__":
    sol = Solution()
    print(sol.subarrayLCM([3,6,2,7,1], 6))  # Output: 4
    print(sol.subarrayLCM([3], 2))          # Output: 0