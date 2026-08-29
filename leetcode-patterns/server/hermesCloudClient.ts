// Hermes cloud — generic model-query client for the Nous Research inference
// API (OpenAI-compatible). This is the CLOUD counterpart to reviewClient.ts's
// self-hosted tailnet gateway: same "attempt, throw, let the caller fall back"
// contract, but reusable for any feature that needs a model answer (Interview
// Drill "Break it down" today; textbook explainers etc. later — see
// POST /api/hermes in app.ts).
//
// Endpoint contract:
//   POST {HERMES_CLOUD_URL}/chat/completions
//     body: { model, messages: [{ role, content }], max_tokens, temperature }
//     resp: { choices: [{ message: { content } }], model }
//
// Any failure (missing key, network, non-2xx, empty body, timeout) throws
// HermesUnavailable so callers can fall back to a local heuristic — buttons
// backed by this client must never hard-fail.
//
// Config (all optional except the key):
//   HERMES_CLOUD_KEY    bearer key      (required — no key ⇒ unavailable)
//   HERMES_CLOUD_URL    base URL        (default: Nous inference API v1)
//   HERMES_CLOUD_MODEL  default model   (default: "nousresearch/hermes-4-70b")

const DEFAULT_URL = "https://inference-api.nousresearch.com/v1";
const DEFAULT_MODEL = "nousresearch/hermes-4-70b";
const DEFAULT_MAX_TOKENS = 700;
// Netlify sync functions cap out well under 30s — leave headroom for the
// response to serialize. Long generations should lower max_tokens, not raise this.
const TIMEOUT_MS = 25_000;

export class HermesUnavailable extends Error {}

export interface HermesMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface HermesQuery {
  messages: HermesMessage[];
  model?: string;
  maxTokens?: number;
  temperature?: number;
}

export interface HermesReply {
  content: string;
  model: string;
}

export function hermesCloudConfigured(): boolean {
  return Boolean(process.env.HERMES_CLOUD_KEY);
}

export async function queryHermesCloud(q: HermesQuery): Promise<HermesReply> {
  const key = process.env.HERMES_CLOUD_KEY;
  if (!key) throw new HermesUnavailable("HERMES_CLOUD_KEY not configured");
  if (!q.messages.length) throw new HermesUnavailable("no messages");

  const base = (process.env.HERMES_CLOUD_URL ?? DEFAULT_URL).replace(/\/+$/, "");
  const model = q.model ?? process.env.HERMES_CLOUD_MODEL ?? DEFAULT_MODEL;

  let res: Response;
  try {
    res = await fetch(`${base}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${key}`,
      },
      body: JSON.stringify({
        model,
        messages: q.messages,
        max_tokens: q.maxTokens ?? DEFAULT_MAX_TOKENS,
        temperature: q.temperature ?? 0.3,
        stream: false,
      }),
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
  } catch (e) {
    throw new HermesUnavailable(
      `hermes cloud unreachable: ${e instanceof Error ? e.message : String(e)}`,
    );
  }

  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    throw new HermesUnavailable(`hermes cloud ${res.status}: ${detail.slice(0, 300)}`);
  }

  const body = (await res.json().catch(() => null)) as {
    choices?: { message?: { content?: string } }[];
    model?: string;
  } | null;
  const content = body?.choices?.[0]?.message?.content?.trim();
  if (!content) throw new HermesUnavailable("hermes cloud returned an empty completion");

  return { content, model: body?.model ?? model };
}
