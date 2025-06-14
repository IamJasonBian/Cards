from collections import Counter

class Solution:
    def minDeletion(self, s: str, k: int) -> int:
        # Count frequency of each character
        freq = Counter(s)
        
        # If we already have <= k distinct chars, no deletions needed
        if len(freq) <= k:
            return 0
        
        # Get sorted frequencies
        freqs = sorted(freq.values(), reverse=True)
        
        # Try keeping each possible target frequency
        min_deletions = float('inf')
        for target in range(min(freqs), max(freqs) + 1):
            # Count deletions needed if we keep only characters with
            # frequency >= target, and reduce others to target-1
            curr_deletions = 0
            chars_kept = 0
            
            for f in freqs:
                if f >= target:
                    chars_kept += 1
                else:
                    curr_deletions += f
                    
                if chars_kept > k:
                    curr_deletions += f
                    chars_kept -= 1
            
            min_deletions = min(min_deletions, curr_deletions)
        
        return min_deletions