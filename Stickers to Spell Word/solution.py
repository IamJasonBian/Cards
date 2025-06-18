from collections import deque, defaultdict
from typing import List

class Solution:
    def minStickers(self, stickers: List[str], target: str) -> int:
        """
        Find the minimum number of stickers needed to spell out the target.
        
        Args:
        stickers: List of available stickers (with lowercase English letters)
        target: Target word to spell (with lowercase English letters)
        
        Returns:
        int: Minimum number of stickers needed, or -1 if it's not possible
        """
        # Convert each sticker to a character count dictionary
        sticker_counts = []
        for sticker in stickers:
            count = defaultdict(int)
            for c in sticker:
                count[c] += 1
            sticker_counts.append(count)
        
        # Convert target to a character count dictionary
        target_count = defaultdict(int)
        for c in target:
            target_count[c] += 1
        
        # Check if all characters in target are covered by stickers
        target_chars = set(target)
        sticker_chars = set()
        for sticker in stickers:
            sticker_chars.update(sticker)
        if not target_chars.issubset(sticker_chars):
            return -1
        
        # BFS queue: (remaining_chars, steps)
        # We'll use a frozenset of (char, count) tuples to represent remaining chars
        initial_remaining = frozenset(target_count.items())
        queue = deque([(initial_remaining, 0)])
        visited = {initial_remaining}
        
        while queue:
            remaining, steps = queue.popleft()
            
            # If no characters remaining, we're done
            if not remaining:
                return steps
            
            # Try each sticker
            for sticker in sticker_counts:
                # Skip stickers that don't have any characters we need
                if not any(ch in dict(remaining) for ch in sticker):
                    continue
                
                # Create new remaining after using this sticker
                new_remaining = dict(remaining)
                for ch, cnt in sticker.items():
                    if ch in new_remaining:
                        if new_remaining[ch] <= cnt:
                            del new_remaining[ch]
                        else:
                            new_remaining[ch] -= cnt
                
                # Convert to frozenset for hashing
                new_remaining_fs = frozenset(new_remaining.items())
                
                # If we haven't seen this state before, add to queue
                if new_remaining_fs not in visited:
                    visited.add(new_remaining_fs)
                    queue.append((new_remaining_fs, steps + 1))
        
        return -1

def test():
    sol = Solution()
    
    # Test case 1
    stickers = ["with", "example", "science"]
    target = "thehat"
    expected = 3
    result = sol.minStickers(stickers, target)
    assert result == expected, f"Test case 1 failed: expected {expected}, got {result}"
    
    # Test case 2
    stickers = ["notice", "possible"]
    target = "basicbasic"
    expected = -1  # Can't form 'a' and 'i' is missing
    result = sol.minStickers(stickers, target)
    assert result == expected, f"Test case 2 failed: expected {expected}, got {result}"
    
    # Test case 3: Single character target
    stickers = ["a", "b", "c"]
    target = "a"
    expected = 1
    result = sol.minStickers(stickers, target)
    assert result == expected, f"Test case 3 failed: expected {expected}, got {result}"
    
    # Test case 4: All stickers same as target
    stickers = ["abc", "def"]
    target = "abc"
    expected = 1
    result = sol.minStickers(stickers, target)
    assert result == expected, f"Test case 4 failed: expected {expected}, got {result}"
    
    print("All test cases passed!")

if __name__ == "__main__":
    test()
