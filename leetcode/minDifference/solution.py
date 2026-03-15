from typing import List, Set, Tuple
import math
from functools import lru_cache

class Solution:
    def minDifference(self, n: int, k: int) -> List[int]:
        """
        Splits n into k positive integers with minimal maximum difference
        between any two numbers, such that their product equals n.
        
        Args:
            n: The number to split (1 <= n <= 10^6)
            k: Number of parts to split into (1 <= k <= 20, k <= n)
            
        Returns:
            List of k integers whose product is n, with minimal maximum difference
            between any two numbers.
        """
        if k == 1:
            return [n]
        if n == 1:
            return [1] * k

        # Get all prime factors of n with multiplicity
        def get_prime_factors(x: int) -> List[int]:
            factors = []
            # Handle 2 separately
            while x % 2 == 0:
                factors.append(2)
                x = x // 2
            # Check odd divisors up to sqrt(x)
            i = 3
            while i * i <= x:
                while x % i == 0:
                    factors.append(i)
                    x = x // i
                i += 2
            if x > 1:
                factors.append(x)
            return factors

        factors = get_prime_factors(n)
        
        # If we don't have enough factors, add 1s
        while len(factors) < k:
            factors.append(1)
        
        # Sort factors to help with distribution
        factors.sort()
        
        # Use a min-heap to always multiply the smallest current number with the next factor
        import heapq
        heap = [1] * k
        
        # Distribute factors to minimize the maximum product
        for factor in reversed(factors):
            # Always multiply the smallest current product with the next largest factor
            smallest = heapq.heappop(heap)
            heapq.heappush(heap, smallest * factor)
        
        result = sorted(heap)
        
        # Edge case: if we have 1s in the result, we might do better by distributing factors differently
        if 1 in result and len(factors) > k:
            # Try alternative distribution by combining some factors
            # This handles cases like n=24, k=4 where we want [2,2,2,3] instead of [1,2,3,4]
            combined = []
            temp_factors = factors.copy()
            
            # Try to combine factors to get k numbers
            while len(combined) < k - 1 and len(temp_factors) > 0:
                combined.append(temp_factors.pop())
            
            if temp_factors:
                remaining_product = 1
                for f in temp_factors:
                    remaining_product *= f
                combined.append(remaining_product)
            
            # Fill with 1s if needed
            while len(combined) < k:
                combined.append(1)
            
            combined.sort()
            
            # Choose the better distribution
            if max(combined) - min(combined) < max(result) - min(result):
                return combined
        
        return result


def test():
    solution = Solution()
    
    # Test cases
    test_cases = [
        (180, 2, [12, 15]),
        (100, 2, [10, 10]),
        (72, 3, [6, 6, 2]),
        (360, 4, [6, 6, 10, 1]),
        (1, 3, [1, 1, 1]),
        (17, 1, [17]),
        (12, 3, [2, 2, 3]),
        (24, 4, [2, 2, 2, 3]),
    ]
    
    for n, k, expected in test_cases:
        result = solution.minDifference(n, k)
        # Sort both for comparison since order doesn't matter
        result_sorted = sorted(result)
        expected_sorted = sorted(expected)
        
        # Verify product and length
        product = 1
        for num in result:
            product *= num
            
        if product != n or len(result) != k or result_sorted != expected_sorted:
            print(f"❌ Failed for n={n}, k={k}")
            print(f"   Expected: {expected_sorted}")
            print(f"   Got:      {result_sorted}")
            print(f"   Product:  {product} (should be {n})")
        else:
            print(f"✅ Passed: n={n}, k={k} -> {result_sorted}")


if __name__ == "__main__":
    test()
