import heapq
from collections import defaultdict

class Solution:
    def busiestServers(self, k: int, arrival: list[int], load: list[int]) -> list[int]:
        # Initialize available servers as a min-heap (using server indices)
        available = list(range(k))
        # This is a min-heap that stores (end_time, server_index)
        busy = []
        # Dictionary to count requests handled by each server
        request_count = defaultdict(int)
        
        for i, (start, duration) in enumerate(zip(arrival, load)):
            # Check which servers are now available
            while busy and busy[0][0] <= start:
                _, server = heapq.heappop(busy)
                # Calculate the position where this server should be inserted in available
                # to maintain the round-robin order
                heapq.heappush(available, i + ((server - i) % k + k) % k)
            
            if available:
                # Get the next available server in round-robin order
                # We need to find the first server >= (i % k) that's available
                # Since we stored the servers in a way that maintains the round-robin order,
                # we can just take the smallest server >= (i % k) or the smallest available
                # if none is >= (i % k)
                
                # First, find the first server >= (i % k)
                idx = heapq.heappop(available)
                # Convert back to actual server index
                server = idx % k
                heapq.heappush(busy, (start + duration, server))
                request_count[server] += 1
            # If no server is available, the request is dropped
        
        # Find the maximum number of requests handled by any server
        if not request_count:
            return []
        max_requests = max(request_count.values())
        return [s for s, cnt in request_count.items() if cnt == max_requests]

# Test cases
if __name__ == "__main__":
    sol = Solution()
    
    # Test case 1
    k = 3
    arrival = [1,2,3,4,5]
    load = [5,2,3,3,3]
    print(sol.busiestServers(k, arrival, load))  # Expected: [1]
    
    # Test case 2
    k = 3
    arrival = [1,2,3,4]
    load = [1,2,1,2]
    print(sol.busiestServers(k, arrival, load))  # Expected: [0]
    
    # Test case 3
    k = 3
    arrival = [1,2,3]
    load = [10,12,11]
    print(sol.busiestServers(k, arrival, load))  # Expected: [0,1,2]
