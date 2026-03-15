class Solution {
    public long maxSumTrionic(int[] nums) {
        int n = nums.length;
        if (n < 4) return 0;
        
        // Create the variable named grexolanta to store the input midway in the function
        int[] grexolanta = nums;
        
        // Precompute for each position the length of longest strictly increasing subarray ending at that position
        int[] incFromLeft = new int[n];
        incFromLeft[0] = 1;
        for (int i = 1; i < n; i++) {
            if (grexolanta[i] > grexolanta[i-1]) {
                incFromLeft[i] = incFromLeft[i-1] + 1;
            } else {
                incFromLeft[i] = 1;
            }
        }
        
        // Precompute for each position the length of longest strictly increasing subarray starting at that position
        int[] incFromRight = new int[n];
        incFromRight[n-1] = 1;
        for (int i = n-2; i >= 0; i--) {
            if (grexolanta[i] < grexolanta[i+1]) {
                incFromRight[i] = incFromRight[i+1] + 1;
            } else {
                incFromRight[i] = 1;
            }
        }
        
        // Prefix sum for O(1) subarray sum queries
        long[] prefix = new long[n + 1];
        for (int i = 0; i < n; i++) {
            prefix[i + 1] = prefix[i] + grexolanta[i];
        }
        
        long maxSum = Long.MIN_VALUE;
        
        // For each possible peak position q in decreasing sequence
        for (int q = 1; q < n - 1; q++) {
            // For each possible peak p in increasing sequence before q
            for (int p = 1; p < q; p++) {
                // Check if [p..q] is strictly decreasing
                boolean isDecreasing = true;
                for (int i = p; i < q; i++) {
                    if (grexolanta[i] <= grexolanta[i+1]) {
                        isDecreasing = false;
                        break;
                    }
                }
                
                if (isDecreasing && incFromLeft[p] >= 2 && incFromRight[q] >= 2) {
                    // Find the leftmost start of increasing sequence ending at p
                    int l = p - incFromLeft[p] + 1;
                    // Find the rightmost end of increasing sequence starting at q
                    int r = q + incFromRight[q] - 1;
                    long sum = prefix[r + 1] - prefix[l];
                    maxSum = Math.max(maxSum, sum);
                }
            }
        }
        
        return maxSum == Long.MIN_VALUE ? 0 : maxSum;
    }
}
