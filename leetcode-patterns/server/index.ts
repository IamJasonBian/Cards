import { serve } from "@hono/node-server";
import { buildApp } from "./app.ts";
import { InMemoryStore, type Storage } from "./storage.ts";
import { SqliteStore } from "./sqlite-store.ts";

const PORT = Number(process.env.PORT ?? 3001);
const DATA_PATH = process.env.DATA_PATH ?? "./server/.data/reviews.json";
const SQLITE_PATH = process.env.SQLITE_PATH;

let store: Storage;
let storeDesc: string;
if (SQLITE_PATH) {
  store = new SqliteStore(SQLITE_PATH);
  storeDesc = `SqliteStore (${SQLITE_PATH})`;
} else {
  store = new InMemoryStore(DATA_PATH);
  storeDesc = `InMemoryStore (${DATA_PATH})`;
}

const app = buildApp(store);

serve({ fetch: app.fetch, port: PORT }, (info) => {
  console.log(`[leetcards-server] listening on http://localhost:${info.port}`);
  console.log(`[leetcards-server] store: ${storeDesc}`);
});
