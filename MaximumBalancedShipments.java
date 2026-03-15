public class MaximumBalancedShipments {
    // You can use this class to test or demonstrate the balanced shipments logic
    public static int maxBalancedShipments(int[] weight) {
        int n = weight.length;
        int count = 0, i = 0;
        while (i < n - 1) {
            int curMax = weight[i];
            boolean found = false;
            for (int j = i + 1; j < n; j++) {
                curMax = Math.max(curMax, weight[j]);
                if (weight[j] < curMax) {
                    count++;
                    i = j + 1;
                    found = true;
                    break;
                }
            }
            if (!found) i++;
        }
        return count;
    }

    public static void main(String[] args) {
        int[] weight1 = {2,5,1,4,3};
        int[] weight2 = {4,4};
        System.out.println(maxBalancedShipments(weight1)); // Output: 2
        System.out.println(maxBalancedShipments(weight2)); // Output: 0
    }
}


