import java.util.*;

public class TrionicSubarray {
    /**
     * Returns the maximum sum of a subarray that can be split into three contiguous segments:
     * strictly increasing, then strictly decreasing, then strictly increasing (tritonic).
     * Each segment must have at least one element, and the total length >= 4.
     */
    public int maxTrionicSum(int[] nums) {
        int n = nums.length;
        if (n < 4) return 0;
        int maxSum = Integer.MIN_VALUE;

        // Prefix sum for O(1) subarray sum queries
        int[] prefix = new int[n + 1];
        for (int i = 0; i < n; i++) prefix[i + 1] = prefix[i] + nums[i];

        // For each possible (l, p, q, r):
        // l < p < q < r, nums[l..p] strictly inc, nums[p..q] strictly dec, nums[q..r] strictly inc
        for (int l = 0; l <= n - 4; l++) {
            // Find all valid p (end of first inc segment)
            for (int p = l + 1; p <= n - 3; p++) {
                boolean inc1 = true;
                for (int i = l + 1; i <= p; i++) {
                    if (nums[i] <= nums[i - 1]) {
                        inc1 = false; break;
                    }
                }
                if (!inc1) break; // further p will not be strictly inc

                // Find all valid q (end of dec segment)
                for (int q = p + 1; q <= n - 2; q++) {
                    boolean dec = true;
                    for (int i = p + 1; i <= q; i++) {
                        if (nums[i] >= nums[i - 1]) {
                            dec = false; break;
                        }
                    }
                    if (!dec) break; // further q will not be strictly dec

                    // Find all valid r (end of second inc segment)
                    for (int r = q + 1; r < n; r++) {
                        boolean inc2 = true;
                        for (int i = q + 1; i <= r; i++) {
                            if (nums[i] <= nums[i - 1]) {
                                inc2 = false; break;
                            }
                        }
                        if (!inc2) break; // further r will not be strictly inc

                        int sum = prefix[r + 1] - prefix[l];
                        maxSum = Math.max(maxSum, sum);
                    }
                }
            }
        }
        return maxSum == Integer.MIN_VALUE ? 0 : maxSum;
    }

    public static void main(String[] args) {
        TrionicSubarray sol = new TrionicSubarray();
        int[] test1 = {0,-2,-1,-3,0,2,-1};
        System.out.println(sol.maxTrionicSum(test1));  // Expected: -4
        int[] test2 = {1,4,2,7};
        System.out.println(sol.maxTrionicSum(test2));  // Expected: 14
        int[] test3 = {2,993,-791,-635,-569};
        System.out.println(sol.maxTrionicSum(test3));  // Expected: -4
    }
}
