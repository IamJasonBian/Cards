import { serve } from "@hono/node-server";
import { buildApp } from "./app.ts";
import { InMemoryStore } from "./storage.ts";

const PORT = Number(process.env.PORT ?? 3001);
const DATA_PATH = process.env.DATA_PATH ?? "./server/.data/reviews.json";

const store = new InMemoryStore(DATA_PATH);
const app = buildApp(store);

serve({ fetch: app.fetch, port: PORT }, (info) => {
  console.log(`[leetcards-server] listening on http://localhost:${info.port}`);
  console.log(`[leetcards-server] persistence: ${DATA_PATH}`);
});
