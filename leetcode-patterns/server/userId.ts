// Anonymous user identity via httpOnly cookie. Issued on first hit, sticky
// thereafter. Falls back to client IP when cookies are disabled or stripped
// (corp proxies, curl). Used as the bucket key for per-user rate limits — IP
// alone is unsafe behind CGNAT / corporate NAT.
//
// We don't need crypto-grade signing here: the cookie just maps a session
// to its rate-limit bucket. The worst a user can do by editing their own
// cookie is reset their own bucket — they don't gain access to anyone else's.

import type { Context } from "hono";
import { getCookie, setCookie } from "hono/cookie";

const COOKIE_NAME = "lc_uid";
const COOKIE_TTL_S = 60 * 60 * 24 * 365; // one year

export interface RequestIdentity {
  userId: string; // cookie-derived stable id, or `ip:{ip}` fallback
  ip: string;     // raw IP (still useful as a coarse secondary fence)
  isFresh: boolean; // true if we just minted the cookie this request
}

export function getOrSetUserId(c: Context): RequestIdentity {
  const ip =
    c.req.header("x-nf-client-connection-ip") ??
    c.req.header("x-forwarded-for")?.split(",")[0].trim() ??
    "unknown";

  const existing = getCookie(c, COOKIE_NAME);
  if (existing && /^[a-zA-Z0-9_-]{8,64}$/.test(existing)) {
    return { userId: existing, ip, isFresh: false };
  }

  const fresh = mintId();
  setCookie(c, COOKIE_NAME, fresh, {
    httpOnly: true,
    sameSite: "Lax",
    secure: !isLocalRequest(c),
    path: "/",
    maxAge: COOKIE_TTL_S,
  });
  return { userId: fresh, ip, isFresh: true };
}

function mintId(): string {
  // crypto.randomUUID is available in modern Node + the Netlify runtime.
  // Strip dashes to keep it cookie-friendly.
  return crypto.randomUUID().replace(/-/g, "");
}

function isLocalRequest(c: Context): boolean {
  const host = c.req.header("host") ?? "";
  return /^(localhost|127\.0\.0\.1|0\.0\.0\.0)/.test(host);
}
