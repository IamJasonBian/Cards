// Fetches a random nature wallpaper from the dharmx/walls repo on GitHub.
// Dependency-free: uses the global `fetch`. Tolerates network/API failures by
// falling back to a small set of confirmed direct URLs.
//
// Load-time strategy (the wallpaper is on the page's critical visual path):
//  1. Repeat visit: the previous visit prefetched a wallpaper and stored its
//     URL in localStorage. An inline script in index.html preloads it before
//     this bundle is even parsed, and `getPreloadedWallpaper` returns it
//     synchronously — the background costs zero network round trips.
//  2. First visit: `primeWallpaper` (called from main.tsx, before React
//     mounts) starts the fetch immediately instead of waiting for App's
//     effect. The GitHub folder listings are cached in localStorage for a
//     week, so at most one visit per week pays the API round trip — this also
//     stops burning 3 of the 60/hr unauthenticated API calls on every visit.
//  3. After the background is up, `prefetchNextWallpaper` picks next visit's
//     image during idle time and warms the browser HTTP cache for it.

export const FALLBACK_WALLPAPERS = [
  "https://raw.githubusercontent.com/dharmx/walls/main/mountain/a_body_of_water_with_rocks_and_a_cliff.jpg",
  "https://raw.githubusercontent.com/dharmx/walls/main/mountain/a_castle_on_a_hill_with_fog_with_Eltz_Castle_in_the_background.jpg",
  "https://raw.githubusercontent.com/dharmx/walls/main/mountain/a_city_in_the_distance_with_clouds.jpg",
  "https://raw.githubusercontent.com/dharmx/walls/main/mountain/a_close_up_of_rocks.jpg",
  "https://raw.githubusercontent.com/dharmx/walls/main/mountain/a_iceberg_in_the_water_with_mountains_in_the_background.jpg",
];

const FOLDERS = ["nature", "aerial", "mountain"] as const;

const IMAGE_RE = /\.(jpe?g|png)$/i;

// Keep in sync with the inline preload script in index.html.
const NEXT_KEY = "wallpaper:next:v1";
const POOL_KEY = "wallpaper:pool:v1";
const POOL_TTL_MS = 7 * 24 * 60 * 60 * 1000;

interface GitHubContentEntry {
  name: string;
  download_url: string | null;
  type: string;
}

function pickRandom<T>(items: T[]): T {
  return items[Math.floor(Math.random() * items.length)];
}

// Routes a raw image URL through the free wsrv.nl image proxy, which serves a
// viewport-bucketed, webp-encoded copy. On phones this shrinks a multi-MB JPG
// to a small webp. Returns the raw URL unchanged when there is no `window`
// (SSR / non-browser env) so callers can't crash.
export function proxied(rawUrl: string): string {
  if (typeof window === "undefined") return rawUrl;

  const effectiveWidth = window.innerWidth * (window.devicePixelRatio || 1);
  const width = effectiveWidth <= 640 ? 720 : effectiveWidth <= 1024 ? 1280 : 1920;

  return `https://wsrv.nl/?url=${encodeURIComponent(rawUrl)}&w=${width}&output=webp&q=70&we`;
}

function readStorage(key: string): string | null {
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null; // storage disabled (private mode / permissions)
  }
}

function writeStorage(key: string, value: string): void {
  try {
    window.localStorage.setItem(key, value);
  } catch {
    // best-effort cache; losing it just means a fetch next visit
  }
}

// The wallpaper URL prefetched by the previous visit (already warmed in the
// HTTP cache, and preloaded by index.html on this visit). Null on first visit.
export function getPreloadedWallpaper(): string | null {
  return readStorage(NEXT_KEY);
}

function loadCachedPool(): string[] | null {
  const raw = readStorage(POOL_KEY);
  if (!raw) return null;
  try {
    const { ts, urls } = JSON.parse(raw) as { ts: number; urls: string[] };
    if (!Array.isArray(urls) || urls.length === 0) return null;
    if (Date.now() - ts > POOL_TTL_MS) return null;
    return urls;
  } catch {
    return null;
  }
}

async function fetchPool(): Promise<string[] | null> {
  const results = await Promise.allSettled(
    FOLDERS.map(async (folder) => {
      const res = await fetch(
        `https://api.github.com/repos/dharmx/walls/contents/${folder}`
      );
      if (!res.ok) {
        throw new Error(`GitHub API ${res.status} for ${folder}`);
      }
      return (await res.json()) as GitHubContentEntry[];
    })
  );

  const pool: string[] = [];
  for (const result of results) {
    if (result.status !== "fulfilled" || !Array.isArray(result.value)) continue;
    for (const entry of result.value) {
      if (entry.download_url && IMAGE_RE.test(entry.name)) {
        pool.push(entry.download_url);
      }
    }
  }

  if (pool.length === 0) return null;

  // Shuffle before capping so the candidates are drawn from across all
  // folders, not just the alphabetically-first images of the first folder.
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  const capped = pool.slice(0, 50);
  writeStorage(POOL_KEY, JSON.stringify({ ts: Date.now(), urls: capped }));
  return capped;
}

async function getPool(): Promise<string[]> {
  const cached = loadCachedPool();
  if (cached) return cached;
  const fetched = await fetchPool();
  if (fetched) return fetched;
  console.warn("[wallpaper] API failed, using fallback");
  return FALLBACK_WALLPAPERS;
}

let pending: Promise<string> | null = null;

export function fetchRandomWallpaper(): Promise<string> {
  pending ??= getPool().then((pool) => proxied(pickRandom(pool)));
  return pending;
}

// Called from main.tsx before React mounts: on first visits (no prefetched
// wallpaper) this starts the fetch chain ~a render cycle earlier than App's
// effect would.
export function primeWallpaper(): void {
  if (!getPreloadedWallpaper()) void fetchRandomWallpaper().catch(() => {});
}

let prefetched = false;

// Picks next visit's wallpaper, warms the HTTP cache for it, and records it
// for the index.html preloader. Runs once per page load, during idle time.
export function prefetchNextWallpaper(): void {
  if (prefetched) return;
  prefetched = true;

  const schedule =
    typeof requestIdleCallback === "function"
      ? requestIdleCallback
      : (cb: () => void) => setTimeout(cb, 2000);

  schedule(() => {
    getPool()
      .then((pool) => {
        const url = proxied(pickRandom(pool));
        const img = new Image();
        img.onload = () => writeStorage(NEXT_KEY, url);
        img.src = url;
      })
      .catch(() => {});
  });
}
