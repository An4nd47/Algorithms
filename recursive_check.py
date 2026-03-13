import ast

class RecursionAnalyzer(ast.NodeVisitor):
    def __init__(self, source_code):
        self.source_code = source_code
        self.functions = {}
        self.current_function = None
        self.current_loop_depth = 0

    def visit_FunctionDef(self, node):
        self.current_function = node.name
        self.functions[node.name] = {
            'is_recursive': False,
            'recursive_calls': [],
            'loop_depth': 0
        }
        self.current_loop_depth = 0
        self.generic_visit(node)
        self.current_function = None

    def visit_For(self, node):
        if self.current_function:
            self.current_loop_depth += 1
            if self.current_loop_depth > self.functions[self.current_function]['loop_depth']:
                self.functions[self.current_function]['loop_depth'] = self.current_loop_depth
            self.generic_visit(node)
            self.current_loop_depth -= 1
        else:
            self.generic_visit(node)

    def visit_While(self, node):
        if self.current_function:
            self.current_loop_depth += 1
            if self.current_loop_depth > self.functions[self.current_function]['loop_depth']:
                self.functions[self.current_function]['loop_depth'] = self.current_loop_depth
            self.generic_visit(node)
            self.current_loop_depth -= 1
        else:
            self.generic_visit(node)

    def visit_Call(self, node):
        if self.current_function and isinstance(node.func, ast.Name):
            if node.func.id == self.current_function:
                self.functions[self.current_function]['is_recursive'] = True
                
                # Try to get the exact source segment of the call
                try:
                    call_source = ast.get_source_segment(self.source_code, node)
                except Exception:
                    call_source = None
                    
                if not call_source:
                    # Fallback if get_source_segment isn't available
                    lines = self.source_code.splitlines()
                    if node.lineno and node.lineno <= len(lines):
                        call_source = lines[node.lineno - 1].strip()
                    else:
                        call_source = "Unknown source"
                    
                call_info = {
                    'line_no': node.lineno,
                    'code': call_source,
                    'args': node.args
                }
                self.functions[self.current_function]['recursive_calls'].append(call_info)
        self.generic_visit(node)

def estimate_complexity(func_info):
    """
    Provides a heuristic guess of the time complexity based on:
    - Number of recursive calls within the function.
    - Argument modifications (division vs subtraction).
    - Maximum loop depth inside the function.
    """
    if not func_info['is_recursive']:
        loop_depth = func_info['loop_depth']
        if loop_depth == 0:
            return "O(1) (Not recursive, no loops)"
        elif loop_depth == 1:
            return "O(N) (Not recursive, 1 loop level)"
        else:
            return f"O(N^{loop_depth}) (Not recursive, nested loops)"
    
    num_calls = len(func_info['recursive_calls'])
    loop_depth = func_info['loop_depth']
    
    reduces_by_division = False
    reduces_by_subtraction = False
    
    # Check what kind of operation is applied to the arguments in the recursive calls
    for call in func_info['recursive_calls']:
        for arg in call['args']:
            if isinstance(arg, ast.BinOp):
                if isinstance(arg.op, (ast.Div, ast.FloorDiv)):
                    reduces_by_division = True
                elif isinstance(arg.op, ast.Sub):
                    reduces_by_subtraction = True
    
    # 1. Simple linear recursion
    if num_calls == 1:
        if reduces_by_division:
            if loop_depth == 0:
                return "O(log N) (like Binary Search)"
            elif loop_depth == 1:
                return "O(N) (1 recursive call halving size, linear work per level)"
            else:
                return f"O(N^{loop_depth})"
        else:
            if loop_depth == 0:
                return "O(N) (like Factorial or simple traversal)"
            elif loop_depth == 1:
                return "O(N^2) (e.g., Insertion Sort recursively)"
            else:
                return f"O(N^{loop_depth+1})"
                
    # 2. Multiple recursive calls
    elif num_calls == 2:
        if reduces_by_division:
            if loop_depth == 0:
                return "O(N) (e.g., Tree Traversal where problem halves)"
            elif loop_depth == 1:
                return "O(N log N) (Master Theorem case 2, e.g., Merge Sort)"
            else:
                return f"O(N^{loop_depth}) (Master Theorem case 1)"
        else:
            if loop_depth == 0:
                return "O(2^N) (e.g., Naive Fibonacci)"
            else:
                return "O(2^N * polynomial) (Exponential with loop overhead)"
                
    elif num_calls > 2:
        if reduces_by_subtraction:
            return f"O({num_calls}^N) (Exponential branches)"
        if reduces_by_division:
            return f"O(N^{max(1, loop_depth)} * log N) or Master Theorem applicable"

    return "Unknown/Complex - requires detailed Master Theorem or substitution method"

def analyze_code(source_code):
    try:
        tree = ast.parse(source_code)
    except Exception as e:
        return {"error": f"Failed to parse source code: {e}"}

    analyzer = RecursionAnalyzer(source_code)
    analyzer.visit(tree)
    
    results = []
    for func_name, info in analyzer.functions.items():
        res = {
            'function': func_name,
            'is_recursive': info['is_recursive'],
        }
        if info['is_recursive']:
            res['recursive_calls'] = [{'line': c['line_no'], 'code': c['code']} for c in info['recursive_calls']]
            res['estimated_complexity'] = estimate_complexity(info)
        results.append(res)
        
    return {"results": results}

if __name__ == "__main__":
    import sys
    print("Enter the Python code to analyze (Press Ctrl+Z then Enter on Windows, or Ctrl+D on Unix to finish):")
    try:
        user_code = sys.stdin.read()
    except KeyboardInterrupt:
        print("\nOperation cancelled.")
        sys.exit(0)
        
    if not user_code.strip():
        print("No code provided. Exiting.")
        sys.exit(0)
        
    print("\n--- Analyzing Input Code ---")
    analysis = analyze_code(user_code)
    
    if "error" in analysis:
        print(analysis["error"])
    else:
        if not analysis["results"]:
            print("No functions found in the provided code.")
        else:
            for func_res in analysis["results"]:
                print(f"Function: {func_res['function']}")
                if func_res['is_recursive']:
                    print(f"  Recursive: Yes")
                    print("  Recursive Calls:")
                    for call in func_res['recursive_calls']:
                        print(f"    - Line {call['line']}: {call['code'].strip()}")
                    print(f"  Time Complexity Guess: {func_res['estimated_complexity']}")
                else:
                    print("  Recursive: No")
