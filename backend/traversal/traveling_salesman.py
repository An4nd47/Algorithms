# =======================================================
# traversal / traveling_salesman.py
# 
# Traveling Salesman Problem (TSP) Solver
# Supports:
#   - Exact solution via Held-Karp DP (O(n^2 * 2^n))
#   - Heuristic solution via Nearest Neighbor
#   - Graph input via adjacency matrix or edge list
# =======================================================

import itertools
import math
from typing import Dict, List, Tuple, Union, Optional


class TravelingSalesmanSolver:
    """Solves the Traveling Salesman Problem for complete graphs."""

    def __init__(self, num_cities: int, distance_matrix: List[List[float]] = None):
        """
        Initialize TSP solver.

        Args:
            num_cities: Number of cities/nodes.
            distance_matrix: n x n symmetric matrix of distances.
                             If None, must be set later via build_matrix_from_edges.
        """
        self.n = num_cities
        if distance_matrix is not None:
            self.dist = distance_matrix
        else:
            self.dist = [[0.0] * num_cities for _ in range(num_cities)]

    def build_matrix_from_edges(self, edges: List[Tuple[str, str, float]], node_labels: List[str]):
        """
        Build distance matrix from edge list. Assumes undirected graph.
        Missing edges will be filled with large value (MST fallback warning).

        Args:
            edges: List of (u, v, weight) where u, v are node labels.
            node_labels: Ordered list of node labels matching city indices.
        """
        label_to_idx = {label: i for i, label in enumerate(node_labels)}
        INF = 1e9
        for i in range(self.n):
            for j in range(self.n):
                self.dist[i][j] = 0 if i == j else INF

        for u, v, w in edges:
            i, j = label_to_idx[u], label_to_idx[v]
            self.dist[i][j] = w
            self.dist[j][i] = w

        # Warn if graph appears incomplete
        for i in range(self.n):
            for j in range(self.n):
                if i != j and self.dist[i][j] >= INF / 2:
                    print(f"⚠️ Warning: Edge between {node_labels[i]} and {node_labels[j]} missing. Using large distance (1e9).")

    def held_karp(self) -> Tuple[float, List[int]]:
        """
        Exact TSP solution using Held-Karp DP (O(n^2 * 2^n)).
        Returns (min_cost, tour_indices).
        """
        n = self.n
        INF = float('inf')

        # dp[mask][i] = minimum cost to visit all cities in mask, ending at i
        dp = [[INF] * n for _ in range(1 << n)]
        parent = [[-1] * n for _ in range(1 << n)]

        # Base case: start from city 0
        dp[1 << 0][0] = 0

        # Iterate over all subsets of cities
        for mask in range(1 << n):
            for i in range(n):
                if not (mask & (1 << i)):
                    continue
                if dp[mask][i] >= INF:
                    continue
                # Try to extend to an unvisited city j
                for j in range(n):
                    if mask & (1 << j):
                        continue
                    new_mask = mask | (1 << j)
                    new_cost = dp[mask][i] + self.dist[i][j]
                    if new_cost < dp[new_mask][j]:
                        dp[new_mask][j] = new_cost
                        parent[new_mask][j] = i

        # Find minimum cost to return to start
        full_mask = (1 << n) - 1
        min_cost = INF
        last_city = -1
        for i in range(1, n):
            candidate = dp[full_mask][i] + self.dist[i][0]
            if candidate < min_cost:
                min_cost = candidate
                last_city = i

        if min_cost >= INF:
            return -1.0, []  # No valid tour

        # Reconstruct tour
        tour = []
        mask = full_mask
        curr = last_city
        while curr != -1:
            tour.append(curr)
            prev = parent[mask][curr]
            mask ^= (1 << curr)
            curr = prev
        tour.append(0)  # Return to start
        tour.reverse()

        return min_cost, tour

    def nearest_neighbor(self, start: int = 0) -> Tuple[float, List[int]]:
        """
        Heuristic TSP solution using Nearest Neighbor algorithm.
        Returns (cost, tour_indices).
        """
        n = self.n
        visited = [False] * n
        tour = [start]
        visited[start] = True
        total_cost = 0.0

        current = start
        for _ in range(n - 1):
            nearest = -1
            min_dist = float('inf')
            for nxt in range(n):
                if not visited[nxt] and self.dist[current][nxt] < min_dist:
                    min_dist = self.dist[current][nxt]
                    nearest = nxt
            if nearest == -1:
                return float('inf'), []
            total_cost += min_dist
            visited[nearest] = True
            tour.append(nearest)
            current = nearest

        # Return to start
        total_cost += self.dist[current][start]
        tour.append(start)

        return total_cost, tour

    def solve(self, exact: bool = True, start_city: int = 0) -> Dict:
        """
        Main solve method.

        Args:
            exact: If True, uses Held-Karp DP (exact). If False, uses Nearest Neighbor.
            start_city: Starting city index for heuristic (ignored for exact).

        Returns:
            Dictionary with 'cost', 'tour', 'method', 'time_complexity'.
        """
        if exact:
            cost, tour = self.held_karp()
            method = "Held-Karp DP (Exact)"
            complexity = "O(n²·2ⁿ)"
        else:
            cost, tour = self.nearest_neighbor(start_city)
            method = "Nearest Neighbor (Heuristic)"
            complexity = "O(n²)"
        return {
            "cost": cost,
            "tour": tour,
            "method": method,
            "time_complexity": complexity,
        }


def tsp_from_edge_list(
    edges: List[Tuple[str, str, float]],
    node_labels: List[str],
    exact: bool = True,
    start: str = None
) -> Dict:
    """
    Convenience function: solve TSP given edge list and node labels.

    Args:
        edges: List of (u, v, weight).
        node_labels: All city names in order (indices will map automatically).
        exact: Use exact DP solver (default True).
        start: Starting city label for heuristic (ignored if exact).

    Returns:
        Dictionary with 'cost', 'tour_labels', 'tour_indices', 'method', 'time_complexity'.
    """
    n = len(node_labels)
    solver = TravelingSalesmanSolver(n)
    solver.build_matrix_from_edges(edges, node_labels)

    start_idx = 0
    if not exact and start is not None:
        try:
            start_idx = node_labels.index(start)
        except ValueError:
            start_idx = 0

    result = solver.solve(exact=exact, start_city=start_idx)

    # Convert tour indices back to labels
    tour_labels = [node_labels[i] for i in result["tour"]] if result["tour"] else []

    return {
        "cost": result["cost"],
        "tour_indices": result["tour"],
        "tour_labels": tour_labels,
        "method": result["method"],
        "time_complexity": result["time_complexity"],
    }