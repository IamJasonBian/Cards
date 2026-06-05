// Configurable API base for routing the frontend at a cross-origin backend.
//
// When VITE_API_BASE is unset (default, e.g. on Netlify) apiUrl() returns the
// path unchanged, so `/api/*` calls stay same-origin and hit Netlify Functions.
// Set VITE_API_BASE=https://leetcards-backend.onrender.com at build time to
// point the frontend at the Render backend instead.
export const API_BASE = import.meta.env.VITE_API_BASE ?? "";

export function apiUrl(path: string): string {
  return `${API_BASE}${path}`;
}
