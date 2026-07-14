import Anthropic from "@anthropic-ai/sdk";
import { Hono } from "hono";
import { bodyLimit } from "hono/body-limit";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import { secureHeaders } from "hono/secure-headers";
import { schedule, type Grade, type Storage } from "./storage.ts";
import { getProblem } from "./problemLoader.ts";
import { buildProgram } from "./judgeHarness.ts";
import { runPython, Judge0Unavailable, JUDGE0_STATUS } from "./judge0Client.ts";
import { getOrSetUserId } from "./userId.ts";
import { preflight, recordSuccess, recordFailure, CircuitOpen } from "./circuit.ts";
import type { CaseReport, RunReport } from "./problemSchema.ts";

const anthropic = new Anthropic();

const PARSE_PROMPTS = {
  problem:
    "Extract the LeetCode problem statement from this image exactly as written. Include the description, constraints, and all examples. Return only the problem text — no commentary.",
  code:
    "Extract all code visible in this image exactly as written, preserving indentation and syntax. Return only the code — no commentary or markdown fences.",
};

const RATE_LIMIT = 10;          // max parses per IP
const RATE_WINDOW_MS = 60 * 60 * 1000; // per hour
const MAX_IMAGE_BYTES = 1.5 * 1024 * 1024; // 1.5 MB base64 (~1 MB raw)

const SUBMIT_RATE_LIMIT = 120;           // max submission writes per IP
const SUBMIT_RATE_WINDOW_MS = 60 * 60 * 1000;

// Layered limits for /api/submissions/run:
//   global per-user/hour       — overall budget
//   per-user/per-problem/5s    — kills compile-error storms + auto-retry loops
//   per-IP/hour                — coarse fence behind cookie clearing
const RUN_RATE_LIMIT_USER = 60;          // submissions/hour/user (cookie)
const RUN_RATE_LIMIT_IP = 200;           // submissions/hour/IP (NAT-tolerant)
const RUN_RATE_WINDOW_MS = 60 * 60 * 1000;
const RUN_PAIR_LIMIT = 3;                // submissions per problem in 5s
const RUN_PAIR_WINDOW_MS = 5_000;
const MAX_CODE_BYTES = 32 * 1024;

const DEFAULT_USER = "local";

// Origins allowed to make credentialed cross-origin /api/* calls. Configured via
// the comma-separated ALLOWED_ORIGINS env var (e.g. your Netlify site URL); local
// dev origins are always allowed so same-origin and `npm run dev` keep working.
const DEFAULT_ALLOWED_ORIGINS = ["http://localhost:5173", "http://localhost:8888"];

function allowedOrigins(): string[] {
  const fromEnv = (process.env.ALLOWED_ORIGINS ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  return [...new Set([...DEFAULT_ALLOWED_ORIGINS, ...fromEnv])];
}

export function buildApp(store: Storage): Hono {
  const app = new Hono();

  // Request logging — surfaces method/path/status/latency in Render & Netlify
  // function logs. Registered first so every request (including preflights and
  // rejections) is logged.
  app.use("*", logger());

  // Safe response headers (X-Content-Type-Options: nosniff, X-Frame-Options,
  // Referrer-Policy, etc.). Defaults only — the default Strict-Transport-Security
  // header is ignored by browsers over plain http://, so local development is
  // unaffected, and it only takes effect once served over https in production.
  app.use("*", secureHeaders());

  // CORS for the API surface only. We use credentialed requests (the anonymous
  // user cookie), so we reflect the request origin only when it is in the
  // allowlist — never a wildcard. Same-origin requests carry no Origin header
  // (or a matching one) and are unaffected. Preflight (OPTIONS) is handled by
  // this middleware.
  const origins = allowedOrigins();
  app.use(
    "/api/*",
    cors({
      origin: (origin) => (origins.includes(origin) ? origin : null),
      credentials: true,
      allowMethods: ["GET", "POST", "OPTIONS"],
      allowHeaders: ["Content-Type"],
    })
  );

  app.get("/api/health", (c) => c.json({ ok: true }));

  app.get("/api/reviews", async (c) => {
    const user = c.req.query("user") ?? DEFAULT_USER;
    return c.json({ reviews: await store.listAllReviews(user) });
  });

  app.get("/api/reviews/due", async (c) => {
    const user = c.req.query("user") ?? DEFAULT_USER;
    const now = Date.now();
    const ids = await store.listDue(user, now, 200);
    return c.json({ due: ids, now });
  });

  app.post("/api/reviews", async (c) => {
    const body = (await c.req.json()) as { cardId?: string; grade?: Grade; user?: string };
    if (!body.cardId || !body.grade) {
      return c.json({ error: "cardId and grade required" }, 400);
    }
    const user = body.user ?? DEFAULT_USER;
    const now = Date.now();
    const prev = await store.getReview(user, body.cardId);
    const next = schedule(prev, body.grade, body.cardId, now);
    await store.saveReview(user, next);
    return c.json({ state: next });
  });

  // parse-image carries base64 image payloads — the only large body in the API.
  // Cap it before Hono buffers/parses the JSON so oversized uploads are rejected
  // cheaply. Other routes carry small JSON and are left uncapped.
  app.use(
    "/api/parse-image",
    bodyLimit({
      maxSize: 10 * 1024 * 1024,
      onError: (c) => c.json({ error: "payload too large" }, 413),
    })
  );

  app.post("/api/parse-image", async (c) => {
    const body = (await c.req.json()) as {
      image?: string;
      mimeType?: string;
      mode?: "problem" | "code";
    };
    if (!body.image || !body.mimeType || !body.mode) {
      return c.json({ error: "image, mimeType, and mode are required" }, 400);
    }
    if (!PARSE_PROMPTS[body.mode]) {
      return c.json({ error: "mode must be 'problem' or 'code'" }, 400);
    }
    if (body.image.length > MAX_IMAGE_BYTES) {
      return c.json({ error: "Image too large — maximum 1 MB." }, 413);
    }
    if (!process.env.ANTHROPIC_API_KEY) {
      return c.json({ error: "Server is missing ANTHROPIC_API_KEY." }, 503);
    }

    const ip =
      c.req.header("x-nf-client-connection-ip") ??   // Netlify real IP header
      c.req.header("x-forwarded-for")?.split(",")[0].trim() ??
      "unknown";
    const bucket = await store.incrementRateLimit(`parse:${ip}`, RATE_WINDOW_MS, Date.now());
    if (bucket.count > RATE_LIMIT) {
      return c.json({ error: "Rate limit exceeded — max 10 parses per hour." }, 429);
    }

    try {
      const message = await anthropic.messages.create({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 2048,
        messages: [
          {
            role: "user",
            content: [
              {
                type: "image",
                source: { type: "base64", media_type: body.mimeType as "image/jpeg" | "image/png" | "image/gif" | "image/webp", data: body.image },
              },
              { type: "text", text: PARSE_PROMPTS[body.mode] },
            ],
          },
        ],
      });
      const text = message.content.find((b) => b.type === "text")?.text ?? "";
      return c.json({ text });
    } catch (err) {
      console.error("[parse-image] anthropic call failed:", err);
      const msg = err instanceof Error ? err.message : "Claude request failed";
      return c.json({ error: msg }, 502);
    }
  });

  // Run user code against a problem's hidden + visible tests via Judge0.
  // Hidden cases live in server/problems/{slug}.json — never sent to the client.
  app.post("/api/submissions/run", async (c) => {
    const body = (await c.req.json().catch(() => null)) as
      | { problemId?: string; code?: string }
      | null;
    if (!body || typeof body.problemId !== "string" || typeof body.code !== "string") {
      return c.json({ error: "problemId and code are required" }, 400);
    }
    if (body.code.length > MAX_CODE_BYTES) {
      return c.json({ error: `code too large (max ${MAX_CODE_BYTES} bytes)` }, 413);
    }

    const { userId, ip } = getOrSetUserId(c);
    const now = Date.now();

    // Layered rate limits. Run all three buckets (we want every offender to
    // burn quota in every dimension), then short-circuit if any exceeds.
    const [perUser, perIp, perPair] = await Promise.all([
      store.incrementRateLimit(`run:user:${userId}`, RUN_RATE_WINDOW_MS, now),
      store.incrementRateLimit(`run:ip:${ip}`, RUN_RATE_WINDOW_MS, now),
      store.incrementRateLimit(`run:pair:${userId}:${body.problemId}`, RUN_PAIR_WINDOW_MS, now),
    ]);
    if (perUser.count > RUN_RATE_LIMIT_USER) {
      return c.json({ error: `Rate limit: max ${RUN_RATE_LIMIT_USER} runs/hour per user.` }, 429);
    }
    if (perIp.count > RUN_RATE_LIMIT_IP) {
      return c.json({ error: `Rate limit: max ${RUN_RATE_LIMIT_IP} runs/hour from this network.` }, 429);
    }
    if (perPair.count > RUN_PAIR_LIMIT) {
      return c.json(
        { error: `Slow down — max ${RUN_PAIR_LIMIT} submissions per problem in ${RUN_PAIR_WINDOW_MS / 1000}s.` },
        429
      );
    }

    const problem = await getProblem(body.problemId);
    if (!problem) {
      return c.json({ error: `unknown problemId '${body.problemId}'` }, 404);
    }

    // Circuit breaker — fail fast if Judge0 has been failing repeatedly so we
    // don't pile request after request onto an already-broken backend.
    try {
      await preflight(store, now);
    } catch (e) {
      if (e instanceof CircuitOpen) {
        return c.json(
          {
            passed: 0,
            total: problem.visibleExamples.length + problem.hiddenCases.length,
            visiblePassed: 0,
            visibleTotal: problem.visibleExamples.length,
            hiddenPassed: 0,
            hiddenTotal: problem.hiddenCases.length,
            durationMs: 0,
            cases: [],
            fatal: `Judge cooling down — try again in ~${Math.ceil(e.retryAfterMs / 1000)}s.`,
            status: "judge-unavailable",
          } satisfies RunReport,
          503
        );
      }
      throw e;
    }

    const program = buildProgram(problem, body.code);
    const startedAt = Date.now();
    let report: RunReport;
    try {
      const judgeResult = await runPython({ sourceCode: program });
      report = parseJudge0Result(problem, judgeResult, Date.now() - startedAt);
      await recordSuccess(store);
    } catch (e) {
      if (e instanceof Judge0Unavailable) {
        await recordFailure(store, Date.now());
        return c.json(
          {
            passed: 0,
            total: problem.visibleExamples.length + problem.hiddenCases.length,
            visiblePassed: 0,
            visibleTotal: problem.visibleExamples.length,
            hiddenPassed: 0,
            hiddenTotal: problem.hiddenCases.length,
            durationMs: Date.now() - startedAt,
            cases: [],
            fatal: `Judge unavailable: ${e.cause}. Set JUDGE0_URL and start your Judge0 instance.`,
            status: "judge-unavailable",
          } satisfies RunReport,
          503
        );
      }
      throw e;
    }

    void store
      .saveSubmission?.(userId, {
        problemId: problem.slug,
        passed: report.passed,
        total: report.total,
        durationMs: report.durationMs,
        codeHash: null,
        ts: Date.now(),
      })
      .catch(() => {});

    return c.json(report);
  });

  // Submissions endpoint is now history-only (the run endpoint persists internally).
  app.post("/api/submissions", async (c) => {
    const body = (await c.req.json().catch(() => null)) as
      | {
          problemId?: string;
          passed?: number;
          total?: number;
          durationMs?: number;
          codeHash?: string;
          codeBlob?: string;
          saveCode?: boolean;
          user?: string;
        }
      | null;
    if (
      !body ||
      typeof body.problemId !== "string" ||
      typeof body.passed !== "number" ||
      typeof body.total !== "number"
    ) {
      return c.json(
        { error: "problemId, passed, total are required" },
        400
      );
    }

    const ip =
      c.req.header("x-nf-client-connection-ip") ??
      c.req.header("x-forwarded-for")?.split(",")[0].trim() ??
      "unknown";
    const bucket = await store.incrementRateLimit(
      `submit:${ip}`,
      SUBMIT_RATE_WINDOW_MS,
      Date.now()
    );
    if (bucket.count > SUBMIT_RATE_LIMIT) {
      return c.json({ error: "Rate limit exceeded." }, 429);
    }

    const user = body.user ?? DEFAULT_USER;
    const submission = {
      problemId: body.problemId,
      passed: body.passed,
      total: body.total,
      durationMs: body.durationMs ?? 0,
      codeHash: body.codeHash ?? null,
      ts: Date.now(),
    };
    await store.saveSubmission?.(user, submission);
    if (body.saveCode && body.codeBlob && body.codeHash) {
      await store.saveCodeBlob?.(body.codeHash, body.codeBlob);
    }
    return c.json({ ok: true, submission });
  });

  app.get("/api/submissions", async (c) => {
    const user = c.req.query("user") ?? DEFAULT_USER;
    const problemId = c.req.query("problemId") ?? undefined;
    const items = (await store.listSubmissions?.(user, problemId, 50)) ?? [];
    return c.json({ submissions: items });
  });

  app.get("/api/stats", async (c) => {
    const user = c.req.query("user") ?? DEFAULT_USER;
    const reviews = await store.listAllReviews(user);
    const now = Date.now();
    const due = reviews.filter((r) => r.due <= now).length;
    const learning = reviews.filter((r) => r.reps > 0 && r.reps < 3).length;
    const mature = reviews.filter((r) => r.reps >= 3).length;
    const lapsed = reviews.reduce((a, r) => a + r.lapses, 0);
    return c.json({ total: reviews.length, due, learning, mature, lapsed });
  });

  return app;
}

import type { ServerProblem } from "./problemSchema.ts";
import type { Judge0Result } from "./judge0Client.ts";

function parseJudge0Result(
  problem: ServerProblem,
  judge: Judge0Result,
  durationMs: number
): RunReport {
  const visibleTotal = problem.visibleExamples.length;
  const hiddenTotal = problem.hiddenCases.length;

  // Compile error → no test cases ran.
  if (judge.status.id === JUDGE0_STATUS.COMPILE_ERROR || judge.compileOutput) {
    return {
      passed: 0,
      total: visibleTotal + hiddenTotal,
      visiblePassed: 0,
      visibleTotal,
      hiddenPassed: 0,
      hiddenTotal,
      durationMs,
      cases: [],
      fatal: (judge.compileOutput ?? judge.message ?? "Compile error").trim().slice(0, 2000),
      status: "compile-error",
    };
  }

  // Time limit hit before harness could finish printing all cases.
  if (judge.status.id === JUDGE0_STATUS.TIME_LIMIT) {
    return {
      passed: 0,
      total: visibleTotal + hiddenTotal,
      visiblePassed: 0,
      visibleTotal,
      hiddenPassed: 0,
      hiddenTotal,
      durationMs,
      cases: [],
      fatal: "Time limit exceeded.",
      status: "time-limit",
    };
  }

  // Parse one JSON line per case from stdout. The harness emits __fatal for
  // missing-method / can't-instantiate-Solution scenarios.
  const stdout = judge.stdout ?? "";
  const cases: CaseReport[] = [];
  let fatal: string | undefined;
  for (const line of stdout.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    try {
      const obj = JSON.parse(trimmed) as Record<string, unknown>;
      if (typeof obj.__fatal === "string") {
        fatal = obj.__fatal;
        continue;
      }
      cases.push({
        name: String(obj.name ?? ""),
        visible: Boolean(obj.visible),
        passed: Boolean(obj.passed),
        durationMs: Number(obj.durationMs ?? 0),
        input: obj.input as Record<string, unknown> | undefined,
        expected: obj.expected,
        actual: obj.actual,
        error: typeof obj.error === "string" ? obj.error : undefined,
      });
    } catch {
      // ignore non-JSON lines (e.g. accidental prints in user code)
    }
  }

  if (!fatal && cases.length === 0) {
    fatal = (judge.stderr ?? judge.message ?? "Judge produced no output.").trim().slice(0, 2000);
    return {
      passed: 0,
      total: visibleTotal + hiddenTotal,
      visiblePassed: 0,
      visibleTotal,
      hiddenPassed: 0,
      hiddenTotal,
      durationMs,
      cases: [],
      fatal,
      status: "runtime-error",
    };
  }

  const visibleResults = cases.filter((c) => c.visible);
  const hiddenResults = cases.filter((c) => !c.visible);
  const visiblePassed = visibleResults.filter((c) => c.passed).length;
  const hiddenPassed = hiddenResults.filter((c) => c.passed).length;
  const passed = visiblePassed + hiddenPassed;
  const total = visibleTotal + hiddenTotal;

  // Reveal only the FIRST failing hidden case to the client.
  const firstFailingHidden = hiddenResults.find((c) => !c.passed);
  const reportedCases: CaseReport[] = [
    ...visibleResults,
    ...(firstFailingHidden ? [firstFailingHidden] : []),
  ];

  let status: RunReport["status"] = "accepted";
  if (fatal || cases.some((c) => c.error)) status = "runtime-error";
  if (passed < total) status = "wrong-answer";
  if (passed === total && !fatal) status = "accepted";

  return {
    passed,
    total,
    visiblePassed,
    visibleTotal,
    hiddenPassed,
    hiddenTotal,
    durationMs,
    cases: reportedCases,
    fatal,
    status,
  };
}
