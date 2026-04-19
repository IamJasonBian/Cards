import { getStore, type Store } from "@netlify/blobs";
import type { ReviewState, Storage } from "./storage.ts";

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
}
