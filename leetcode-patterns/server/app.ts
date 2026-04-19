import Anthropic from "@anthropic-ai/sdk";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { schedule, type Grade, type Storage } from "./storage.ts";

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

const DEFAULT_USER = "local";

export function buildApp(store: Storage): Hono {
  const app = new Hono();
  app.use("*", cors());

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

    const ip =
      c.req.header("x-nf-client-connection-ip") ??   // Netlify real IP header
      c.req.header("x-forwarded-for")?.split(",")[0].trim() ??
      "unknown";
    const bucket = await store.incrementRateLimit(`parse:${ip}`, RATE_WINDOW_MS, Date.now());
    if (bucket.count > RATE_LIMIT) {
      return c.json({ error: "Rate limit exceeded — max 10 parses per hour." }, 429);
    }

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
