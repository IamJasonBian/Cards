// Tiny provider abstraction for the build-time problem-generation scripts.
//
// `complete({ system, user, maxTokens })` returns the model's text reply. The
// provider is chosen by the `LLM_PROVIDER` env var:
//
//   - unset / "anthropic" (default): Claude Haiku 4.5 via @anthropic-ai/sdk,
//     with ephemeral prompt caching on the system prompt (Anthropic-only).
//     Behaves byte-for-byte like the original inlined call. Reads
//     ANTHROPIC_API_KEY.
//   - "qwen" / "ollama": an OpenAI-compatible chat-completions endpoint
//     (e.g. Ollama). Reads QWEN_BASE_URL (default http://localhost:11434/v1)
//     and QWEN_MODEL (default qwen2.5:7b-instruct). No cache_control.
//
// Quality from a local Qwen is lower than Haiku, but the pipeline still
// validates every output by executing the reference solution, so bad
// generations are rejected rather than silently shipped.

import Anthropic from "@anthropic-ai/sdk";

// Anthropic model id — kept identical to the original scripts so the default
// path is unchanged.
const ANTHROPIC_MODEL = "claude-haiku-4-5-20251001";

// OpenAI-compatible (Qwen / Ollama) defaults. Overridable via env.
const DEFAULT_QWEN_BASE_URL = "http://localhost:11434/v1";
const DEFAULT_QWEN_MODEL = "qwen2.5:7b-instruct";
const QWEN_TIMEOUT_MS = 120_000;

export interface CompleteOptions {
  system: string;
  user: string;
  maxTokens?: number;
}

// Lazily created so importing this module (e.g. for the qwen path or a smoke
// test) never requires ANTHROPIC_API_KEY to be set.
let anthropicClient: Anthropic | null = null;
function getAnthropic(): Anthropic {
  if (!anthropicClient) anthropicClient = new Anthropic();
  return anthropicClient;
}

async function completeAnthropic(opts: CompleteOptions): Promise<string> {
  const msg = await getAnthropic().messages.create({
    model: ANTHROPIC_MODEL,
    max_tokens: opts.maxTokens ?? 4000,
    system: [{ type: "text", text: opts.system, cache_control: { type: "ephemeral" } }],
    messages: [{ role: "user", content: opts.user }],
  });
  return msg.content
    .filter((b) => b.type === "text")
    .map((b) => b.text)
    .join("\n");
}

interface OpenAIChatResponse {
  choices?: Array<{ message?: { content?: string | null } }>;
}

async function completeQwen(opts: CompleteOptions): Promise<string> {
  const baseUrl = (process.env.QWEN_BASE_URL || DEFAULT_QWEN_BASE_URL).replace(/\/+$/, "");
  const model = process.env.QWEN_MODEL || DEFAULT_QWEN_MODEL;
  const url = `${baseUrl}/chat/completions`;

  const headers: Record<string, string> = { "Content-Type": "application/json" };
  // Optional bearer for OpenAI-compatible servers that require a key (Ollama
  // ignores it). Never hardcoded — only sent if the operator sets it.
  const apiKey = process.env.QWEN_API_KEY || process.env.OPENAI_API_KEY;
  if (apiKey) headers.Authorization = `Bearer ${apiKey}`;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), QWEN_TIMEOUT_MS);
  let res: Response;
  try {
    res = await fetch(url, {
      method: "POST",
      headers,
      body: JSON.stringify({
        model,
        max_tokens: opts.maxTokens ?? 4000,
        messages: [
          { role: "system", content: opts.system },
          { role: "user", content: opts.user },
        ],
      }),
      signal: controller.signal,
    });
  } catch (e) {
    if (e instanceof Error && e.name === "AbortError") {
      throw new Error(`Qwen request to ${url} timed out after ${QWEN_TIMEOUT_MS}ms`);
    }
    throw new Error(
      `Qwen endpoint unreachable at ${url}: ${e instanceof Error ? e.message : String(e)}. ` +
        `Is the server running? (set QWEN_BASE_URL / QWEN_MODEL, e.g. ollama serve)`
    );
  } finally {
    clearTimeout(timer);
  }

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`Qwen endpoint ${url} returned HTTP ${res.status}: ${body.slice(0, 300)}`);
  }

  const data = (await res.json()) as OpenAIChatResponse;
  const content = data.choices?.[0]?.message?.content;
  if (typeof content !== "string") {
    throw new Error(`Qwen response from ${url} had no choices[0].message.content`);
  }
  return content;
}

export async function complete(opts: CompleteOptions): Promise<string> {
  const provider = (process.env.LLM_PROVIDER || "anthropic").toLowerCase();
  switch (provider) {
    case "anthropic":
      return completeAnthropic(opts);
    case "qwen":
    case "ollama":
      return completeQwen(opts);
    default:
      throw new Error(
        `Unknown LLM_PROVIDER "${process.env.LLM_PROVIDER}". Use "anthropic" (default), "qwen", or "ollama".`
      );
  }
}
