# Balanced Product Split

Given two integers `n` and `k`, split `n` into `k` positive integers such that:
1. The product of the integers equals `n`
2. The maximum difference between any two integers is minimized

## Solution

The solution uses a combinatorial approach to find the optimal split:
1. Generates all divisors of `n`
2. Tries all combinations of `k-1` divisors
3. For each combination, calculates the remaining factor and checks if it forms a valid split
4. Tracks the split with the smallest maximum difference

## Example

```python
solution = Solution()
solution.minDifference(180, 2)  # Returns [12, 15]
```

## Complexity

- Time: O(d^(k-1)) where d is the number of divisors of n
- Space: O(d) for storing divisors
