class Solution:
    def checkRecord(self, n: int) -> int:
        """
        Calculate the number of possible attendance records of length n that make a student eligible for an attendance award.
        The record may contain the following three characters:
        - 'A' : Absent.
        - 'L' : Late.
        - 'P' : Present.
        
        A student can be rewarded if their attendance record doesn't contain:
        - More than one 'A' (absent).
        - Three or more consecutive 'L' (late).
        
        Args:
        n: Length of the attendance record (1 <= n <= 10^5)
        
        Returns:
        int: Number of possible records modulo 10^9 + 7
        """
        MOD = 10**9 + 7
        
        # dp[i][a][l] represents the number of valid sequences of length i with:
        # - a: number of 'A's in the sequence (0 or 1)
        # - l: number of consecutive 'L's at the end (0, 1, or 2)
        
        # Initialize dp for sequences of length 1
        dp = [[0] * 3 for _ in range(2)]
        dp[0][0] = 1  # 'P'
        dp[0][1] = 1  # 'L'
        dp[1][0] = 1  # 'A'
        
        for _ in range(1, n):
            new_dp = [[0] * 3 for _ in range(2)]
            
            # Add 'P' (Present)
            for a in range(2):
                for l in range(3):
                    new_dp[a][0] = (new_dp[a][0] + dp[a][l]) % MOD
            
            # Add 'A' (Absent) - can only add if we haven't had an 'A' yet
            for l in range(3):
                new_dp[1][0] = (new_dp[1][0] + dp[0][l]) % MOD
            
            # Add 'L' (Late) - can't have 3 or more consecutive 'L's
            for a in range(2):
                for l in range(2):
                    new_dp[a][l + 1] = (new_dp[a][l + 1] + dp[a][l]) % MOD
            
            dp = new_dp
        
        # Sum all valid states
        result = 0
        for a in range(2):
            for l in range(3):
                result = (result + dp[a][l]) % MOD
                
        return result

def test():
    sol = Solution()
    
    # Test case 1: n = 1
    # Possible records: "P", "A", "L"
    assert sol.checkRecord(1) == 3, "Test case 1 failed"
    
    # Test case 2: n = 2
    # All possible valid combinations:
    # PP, AP, LP, PA, PL, AL, LA (but not LL because it would be 2 consecutive L's which is allowed)
    # Total: 8 combinations
    assert sol.checkRecord(2) == 8, "Test case 2 failed"
    
    # Test case 3: n = 3
    # There are 19 valid combinations
    assert sol.checkRecord(3) == 19, "Test case 3 failed"
    
    # Test case 4: n = 4
    # Should return 43
    assert sol.checkRecord(4) == 43, "Test case 4 failed"
    
    print("All test cases passed!")

if __name__ == "__main__":
    test()
