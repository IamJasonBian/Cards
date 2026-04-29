// Server-side problem schema (mirrors src/lib/problemSchema.ts but lives on the
// Node side, since the function bundles `server/problems/{slug}.json`).

export type Equality = "exact" | "set" | "set-of-sets" | "two-sum-pair";

export interface ServerExample {
  input: Record<string, unknown>;
  output: unknown;
  explanation?: string;
}

export interface ServerHiddenCase {
  name: string;
  input: Record<string, unknown>;
  expected: unknown;
}

export interface ServerCase {
  name: string;
  input: Record<string, unknown>;
  expected: unknown;
  visible: boolean;
}

export interface ServerProblem {
  slug: string;
  title: string;
  number: number;
  difficulty: "Easy" | "Medium" | "Hard";
  category: string;
  url: string;
  statement: string;
  constraints: string[];
  signature: {
    className: string;
    methodName: string;
    params: { name: string; pyType: string; inputKind?: string }[];
    returns: string;
  };
  starterCode: string;
  equality: Equality;
  visibleExamples: ServerExample[];
  hiddenCases: ServerHiddenCase[];
}

// What the runtime returns to the client. Hidden cases are summarized;
// only the FIRST failing hidden case is exposed (LeetCode-style).
export interface CaseReport {
  name: string;
  visible: boolean;
  passed: boolean;
  durationMs: number;
  input?: Record<string, unknown>;
  expected?: unknown;
  actual?: unknown;
  error?: string;
}

export interface RunReport {
  passed: number;
  total: number;
  visiblePassed: number;
  visibleTotal: number;
  hiddenPassed: number;
  hiddenTotal: number;
  durationMs: number;
  cases: CaseReport[];
  fatal?: string;
  status: "accepted" | "wrong-answer" | "runtime-error" | "time-limit" | "compile-error" | "judge-unavailable";
}
