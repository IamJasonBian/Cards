// Fetches a random nature wallpaper from the dharmx/walls repo on GitHub.
// Dependency-free: uses the global `fetch`. Tolerates network/API failures by
// falling back to a small set of confirmed direct URLs.

export const FALLBACK_WALLPAPERS = [
  "https://raw.githubusercontent.com/dharmx/walls/main/mountain/a_body_of_water_with_rocks_and_a_cliff.jpg",
  "https://raw.githubusercontent.com/dharmx/walls/main/mountain/a_castle_on_a_hill_with_fog_with_Eltz_Castle_in_the_background.jpg",
  "https://raw.githubusercontent.com/dharmx/walls/main/mountain/a_city_in_the_distance_with_clouds.jpg",
  "https://raw.githubusercontent.com/dharmx/walls/main/mountain/a_close_up_of_rocks.jpg",
  "https://raw.githubusercontent.com/dharmx/walls/main/mountain/a_iceberg_in_the_water_with_mountains_in_the_background.jpg",
];

const FOLDERS = ["nature", "aerial", "mountain"] as const;

const IMAGE_RE = /\.(jpe?g|png)$/i;

interface GitHubContentEntry {
  name: string;
  download_url: string | null;
  type: string;
}

function pickRandom<T>(items: T[]): T {
  return items[Math.floor(Math.random() * items.length)];
}

export async function fetchRandomWallpaper(): Promise<string> {
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

  if (pool.length === 0) {
    console.warn("[wallpaper] API failed, using fallback");
    return pickRandom(FALLBACK_WALLPAPERS);
  }

  // Shuffle before capping so the 50 candidates are drawn from across all folders,
  // not just the alphabetically-first images of the first folder.
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }

  const candidates = pool.slice(0, 50);
  const url = pickRandom(candidates);
  console.log("[wallpaper] selected", url);
  return url;
}
