import numpy as np
import matplotlib.pyplot as plt

# -----------------------------
# Transformation Functions
# -----------------------------

def translate(point, tx, ty):
    T = np.array([[1, 0, tx],
                  [0, 1, ty],
                  [0, 0, 1]])
    return T @ point


def rotate(point, angle_deg):
    theta = np.radians(angle_deg)
    R = np.array([[np.cos(theta), -np.sin(theta), 0],
                  [np.sin(theta),  np.cos(theta), 0],
                  [0,              0,             1]])
    return R @ point


def scale(point, sx, sy):
    S = np.array([[sx, 0,  0],
                  [0,  sy, 0],
                  [0,  0,  1]])
    return S @ point


# -----------------------------
# Visualization Function
# -----------------------------

def plot_points(original, transformed, title):
    plt.figure()
    plt.axhline(0)
    plt.axvline(0)

    # Original point
    plt.scatter(original[0], original[1], label='Original', marker='o')
    plt.text(original[0], original[1], '  Original')

    # Transformed point
    plt.scatter(transformed[0], transformed[1], label='Transformed', marker='x')
    plt.text(transformed[0], transformed[1], '  Transformed')

    plt.legend()
    plt.title(title)
    plt.grid()
    plt.axis('equal')
    plt.show()


# -----------------------------
# Explanation Function
# -----------------------------

def explain(original, transformed, action):
    ox, oy = original[0], original[1]
    tx, ty = transformed[0], transformed[1]
    dx, dy = tx - ox, ty - oy

    print("\n--- Result Explanation ---")

    if action == "translation":
        print(f"The point moved from ({ox:.2f}, {oy:.2f}) to ({tx:.2f}, {ty:.2f}) by shifting {dx:.2f} units in x and {dy:.2f} units in y.")
        print("This means the shape slides without changing its orientation or size.")

    elif action == "rotation":
        print(f"The point rotated from ({ox:.2f}, {oy:.2f}) to ({tx:.2f}, {ty:.2f}) around the origin.")
        print("The distance from origin remains same, only the direction changes.")

    elif action == "scaling":
        print(f"The point changed from ({ox:.2f}, {oy:.2f}) to ({tx:.2f}, {ty:.2f}) by scaling factors.")
        print("This increases or decreases the size relative to the origin.")

    elif action == "combined":
        print(f"The point moved from ({ox:.2f}, {oy:.2f}) to ({tx:.2f}, {ty:.2f}) after rotation and translation.")
        print("This combines rotation (direction change) and translation (position shift).")


# -----------------------------
# User Input Section
# -----------------------------

if __name__ == "__main__":
    print("--- Coordinate Transformation Visualization ---")

    # Input point
    x = float(input("Enter x coordinate: "))
    y = float(input("Enter y coordinate: "))
    point = np.array([x, y, 1])

    print("\nChoose Transformation:")
    print("1. Translation")
    print("2. Rotation")
    print("3. Scaling")
    print("4. Combined (Rotation + Translation)")

    choice = int(input("Enter choice (1-4): "))

    if choice == 1:
        tx = float(input("Enter translation in x (tx): "))
        ty = float(input("Enter translation in y (ty): "))
        result = translate(point, tx, ty)
        plot_points(point, result, "Translation")
        explain(point, result, "translation")

    elif choice == 2:
        angle = float(input("Enter rotation angle (degrees): "))
        result = rotate(point, angle)
        plot_points(point, result, f"Rotation ({angle} deg)")
        explain(point, result, "rotation")

    elif choice == 3:
        sx = float(input("Enter scaling factor in x (sx): "))
        sy = float(input("Enter scaling factor in y (sy): "))
        result = scale(point, sx, sy)
        plot_points(point, result, "Scaling")
        explain(point, result, "scaling")

    elif choice == 4:
        angle = float(input("Enter rotation angle (degrees): "))
        tx = float(input("Enter translation in x (tx): "))
        ty = float(input("Enter translation in y (ty): "))
        temp = rotate(point, angle)
        result = translate(temp, tx, ty)
        plot_points(point, result, "Combined Transformation")
        explain(point, result, "combined")

    else:
        print("Invalid choice!")
