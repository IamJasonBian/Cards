public class TestTrionicSubarrayHighlyOptimized {
    public static void main(String[] args) {
        TrionicSubarrayHighlyOptimized solution = new TrionicSubarrayHighlyOptimized();
        
        // Test case 1
        int[] nums1 = {0, -2, -1, -3, 0, 2, -1};
        long result1 = solution.maxTrionicSum(nums1);
        System.out.println("Test case 1: " + result1); // Expected: -4
        
        // Test case 2
        int[] nums2 = {1, 4, 2, 7};
        long result2 = solution.maxTrionicSum(nums2);
        System.out.println("Test case 2: " + result2); // Expected: 14
        
        // Additional test case
        int[] nums3 = {1, 2, 3, 2, 1, 4, 5, 6};
        long result3 = solution.maxTrionicSum(nums3);
        System.out.println("Test case 3: " + result3);
    }
}
