# LeetCode Contest Agents

This document outlines the various agents and their roles in solving LeetCode contest problems.

## Problem Solving Agents

### 1. Solution Generator
- **Purpose**: Generates initial solution code for given LeetCode problems
- **Input**: Problem description, constraints, and examples
- **Output**: Python solution code with time and space complexity analysis
- **Key Features**:
  - Implements optimal algorithms
  - Handles edge cases
  - Includes docstrings and comments
  - Follows PEP 8 style guidelines

### 2. Test Case Generator
- **Purpose**: Creates test cases to validate solutions
- **Input**: Problem constraints and examples
- **Output**: Test cases in the format `[[input_params], expected_output]`
- **Key Features**:
  - Covers edge cases
  - Includes large input cases
  - Validates both functionality and performance

### 3. Solution Validator
- **Purpose**: Verifies the correctness of solutions
- **Input**: Solution code and test cases
- **Output**: Pass/Fail status for each test case
- **Key Features**:
  - Executes test cases
  - Validates outputs
  - Measures runtime and memory usage

## Utility Agents

### 1. Code Formatter
- **Purpose**: Ensures consistent code formatting
- **Key Features**:
  - Applies PEP 8 style
  - Fixes indentation
  - Standardizes imports

### 2. Complexity Analyzer
- **Purpose**: Analyzes time and space complexity
- **Key Features**:
  - Calculates Big-O notation
  - Identifies bottlenecks
  - Suggests optimizations

## Workflow

1. Problem analysis and solution design
2. Solution implementation with test cases
3. Code review and optimization
4. Performance testing
5. Documentation and submission

## Configuration

Configuration is managed in `.cascade/config.json`:
- Solution file naming
- Test case loading
- Code style preferences

## Best Practices

- Always include test cases
- Document time and space complexity
- Handle edge cases
- Write clean, readable code
- Optimize for both time and space

## Adding New Agents

To add a new agent:
1. Define its purpose and scope
2. Implement the agent in the appropriate directory
3. Update this documentation
4. Add necessary test cases
5. Update the configuration if needed
