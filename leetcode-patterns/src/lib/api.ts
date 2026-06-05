// Configurable API base for routing the frontend at a cross-origin backend.
//
// The default points at the Render service because the Netlify Functions
// backend is not serving `/api` (live `/api/*` calls 404 on leetcodecards.com,
// returning HTML). Falling back to Render keeps `/api/*` reaching a working
// backend. Set VITE_API_BASE at build time to override (e.g. for local/other
// environments).
export const API_BASE = (
  import.meta.env.VITE_API_BASE ?? "https://leetcards-backend.onrender.com"
).replace(/\/$/, "");

export function apiUrl(path: string): string {
  return `${API_BASE}${path}`;
}
