#!/usr/bin/env python3
"""
LeetCode Problem Runner
=======================
Low-Level Design (LLD) for app-based local execution of LeetCode solutions.

Architecture
------------
  key_problems.json  ->  Runner  ->  SolutionLoader  ->  TestExecutor  ->  Reporter
                                       |
                               leetcode/<folder>/solution.py

The Runner reads key_problems.json, dynamically loads each Python solution,
runs it against the defined test cases, and prints a pass/fail report.

Usage
-----
    python3 runner.py                          # run all key problems
    python3 runner.py --problem two-sum        # run one problem by slug
    python3 runner.py --list                   # list all key problems
    python3 runner.py --problem two-sum --verbose  # verbose output

Exit code
---------
    0  -- all tests passed
    1  -- one or more tests failed (or problem not found)
"""

import argparse
import importlib.util
import json
import os
import sys
from collections import deque
from typing import Any, List, Optional

# ---------------------------------------------------------------------------
# Paths
# ---------------------------------------------------------------------------
REPO_DIR = os.path.dirname(os.path.abspath(__file__))
KEY_PROBLEMS_FILE = os.path.join(REPO_DIR, "key_problems.json")


# ---------------------------------------------------------------------------
# SolutionLoader
# ---------------------------------------------------------------------------

# Common symbols injected into the solution's exec namespace so that type
# hints and standard helpers used in LeetCode solutions resolve correctly.
_EXEC_GLOBALS: dict = {
    "__builtins__": __builtins__,
    "List": List,
    "Optional": Optional,
    "Any": Any,
    "deque": deque,
}


def load_solution_class(solutions_dir: str, folder: str):
    """
    Load the Solution class from <solutions_dir>/<folder>/solution.py using
    importlib for proper module isolation.

    Common LeetCode type hints (List, Optional, deque ...) are injected into
    the module's namespace before execution so that solutions that rely on
    them without explicit imports still work.
    """
    solution_path = os.path.join(solutions_dir, folder, "solution.py")
    if not os.path.exists(solution_path):
        raise FileNotFoundError(f"Solution file not found: {solution_path}")

    spec = importlib.util.spec_from_file_location("solution", solution_path)
    module = importlib.util.module_from_spec(spec)

    # Inject helpers that LeetCode solutions assume are in scope.
    for name, value in _EXEC_GLOBALS.items():
        if name != "__builtins__":
            setattr(module, name, value)

    spec.loader.exec_module(module)

    if not hasattr(module, "Solution"):
        raise AttributeError(f"No 'Solution' class found in {solution_path}")

    return module.Solution


# ---------------------------------------------------------------------------
# TestExecutor
# ---------------------------------------------------------------------------

def _results_equal(actual: Any, expected: Any, unordered: bool) -> bool:
    """
    Compare actual vs expected results.

    When unordered=True the comparison is order-insensitive for flat lists
    (used for problems like Two Sum where index order may vary).
    """
    if unordered and isinstance(actual, list) and isinstance(expected, list):
        return sorted(actual) == sorted(expected)
    return actual == expected


def run_test_cases(problem: dict, solutions_dir: str, verbose: bool = False) -> tuple[int, int]:
    """
    Execute all test cases for a single problem.

    Returns (passed, total).
    """
    slug = problem["slug"]
    folder = problem["folder"]
    method_name = problem["method"]
    unordered = problem.get("unordered_result", False)
    test_cases = problem.get("test_cases", [])

    try:
        SolutionClass = load_solution_class(solutions_dir, folder)
    except (FileNotFoundError, AttributeError, SyntaxError) as exc:
        print(f"  x Could not load solution: {exc}")
        return 0, len(test_cases)

    passed = 0
    for i, tc in enumerate(test_cases):
        args = tc["args"]
        expected = tc["expected"]
        try:
            solution = SolutionClass()
            method = getattr(solution, method_name)
            actual = method(*args)
        except Exception as exc:
            print(f"  x Test {i + 1}: EXCEPTION -- {exc}")
            if verbose:
                import traceback
                traceback.print_exc()
            continue

        ok = _results_equal(actual, expected, unordered)
        if ok:
            passed += 1
            if verbose:
                print(f"  v Test {i + 1}: {args} -> {actual}")
        else:
            print(f"  x Test {i + 1}: {args} -> got {actual!r}, expected {expected!r}")

    return passed, len(test_cases)


# ---------------------------------------------------------------------------
# Reporter
# ---------------------------------------------------------------------------

def run_problem(problem: dict, solutions_dir: str, verbose: bool = False) -> bool:
    """Run a single problem and print results. Returns True if all tests pass."""
    slug = problem["slug"]
    title = problem["title"]
    difficulty = problem["difficulty"]

    diff_badge = {"Easy": "[Easy]", "Medium": "[Medium]", "Hard": "[Hard]"}.get(difficulty, "[?]")
    print(f"\n{diff_badge} {title} ({slug})")

    passed, total = run_test_cases(problem, solutions_dir, verbose=verbose)
    if total == 0:
        print("  ! No test cases defined.")
        return True

    status = "PASS" if passed == total else f"FAIL ({passed}/{total})"
    print(f"  {status}")
    return passed == total


def list_problems(problems: list[dict]) -> None:
    """Print the list of key problems."""
    print(f"\n{'#':<4} {'Difficulty':<10} {'Slug':<45} Title")
    print("-" * 80)
    for i, p in enumerate(problems, 1):
        print(f"{i:<4} {p['difficulty']:<10} {p['slug']:<45} {p['title']}")


# ---------------------------------------------------------------------------
# CLI
# ---------------------------------------------------------------------------

def main() -> int:
    parser = argparse.ArgumentParser(
        description="Run LeetCode solutions locally against built-in test cases.",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog=__doc__,
    )
    parser.add_argument("--problem", "-p", metavar="SLUG",
                        help="Run a specific problem by its slug (e.g. two-sum)")
    parser.add_argument("--list", "-l", action="store_true",
                        help="List all key problems and exit")
    parser.add_argument("--verbose", "-v", action="store_true",
                        help="Print each test case input/output")
    args = parser.parse_args()

    if not os.path.exists(KEY_PROBLEMS_FILE):
        print(f"Error: {KEY_PROBLEMS_FILE} not found.", file=sys.stderr)
        return 1

    with open(KEY_PROBLEMS_FILE) as f:
        config = json.load(f)

    problems: list[dict] = config.get("key_problems", [])
    solutions_dir = os.path.join(REPO_DIR, config.get("solutions_dir", "leetcode"))

    if args.list:
        list_problems(problems)
        return 0

    if args.problem:
        matches = [p for p in problems if p["slug"] == args.problem]
        if not matches:
            print(f"Problem '{args.problem}' not found in key_problems.json.", file=sys.stderr)
            print("Run with --list to see available problems.", file=sys.stderr)
            return 1
        problems = matches

    print(f"Running {len(problems)} key problem(s)...")
    all_passed = True
    for problem in problems:
        ok = run_problem(problem, solutions_dir, verbose=args.verbose)
        if not ok:
            all_passed = False

    print()
    if all_passed:
        print("All key problems passed.")
    else:
        print("Some problems failed.")
    return 0 if all_passed else 1


if __name__ == "__main__":
    sys.exit(main())
