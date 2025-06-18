class Solution:
    def largestPalindrome(self, n: int) -> int:
        """
        Find the largest palindrome made from the product of two n-digit numbers.
        Since the result could be very large, return it modulo 1337.
        
        Args:
        n (int): Number of digits for the two numbers to multiply
        
        Returns:
        int: Largest palindrome modulo 1337
        """
        if n == 1:
            return 9
        
        # Calculate the upper and lower bounds for n-digit numbers
        upper = 10**n - 1
        lower = 10**(n-1)
        
        max_num = upper * upper
        first_half = max_num // (10**n)
        
        found = False
        palindrom = 0
        
        while not found and first_half >= lower:
            # Create the palindrome by mirroring the first half
            palindrom = int(str(first_half) + str(first_half)[::-1])
            
            # Try to find a divisor for the palindrome
            i = upper
            while i * i >= palindrom:
                if palindrom % i == 0 and palindrom // i <= upper:
                    found = True
                    break
                i -= 1
                
            first_half -= 1
        
        return palindrom % 1337

# Test cases
def test():
    sol = Solution()
    
    # Test case 1: n = 1
    assert sol.largestPalindrome(1) == 9, "Test case 1 failed"
    
    # Test case 2: n = 2
    # The largest palindrome made from the product of two 2-digit numbers is 9009 = 91 × 99
    assert sol.largestPalindrome(2) == 987, "Test case 2 failed"  # 9009 % 1337 = 987
    
    print("All test cases passed!")

if __name__ == "__main__":
    test()
