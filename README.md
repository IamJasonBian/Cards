# Cards

Anki, flashcards and spaced repetition within hosted llm execution environments

---

# Hash Map & Sliding Window Study Guide

This guide covers all three parts of the discussion: the **8 hash map patterns**, the
**sliding window problem list grouped by type**, and the **pseudocode templates** —
plus the O(n) two-pointer insight at the end.

## Part 1 — The 8 Hash Map Patterns

| # | Pattern | Core idea | Representative problems |
|---|---------|-----------|-------------------------|
| 1 | **Frequency counter** | Count occurrences of each element, then reason about the counts | 242 Valid Anagram, 387 First Unique Character, 169 Majority Element |
| 2 | **Complement lookup** | For each element, ask "have I already seen the value that pairs with this one?" | 1 Two Sum, 454 4Sum II |
| 3 | **Grouping by canonical key** | Compute a normalized key (sorted string, count signature) and bucket items under it | 49 Group Anagrams, 249 Group Shifted Strings |
| 4 | **Prefix sum + hash map** | Store running sum → count (or earliest index); a subarray with the target property exists when `prefix[j] - target` was seen before | 560 Subarray Sum Equals K, 525 Contiguous Array, 974 Subarray Sums Divisible by K |
| 5 | **Seen set / membership** | O(1) "have I seen this?" for dedup, cycle detection, and sequence building | 217 Contains Duplicate, 128 Longest Consecutive Sequence, 202 Happy Number |
| 6 | **Index / last-seen map** | Map each value to its most recent index so you can measure gaps or jump the left pointer | 219 Contains Duplicate II, 3 Longest Substring Without Repeating Characters (optimized jump) |
| 7 | **Sliding window state** | The hash map *is* the window's state — counts of chars/elements currently inside the window, updated as the window slides | 76 Minimum Window Substring, 438 Find All Anagrams in a String, 340 Longest Substring with At Most K Distinct Characters |
| 8 | **Hash map + design** | Combine a map with an auxiliary structure for O(1) design operations — the common interview design question where you keep a map of keys and **evict entries** by recency or timestamp | 146 LRU Cache (map + doubly linked list), 380 Insert Delete GetRandom O(1) (map + array), 359 Logger Rate Limiter (key → last timestamp) |

Patterns 4, 6, and 7 are the bridge into sliding window: the map tracks window contents,
and the window's validity is a question about the map.

## Part 2 — Sliding Window Problems, Grouped by Type

### A. Fixed-size window (size k)
- 643 Maximum Average Subarray I
- 1456 Maximum Number of Vowels in a Substring of Given Length
- 567 Permutation in String
- 438 Find All Anagrams in a String
- 2461 Maximum Sum of Distinct Subarrays With Length K

### B. Variable-size — longest valid window
- 3 Longest Substring Without Repeating Characters
- 424 Longest Repeating Character Replacement
- 1004 Max Consecutive Ones III (flip at most k zeros)
- 340 Longest Substring with At Most K Distinct Characters
- 904 Fruit Into Baskets

### C. Variable-size — shortest valid window
- 209 Minimum Size Subarray Sum
- 76 Minimum Window Substring
- 1658 Minimum Operations to Reduce X to Zero (invert it: longest window with sum = total − x)

### D. Counting subarrays
- 713 Subarray Product Less Than K
- 930 Binary Subarrays With Sum ("exactly K" trick)
- 992 Subarrays with K Different Integers ("exactly K" trick)
- 1358 Number of Substrings Containing All Three Characters

### E. Monotonic deque
- 239 Sliding Window Maximum
- 1438 Longest Continuous Subarray With Absolute Diff ≤ Limit (two deques)

## Part 3 — Pseudocode Templates

### Fixed-size window (size k)

```text
init window state (sum / counter) over first k elements
record answer
for right from k to n-1:
    add arr[right] to state
    remove arr[right - k] from state
    update answer
```

### Variable-size — longest valid window

```text
left = 0
for right from 0 to n-1:
    add arr[right] to state
    while state is INVALID:          # e.g. > k distinct, > k zeros flipped
        remove arr[left]; left++
    answer = max(answer, right - left + 1)
```

### Variable-size — shortest valid window

```text
left = 0
for right from 0 to n-1:
    add arr[right] to state
    while state is VALID:            # e.g. sum >= target, all chars covered
        answer = min(answer, right - left + 1)
        remove arr[left]; left++
```

### Counting subarrays — "exactly K" trick

```text
exactly(K) = atMost(K) - atMost(K-1)

atMost(K):
    left = 0, count = 0
    for right in 0..n-1:
        add arr[right]
        while state exceeds K:
            remove arr[left]; left++
        count += right - left + 1    # all windows ending at right
```

### Monotonic deque — window maximum (239)

```text
for right in 0..n-1:
    pop deque back while arr[back] <= arr[right]
    push right
    if deque front out of window (front <= right - k): pop front
    if right >= k-1:
        answer.append(arr[deque front])
```

## Key Insight — why sliding window is O(n), not O(n²)

Every template above has a loop inside a loop, which looks quadratic. It isn't.
The two pointers **only ever move forward**: `right` advances n times total, and
`left` advances at most n times total across the *entire* run — it never resets.
Each element enters the window exactly once and leaves at most once, so the total
work is bounded by ~2n pointer movements. That amortized argument is the whole
reason sliding window beats the brute-force "check every subarray" O(n²) approach.
