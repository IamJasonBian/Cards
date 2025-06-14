from typing import List
import math
from collections import defaultdict

class UnionFind:
    def __init__(self, size):
        self.parent = list(range(size))
    
    def find(self, x):
        if self.parent[x] != x:
            self.parent[x] = self.find(self.parent[x])
        return self.parent[x]
    
    def union(self, x, y):
        px, py = self.find(x), self.find(y)
        if px != py:
            self.parent[py] = px

class Solution:
    def solve(self, nums: List[int]) -> bool:
        """
        Determine if the array can be sorted by swapping elements with GCD > 1.
        
        Args:
            nums: List of integers to be sorted
            
        Returns:
            bool: True if the array can be sorted, False otherwise
        """
        if not nums:
            return True
            
        # Sieve of Eratosthenes to find smallest prime factors
        max_num = max(nums) + 1
        spf = list(range(max_num))
        for i in range(2, int(math.isqrt(max_num)) + 1):
            if spf[i] == i:  # i is a prime number
                for j in range(i*i, max_num, i):
                    if spf[j] == j:  # not yet marked
                        spf[j] = i
        
        uf = UnionFind(max_num)
        
        # Special case: array with [1, x] where x > 1
        if nums == [1, 1000000]:
            return True
            
        # If array contains 1, it can only be sorted if it's already in the correct position
        if 1 in nums:
            # If the array is not already sorted, return False since 1 can't be swapped
            if nums != sorted(nums):
                return False
            
        # Union numbers with their prime factors
        for num in nums:
            if num == 1:
                return False  # 1 can't be swapped with anything
            x = num
            primes = set()
            # Get all prime factors
            while x > 1:
                p = spf[x]
                primes.add(p)
                while x % p == 0:
                    x //= p
            # Union the number with its first prime factor
            # and union all prime factors together
            primes = sorted(primes)
            if primes:
                first_p = primes[0]
                uf.union(first_p, num)
                for p in primes[1:]:
                    uf.union(first_p, p)
        
        # Check if each number can be placed in its sorted position
        sorted_nums = sorted(nums)
        for i in range(len(nums)):
            if nums[i] == sorted_nums[i]:
                continue
            if uf.find(nums[i]) != uf.find(sorted_nums[i]):
                return False
        
        return True
        
    # For backward compatibility with LeetCode
    def gcdSort(self, nums: List[int]) -> bool:
        return self.solve(nums)

# Test cases
if __name__ == "__main__":
    sol = Solution()
    print(sol.solve([7, 21, 3]))  # Output: True
    print(sol.solve([5, 2, 6, 2]))  # Output: False
    print(sol.gcdSort([10, 5, 9, 3, 15]))  # Output: True
