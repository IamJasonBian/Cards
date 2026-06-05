// Builds the Python program we ship to Judge0.
//
// Layout: [user code] + [TEST_CASES literal] + [judge harness].
// The harness instantiates Solution, iterates cases, and prints one JSON
// line per case to stdout. We then parse those lines on the Node side.
//
// This is a server-side analogue of what the Pyodide worker used to inline.
// Hidden cases stay on the server; the client never sees them.

import type { ServerProblem, ServerCase } from "./problemSchema.ts";

const HARNESS = `
import json, time, traceback

def __lc_norm(x):
    if isinstance(x, tuple): return [__lc_norm(v) for v in x]
    if isinstance(x, set): return sorted([__lc_norm(v) for v in x])
    if isinstance(x, list): return [__lc_norm(v) for v in x]
    if isinstance(x, dict): return {k: __lc_norm(v) for k, v in x.items()}
    return x

def __lc_check(actual, expected, equality, ctx):
    actual_n = __lc_norm(actual)
    if equality == "exact":
        return (actual_n == expected, None)
    if equality == "set":
        if not isinstance(actual_n, list):
            return (False, "expected a list")
        try:
            return (sorted(actual_n) == sorted(expected), None)
        except Exception as e:
            return (False, f"comparison failed: {e}")
    if equality == "set-of-sets":
        try:
            a = sorted([sorted(x) for x in actual_n])
            b = sorted([sorted(x) for x in expected])
            return (a == b, None)
        except Exception:
            return (False, "result is not a list of lists")
    if equality == "two-sum-pair":
        nums = ctx["input"]["nums"]; target = ctx["input"]["target"]
        if not (isinstance(actual_n, list) and len(actual_n) == 2):
            return (False, "expected a list of two indices")
        i, j = actual_n
        if not all(isinstance(v, int) for v in (i, j)):
            return (False, "indices must be integers")
        if i == j:
            return (False, "indices must be distinct")
        if not (0 <= i < len(nums) and 0 <= j < len(nums)):
            return (False, "indices out of range")
        if nums[i] + nums[j] != target:
            return (False, f"nums[{i}] + nums[{j}] = {nums[i]+nums[j]}, expected {target}")
        return (True, None)
    return (actual_n == expected, None)

def __lc_run():
    try:
        sol = Solution()
    except Exception as e:
        print(json.dumps({"__fatal": f"could not instantiate Solution: {type(e).__name__}: {e}"}))
        return
    method = getattr(sol, __LC_METHOD_NAME, None)
    if method is None:
        print(json.dumps({"__fatal": f"Solution has no method '{__LC_METHOD_NAME}'"}))
        return
    for case in __LC_CASES:
        # Deep-copy inputs so user code can't mutate across cases
        args = json.loads(json.dumps(case["input"]))
        t0 = time.perf_counter()
        try:
            actual = method(**args)
        except Exception as e:
            dt = int((time.perf_counter() - t0) * 1000)
            print(json.dumps({
                "name": case["name"], "visible": case.get("visible", False),
                "passed": False, "durationMs": dt,
                "error": f"{type(e).__name__}: {e}",
                "input": case["input"], "expected": case.get("expected"),
                "trace": "".join(traceback.format_exception_only(type(e), e)).strip()
            }))
            continue
        dt = int((time.perf_counter() - t0) * 1000)
        ok, why = __lc_check(actual, case.get("expected"), __LC_EQUALITY, {"input": case["input"]})
        out = {
            "name": case["name"], "visible": case.get("visible", False),
            "passed": bool(ok), "durationMs": dt,
            "actual": __lc_norm(actual), "expected": case.get("expected"),
            "input": case["input"]
        }
        if why and not ok:
            out["error"] = why
        print(json.dumps(out))

__lc_run()
`;

export function buildProgram(problem: ServerProblem, userCode: string): string {
  const visible: ServerCase[] = problem.visibleExamples.map((v, i) => ({
    name: `Example ${i + 1}`,
    input: v.input,
    expected: v.output,
    visible: true,
  }));
  const hidden: ServerCase[] = problem.hiddenCases.map((h) => ({
    name: h.name,
    input: h.input,
    expected: h.expected,
    visible: false,
  }));
  const cases = [...visible, ...hidden];

  // Embed data as JSON *strings* parsed by json.loads, not as inline literals:
  // JSON true/false/null are not valid Python, so inlining the cases array
  // (which contains "visible": true/false) would raise NameError at runtime.
  const literals = [
    `__LC_CASES = json.loads(${JSON.stringify(JSON.stringify(cases))})`,
    `__LC_EQUALITY = json.loads(${JSON.stringify(JSON.stringify(problem.equality))})`,
    `__LC_METHOD_NAME = json.loads(${JSON.stringify(JSON.stringify(problem.signature.methodName))})`,
  ].join("\n");

  return [
    "# --- user code ---",
    userCode,
    "",
    "# --- test data ---",
    "import json",
    literals,
    "",
    "# --- judge harness ---",
    HARNESS,
  ].join("\n");
}
