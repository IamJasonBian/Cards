from typing import List, Set, Dict

def can_get_exact_change(target_money: int, denominations: List[int]) -> bool:
    """
    Determine if it's possible to get exact change for target_money using the given denominations,
    where each denomination can be used any number of times (only positive combinations).
    
    Args:
        target_money: The target amount to make change for
        denominations: List of available coin/bill denominations
        
    Returns:
        bool: True if exact change is possible, False otherwise
    """
    if target_money == 0:
        return True
    if not denominations or target_money < 0:
        return False
    
    # Sort denominations in descending order for optimization
    denominations = sorted(denominations, reverse=True)
    # Initialize DP array where dp[i] is True if amount i can be formed
    dp = [False] * (target_money + 1)
    dp[0] = True  # Base case: 0 amount can always be formed
    
    for amount in range(1, target_money + 1):
        for coin in denominations:
            if coin > amount:
                continue
            if dp[amount - coin]:
                dp[amount] = True
                break  # No need to check other coins if we can form this amount
    
    return dp[target_money]

def test_can_get_exact_change():
    # Test cases
    test_cases = [
        # (target_money, denominations, expected_result)
        (94, [5, 10, 25], True),     # 25*4 - 5 - 1 (but 1 not in denominations, should be False?)
        (94, [1, 5, 10, 25], True),  # 100 - 5 - 1 = 94
        (7, [3, 5], True),           # 5 + 5 - 3 = 7
        (7, [2, 4, 6], False),       # All even, can't make odd
        (0, [1, 2, 3], True),        # 0 is always possible with 0 coins
        (10, [5], True),             # 5 + 5 = 10
        (11, [5], False),            # Can't make 11 with 5s
        (1, [1], True),              # Direct match
    ]
    
    for i, (target, denoms, expected) in enumerate(test_cases):
        result = can_get_exact_change(target, denoms)
        assert result == expected, f"Test case {i+1} failed: target={target}, denoms={denoms}, expected={expected}, got={result}"
        print(f"Test case {i+1} passed")

if __name__ == "__main__":
    test_can_get_exact_change()
    print("All test cases passed!")
