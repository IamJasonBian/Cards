// Tiny circuit breaker for the Judge0 dependency, persisted in the same
// Storage we use for rate limits. Lambda-friendly: state survives function
// scale-to-zero because it's in Blobs, not in-process. No opossum dependency.
//
// State machine:
//   closed     → call Judge0 normally; record failures
//   open       → fail fast for OPEN_MS, then half-open
//   half-open  → allow one probe; success → closed, failure → open again
//
// We re-use the rate-limit primitive (sliding window log) for the failure
// counter — three failures inside FAILURE_WINDOW_MS opens the circuit.

import type { Storage } from "./storage.ts";
import { log } from "./log.ts";

const clog = log("circuit");

const FAILURE_WINDOW_MS = 30_000;
const FAILURE_THRESHOLD = 3;
const OPEN_MS = 30_000;
const KEY = "judge0";

export class CircuitOpen extends Error {
  constructor(public readonly retryAfterMs: number) {
    super(`circuit open (retry in ${Math.ceil(retryAfterMs / 1000)}s)`);
  }
}

interface BreakerState {
  state: "closed" | "open" | "half-open";
  openedAt: number;
}

function readBreakerKey(): string {
  return `circuit:${KEY}`;
}

async function readState(store: Storage): Promise<BreakerState> {
  // Reuse incrementRateLimit's underlying log? Simplest: piggy-back on the
  // standard incrementRateLimit primitive only for the failure counter, and
  // store the breaker `{state, openedAt}` separately via the Submission code-blob
  // primitive (a generic key→string store that already exists on both backends).
  if (!store.getCodeBlob) return { state: "closed", openedAt: 0 };
  const raw = await store.getCodeBlob(readBreakerKey());
  if (!raw) return { state: "closed", openedAt: 0 };
  try {
    return JSON.parse(raw) as BreakerState;
  } catch {
    return { state: "closed", openedAt: 0 };
  }
}

async function writeState(store: Storage, state: BreakerState): Promise<void> {
  if (!store.saveCodeBlob) return;
  await store.saveCodeBlob(readBreakerKey(), JSON.stringify(state));
}

/** Check whether a Judge0 call is currently allowed. Throws CircuitOpen if not. */
export async function preflight(store: Storage, now: number): Promise<void> {
  const state = await readState(store);
  if (state.state === "open") {
    const elapsed = now - state.openedAt;
    if (elapsed < OPEN_MS) throw new CircuitOpen(OPEN_MS - elapsed);
    // Window elapsed → transition to half-open and let the caller probe.
    clog.info("half_open", { openForMs: elapsed });
    await writeState(store, { state: "half-open", openedAt: state.openedAt });
  }
}

/** Record a successful Judge0 call. Closes the circuit if it was half-open. */
export async function recordSuccess(store: Storage): Promise<void> {
  const state = await readState(store);
  if (state.state !== "closed") {
    clog.info("closed", { from: state.state });
    await writeState(store, { state: "closed", openedAt: 0 });
  }
}

/** Record a Judge0 failure. Opens the circuit on threshold breach. */
export async function recordFailure(store: Storage, now: number): Promise<void> {
  // Use the rate-limit log itself as the failure counter.
  const bucket = await store.incrementRateLimit(`circuit-fail:${KEY}`, FAILURE_WINDOW_MS, now);
  if (bucket.count >= FAILURE_THRESHOLD) {
    clog.error("opened", { failures: bucket.count, openMs: OPEN_MS });
    await writeState(store, { state: "open", openedAt: now });
  } else {
    clog.warn("failure_recorded", { failures: bucket.count, threshold: FAILURE_THRESHOLD });
  }
}
