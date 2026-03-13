import ast

code = "print('Hello')"
tree = ast.parse(code)
print(tree)
# Convert back to code
new_code = ast.unparse(tree)
print(new_code)