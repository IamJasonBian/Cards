export type Difficulty = "Easy" | "Medium" | "Hard";

export interface ManifestEntry {
  slug: string;
  number: number;
  title: string;
  difficulty: Difficulty;
  category?: string;
}

export interface ProblemManifest {
  problems: ManifestEntry[];
}

export interface Example {
  input: Record<string, unknown>;
  output: unknown;
  explanation?: string;
}

export interface PublicProblem {
  slug: string;
  number: number;
  title: string;
  url: string;
  difficulty: Difficulty;
  category: string;
  statement: string;
  constraints: string[];
  starterCode: string;
  visibleExamples: Example[];
  hiddenCount: number;
}

export interface CaseResult {
  name: string;
  input?: Record<string, unknown>;
  expected: unknown;
  actual: unknown;
  passed: boolean;
  visible: boolean;
  error?: string;
}

export type RunStatus =
  | "accepted"
  | "time-limit"
  | "compile-error"
  | "runtime-error"
  | "judge-unavailable"
  | "wrong-answer";

export interface RunResult {
  status: RunStatus;
  cases: CaseResult[];
  passed: number;
  total: number;
  visiblePassed: number;
  visibleTotal: number;
  hiddenPassed: number;
  hiddenTotal: number;
  durationMs?: number;
  fatal?: string;
}
