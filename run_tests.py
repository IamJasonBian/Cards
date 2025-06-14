#!/usr/bin/env python3
"""
Simple test runner for LeetCode problems.
Assumes each problem has:
- problem.py or solution.py with a Solution class
- tests.txt with test cases
"""
import os
import sys
import importlib.util
import ast
from typing import List, Tuple, Any, Optional, Union

class TreeNode:
    def __init__(self, val=0, left=None, right=None):
        self.val = val
        self.left = left
        self.right = right

def list_to_binary_tree(lst: List[Optional[int]]) -> Optional[TreeNode]:
    """Convert a list representation of a binary tree to a tree node structure."""
    if not lst:
        return None
    
    root = TreeNode(lst[0])
    queue = [root]
    i = 1
    
    while queue and i < len(lst):
        node = queue.pop(0)
        
        if i < len(lst) and lst[i] is not None:
            node.left = TreeNode(lst[i])
            queue.append(node.left)
        i += 1
        
        if i < len(lst) and lst[i] is not None:
            node.right = TreeNode(lst[i])
            queue.append(node.right)
        i += 1
    
    return root

ROOT = os.path.dirname(os.path.abspath(__file__))

def get_solution_method(Solution):
    """Get the main solution method from the Solution class."""
    for attr in dir(Solution):
        if not attr.startswith('_') and callable(getattr(Solution, attr)):
            return attr
    raise Exception("No public method found in Solution class.")

def parse_test_case(block: str, problem_name: str = '') -> Tuple[tuple, Any]:
    """Parse a test case block into inputs and expected output."""
    lines = [line.strip() for line in block.strip().split('\n') if line.strip()]
    if not lines:
        raise ValueError("Empty test case")
    
    try:
        # Last line is expected output
        expected = ast.literal_eval(lines[-1])
        
        # Special handling for binary tree problems
        if 'Binary Tree' in problem_name:
            if len(lines) != 2:
                raise ValueError("Binary tree test cases must have exactly 2 lines (input and expected output)")
            tree_input = ast.literal_eval(lines[0])
            return (list_to_binary_tree(tree_input),), expected
        
        # For other problems, parse all lines except last as inputs
        inputs = [ast.literal_eval(line) for line in lines[:-1]]
        return tuple(inputs), expected
        
    except Exception as e:
        raise ValueError(f"Error parsing test case: {e}")

def load_test_cases(test_file: str, problem_name: str = '') -> List[Tuple[tuple, Any]]:
    """Load test cases from a file."""
    with open(test_file, 'r') as f:
        content = f.read().strip()
    
    # Split into test cases (separated by blank lines)
    blocks = [block.strip() for block in content.split('\n\n') if block.strip()]
    test_cases = []
    
    for block in blocks:
        try:
            test_cases.append(parse_test_case(block, problem_name))
        except Exception as e:
            print(f"  Warning: Skipping malformed test case: {e}")
    
    return test_cases

def run_tests():
    """Run tests for all problems."""
    # Find all problem directories (those containing tests.txt)
    problem_dirs = [
        d for d in os.listdir(ROOT)
        if (os.path.isdir(os.path.join(ROOT, d)) and
            os.path.exists(os.path.join(ROOT, d, 'tests.txt')) and
            not d.startswith('.'))
    ]
    
    if not problem_dirs:
        print("No problems found with tests.txt")
        return
    
    print(f"Found {len(problem_dirs)} problems with tests\n")
    
    total_passed = 0
    total_tests = 0
    
    for problem_dir in sorted(problem_dirs):
        problem_path = os.path.join(ROOT, problem_dir)
        print(f"\n=== {problem_dir} ===")
        
        # Find solution file (problem.py or solution.py)
        solution_file = None
        for fname in ['problem.py', 'solution.py']:
            if os.path.exists(os.path.join(problem_path, fname)):
                solution_file = os.path.join(problem_path, fname)
                break
        
        if not solution_file:
            print("  ❌ No solution file found (problem.py or solution.py)")
            continue
        
        # Import the solution
        try:
            spec = importlib.util.spec_from_file_location("solution", solution_file)
            module = importlib.util.module_from_spec(spec)
            spec.loader.exec_module(module)
            
            # Get the Solution class and method
            Solution = getattr(module, 'Solution', None)
            if not Solution:
                print("  ❌ No Solution class found")
                continue
                
            method_name = get_solution_method(Solution)
            method = getattr(Solution(), method_name)
            
            # Load and run test cases
            test_file = os.path.join(problem_path, 'tests.txt')
            test_cases = load_test_cases(test_file, problem_dir)
            
            if not test_cases:
                print("  ℹ️ No valid test cases found")
                continue
            
            passed = 0
            for i, (inputs, expected) in enumerate(test_cases, 1):
                try:
                    # Handle both single arg and multiple args
                    if not isinstance(inputs, tuple):
                        inputs = (inputs,)
                    
                    result = method(*inputs)
                    
                    if result == expected:
                        print(f"  ✅ Test {i}: PASS")
                        passed += 1
                    else:
                        print(f"  ❌ Test {i}: FAIL")
                        print(f"     Input:    {inputs}")
                        print(f"     Expected: {expected}")
                        print(f"     Got:      {result}")
                except Exception as e:
                    print(f"  ❌ Test {i}: ERROR - {e}")
                    print(f"     Input: {inputs}")
            
            print(f"  {passed}/{len(test_cases)} tests passed")
            total_passed += passed
            total_tests += len(test_cases)
            
        except Exception as e:
            print(f"  ❌ Error running tests: {e}")
    
    # Print summary
    print("\n=== SUMMARY ===")
    print(f"Total problems: {len(problem_dirs)}")
    print(f"Total tests:    {total_tests}")
    print(f"Passed:         {total_passed}")
    print(f"Failed:         {total_tests - total_passed}")

if __name__ == "__main__":
    run_tests()
