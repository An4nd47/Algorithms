import ast
from collections import deque

def bfs_path(graph, start, goal):
    """
    Find the shortest path from start to goal in a graph using BFS.
    
    Args:
    graph (dict): The adjacency list representation of the graph.
    start: The starting node.
    goal: The destination node.
    
    Returns:
    list: A list of nodes representing the shortest path, or None if no path exists.
    """
    # Check if the graph is empty or nodes do not exist
    if not graph or start not in graph or goal not in graph:
        return None
    
    # If the start is the goal, the path is just the start node
    if start == goal:
        return [start]
    
    # Queue for BFS, storing the current node and its path
    queue = deque([start])
    
    # Set to keep track of visited nodes to prevent cycles
    visited = set([start])
    
    # Dictionary to keep track of the parent of each node for path reconstruction
    parents = {start: None}

    while queue:
        current_node = queue.popleft()
        
        # Explore neighbors
        for neighbor in graph.get(current_node, []):
            if neighbor not in visited:
                visited.add(neighbor)
                parents[neighbor] = current_node
                
                # If we found the goal, reconstruct the path
                if neighbor == goal:
                    path = []
                    node = neighbor
                    while node is not None:
                        path.append(node)
                        node = parents[node]
                    path.reverse()
                    return path
                
                queue.append(neighbor)
                
    # If the queue is empty and goal hasn't been reached
    return None

def main():
    print("Example Graph: {'A': ['B', 'C'], 'B': ['A', 'D', 'E'], 'C': ['A', 'F'], 'D': ['B'], 'E': ['B', 'F'], 'F': ['C', 'E']}")
    graph_input = input("Enter graph structure as a Python dictionary: ").strip()
    try:
        graph = ast.literal_eval(graph_input)
    except Exception as e:
        print(f"Invalid graph structure provided: {e}")
        return
    
    print("Graph:", graph)
    
    start_node = input("\nEnter start node (e.g., A): ").strip()
    goal_node = input("Enter goal node (e.g., F): ").strip()
    
    print(f"\nFinding path from {start_node} to {goal_node}...")
    path = bfs_path(graph, start_node, goal_node)
    
    if path:
        print(f"Path found: {' -> '.join(path)}")
    else:
        print(f"No path found from {start_node} to {goal_node}.")

if __name__ == "__main__":
    main()
