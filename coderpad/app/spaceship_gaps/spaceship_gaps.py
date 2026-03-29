# Palantir Phone Screen (Pre-bank)

# A spaceship is approaching some planets that are arranged in a 1-dimensional line.
# It needs to pass through the line of the planets,
# but can't get too close to any planet, otherwise it would get caught in that
# planet's gravitational field.
# Given a list of planets,
# where each planet is specified by its position along the line and the range of its gravitational field,
# compute the list of gaps from [0, 1000] through which the spaceship can fly.

# [0, 1000]
# [3,2]


# input                output (gaps)           reasoning
# [location, orbit]

# [3,2]                [0,1],[5,1000]          The field covers [1,5].
# [3,2],[5,1]          [0,1],[6,1000]          The fields cover [1,5] and [4,6].
# [2,1],[5,1]          [0,1],[3,4],[6,1000]    The fields cover [1,3] and [4,6].
# [2,2],[7,1],[4,1]    [5,6],[8,1000]          The fields cover [0,4], [6,8], and [3,5].

# Solution
def computeGaps(planets):
    results = []
    boundaries: list[tuple[int, int]] = []
    for loc, orbit in planets:
        boundaries.append((loc - orbit, loc + orbit))
    boundaries.sort()
    cursor = 0
    for start, end in boundaries:
        if cursor < start:
            results.append([cursor, start])
        cursor = max(cursor, end)
    if cursor < 1000:
        results.append([cursor, 1000])
    return results


test_cases = [
    ([[3,2]],               [[0,1],[5,1000]]),
    ([[3,2],[5,1]],         [[0,1],[6,1000]]),
    ([[2,1],[5,1]],         [[0,1],[3,4],[6,1000]]),
    ([[2,2],[7,1],[4,1]],   [[5,6],[8,1000]]),
]

passed = 0
for planets, expected in test_cases:
    result = computeGaps(planets)
    ok = result == expected
    status = "PASS" if ok else "FAIL"
    print(f"[{status}] computeGaps({planets})")
    if not ok:
        print(f"       expected: {expected}")
        print(f"       got:      {result}")
    else:
        passed += 1

print(f"\n{passed}/{len(test_cases)} passed")
