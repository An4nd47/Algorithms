def dfs_path(graph, start, goal):
    """
    Find a path from start to goal in a graph using Depth-First Search (DFS).
    
    Args:
    graph (dict): The adjacency list representation of the graph.
    start: The starting node.
    goal: The destination node.
    
    Returns:
    list: A list of nodes representing the path, or None if no path exists.
    Note: DFS does not guarantee the shortest path, unlike BFS.
    """
    # Check if the graph is empty or nodes do not exist
    if not graph or start not in graph or goal not in graph:
        return None
    
    # If the start is the goal, the path is just the start node
    if start == goal:
        return [start]
    
    # Stack for DFS, storing tuples of (current_node, current_path)
    stack = [(start, [start])]
    
    # Set to keep track of visited nodes to prevent cycles
    visited = set()

    while stack:
        current_node, current_path = stack.pop()
        
        if current_node not in visited:
            visited.add(current_node)
            
            # Explore neighbors. 
            # We iterate in reverse to explore nodes in alphabetical order on the stack
            # assuming the adjacency list is ordered alphabetically.
            neighbors = graph.get(current_node, [])
            for neighbor in reversed(neighbors):
                if neighbor not in visited:
                    if neighbor == goal:
                        return current_path + [neighbor]
                    stack.append((neighbor, current_path + [neighbor]))
                
    # If the stack is empty and goal hasn't been reached
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
    
    print("Graph:", graph)
    
    start_node = 'A'
    goal_node = 'F'
    print(f"\nFinding path from {start_node} to {goal_node} using DFS...")
    path = dfs_path(graph, start_node, goal_node)
    
    if path:
        print(f"Path found: {' -> '.join(path)}")
    else:
        print(f"No path found from {start_node} to {goal_node}.")

    print(f"\nFinding path from D to C...")
    path = dfs_path(graph, 'D', 'C')
    if path:
        print(f"Path found: {' -> '.join(path)}")
    else:
        print(f"No path found.")
        
    print(f"\nFinding path from A to Z (non-existent node)...")
    path = dfs_path(graph, 'A', 'Z')
    if path:
        print(f"Path found: {' -> '.join(path)}")
    else:
        print(f"No path found.")

if __name__ == "__main__":
    main()
