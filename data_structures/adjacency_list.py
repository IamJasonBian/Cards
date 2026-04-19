"""
Adjacency List Graph Implementation

Supports both directed and undirected graphs.
Vertices can be any hashable value (int, str, etc.).
"""

from collections import deque


class Graph:
    def __init__(self, directed=False):
        self.directed = directed
        self.adj = {}  # vertex -> list of neighbors

    # ------------------------------------------------------------------ #
    # Vertex / Edge operations                                             #
    # ------------------------------------------------------------------ #

    def add_vertex(self, vertex):
        if vertex not in self.adj:
            self.adj[vertex] = []

    def remove_vertex(self, vertex):
        if vertex not in self.adj:
            return
        del self.adj[vertex]
        for neighbors in self.adj.values():
            if vertex in neighbors:
                neighbors.remove(vertex)

    def add_edge(self, u, v):
        self.add_vertex(u)
        self.add_vertex(v)
        self.adj[u].append(v)
        if not self.directed:
            self.adj[v].append(u)

    def remove_edge(self, u, v):
        if u in self.adj and v in self.adj[u]:
            self.adj[u].remove(v)
        if not self.directed and v in self.adj and u in self.adj[v]:
            self.adj[v].remove(u)

    def has_edge(self, u, v):
        return u in self.adj and v in self.adj[u]

    def neighbors(self, vertex):
        return list(self.adj.get(vertex, []))

    def vertices(self):
        return list(self.adj.keys())

    def edges(self):
        result = []
        seen = set()
        for u, neighbors in self.adj.items():
            for v in neighbors:
                if self.directed:
                    result.append((u, v))
                else:
                    key = frozenset((id(u), id(v))) if u == v else frozenset({u, v})
                    if key not in seen:
                        seen.add(key)
                        result.append((u, v))
        return result

    # ------------------------------------------------------------------ #
    # Traversals                                                           #
    # ------------------------------------------------------------------ #

    def bfs(self, start):
        if start not in self.adj:
            return []
        visited, order = {start}, []
        queue = deque([start])
        while queue:
            node = queue.popleft()
            order.append(node)
            for neighbor in self.adj[node]:
                if neighbor not in visited:
                    visited.add(neighbor)
                    queue.append(neighbor)
        return order

    def dfs(self, start):
        if start not in self.adj:
            return []
        visited, order = set(), []
        self._dfs(start, visited, order)
        return order

    def _dfs(self, node, visited, order):
        visited.add(node)
        order.append(node)
        for neighbor in self.adj[node]:
            if neighbor not in visited:
                self._dfs(neighbor, visited, order)

    def has_path(self, src, dst):
        if src not in self.adj:
            return False
        visited = {src}
        queue = deque([src])
        while queue:
            node = queue.popleft()
            if node == dst:
                return True
            for neighbor in self.adj[node]:
                if neighbor not in visited:
                    visited.add(neighbor)
                    queue.append(neighbor)
        return False

    def __repr__(self):
        lines = [f"Graph(directed={self.directed})"]
        for vertex, neighbors in self.adj.items():
            lines.append(f"  {vertex}: {neighbors}")
        return "\n".join(lines)
