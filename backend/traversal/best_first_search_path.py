import ast
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
    print("Example Graph: {'A': ['B', 'C'], 'B': ['A', 'D', 'E'], 'C': ['A', 'F'], 'D': ['B'], 'E': ['B', 'F'], 'F': ['C', 'E']}")
    graph_input = input("Enter graph structure as a Python dictionary: ").strip()
    try:
        graph = ast.literal_eval(graph_input)
    except Exception as e:
        print(f"Invalid graph structure provided: {e}")
        return
        
    print("\nExample Heuristics: {'A': 5, 'B': 4, 'C': 2, 'D': 6, 'E': 1, 'F': 0}")
    heuristics_input = input("Enter heuristics as a Python dictionary: ").strip()
    try:
        heuristics = ast.literal_eval(heuristics_input)
    except Exception as e:
        print(f"Invalid heuristics structure provided: {e}")
        return
    
    print("Graph:", graph)
    print("Heuristics:", heuristics)
    
    start_node = input("\nEnter start node (e.g., A): ").strip()
    goal_node = input("Enter goal node (e.g., F): ").strip()
    
    print(f"\nFinding path from {start_node} to {goal_node} using Greedy Best-First Search...")
    path = best_first_search_path(graph, heuristics, start_node, goal_node)
    
    if path:
        print(f"Path found: {' -> '.join(path)}")
    else:
        print(f"No path found.")


if __name__ == "__main__":
    main()
