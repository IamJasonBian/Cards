from typing import List

class Solution:
    def triangularSum(self, nums: List[int]) -> int:
        while len(nums) > 1:
            new_nums = []
            for i in range(len(nums) - 1):
                new_nums.append((nums[i] + nums[i + 1]) % 10)
            nums = new_nums
        return nums[0] if nums else 0

# Example usage:
if __name__ == "__main__":
    sol = Solution()
    print(sol.triangularSum([1, 2, 3, 4, 5]))  # Output: 8
    print(sol.triangularSum([5]))  # Output: 5
