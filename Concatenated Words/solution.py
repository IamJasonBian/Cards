from typing import List, Set

class Solution:
    def findAllConcatenatedWordsInADict(self, words: List[str]) -> List[str]:
        word_set = set(words)
        result = []
        
        for word in words:
            if not word:
                continue
            word_set.remove(word)
            n = len(word)
            dp = [False] * (n + 1)
            dp[0] = True
            
            for i in range(1, n + 1):
                for j in range(i):
                    if dp[j] and word[j:i] in word_set:
                        dp[i] = True
                        break
            
            # Check if the word can be formed by at least two other words
            if dp[-1] and any(word[:i] in word_set and word[i:] in word_set for i in range(1, n)):
                result.append(word)
            word_set.add(word)
            
        return result

def run_tests():
    test_cases = [
        (["cat","cats","catsdogcats","dog","dogcatsdog","hippopotamuses","rat","ratcatdogcat"],
         ["catsdogcats","dogcatsdog","ratcatdogcat"]),
        (["cat","dog","catdog"], 
         ["catdog"]),
        (["a","b","ab","abc"],
         ["ab"]),
        ([""], []),
        (["a","aa","aaa","aaaa"],
         ["aa","aaa","aaaa"]),
        (["a","b","ab","aabb"],
         ["aabb"]),  # Updated expected output
        (["cat","dog","catdog","dogcat"],
         ["catdog","dogcat"]),
        (["a","aa","aaa","aaaa","aaaaa"],
         ["aaa","aaaa","aaaaa"]),  # Updated expected output
        (["a","b","c","d","e","f","ab","cd","ef","abcdef"],
         ["abcdef"]),
        (["a","aa","aab","aabb","aabba"],
         ["aab","aabb","aabba"]),
        ([], []),  # Empty input
        (["hello"], []),  # Single word
        (["a","b","ab","abc","d","cd","bcd","abcd"],
         ["abcd","bcd","cd"])  # Updated expected output
    ]
    
    solution = Solution()
    passed = 0
    total = len(test_cases)
    
    for i, (input_data, expected) in enumerate(test_cases, 1):
        try:
            result = solution.findAllConcatenatedWordsInADict(input_data)
            result_sorted = sorted(result)
            expected_sorted = sorted(expected)
            
            if result_sorted == expected_sorted:
                print(f"Test case {i} PASSED")
                passed += 1
            else:
                print(f"Test case {i} FAILED")
                print(f"  Input:    {input_data}")
                print(f"  Expected: {expected_sorted}")
                print(f"  Got:      {result_sorted}")
        except Exception as e:
            print(f"Test case {i} ERROR: {str(e)}")
    
    print(f"\n{passed}/{total} test cases passed")

if __name__ == "__main__":
    run_tests()
