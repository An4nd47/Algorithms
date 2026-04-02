import ast
import heapq

def dijkstra_path(graph, start, goal):
    """
    Find the shortest path from start to goal using Dijkstra's Algorithm.
    
    Args:
    graph (dict): Adjacency list representation where values are dictionaries of {neighbor: weight}.
    start: The starting node.
    goal: The destination node.
    
    Returns:
    tuple: (path, total_cost) or (None, float('inf')) if no path exists.
    """
    if not graph or start not in graph or goal not in graph:
        return None, float('inf')

    # Priority queue to store (cost, current_node, path)
    pq = [(0, start, [start])]
    
    # Dictionary to keep track of minimum cost to reach each node
    min_costs = {start: 0}
    
    # Set to keep track of visited nodes
    visited = set()

    while pq:
        cost, current_node, path = heapq.heappop(pq)
        
        # If we reached the goal, we can just return the path and cost
        # Since it's a priority queue, the first time we pop the goal, it's the optimal path
        if current_node == goal:
            return path, cost
            
        if current_node in visited:
            continue
            
        visited.add(current_node)
        
        # Explore neighbors
        for neighbor, weight in graph.get(current_node, {}).items():
            if neighbor in visited:
                continue
                
            new_cost = cost + weight
            
            # If we found a cheaper path to the neighbor or we haven't seen it yet
            if neighbor not in min_costs or new_cost < min_costs[neighbor]:
                min_costs[neighbor] = new_cost
                heapq.heappush(pq, (new_cost, neighbor, path + [neighbor]))
                
    return None, float('inf')

def main():
    print("Example Weighted Graph: {'A': {'B': 1, 'C': 4}, 'B': {'A': 1, 'D': 2, 'E': 5}, 'C': {'A': 4, 'F': 3}, 'D': {'B': 2}, 'E': {'B': 5, 'F': 1}, 'F': {'C': 3, 'E': 1}}")
    graph_input = input("Enter graph structure as a Python dictionary: ").strip()
    try:
        graph = ast.literal_eval(graph_input)
    except Exception as e:
        print(f"Invalid graph structure provided: {e}")
        return
    
    print("Weighted Graph:", graph)
    
    start_node = input("\nEnter start node (e.g., A): ").strip()
    goal_node = input("Enter goal node (e.g., F): ").strip()
    
    print(f"\nFinding shortest path from {start_node} to {goal_node} using Dijkstra's Algorithm...")
    path, cost = dijkstra_path(graph, start_node, goal_node)
    
    if path:
        print(f"Path found: {' -> '.join(path)}\nTotal Cost: {cost}")
    else:
        print(f"No path found.")


if __name__ == "__main__":
    main()
