// LLM-backed code review for the Interview Drill "Review my code →" button.
//
// Talks to a self-hosted OpenAI-ish model gateway (a custom "ollama-api"
// server, e.g. reachable over Tailscale). Endpoint contract:
//   POST {REVIEW_LLM_URL}/v1/chat
//     body: { model, messages: [{ role, content }], stream: false, max_tokens }
//     resp: { model, content, thinking }
//
// This module only ever *attempts* the review. Any failure (missing config,
// network, non-2xx, empty body, timeout) throws ReviewUnavailable so the caller
// can fall back to the local heuristic — the button must never hard-fail.
//
// Config (all optional except the token):
//   REVIEW_LLM_URL    base URL           (default: the Tailscale gateway below)
//   REVIEW_LLM_TOKEN  bearer token       (required — no token ⇒ unavailable)
//   REVIEW_LLM_MODEL  model / alias      (default: "hermes")

const DEFAULT_URL = "https://jasons-macbook-pro-3.tail70b2c1.ts.net";
const DEFAULT_MODEL = "hermes";
const MAX_TOKENS = 400;
// Local/tailnet round-trips take a few seconds; cap well under a hung socket.
// In cloud deploys that can't reach the tailnet this simply trips the fallback.
const TIMEOUT_MS = 20_000;

const SYSTEM_PROMPT =
  "You are a senior interviewer reviewing a candidate's code during a coding " +
  "interview drill. Give terse, high-signal feedback as short bullet points: " +
  "correctness bugs, missing edge cases, complexity problems, and " +
  "data-structure mismatches. Nudge like an interviewer — do NOT rewrite the " +
  "solution or hand over the full answer.";

export class ReviewUnavailable extends Error {}

export interface ReviewInput {
  code: string;
  patterns?: string[];
  problem?: string;
}

export function reviewLLMConfigured(): boolean {
  return Boolean(process.env.REVIEW_LLM_TOKEN);
}

export async function reviewWithLLM(input: ReviewInput): Promise<string> {
  const token = process.env.REVIEW_LLM_TOKEN;
  if (!token) throw new ReviewUnavailable("REVIEW_LLM_TOKEN not configured");

  const base = (process.env.REVIEW_LLM_URL ?? DEFAULT_URL).replace(/\/+$/, "");
  const model = process.env.REVIEW_LLM_MODEL ?? DEFAULT_MODEL;

  const context = input.patterns?.length
    ? `Likely patterns: ${input.patterns.join(", ")}.`
    : "";
  const problem = input.problem?.trim()
    ? `Problem:\n${input.problem.trim()}\n\n`
    : "";
  const userMsg = `${problem}${context}\n\nCandidate code:\n\`\`\`\n${input.code}\n\`\`\``;

  let res: Response;
  try {
    res = await fetch(`${base}/v1/chat`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        model,
        stream: false,
        max_tokens: MAX_TOKENS,
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: userMsg },
        ],
      }),
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
  } catch (e) {
    throw new ReviewUnavailable(e instanceof Error ? e.message : String(e));
  }

  if (!res.ok) throw new ReviewUnavailable(`HTTP ${res.status}`);

  const json = (await res.json().catch(() => null)) as { content?: string } | null;
  const text = json?.content?.trim();
  if (!text) throw new ReviewUnavailable("empty response");
  return text;
}
