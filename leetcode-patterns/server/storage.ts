import { readFileSync, writeFileSync, existsSync, mkdirSync } from "node:fs";
import { dirname } from "node:path";

// ---- Review state (Anki-style SM-2 subset) ----
export interface ReviewState {
  cardId: string;
  ease: number;       // ease factor, starts at 2.5
  interval: number;   // days until next due
  reps: number;       // consecutive correct reviews
  lapses: number;     // times answered "Again"
  due: number;        // epoch ms
  lastReviewed: number | null;
}

export type Grade = "again" | "hard" | "good" | "easy";

// ---- Storage interface ----
// Key shape is Redis-ready:
//   review:{userId}:{cardId}   → hash (we store JSON blob here for simplicity)
//   due:{userId}               → sorted set (score = due ms, member = cardId)
// A RedisStore implementation can be swapped in later without changing callers.
export interface Storage {
  getReview(userId: string, cardId: string): Promise<ReviewState | null>;
  saveReview(userId: string, state: ReviewState): Promise<void>;
  listDue(userId: string, now: number, limit?: number): Promise<string[]>;
  listAllReviews(userId: string): Promise<ReviewState[]>;
}

// ---- In-memory + JSON-backed store (single-user dev default) ----
export class InMemoryStore implements Storage {
  // reviews[userId][cardId] = ReviewState
  private reviews = new Map<string, Map<string, ReviewState>>();
  private path: string | null;

  constructor(persistencePath?: string) {
    this.path = persistencePath ?? null;
    if (this.path && existsSync(this.path)) {
      try {
        const raw = JSON.parse(readFileSync(this.path, "utf8")) as Record<
          string,
          Record<string, ReviewState>
        >;
        for (const [u, cards] of Object.entries(raw)) {
          this.reviews.set(u, new Map(Object.entries(cards)));
        }
      } catch {
        // ignore corrupt file; start fresh
      }
    }
  }

  private flush(): void {
    if (!this.path) return;
    const out: Record<string, Record<string, ReviewState>> = {};
    for (const [u, cards] of this.reviews) {
      out[u] = Object.fromEntries(cards);
    }
    mkdirSync(dirname(this.path), { recursive: true });
    writeFileSync(this.path, JSON.stringify(out, null, 2));
  }

  async getReview(userId: string, cardId: string): Promise<ReviewState | null> {
    return this.reviews.get(userId)?.get(cardId) ?? null;
  }

  async saveReview(userId: string, state: ReviewState): Promise<void> {
    let bucket = this.reviews.get(userId);
    if (!bucket) {
      bucket = new Map();
      this.reviews.set(userId, bucket);
    }
    bucket.set(state.cardId, state);
    this.flush();
  }

  async listDue(userId: string, now: number, limit = 50): Promise<string[]> {
    const bucket = this.reviews.get(userId);
    if (!bucket) return [];
    return Array.from(bucket.values())
      .filter((r) => r.due <= now)
      .sort((a, b) => a.due - b.due)
      .slice(0, limit)
      .map((r) => r.cardId);
  }

  async listAllReviews(userId: string): Promise<ReviewState[]> {
    const bucket = this.reviews.get(userId);
    return bucket ? Array.from(bucket.values()) : [];
  }
}

// ---- SM-2 scheduling ----
// Minimal Anki-style: Again resets, Hard keeps easy-ish interval, Good doubles,
// Easy gets a boost. Ease factor drifts per grade.
const DAY_MS = 24 * 60 * 60 * 1000;

export function schedule(prev: ReviewState | null, grade: Grade, cardId: string, now: number): ReviewState {
  const base: ReviewState = prev ?? {
    cardId,
    ease: 2.5,
    interval: 0,
    reps: 0,
    lapses: 0,
    due: now,
    lastReviewed: null,
  };

  let { ease, interval, reps, lapses } = base;

  if (grade === "again") {
    reps = 0;
    lapses += 1;
    ease = Math.max(1.3, ease - 0.2);
    // show again in ~10 minutes
    interval = 10 / (60 * 24);
  } else if (grade === "hard") {
    reps += 1;
    ease = Math.max(1.3, ease - 0.15);
    interval = reps === 1 ? 1 : Math.max(1, interval * 1.2);
  } else if (grade === "good") {
    reps += 1;
    if (reps === 1) interval = 1;
    else if (reps === 2) interval = 3;
    else interval = Math.round(interval * ease);
  } else {
    // easy
    reps += 1;
    ease = ease + 0.15;
    if (reps === 1) interval = 4;
    else interval = Math.round(interval * ease * 1.3);
  }

  return {
    cardId,
    ease,
    interval,
    reps,
    lapses,
    due: now + interval * DAY_MS,
    lastReviewed: now,
  };
}
