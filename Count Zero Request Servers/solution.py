from typing import List
from collections import defaultdict, deque
import bisect

class Solution:
    def countServers(self, n: int, logs: List[List[int]], x: int, queries: List[int]) -> List[int]:
        # Sort logs by time
        logs.sort(key=lambda log: log[1])
        indexed_queries = sorted([(q, i) for i, q in enumerate(queries)])
        m = len(logs)
        q = len(queries)
        ans = [0] * q
        left = 0
        right = 0
        from collections import defaultdict
        server_count = defaultdict(int)  # server_id -> count in window
        active_servers = set()  # servers with at least one request in window
        
        for query, idx in indexed_queries:
            # Expand right pointer to include logs with time <= query
            while right < m and logs[right][1] <= query:
                server = logs[right][0]
                server_count[server] += 1
                if server_count[server] == 1:
                    active_servers.add(server)
                right += 1
            # Move left pointer to exclude logs with time < query - x
            while left < m and logs[left][1] < query - x:
                server = logs[left][0]
                server_count[server] -= 1
                if server_count[server] == 0:
                    active_servers.discard(server)
                left += 1
            ans[idx] = n - len(active_servers)
        return ans
