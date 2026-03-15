from collections import Counter

class Solution:
    def minDeletion(self, s: str, k: int) -> int:
        # Handle empty string case
        if not s:
            return 0
            
        # Count frequency of each character
        freq = Counter(s)
        
        # If we already have <= k distinct characters
        if len(freq) <= k:
            # If all frequencies are already equal, no deletions needed
            if len(set(freq.values())) == 1:
                return 0
            # Otherwise, we need to make frequencies equal
            min_freq = min(freq.values())
            return sum(f - min_freq for f in freq.values())
        
        # Get all frequencies in descending order
        freqs = sorted(freq.values(), reverse=True)
        min_deletions = float('inf')
        
        # Try all possible numbers of distinct characters to keep (from 1 to k)
        for m in range(1, k + 1):
            # We'll keep the top m most frequent characters
            # and try to make their frequencies equal
            
            # The target frequency must be <= the m-th frequency
            target = freqs[m-1]
            
            # Calculate deletions needed:
            # 1. For the top m-1 characters, delete (f - target) from each
            # 2. For the m-th character, delete (f - target) if f > target
            # 3. For all other characters, delete all occurrences
            deletions = 0
            for i in range(len(freqs)):
                if i < m:
                    if freqs[i] > target:
                        deletions += freqs[i] - target
                else:
                    deletions += freqs[i]
            
            min_deletions = min(min_deletions, deletions)
            
            # Also try target-1 in case it gives a better result
            if target > 1:
                target -= 1
                deletions = 0
                for i in range(len(freqs)):
                    if i < m:
                        if freqs[i] > target:
                            deletions += freqs[i] - target
                    else:
                        deletions += freqs[i]
                min_deletions = min(min_deletions, deletions)
            
            # Early exit if we found a solution with 0 deletions
            if min_deletions == 0:
                return 0
        
        # Special case: check if we can keep all characters with frequency 1
        # and have exactly k distinct characters
        if k <= len(freqs):
            # Take the top k frequencies and make them 1
            deletions = sum(freqs[:k]) - k + sum(freqs[k:])
            min_deletions = min(min_deletions, deletions)
        
        return min_deletions