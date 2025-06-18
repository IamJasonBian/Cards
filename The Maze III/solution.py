from typing import List, Tuple
import heapq

class Solution:
    def findShortestWay(self, maze: List[List[int]], ball: List[int], hole: List[int]) -> str:
        """
        Find the shortest way for the ball to drop into the hole by moving the ball up, down, left or right.
        The ball keeps rolling until it hits a wall or the edge of the maze.
        
        Args:
        maze: 2D grid where 0 represents empty space and 1 represents walls
        ball: Starting position [row, col] of the ball
        hole: Destination position [row, col] of the hole
        
        Returns:
        str: The shortest path as directions ('u', 'd', 'l', 'r') or "impossible" if no path exists
        """
        if not maze or not maze[0]:
            return "impossible"
            
        rows, cols = len(maze), len(maze[0])
        hole_pos = (hole[0], hole[1])
        
        # Priority queue: (distance, path, x, y)
        heap = [(0, "", ball[0], ball[1])]
        # Visited dictionary: (x, y) -> (distance, path)
        visited = {}
        
        # Directions and their corresponding movement and character
        directions = [
            (1, 0, 'd'),  # down
            (0, -1, 'l'), # left
            (0, 1, 'r'),  # right
            (-1, 0, 'u')  # up
        ]
        
        while heap:
            dist, path, x, y = heapq.heappop(heap)
            
            # If we've reached the hole, return the path
            if (x, y) == hole_pos:
                return path
                
            # If we've already visited this position with a shorter or equal distance
            if (x, y) in visited:
                current_dist, current_path = visited[(x, y)]
                if current_dist < dist or (current_dist == dist and current_path <= path):
                    continue
                    
            # Mark as visited
            visited[(x, y)] = (dist, path)
            
            # Try all four directions
            for dx, dy, direction in directions:
                new_x, new_y = x, y
                steps = 0
                
                # Roll the ball until it hits a wall or the hole
                while 0 <= new_x + dx < rows and 0 <= new_y + dy < cols and maze[new_x + dx][new_y + dy] == 0:
                    new_x += dx
                    new_y += dy
                    steps += 1
                    # Check if we've reached the hole
                    if (new_x, new_y) == hole_pos:
                        break
                
                # If the ball didn't move, skip
                if (new_x, new_y) == (x, y):
                    continue
                    
                # Add to heap if not visited or found a better path
                new_dist = dist + steps
                new_path = path + direction
                
                if (new_x, new_y) not in visited or new_dist < visited[(new_x, new_y)][0] or \
                   (new_dist == visited[(new_x, new_y)][0] and new_path < visited[(new_x, new_y)][1]):
                    heapq.heappush(heap, (new_dist, new_path, new_x, new_y))
        
        return "impossible"

def test():
    sol = Solution()
    
    # Test case 1
    maze1 = [
        [0, 0, 0, 0, 0],
        [1, 1, 0, 0, 1],
        [0, 0, 0, 0, 0],
        [0, 1, 0, 0, 1],
        [0, 1, 0, 0, 0]
    ]
    ball1 = [4, 3]
    hole1 = [0, 1]
    print(sol.findShortestWay(maze1, ball1, hole1))  # Expected: "lul"
    
    # Test case 2
    maze2 = [
        [0, 0, 0, 0, 0],
        [1, 1, 0, 0, 1],
        [0, 0, 0, 0, 0],
        [0, 1, 0, 0, 1],
        [0, 1, 0, 0, 0]
    ]
    ball2 = [4, 3]
    hole2 = [3, 0]
    print(sol.findShortestWay(maze2, ball2, hole2))  # Expected: "impossible"
    
    # Test case 3: Simple case
    maze3 = [
        [0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0]
    ]
    ball3 = [0, 0]
    hole3 = [4, 4]
    print(sol.findShortestWay(maze3, ball3, hole3))  # Expected: "rdrd" or "drdr"

if __name__ == "__main__":
    test()
