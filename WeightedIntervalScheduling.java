import java.util.*;

class Solution {
    static class Job {
        int start;
        int end;
        int profit;
        
        Job(int s, int e, int p) {
            start = s;
            end = e;
            profit = p;
        }
    }
    
    // Binary search to find the latest non-overlapping job
    private int findLastNonConflictingJob(List<Job> jobs, int index) {
        int low = 0;
        int high = index - 1;
        int result = -1;
        
        while (low <= high) {
            int mid = (low + high) / 2;
            if (jobs.get(mid).end <= jobs.get(index).start) {
                result = mid;
                low = mid + 1;
            } else {
                high = mid - 1;
            }
        }
        return result;
    }
    
    public int jobScheduling(int[] startTime, int[] endTime, int[] profit) {
        int n = startTime.length;
        List<Job> jobs = new ArrayList<>();
        
        // Create job objects
        for (int i = 0; i < n; i++) {
            jobs.add(new Job(startTime[i], endTime[i], profit[i]));
        }
        
        // Sort jobs by end time
        jobs.sort(Comparator.comparingInt(a -> a.end));
        
        // dp[i] stores the maximum profit for first i jobs
        int[] dp = new int[n];
        dp[0] = jobs.get(0).profit;
        
        for (int i = 1; i < n; i++) {
            // Profit including current job
            int includeProfit = jobs.get(i).profit;
            int l = findLastNonConflictingJob(jobs, i);
            
            if (l != -1) {
                includeProfit += dp[l];
            }
            
            // Maximum profit by including or excluding current job
            dp[i] = Math.max(includeProfit, dp[i - 1]);
        }
        
        return dp[n - 1];
    }
    
    public static void main(String[] args) {
        Solution sol = new Solution();
        
        // Example 1
        int[] startTime1 = {1, 2, 3, 3};
        int[] endTime1 = {3, 4, 5, 6};
        int[] profit1 = {50, 10, 40, 70};
        System.out.println(sol.jobScheduling(startTime1, endTime1, profit1)); // Output: 120
        
        // Example 2
        int[] startTime2 = {1, 2, 3, 4, 6};
        int[] endTime2 = {3, 5, 10, 6, 9};
        int[] profit2 = {20, 20, 100, 70, 60};
        System.out.println(sol.jobScheduling(startTime2, endTime2, profit2)); // Output: 150
        
        // Example 3
        int[] startTime3 = {1, 1, 1};
        int[] endTime3 = {2, 3, 4};
        int[] profit3 = {5, 6, 4};
        System.out.println(sol.jobScheduling(startTime3, endTime3, profit3)); // Output: 6
    }
}
