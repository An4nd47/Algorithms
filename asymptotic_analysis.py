"""
asymptotic_analysis.py

This tool dynamically analyzes the asymptotic time complexity of a provided Python code snippet.
It measures the number of operations (or execution time) for increasing values of n
and attempts to fit the data to common asymptotic models (O(1), O(log n), O(n), O(n log n), O(n^2), O(2^n)).

DISCLAIMER: This is an empirical "best guess" analyzer based on regression fitting.
"""

import time
import math
import textwrap

def generate_test_data(n):
    """
    Provides standard inputs for common array/number processing algorithms based on size `n`.
    If the function takes an integer, it passes `n`.
    If the function takes a list, it passes a list of size `n`.
    """
    import random
    return {
        'n': n,
        'lst': [random.randint(0, 1000) for _ in range(n)],
        'arr': [random.randint(0, 1000) for _ in range(n)]
    }

def profile_function(code_str, max_n_limit=10000):
    """
    Executes the provided code snippet dynamically, extracts the function,
    and times its execution for increasing values of `n`.
    """
    local_env = {}
    
    # Pre-clean the code to ignore prints and inputs
    clean_lines = []
    for line in code_str.split("\n"):
        indent = len(line) - len(line.lstrip())
        spaces = " " * indent
        if "input(" in line:
            clean_lines.append(f"{spaces}pass # {line.strip()} (Input ignored during testing)")
        elif "print(" in line:
            clean_lines.append(f"{spaces}pass # {line.strip()} (Print ignored during testing)")
        else:
            clean_lines.append(line)
            
    clean_code = "\n".join(clean_lines)

    # First, try to execute the code exactly as written
    exec(clean_code, {}, local_env)
    
    # Check if the user defined any functions in their code
    user_funcs = [v for k, v in local_env.items() if callable(v) and not k.startswith("__")]
    
    if user_funcs:
        # The user provided a 'def', so we use their function Directly
        target_func = user_funcs[0] # Pick the first defined function
        func_name = target_func.__name__
    else:
        # The user just provided raw loops, wrap it in our magic function
        func_name = "raw_script"
        wrapped_code = "def __dynamic_user_func(n, lst, arr):\n"
        for line in clean_lines:
            wrapped_code += f"    {line}\n"
        exec(wrapped_code, {}, local_env)
        target_func = local_env["__dynamic_user_func"]

    # 2. Collect empirical timing data
    sizes = []
    times = []
    
    print(f"\n[1/3] Running empirical analysis on the provided code...")
    n = 10
    
    # We double n each iteration to see how time scales
    while n <= max_n_limit:
        test_data = generate_test_data(n)
        
        # Determine arguments to pass based on function signature
        # Try both approaches for maximum compatibility
        import inspect
        sig = inspect.signature(target_func)
        param_names = list(sig.parameters.keys())
        
        kwargs = {}
        for p in param_names:
            if 'arr' in p.lower() or 'lst' in p.lower() or 'list' in p.lower():
                kwargs[p] = test_data['lst']
            else:
                kwargs[p] = test_data['n']
                
        # To overcome microscopic timer resolutions for extremely fast algorithms like O(log n)
        # We loop the exact same test multiple times and average the outcome.
        iterations = 500
        start_time = time.perf_counter()
        
        try:
            for _ in range(iterations):
                if kwargs:
                    _ = target_func(**kwargs)
                else:
                    # In case it's the raw script which uses n, lst, arr explicitly
                    _ = target_func(n=test_data['n'], lst=test_data['lst'], arr=test_data['arr'])
        except Exception as e:
            print(f"Error during execution at n={n}: {e}")
            return None
            
        end_time = time.perf_counter()
        elapsed = (end_time - start_time) / iterations # Average time per run
        
        sizes.append(n)
        times.append(elapsed)
        
        print(f"  - n = {n:<8} | Time = {elapsed:.8f} sec")
        
        # Prevent runaway executions (stop if it takes more than 0.5s for a single run)
        if elapsed > 0.5:
            print("  - [Execution taking too long, stopping scaling to prevent freezing]")
            break
            
        n *= 2
        
    return sizes, times

def analyze_complexity(sizes, times):
    """
    Fits the (sizes, times) data against typical growth functions to estimate Big-O, Big-Omega, Big-Theta.
    Uses normalized coefficients of variation.
    """
    if not sizes or len(sizes) < 3:
        print("Not enough data to analyze complexity properly.")
        return

    print("\n[2/3] Analyzing growth rate...\n")
    
    models = {
        'O(1)': lambda n: 1,
        'O(log n)': lambda n: math.log(n) if n > 0 else 1,
        'O(n)': lambda n: n,
        'O(n log n)': lambda n: n * math.log(n) if n > 0 else 1,
        'O(n^2)': lambda n: n**2,
        'O(n^3)': lambda n: n**3,
        'O(2^n)': lambda n: 2**n if n < 30 else float('inf') # Prevent overflow in math
    }
    
    best_fit = None
    min_variance = float('inf')
    
    # We look for the model where (Time / Model(n)) is the most constant (lowest variance)
    # i.e., Time ≈ c * Model(n)
    
    results = {}
    
    for name, func in models.items():
        try:
            # Calculate c = time / f(n) for all data points
            ratios = [t / func(n) for n, t in zip(sizes, times)]
            
            mean_ratio = sum(ratios) / len(ratios)
            if mean_ratio == 0:
                continue
                
            # Calculate variance of the ratios
            variance = sum((r - mean_ratio)**2 for r in ratios) / len(ratios)
            
            # Normalize variance relative to the mean to compare different scales
            normalized_variance = variance / (mean_ratio ** 2)
            results[name] = normalized_variance
            
            if normalized_variance < min_variance:
                min_variance = normalized_variance
                best_fit = name
        except OverflowError:
            results[name] = float('inf')
            
    print(f"[3/3] ESTIMATED ASYMPTOTIC NOTATIONS")
    print("=" * 45)
    
    if best_fit:
        print(f"Based on empirical timing, the best fit is:\n")
        print(f" ► Big-Theta (Tight Bound): Θ({best_fit[2:]}") # Strips the "O(" part
        print(f" ► Big-Oh    (Upper Bound): {best_fit}")
        print(f" ► Big-Omega (Lower Bound): Ω({best_fit[2:]}")
        print("\n(Note: Big-Oh and Big-Omega match the Big-Theta best fit empirically unless the function has highly variable best/worst cases).")
    else:
        print("Could not reliably determine the complexity.")


def main():
    print("=====================================================")
    print("      AUTOMATIC ASYMPTOTIC COMPLEXITY ANALYZER       ")
    print("=====================================================\n")
    print("Enter Python code below to analyze its complexity.")
    print("Requirements:")
    print("1. Use the variable 'n', 'lst', or 'arr' in your code.")
    print("   The script will automatically inject size 'n' into them.")
    print("2. You do not need to wrap your code in a def function, just write the loops!")
    print("3. End input by typing 'ANALYZE' on a new line.\n")

    print("Example Valid Input:")
    print("sum = 0")
    print("for i in range(1, n + 1):")
    print("    sum = sum + i\n")
    
    print("--- Paste your code below ---")
    
    lines = []
    while True:
        try:
            line = input()
            # Accept various spellings of Analyze
            if line.strip().upper() in ['ANALYZE', 'ANALYSE']:
                break
            lines.append(line)
        except EOFError:
            break
            
    code = "\n".join(lines)
    
    if not code.strip():
        print("No code provided. Exiting.")
        return

    data = profile_function(code)
    if data:
        sizes, times = data
        analyze_complexity(sizes, times)


if __name__ == "__main__":
    main()
