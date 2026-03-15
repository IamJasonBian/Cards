from typing import List
import math
from itertools import combinations

class Solution:
    def minDifference(self, n: int, k: int) -> List[int]:
        """
        Splits n into k positive integers with minimal maximum difference
        between any two numbers, such that their product equals n.
        
        Args:
            n: The number to split
            k: Number of parts to split into
            
        Returns:
            List of k integers whose product is n, with minimal maximum difference
        """
        if k == 1:
            return [n]
        if n == 1:
            return [1] * k

        # Find all divisors of n
        divisors = set()
        for i in range(1, int(math.isqrt(n)) + 1):
            if n % i == 0:
                divisors.add(i)
                divisors.add(n // i)
        divisors = sorted(divisors)

        best_diff = float('inf')
        best_factors = []

        # Try all combinations of k-1 factors
        for factors in combinations(divisors, k-1):
            product = 1
            for f in factors:
                product *= f
            if n % product != 0:
                continue
                
            last = n // product
            current_factors = list(factors) + [last]
            current_factors.sort()
            current_diff = current_factors[-1] - current_factors[0]
            
            if current_diff < best_diff:
                best_diff = current_diff
                best_factors = current_factors

        # If no valid combination found, use 1s
        if not best_factors:
            return [1] * (k-1) + [n // (1 ** (k-1))]

        return best_factors


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
