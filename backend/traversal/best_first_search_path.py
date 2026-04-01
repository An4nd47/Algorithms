import heapq

def best_first_search_path(graph, heuristics, start, goal):
    """
    Find a path from start to goal using Greedy Best-First Search.
    
    Args:
    graph (dict): Adjacency list representation (weights are ignored in pure greedy BFS).
    heuristics (dict): Estimated cost/distance from each node to the goal.
    start: The starting node.
    goal: The destination node.
    
    Returns:
    list: A list of nodes representing the path, or None if no path exists.
    Note: Greedy Best-First Search does not guarantee the shortest path.
    """
    if not graph or start not in graph or goal not in graph:
        return None

    # Priority queue to store (heuristic_value, current_node, path)
    pq = [(heuristics.get(start, float('inf')), start, [start])]
    
    # Set to keep track of visited nodes
    visited = set()

    while pq:
        h, current_node, path = heapq.heappop(pq)
        
        if current_node == goal:
            return path
            
        if current_node in visited:
            continue
            
        visited.add(current_node)
        
        # Explore neighbors
        for neighbor in graph.get(current_node, []):
            if neighbor not in visited:
                heapq.heappush(pq, (heuristics.get(neighbor, float('inf')), neighbor, path + [neighbor]))
                
    return None

def main():
    # Sample Graph represented as an adjacency list
    graph = {
        'A': ['B', 'C'],
        'B': ['A', 'D', 'E'],
        'C': ['A', 'F'],
        'D': ['B'],
        'E': ['B', 'F'],
        'F': ['C', 'E']
    }
    
    # Heuristics: Estimated straight-line distance to goal 'F'
    heuristics = {
        'A': 5,
        'B': 4,
        'C': 2, # C is closer to F than A and B
        'D': 6,
        'E': 1, # E is right next to F
        'F': 0
    }
    
    print("Graph:", graph)
    print("Heuristics:", heuristics)
    
    start_node = 'A'
    goal_node = 'F'
    print(f"\nFinding path from {start_node} to {goal_node} using Greedy Best-First Search...")
    path = best_first_search_path(graph, heuristics, start_node, goal_node)
    
    if path:
        print(f"Path found: {' -> '.join(path)}")
    else:
        print(f"No path found.")

    print(f"\nFinding path from D to C...")
    # NOTE: Since the heuristic is hardcoded for 'F', running it for goal 'C'
    # with these heuristics won't be optimal, but it will still traverse 
    # based on the priority of nodes closest to F.
    path = best_first_search_path(graph, heuristics, 'D', 'C')
    if path:
        print(f"Path found: {' -> '.join(path)}")
    else:
        print(f"No path found.")


if __name__ == "__main__":
    main()
