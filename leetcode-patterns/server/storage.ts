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
export interface RateLimitBucket {
  count: number;
  // Earliest event still inside the window (epoch ms). Useful for telling
  // callers when their next slot opens. For backward-compat we keep the field
  // name `windowStart`, but with sliding semantics it's now "oldest timestamp".
  windowStart: number;
}

// Internal sliding-window log. Events store epoch ms timestamps within the
// most recent windowMs. Length == count.
export interface RateLimitLog {
  events: number[];
}

export interface Submission {
  problemId: string;
  passed: number;
  total: number;
  durationMs: number;
  codeHash: string | null;
  ts: number; // epoch ms
}

export interface Storage {
  getReview(userId: string, cardId: string): Promise<ReviewState | null>;
  saveReview(userId: string, state: ReviewState): Promise<void>;
  listDue(userId: string, now: number, limit?: number): Promise<string[]>;
  listAllReviews(userId: string): Promise<ReviewState[]>;
  // Returns updated count after increment; callers compare against their limit.
  incrementRateLimit(key: string, windowMs: number, now: number): Promise<RateLimitBucket>;
  // Optional submission persistence (Pyodide does the actual scoring).
  saveSubmission?(userId: string, submission: Submission): Promise<void>;
  listSubmissions?(userId: string, problemId: string | undefined, limit?: number): Promise<Submission[]>;
  saveCodeBlob?(hash: string, code: string): Promise<void>;
  getCodeBlob?(hash: string): Promise<string | null>;
}

// ---- In-memory + JSON-backed store (single-user dev default) ----
interface PersistedShape {
  reviews?: Record<string, Record<string, ReviewState>>;
  submissions?: Record<string, Submission[]>;
}

export class InMemoryStore implements Storage {
  // reviews[userId][cardId] = ReviewState
  private reviews = new Map<string, Map<string, ReviewState>>();
  private submissions = new Map<string, Submission[]>();
  private codeBlobs = new Map<string, string>();
  private rateLimits = new Map<string, RateLimitLog>();
  private path: string | null;

  constructor(persistencePath?: string) {
    this.path = persistencePath ?? null;
    if (this.path && existsSync(this.path)) {
      try {
        const raw = JSON.parse(readFileSync(this.path, "utf8")) as
          | PersistedShape
          | Record<string, Record<string, ReviewState>>;
        // Backward compat: old format was bare `{user: {cardId: ReviewState}}`.
        const reviewsRoot =
          raw && typeof raw === "object" && "reviews" in raw && raw.reviews
            ? (raw as PersistedShape).reviews!
            : (raw as Record<string, Record<string, ReviewState>>);
        for (const [u, cards] of Object.entries(reviewsRoot)) {
          this.reviews.set(u, new Map(Object.entries(cards)));
        }
        const submissionsRoot =
          raw && typeof raw === "object" && "submissions" in raw && raw.submissions
            ? (raw as PersistedShape).submissions!
            : {};
        for (const [u, list] of Object.entries(submissionsRoot)) {
          this.submissions.set(u, list);
        }
      } catch {
        // ignore corrupt file; start fresh
      }
    }
  }

  private flush(): void {
    if (!this.path) return;
    const reviewsOut: Record<string, Record<string, ReviewState>> = {};
    for (const [u, cards] of this.reviews) {
      reviewsOut[u] = Object.fromEntries(cards);
    }
    const submissionsOut: Record<string, Submission[]> = {};
    for (const [u, list] of this.submissions) {
      submissionsOut[u] = list;
    }
    mkdirSync(dirname(this.path), { recursive: true });
    writeFileSync(
      this.path,
      JSON.stringify({ reviews: reviewsOut, submissions: submissionsOut }, null, 2)
    );
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

  async incrementRateLimit(key: string, windowMs: number, now: number): Promise<RateLimitBucket> {
    const log = this.rateLimits.get(key) ?? { events: [] };
    const cutoff = now - windowMs;
    // Trim events that have aged out and append this one. Sliding semantics:
    // "60 in the trailing hour" really means the *trailing* hour, not the
    // current calendar hour, so a user can't double-spend at the boundary.
    const trimmed = log.events.filter((t) => t > cutoff);
    trimmed.push(now);
    this.rateLimits.set(key, { events: trimmed });
    return { count: trimmed.length, windowStart: trimmed[0] ?? now };
  }

  async saveSubmission(userId: string, submission: Submission): Promise<void> {
    const list = this.submissions.get(userId) ?? [];
    list.push(submission);
    // Cap per-user history at 500 to keep the JSON file small.
    if (list.length > 500) list.splice(0, list.length - 500);
    this.submissions.set(userId, list);
    this.flush();
  }

  async listSubmissions(
    userId: string,
    problemId: string | undefined,
    limit = 50
  ): Promise<Submission[]> {
    const list = this.submissions.get(userId) ?? [];
    const filtered = problemId ? list.filter((s) => s.problemId === problemId) : list;
    return filtered.slice(-limit).reverse();
  }

  async saveCodeBlob(hash: string, code: string): Promise<void> {
    this.codeBlobs.set(hash, code);
  }

  async getCodeBlob(hash: string): Promise<string | null> {
    return this.codeBlobs.get(hash) ?? null;
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
