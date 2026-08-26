import { getStore, type Store } from "@netlify/blobs";
import type {
  RateLimitBucket,
  RateLimitLog,
  ReviewState,
  Storage,
  Submission,
  TheoryBookmark,
} from "./storage.ts";

// Key layout inside the single "leetcards-reviews" blob store:
//   review/{userId}/{cardId}  → JSON ReviewState
// Netlify Blobs supports .list({prefix}) for range scans, which covers both
// listAllReviews (prefix review/{userId}/) and listDue (scan + filter).
export class NetlifyBlobsStore implements Storage {
  private readonly name: string;
  private _store: Store | null = null;

  constructor(name = "leetcards-reviews") {
    this.name = name;
  }

  private get store(): Store {
    if (!this._store) this._store = getStore(this.name);
    return this._store;
  }

  private key(userId: string, cardId: string): string {
    return `review/${userId}/${cardId}`;
  }

  async getReview(userId: string, cardId: string): Promise<ReviewState | null> {
    const value = await this.store.get(this.key(userId, cardId), { type: "json" });
    return (value as ReviewState | null) ?? null;
  }

  async saveReview(userId: string, state: ReviewState): Promise<void> {
    await this.store.setJSON(this.key(userId, state.cardId), state);
  }

  async listAllReviews(userId: string): Promise<ReviewState[]> {
    const prefix = `review/${userId}/`;
    const { blobs } = await this.store.list({ prefix });
    if (!blobs.length) return [];
    const states = await Promise.all(
      blobs.map((b) => this.store.get(b.key, { type: "json" }))
    );
    return states.filter((s): s is ReviewState => s !== null);
  }

  async listDue(userId: string, now: number, limit = 50): Promise<string[]> {
    const all = await this.listAllReviews(userId);
    return all
      .filter((r) => r.due <= now)
      .sort((a, b) => a.due - b.due)
      .slice(0, limit)
      .map((r) => r.cardId);
  }

  async incrementRateLimit(key: string, windowMs: number, now: number): Promise<RateLimitBucket> {
    const blobKey = `ratelimit/${key}`;
    const cutoff = now - windowMs;

    // Sliding window log with optimistic CAS. The Netlify Blobs SDK exposes
    // {etag} on getWithMetadata and accepts {onlyIfMatch: etag} on set/setJSON.
    // On 412 conflict we re-read and retry — at most a few times to avoid
    // pathological live-locks. After that, fall back to non-atomic write so
    // a one-in-a-million race doesn't 500 the user.
    const MAX_RETRIES = 3;
    for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const meta = await (this.store as any).getWithMetadata(blobKey, { type: "json" }).catch(() => null);
      const existing = (meta?.data as RateLimitLog | null) ?? null;
      const events = existing ? existing.events.filter((t) => t > cutoff) : [];
      events.push(now);
      const next: RateLimitLog = { events };
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await (this.store as any).setJSON(blobKey, next, meta?.etag ? { onlyIfMatch: meta.etag } : {});
        return { count: events.length, windowStart: events[0] ?? now };
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        // 412 Precondition Failed → another worker won the race. Re-read.
        if (/412|precondition/i.test(msg) && attempt < MAX_RETRIES - 1) continue;
        // Last resort: blind write so we never 500 just because of CAS contention.
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await (this.store as any).setJSON(blobKey, next).catch(() => {});
        return { count: events.length, windowStart: events[0] ?? now };
      }
    }
    // Should be unreachable.
    return { count: 1, windowStart: now };
  }

  // Submissions live at submission/{userId}/{ts}-{problemId}, listed by prefix.
  async saveSubmission(userId: string, submission: Submission): Promise<void> {
    const key = `submission/${userId}/${submission.ts}-${submission.problemId}`;
    await this.store.setJSON(key, submission);
  }

  async listSubmissions(
    userId: string,
    problemId: string | undefined,
    limit = 50
  ): Promise<Submission[]> {
    const { blobs } = await this.store.list({ prefix: `submission/${userId}/` });
    if (!blobs.length) return [];
    const items = await Promise.all(
      blobs.map((b) => this.store.get(b.key, { type: "json" }))
    );
    const filtered = items
      .filter((s): s is Submission => s !== null)
      .filter((s) => !problemId || s.problemId === problemId)
      .sort((a, b) => b.ts - a.ts)
      .slice(0, limit);
    return filtered;
  }

  async saveCodeBlob(hash: string, code: string): Promise<void> {
    await this.store.set(`code/${hash}`, code);
  }

  async getCodeBlob(hash: string): Promise<string | null> {
    return (await this.store.get(`code/${hash}`)) ?? null;
  }

  // Theory bookmarks live at bookmark/{userId}/{docId}/{id}, listed by prefix.
  async listBookmarks(userId: string, docId: string): Promise<TheoryBookmark[]> {
    const { blobs } = await this.store.list({ prefix: `bookmark/${userId}/${docId}/` });
    if (!blobs.length) return [];
    const items = await Promise.all(
      blobs.map((b) => this.store.get(b.key, { type: "json" }))
    );
    return items
      .filter((b): b is TheoryBookmark => b !== null)
      .sort((a, b) => a.page - b.page || a.createdAt - b.createdAt);
  }

  async saveBookmark(userId: string, bookmark: TheoryBookmark): Promise<void> {
    await this.store.setJSON(
      `bookmark/${userId}/${bookmark.docId}/${bookmark.id}`,
      bookmark
    );
  }

  async deleteBookmark(userId: string, docId: string, bookmarkId: string): Promise<void> {
    await this.store.delete(`bookmark/${userId}/${docId}/${bookmarkId}`);
  }
}
