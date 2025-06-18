from solution import Solution

def run_test_case(test_name, operations, params, expected):
    print(f"\n{test_name}")
    print("=" * len(test_name))
    
    fs = None
    results = []
    
    for op, param, exp in zip(operations, params, expected):
        if op == "FileSystem":
            fs = Solution()
            results.append(None)
            print(f"Created FileSystem")
            continue
            
        if not fs:
            print("Error: FileSystem not initialized")
            return False
            
        method = getattr(fs, op)
        result = method(*param) if param else method()
        results.append(result)
        
        # Special handling for ls to make output more readable
        if op == "ls":
            print(f"ls {param[0] if param else '/'} -> {result}")
        elif op == "readContentFromFile":
            print(f"readContentFromFile {param[0]} -> '{result}'")
        else:
            print(f"{op} {param if param else ''}")
    
    # Verify results
    success = results == expected
    print(f"\nTest {'PASSED' if success else 'FAILED'}")
    if not success:
        print(f"Expected: {expected}")
        print(f"Got:      {results}")
    
    return success

def test_case_1():
    print("\n" + "="*50)
    print("TEST CASE 1: Basic directory listing")
    print("="*50)
    operations = ["FileSystem","ls","mkdir","ls","ls","mkdir","ls","ls","addContentToFile","ls","ls","ls"]
    params = [[],["/"],["/a/b/c"],["/"],["/a/b"],["/a/b/e"],["/"],["/a/b"],["/a/b/c/d","hello"],["/"],["/a/b/c"],["/a/b/c/d"]]
    expected = [None,[],None,["a"],["c"],None,["a"],["c","e"],None,["a"],["d"],["d"]]
    return run_test_case("Test 1: Basic directory listing", operations, params, expected)

def test_case_2():
    print("\n" + "="*50)
    print("TEST CASE 2: File operations")
    print("="*50)
    operations = ["FileSystem","mkdir","addContentToFile","ls","readContentFromFile","addContentToFile","readContentFromFile"]
    params = [[],["/a/b/c"],["/a/b/c/d","hello"],["/"],["/a/b/c/d"],["/a/b/c/d"," world"],["/a/b/c/d"]]
    expected = [None,None,None,["a"],"hello",None,"hello world"]
    return run_test_case("Test 2: File operations", operations, params, expected)

def test_case_3():
    print("\n" + "="*50)
    print("TEST CASE 3: Root directory operations")
    print("="*50)
    operations = ["FileSystem","ls","mkdir","ls","addContentToFile","ls","readContentFromFile"]
    params = [[],["/"],["/a"],["/"],["/file.txt","content"],["/"],["/file.txt"]]
    expected = [None,[],None,["a"],None,["a","file.txt"],"content"]
    return run_test_case("Test 3: Root directory operations", operations, params, expected)

def test_case_4():
    print("\n" + "="*50)
    print("TEST CASE 4: Edge cases")
    print("="*50)
    operations = ["FileSystem","mkdir","mkdir","addContentToFile","readContentFromFile","ls","ls","ls"]
    params = [[],["/a"],["/a"],["/file","content"],["/file"],["/"],["/a"],["/bogus/path"]]
    expected = [None,None,None,None,"content",["a","file"],[],[]]
    return run_test_case("Test 4: Edge cases", operations, params, expected)

def test_case_5():
    print("\n" + "="*50)
    print("TEST CASE 5: Additional test case")
    print("="*50)
    operations = ["FileSystem","ls","ls","ls","mkdir","ls","addContentToFile","ls","ls","readContentFromFile","ls"]
    params = [[],["/"],["/"],["/"],["/zou"],["/zou"],["/umvvez","hq"],["/zou"],["/"],["/umvvez"],["/zou"]]
    expected = [None,[],[],[],None,[],None,[],["zou","umvvez"],"hq",[]]
    return run_test_case("Test 5: Additional test case", operations, params, expected)

if __name__ == "__main__":
    results = [
        test_case_1(),
        test_case_2(),
        test_case_3(),
        test_case_4(),
        test_case_5()
    ]
    
    print("\n" + "="*50)
    print(f"TEST SUMMARY: {sum(1 for r in results if r)}/{len(results)} tests passed")
    print("="*50)
