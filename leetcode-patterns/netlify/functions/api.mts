import type { Context } from "@netlify/functions";
import { buildApp } from "../../server/app.ts";
import { NetlifyBlobsStore } from "../../server/blobs-store.ts";

const store = new NetlifyBlobsStore();
const app = buildApp(store);

export default async function handler(req: Request, _context: Context): Promise<Response> {
  return app.fetch(req);
}

export const config = {
  path: "/api/*",
};
