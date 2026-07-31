// Tagged structured logging for the server and the Netlify Function.
//
// Every call site binds a TAG, so one subsystem can be pulled out of a noisy
// function log with a single filter: `[judge0]`, `[run]`, `[harness]`, …
// Production emits one JSON object per line (log drains parse it); dev emits a
// compact human line instead.
//
// Never pass user code or request bodies as fields — log sizes, hashes, counts.

export type LogTag =
  | "server"
  | "run"
  | "harness"
  | "judge0"
  | "circuit"
  | "problems"
  | "review";

export type LogLevel = "debug" | "info" | "warn" | "error";

export type LogFields = Record<string, unknown>;

const LEVEL_RANK: Record<LogLevel, number> = { debug: 10, info: 20, warn: 30, error: 40 };

function resolveMinLevel(): number {
  const configured = process.env.LOG_LEVEL as LogLevel | undefined;
  if (configured && configured in LEVEL_RANK) return LEVEL_RANK[configured];
  return process.env.NODE_ENV === "production" ? LEVEL_RANK.info : LEVEL_RANK.debug;
}

const MIN_LEVEL = resolveMinLevel();
const AS_JSON = process.env.LOG_FORMAT === "json" || Boolean(process.env.NETLIFY);

export interface Logger {
  debug(event: string, fields?: LogFields): void;
  info(event: string, fields?: LogFields): void;
  warn(event: string, fields?: LogFields): void;
  error(event: string, fields?: LogFields): void;
  /** Derive a logger with fields bound to every subsequent line (reqId, problemId, …). */
  child(fields: LogFields): Logger;
  /** Start a timer; call the returned function to emit `event` with `durationMs`. */
  startTimer(event: string): (fields?: LogFields) => void;
}

function formatHuman(level: LogLevel, tag: LogTag, event: string, fields: LogFields): string {
  const rest = Object.entries(fields)
    .map(([k, v]) => `${k}=${typeof v === "string" ? v : JSON.stringify(v)}`)
    .join(" ");
  return `[${tag}] ${level.toUpperCase()} ${event}${rest ? " " + rest : ""}`;
}

function emit(level: LogLevel, tag: LogTag, event: string, bound: LogFields, fields?: LogFields) {
  if (LEVEL_RANK[level] < MIN_LEVEL) return;
  const merged = { ...bound, ...fields };
  const sink = level === "error" ? console.error : level === "warn" ? console.warn : console.log;
  if (AS_JSON) {
    sink(JSON.stringify({ ts: new Date().toISOString(), level, tag, event, ...merged }));
  } else {
    sink(formatHuman(level, tag, event, merged));
  }
}

function make(tag: LogTag, bound: LogFields): Logger {
  return {
    debug: (event, fields) => emit("debug", tag, event, bound, fields),
    info: (event, fields) => emit("info", tag, event, bound, fields),
    warn: (event, fields) => emit("warn", tag, event, bound, fields),
    error: (event, fields) => emit("error", tag, event, bound, fields),
    child: (fields) => make(tag, { ...bound, ...fields }),
    startTimer: (event) => {
      const t0 = performance.now();
      return (fields?: LogFields) =>
        emit("info", tag, event, bound, {
          ...fields,
          durationMs: Math.round(performance.now() - t0),
        });
    },
  };
}

export function log(tag: LogTag, fields: LogFields = {}): Logger {
  return make(tag, fields);
}

/** Flatten an unknown thrown value into loggable fields. */
export function errFields(e: unknown): LogFields {
  if (e instanceof Error) return { err: e.message, errType: e.name };
  return { err: String(e), errType: typeof e };
}
