# Deploying the leetcards backend to Render

The leetcards backend is a Node/[Hono](https://hono.dev/) server living in
[`leetcode-patterns/`](./leetcode-patterns). It is deployed to
[Render](https://render.com/) as a **Blueprint** described by
[`render.yaml`](./render.yaml) at the repo root.

The frontend stays on **Netlify** — Render only hosts the persistent backend
(API + SQLite). Point the Netlify frontend at the Render service URL.

## What the persistent disk is for

The blueprint provisions a 1 GB persistent disk mounted at `/data`. The SQLite
database lives there (`SQLITE_PATH=/data/leetcards.db`) so review/flashcard data
survives deploys and restarts. Without a persistent disk, Render's filesystem is
ephemeral and the database would be wiped on every deploy.

## One-time setup

1. **Create the Blueprint.** In the Render dashboard choose
   **New → Blueprint**, connect this repository, and select `render.yaml`. This
   creates the `leetcards-backend` web service with the persistent disk.

2. **Set the secret env vars** on the service (these are `sync: false` in
   `render.yaml`, so Render prompts for them and never stores them in git):
   - `ANTHROPIC_API_KEY` — Anthropic API key for the AI features.
   - `JUDGE0_URL` — URL of your Judge0 instance (code execution).
   - `JUDGE0_AUTH_TOKEN` — Judge0 auth token (if your instance requires one).
   - `PORT` — optional; Render injects a port, the server defaults to `3001`.

   `SQLITE_PATH` is already set to `/data/leetcards.db` in the blueprint and
   does not need to be entered manually.

## Triggering deploys

Render auto-deploys on push to the connected branch. To trigger a deploy via
the API instead:

```bash
export RENDER_API_KEY=rnd_xxxxxxxx   # from Render → Account Settings → API Keys
bash scripts/deploy-render.sh
```

The script looks up the `leetcards-backend` service and POSTs a deploy. If
`RENDER_API_KEY` is unset it is a no-op (exits 0), so it is safe in CI. Override
the service name with `RENDER_SERVICE_NAME` if you renamed it. No secrets are
hardcoded.

## Routing the Netlify frontend at the Render backend

By default the frontend calls `/api/*` same-origin (Netlify Functions). To point
it at the Render service instead, set two env vars:

- **Netlify** build environment: `VITE_API_BASE=https://leetcards-backend.onrender.com`
  — Vite inlines this at build time so `/api/*` fetches target the Render
  backend. Leave it unset to keep the current same-origin Netlify Functions
  behavior.
- **Render** service env: `ALLOWED_ORIGINS=<your netlify site url>` (e.g.
  `https://your-site.netlify.app`; comma-separated for multiple) so the backend
  reflects that origin on credentialed CORS requests. `http://localhost:5173`
  and `http://localhost:8888` are always allowed for local dev.

The anonymous user cookie is sent cross-site as `SameSite=None; Secure` (both
hosts are https), and the API fetches use `credentials: "include"`.

## Health check

Render polls `GET /api/health` (`healthCheckPath` in `render.yaml`) to decide
whether the service is live.

---

_Note on credits: Render's free/starter tier and any credit line cover this
backend service; keep an eye on disk and instance usage so the persistent SQLite
service stays within the available credit._
