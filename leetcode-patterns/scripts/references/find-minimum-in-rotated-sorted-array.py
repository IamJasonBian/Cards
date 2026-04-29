class Solution:
    def findMin(self, nums: list[int]) -> int:
        start, end = 0, len(nums) - 1
        curr_min = float("inf")
        
        while start < end:
            mid = start + (end - start) // 2
            curr_min = min(curr_min, nums[mid])
            
            # right half has the min
            if nums[mid] > nums[end]:
                start = mid + 1
            # left half has the min
            else:
                end = mid - 1
        
        return min(curr_min, nums[start])

