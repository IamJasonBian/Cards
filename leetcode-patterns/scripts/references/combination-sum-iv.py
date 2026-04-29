class Solution:
    def combinationSum4(self, nums: list[int], target: int) -> int:
        cache = {0: 1}
        
        for total in range(1, target + 1):
            cache[total] = 0
            for n in nums:
                cache[total] += cache.get(total - n, 0)
        return cache[target]
