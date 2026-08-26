import Database from "better-sqlite3";
import { mkdirSync } from "node:fs";
import { dirname } from "node:path";
import type {
  RateLimitBucket,
  RateLimitLog,
  ReviewState,
  Storage,
  Submission,
  TheoryBookmark,
} from "./storage.ts";

// SQLite-backed Storage for Render (or any host with a writable disk).
//
// Key layout mirrors the Netlify Blobs store so behaviour stays identical:
//   reviews        (user_id, card_id)        → JSON ReviewState, plus `due` column for range scans
//   submissions    (user_id, ts, problem_id) → JSON Submission
//   code_blobs     (hash)                     → raw code TEXT
//   rate_limits    (key)                      → JSON RateLimitLog ({events: number[]})
//
// All operations are synchronous (better-sqlite3) but wrapped in async methods
// to satisfy the Storage interface, which the callers await.
export class SqliteStore implements Storage {
  private readonly db: Database.Database;

  constructor(path: string) {
    // Ensure the parent directory exists for paths like "./server/.data/app.db".
    try {
      mkdirSync(dirname(path), { recursive: true });
    } catch {
      // ignore; e.g. path has no directory component
    }
    this.db = new Database(path);
    this.db.pragma("journal_mode = WAL");
    this.db.pragma("foreign_keys = ON");

    this.db.exec(`
      CREATE TABLE IF NOT EXISTS reviews (
        user_id TEXT NOT NULL,
        card_id TEXT NOT NULL,
        due     INTEGER NOT NULL,
        state   TEXT NOT NULL,
        PRIMARY KEY (user_id, card_id)
      );
      CREATE INDEX IF NOT EXISTS idx_reviews_due ON reviews (user_id, due);

      CREATE TABLE IF NOT EXISTS submissions (
        user_id    TEXT NOT NULL,
        ts         INTEGER NOT NULL,
        problem_id TEXT NOT NULL,
        data       TEXT NOT NULL
      );
      CREATE INDEX IF NOT EXISTS idx_submissions_user_ts ON submissions (user_id, ts);
      CREATE INDEX IF NOT EXISTS idx_submissions_user_problem ON submissions (user_id, problem_id);

      CREATE TABLE IF NOT EXISTS code_blobs (
        hash TEXT PRIMARY KEY,
        code TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS rate_limits (
        key TEXT PRIMARY KEY,
        log TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS theory_bookmarks (
        user_id     TEXT NOT NULL,
        doc_id      TEXT NOT NULL,
        bookmark_id TEXT NOT NULL,
        data        TEXT NOT NULL,
        PRIMARY KEY (user_id, doc_id, bookmark_id)
      );
    `);
  }

  async getReview(userId: string, cardId: string): Promise<ReviewState | null> {
    const row = this.db
      .prepare("SELECT state FROM reviews WHERE user_id = ? AND card_id = ?")
      .get(userId, cardId) as { state: string } | undefined;
    return row ? (JSON.parse(row.state) as ReviewState) : null;
  }

  async saveReview(userId: string, state: ReviewState): Promise<void> {
    this.db
      .prepare(
        `INSERT INTO reviews (user_id, card_id, due, state)
         VALUES (?, ?, ?, ?)
         ON CONFLICT (user_id, card_id)
         DO UPDATE SET due = excluded.due, state = excluded.state`
      )
      .run(userId, state.cardId, state.due, JSON.stringify(state));
  }

  async listDue(userId: string, now: number, limit = 50): Promise<string[]> {
    const rows = this.db
      .prepare(
        "SELECT card_id FROM reviews WHERE user_id = ? AND due <= ? ORDER BY due ASC LIMIT ?"
      )
      .all(userId, now, limit) as { card_id: string }[];
    return rows.map((r) => r.card_id);
  }

  async listAllReviews(userId: string): Promise<ReviewState[]> {
    const rows = this.db
      .prepare("SELECT state FROM reviews WHERE user_id = ?")
      .all(userId) as { state: string }[];
    return rows.map((r) => JSON.parse(r.state) as ReviewState);
  }

  async incrementRateLimit(
    key: string,
    windowMs: number,
    now: number
  ): Promise<RateLimitBucket> {
    const cutoff = now - windowMs;
    // Single transaction so concurrent callers can't interleave read/write.
    // better-sqlite3 is synchronous, so the transaction runs to completion
    // before the next call can start — giving us atomic sliding-window updates.
    const tx = this.db.transaction((): RateLimitBucket => {
      const row = this.db
        .prepare("SELECT log FROM rate_limits WHERE key = ?")
        .get(key) as { log: string } | undefined;
      const existing = row ? (JSON.parse(row.log) as RateLimitLog) : null;
      const events = (existing ? existing.events : []).filter((t) => t > cutoff);
      events.push(now);
      const next: RateLimitLog = { events };
      this.db
        .prepare(
          `INSERT INTO rate_limits (key, log) VALUES (?, ?)
           ON CONFLICT (key) DO UPDATE SET log = excluded.log`
        )
        .run(key, JSON.stringify(next));
      return { count: events.length, windowStart: events[0] ?? now };
    });
    return tx();
  }

  async saveSubmission(userId: string, submission: Submission): Promise<void> {
    this.db
      .prepare(
        "INSERT INTO submissions (user_id, ts, problem_id, data) VALUES (?, ?, ?, ?)"
      )
      .run(userId, submission.ts, submission.problemId, JSON.stringify(submission));
  }

  async listSubmissions(
    userId: string,
    problemId: string | undefined,
    limit = 50
  ): Promise<Submission[]> {
    const rows = (
      problemId
        ? this.db
            .prepare(
              "SELECT data FROM submissions WHERE user_id = ? AND problem_id = ? ORDER BY ts DESC LIMIT ?"
            )
            .all(userId, problemId, limit)
        : this.db
            .prepare(
              "SELECT data FROM submissions WHERE user_id = ? ORDER BY ts DESC LIMIT ?"
            )
            .all(userId, limit)
    ) as { data: string }[];
    return rows.map((r) => JSON.parse(r.data) as Submission);
  }

  async saveCodeBlob(hash: string, code: string): Promise<void> {
    this.db
      .prepare(
        `INSERT INTO code_blobs (hash, code) VALUES (?, ?)
         ON CONFLICT (hash) DO UPDATE SET code = excluded.code`
      )
      .run(hash, code);
  }

  async getCodeBlob(hash: string): Promise<string | null> {
    const row = this.db
      .prepare("SELECT code FROM code_blobs WHERE hash = ?")
      .get(hash) as { code: string } | undefined;
    return row ? row.code : null;
  }

  async listBookmarks(userId: string, docId: string): Promise<TheoryBookmark[]> {
    const rows = this.db
      .prepare("SELECT data FROM theory_bookmarks WHERE user_id = ? AND doc_id = ?")
      .all(userId, docId) as { data: string }[];
    return rows
      .map((r) => JSON.parse(r.data) as TheoryBookmark)
      .sort((a, b) => a.page - b.page || a.createdAt - b.createdAt);
  }

  async saveBookmark(userId: string, bookmark: TheoryBookmark): Promise<void> {
    this.db
      .prepare(
        `INSERT INTO theory_bookmarks (user_id, doc_id, bookmark_id, data)
         VALUES (?, ?, ?, ?)
         ON CONFLICT (user_id, doc_id, bookmark_id) DO UPDATE SET data = excluded.data`
      )
      .run(userId, bookmark.docId, bookmark.id, JSON.stringify(bookmark));
  }

  async deleteBookmark(userId: string, docId: string, bookmarkId: string): Promise<void> {
    this.db
      .prepare(
        "DELETE FROM theory_bookmarks WHERE user_id = ? AND doc_id = ? AND bookmark_id = ?"
      )
      .run(userId, docId, bookmarkId);
  }
}
