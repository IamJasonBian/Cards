import { Hono } from "hono";
import { cors } from "hono/cors";
import { schedule, type Grade, type Storage } from "./storage.ts";

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
