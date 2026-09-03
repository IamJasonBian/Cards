#!/usr/bin/env python3
"""Hand-authored generator for the logger / log-stream problem set.

The normal pipeline (fetch-problems -> normalize-references -> gen-hidden-tests)
asks an LLM for hidden test *inputs*. That works for pure-function problems, but
the logger family (Logger Rate Limiter, Design Hit Counter, Design Log Storage
System, Number of Recent Calls) are LeetCode *design* problems: on LeetCode you
implement a stateful class driven by a call sequence, which the judge here does
not model (it calls `Solution().method(**input)` once per case).

So each problem is adapted to a single batch call that replays the whole call
stream, and the hidden cases are generated here deterministically (seeded RNG +
hand-picked boundary cases) and validated against the reference solution in the
same process. Same output files as gen-hidden-tests.ts:

    scripts/normalized/{slug}.json      (reference solution + metadata)
    server/problems/{slug}.json         (hidden cases; server-only)
    public/problems/{slug}.public.json  (browser stub; hidden cases stripped)
    public/problems/index.json          (manifest entry merged in)

Run from the leetcode-patterns directory:  python3 scripts/gen-logger-cases.py
"""

from __future__ import annotations

import json
import os
import random
from typing import Any, Callable

NORM_DIR = "scripts/normalized"
SERVER_DIR = "server/problems"
PUBLIC_DIR = "public/problems"

# --------------------------------------------------------------------------
# Reference solutions. These are exec'd to produce ground-truth outputs, and
# they are also what ships in scripts/normalized/{slug}.json.
# --------------------------------------------------------------------------

LOGGER_RATE_LIMITER_REF = '''class Solution:
    def shouldPrintMessages(self, timestamps: list[int], messages: list[str]) -> list[bool]:
        last_printed: dict[str, int] = {}
        out: list[bool] = []
        for t, msg in zip(timestamps, messages):
            prev = last_printed.get(msg)
            if prev is None or t - prev >= 10:
                last_printed[msg] = t
                out.append(True)
            else:
                out.append(False)
        return out
'''

HIT_COUNTER_REF = '''class Solution:
    def countHits(self, ops: list[str], timestamps: list[int]) -> list[int]:
        from collections import deque

        window: deque[int] = deque()
        out: list[int] = []
        for op, t in zip(ops, timestamps):
            while window and window[0] <= t - 300:
                window.popleft()
            if op == "hit":
                window.append(t)
            else:
                out.append(len(window))
        return out
'''

LOG_STORAGE_REF = '''class Solution:
    def retrieveLogs(
        self, ids: list[int], timestamps: list[str], queries: list[list[str]]
    ) -> list[list[int]]:
        width = {"Year": 4, "Month": 7, "Day": 10, "Hour": 13, "Minute": 16, "Second": 19}
        out: list[list[int]] = []
        for start, end, granularity in queries:
            k = width[granularity]
            lo, hi = start[:k], end[:k]
            matched = [i for i, ts in zip(ids, timestamps) if lo <= ts[:k] <= hi]
            out.append(sorted(matched))
        return out
'''

RECENT_CALLS_REF = '''class Solution:
    def countRecentCalls(self, pings: list[int]) -> list[int]:
        from collections import deque

        window: deque[int] = deque()
        out: list[int] = []
        for t in pings:
            window.append(t)
            while window[0] < t - 3000:
                window.popleft()
            out.append(len(window))
        return out
'''


def load_reference(code: str, method: str) -> Callable[..., Any]:
    namespace: dict[str, Any] = {}
    exec(compile(code, "<reference>", "exec"), namespace)
    return getattr(namespace["Solution"](), method)


# --------------------------------------------------------------------------
# Hidden-case input generators. Each returns a list of (name, input dict).
# Hand-written boundary cases first, then seeded random streams.
# --------------------------------------------------------------------------

WORDS = ["foo", "bar", "baz", "qux", "log", "error", "warn", "info", "debug", "trace"]


def cases_logger_rate_limiter() -> list[tuple[str, dict[str, Any]]]:
    rng = random.Random(359)
    cases: list[tuple[str, dict[str, Any]]] = [
        ("empty stream", {"timestamps": [], "messages": []}),
        ("single message", {"timestamps": [1], "messages": ["foo"]}),
        (
            "gap of exactly 10 prints",
            {"timestamps": [1, 11], "messages": ["foo", "foo"]},
        ),
        (
            "gap of 9 is blocked",
            {"timestamps": [1, 10], "messages": ["foo", "foo"]},
        ),
        (
            "same timestamp repeats",
            {"timestamps": [5, 5, 5], "messages": ["foo", "foo", "foo"]},
        ),
        (
            "distinct messages never block each other",
            {"timestamps": [1, 1, 1, 1], "messages": ["a", "b", "c", "d"]},
        ),
        (
            "blocked message does not refresh the window",
            {
                "timestamps": [1, 5, 9, 11],
                "messages": ["foo", "foo", "foo", "foo"],
            },
        ),
        (
            "interleaved messages with independent windows",
            {
                "timestamps": [1, 2, 8, 11, 12, 21],
                "messages": ["foo", "bar", "foo", "foo", "bar", "bar"],
            },
        ),
        (
            "timestamp zero",
            {"timestamps": [0, 9, 10], "messages": ["foo", "foo", "foo"]},
        ),
        (
            "large timestamps near 10^9",
            {
                "timestamps": [999999990, 999999999, 1000000000],
                "messages": ["boom", "boom", "boom"],
            },
        ),
        (
            "empty-string message is a normal key",
            {"timestamps": [1, 2, 20], "messages": ["", "", ""]},
        ),
        (
            "case-sensitive messages are distinct keys",
            {"timestamps": [1, 2, 3], "messages": ["Foo", "foo", "FOO"]},
        ),
        (
            "long stream of one message every 10 ticks",
            {
                "timestamps": [10 * i for i in range(40)],
                "messages": ["heartbeat"] * 40,
            },
        ),
        (
            "long stream of one message every 9 ticks",
            {"timestamps": [9 * i for i in range(40)], "messages": ["tick"] * 40},
        ),
    ]

    # Seeded random streams: non-decreasing timestamps, small alphabet so the
    # 10-second windows actually collide.
    for idx, (n, step, alphabet) in enumerate(
        [
            (30, 3, 2),
            (60, 1, 3),
            (80, 7, 5),
            (120, 2, 4),
            (200, 4, 10),
            (300, 1, 2),
            (400, 5, 6),
            (500, 11, 10),
            (150, 20, 3),
            (250, 0, 4),
            (100, 13, 1),
        ]
    ):
        t = rng.randint(0, 50)
        timestamps: list[int] = []
        messages: list[str] = []
        for _ in range(n):
            timestamps.append(t)
            t += rng.randint(0, step) if step else 0
            messages.append(WORDS[rng.randrange(alphabet)])
        cases.append(
            (
                f"random stream {idx + 1} (n={n}, step<={step}, {alphabet} distinct messages)",
                {"timestamps": timestamps, "messages": messages},
            )
        )
    return cases


def cases_hit_counter() -> list[tuple[str, dict[str, Any]]]:
    rng = random.Random(362)
    cases: list[tuple[str, dict[str, Any]]] = [
        ("no operations", {"ops": [], "timestamps": []}),
        ("single query with no hits", {"ops": ["getHits"], "timestamps": [1]}),
        ("hit then query same second", {"ops": ["hit", "getHits"], "timestamps": [1, 1]}),
        (
            "hit expires exactly at t+300",
            {"ops": ["hit", "getHits", "getHits"], "timestamps": [1, 300, 301]},
        ),
        (
            "several hits in the same second",
            {"ops": ["hit", "hit", "hit", "getHits"], "timestamps": [3, 3, 3, 4]},
        ),
        (
            "leetcode sample sequence",
            {
                "ops": ["hit", "hit", "hit", "getHits", "hit", "getHits", "getHits"],
                "timestamps": [1, 2, 3, 4, 300, 300, 301],
            },
        ),
        (
            "long idle gap empties the window",
            {"ops": ["hit", "hit", "getHits"], "timestamps": [1, 2, 100000]},
        ),
        (
            "repeated queries without new hits",
            {
                "ops": ["hit", "getHits", "getHits", "getHits"],
                "timestamps": [10, 11, 200, 310],
            },
        ),
        (
            "hits at every second of a full window",
            {
                "ops": ["hit"] * 300 + ["getHits"],
                "timestamps": list(range(1, 301)) + [300],
            },
        ),
        (
            "window slides one second past a full burst",
            {
                "ops": ["hit"] * 300 + ["getHits"],
                "timestamps": list(range(1, 301)) + [301],
            },
        ),
        (
            "large timestamps near 10^9",
            {
                "ops": ["hit", "hit", "getHits", "getHits"],
                "timestamps": [999999000, 999999100, 999999200, 1000000000],
            },
        ),
        (
            "query before any hit then after",
            {"ops": ["getHits", "hit", "getHits"], "timestamps": [1, 2, 3]},
        ),
    ]

    for idx, (n, step, hit_bias) in enumerate(
        [
            (40, 5, 0.5),
            (80, 1, 0.8),
            (120, 20, 0.6),
            (200, 3, 0.7),
            (300, 2, 0.9),
            (400, 10, 0.5),
            (500, 1, 0.95),
            (250, 50, 0.6),
            (150, 0, 0.5),
            (350, 7, 0.75),
            (450, 4, 0.65),
            (100, 300, 0.7),
            (500, 6, 0.4),
        ]
    ):
        t = rng.randint(1, 100)
        ops: list[str] = []
        timestamps: list[int] = []
        for _ in range(n):
            ops.append("hit" if rng.random() < hit_bias else "getHits")
            timestamps.append(t)
            t += rng.randint(0, step) if step else 0
        if "getHits" not in ops:  # make sure the case actually returns something
            ops[-1] = "getHits"
        cases.append(
            (
                f"random ops {idx + 1} (n={n}, step<={step})",
                {"ops": ops, "timestamps": timestamps},
            )
        )
    return cases


GRANULARITIES = ["Year", "Month", "Day", "Hour", "Minute", "Second"]


def fmt_ts(y: int, mo: int, d: int, h: int, mi: int, s: int) -> str:
    return f"{y:04d}:{mo:02d}:{d:02d}:{h:02d}:{mi:02d}:{s:02d}"


def cases_log_storage() -> list[tuple[str, dict[str, Any]]]:
    rng = random.Random(635)
    sample_ids = [1, 2, 3]
    sample_ts = [
        "2017:01:01:23:59:59",
        "2017:01:01:22:59:59",
        "2016:01:01:00:00:00",
    ]
    cases: list[tuple[str, dict[str, Any]]] = [
        (
            "no logs stored",
            {
                "ids": [],
                "timestamps": [],
                "queries": [["2016:01:01:01:01:01", "2017:01:01:23:00:00", "Year"]],
            },
        ),
        (
            "no queries",
            {"ids": sample_ids, "timestamps": sample_ts, "queries": []},
        ),
        (
            "leetcode sample: Year then Hour",
            {
                "ids": sample_ids,
                "timestamps": sample_ts,
                "queries": [
                    ["2016:01:01:01:01:01", "2017:01:01:23:00:00", "Year"],
                    ["2016:01:01:01:01:01", "2017:01:01:23:00:00", "Hour"],
                ],
            },
        ),
        (
            "every granularity over the same range",
            {
                "ids": sample_ids,
                "timestamps": sample_ts,
                "queries": [
                    ["2016:01:01:01:01:01", "2017:01:01:23:00:00", g]
                    for g in GRANULARITIES
                ],
            },
        ),
        (
            "range that matches nothing",
            {
                "ids": sample_ids,
                "timestamps": sample_ts,
                "queries": [["2018:01:01:00:00:00", "2019:01:01:00:00:00", "Second"]],
            },
        ),
        (
            "start equals end at Second granularity",
            {
                "ids": sample_ids,
                "timestamps": sample_ts,
                "queries": [["2017:01:01:23:59:59", "2017:01:01:23:59:59", "Second"]],
            },
        ),
        (
            "start after end returns nothing",
            {
                "ids": sample_ids,
                "timestamps": sample_ts,
                "queries": [["2017:01:01:00:00:00", "2016:01:01:00:00:00", "Day"]],
            },
        ),
        (
            "ids returned ascending regardless of insertion order",
            {
                "ids": [9, 4, 7, 1],
                "timestamps": [
                    "2017:03:04:05:06:07",
                    "2017:03:04:05:06:08",
                    "2017:03:04:05:06:09",
                    "2017:03:04:05:06:10",
                ],
                "queries": [["2017:03:04:05:06:07", "2017:03:04:05:06:10", "Second"]],
            },
        ),
        (
            "coarse granularity ignores finer fields",
            {
                "ids": [1, 2],
                "timestamps": ["2017:12:31:23:59:59", "2017:01:01:00:00:00"],
                "queries": [
                    ["2017:06:06:06:06:06", "2017:06:06:06:06:06", "Year"],
                    ["2017:06:06:06:06:06", "2017:06:06:06:06:06", "Month"],
                ],
            },
        ),
        (
            "boundary padding at year edges",
            {
                "ids": [1, 2, 3],
                "timestamps": [
                    "1999:12:31:23:59:59",
                    "2000:01:01:00:00:00",
                    "2000:12:31:23:59:59",
                ],
                "queries": [
                    ["2000:01:01:00:00:00", "2000:12:31:23:59:59", "Year"],
                    ["1999:01:01:00:00:00", "1999:12:31:23:59:59", "Month"],
                ],
            },
        ),
        (
            "duplicate timestamps with distinct ids",
            {
                "ids": [5, 6, 7],
                "timestamps": ["2020:02:29:12:00:00"] * 3,
                "queries": [
                    ["2020:02:29:12:00:00", "2020:02:29:12:00:00", "Minute"],
                    ["2020:02:29:11:00:00", "2020:02:29:11:59:59", "Second"],
                ],
            },
        ),
        (
            "minute granularity splits a busy hour",
            {
                "ids": [1, 2, 3, 4],
                "timestamps": [
                    "2021:07:07:07:07:07",
                    "2021:07:07:07:08:00",
                    "2021:07:07:07:08:59",
                    "2021:07:07:07:09:01",
                ],
                "queries": [["2021:07:07:07:08:30", "2021:07:07:07:08:31", "Minute"]],
            },
        ),
    ]

    for idx, (n_logs, n_queries, span) in enumerate(
        [
            (10, 6, "day"),
            (25, 6, "hour"),
            (50, 6, "year"),
            (80, 8, "day"),
            (120, 6, "minute"),
            (200, 8, "year"),
            (150, 10, "hour"),
            (60, 12, "minute"),
            (100, 6, "day"),
            (300, 6, "year"),
            (40, 10, "second"),
            (90, 8, "hour"),
            (250, 6, "day"),
        ]
    ):
        ids = rng.sample(range(1, 10000), n_logs)
        timestamps = []
        for _ in range(n_logs):
            if span == "year":
                ts = fmt_ts(
                    rng.randint(2000, 2020),
                    rng.randint(1, 12),
                    rng.randint(1, 28),
                    rng.randint(0, 23),
                    rng.randint(0, 59),
                    rng.randint(0, 59),
                )
            elif span == "day":
                ts = fmt_ts(
                    2017, rng.randint(1, 3), rng.randint(1, 28), rng.randint(0, 23),
                    rng.randint(0, 59), rng.randint(0, 59)
                )
            elif span == "hour":
                ts = fmt_ts(2017, 5, 5, rng.randint(0, 23), rng.randint(0, 59), rng.randint(0, 59))
            elif span == "minute":
                ts = fmt_ts(2017, 5, 5, 12, rng.randint(0, 59), rng.randint(0, 59))
            else:
                ts = fmt_ts(2017, 5, 5, 12, 30, rng.randint(0, 59))
            timestamps.append(ts)
        queries = []
        for _ in range(n_queries):
            a = timestamps[rng.randrange(n_logs)]
            b = timestamps[rng.randrange(n_logs)]
            lo, hi = min(a, b), max(a, b)
            queries.append([lo, hi, GRANULARITIES[rng.randrange(len(GRANULARITIES))]])
        cases.append(
            (
                f"random logs {idx + 1} ({n_logs} logs, {n_queries} queries, {span} spread)",
                {"ids": ids, "timestamps": timestamps, "queries": queries},
            )
        )
    return cases


def cases_recent_calls() -> list[tuple[str, dict[str, Any]]]:
    rng = random.Random(933)
    cases: list[tuple[str, dict[str, Any]]] = [
        ("no pings", {"pings": []}),
        ("single ping", {"pings": [1]}),
        ("leetcode sample", {"pings": [1, 100, 3001, 3002]}),
        ("ping exactly 3000 apart is inside the window", {"pings": [1, 3001]}),
        ("ping 3001 apart falls outside the window", {"pings": [1, 3002]}),
        ("consecutive seconds", {"pings": list(range(1, 60))}),
        ("dense burst, window never fills", {"pings": list(range(1, 1501))}),
        ("dense burst that overflows the window", {"pings": list(range(1, 3600, 2))}),
        ("every ping isolated by a long gap", {"pings": [1 + 5000 * i for i in range(30)]}),
        ("gaps just under the window", {"pings": [1 + 2999 * i for i in range(30)]}),
        ("gaps just over the window", {"pings": [1 + 3001 * i for i in range(30)]}),
        ("large timestamps near 10^9", {"pings": [999999000 + 100 * i for i in range(40)]}),
    ]

    for idx, (n, step) in enumerate(
        [
            (50, 10),
            (100, 1),
            (150, 100),
            (200, 60),
            (300, 5),
            (400, 30),
            (500, 3),
            (250, 500),
            (350, 1),
            (450, 15),
            (500, 1000),
            (120, 3000),
            (500, 12),
        ]
    ):
        t = rng.randint(1, 1000)
        pings: list[int] = []
        for _ in range(n):
            pings.append(t)
            t += rng.randint(1, step)
        cases.append((f"random pings {idx + 1} (n={n}, step<={step})", {"pings": pings}))
    return cases


# --------------------------------------------------------------------------
# Problem definitions
# --------------------------------------------------------------------------

PROBLEMS: list[dict[str, Any]] = [
    {
        "slug": "logger-rate-limiter",
        "number": 359,
        "title": "Logger Rate Limiter",
        "difficulty": "Easy",
        "category": "Design",
        "url": "https://leetcode.com/problems/logger-rate-limiter/",
        "statement": (
            "Design a logger that receives a stream of messages along with their timestamps "
            "(in seconds, non-decreasing) and decides whether each message should be printed. "
            "A message is printed only if it has not been printed in the previous 10 seconds, "
            "meaning it prints when it has never been seen before or when at least 10 seconds "
            "have passed since the last time that exact message was printed. A message that is "
            "rejected does NOT refresh the 10-second window. "
            "Adapted for this judge: instead of the stateful Logger class, implement one batch "
            "call. Given timestamps[i] and messages[i] for the i-th call, return a list where "
            "the i-th entry is true if messages[i] is printed and false if it is rate limited."
        ),
        "constraints": [
            "0 <= len(timestamps) == len(messages) <= 500",
            "0 <= timestamps[i] <= 10^9",
            "timestamps is non-decreasing (calls arrive in chronological order)",
            "0 <= len(messages[i]) <= 20; messages repeat, and they are compared case-sensitively as exact strings",
            "The window is inclusive at 10: a message reprints when timestamp - last_printed >= 10",
        ],
        "signature": {
            "className": "Solution",
            "methodName": "shouldPrintMessages",
            "params": [
                {"name": "timestamps", "pyType": "list[int]", "inputKind": "primitive"},
                {"name": "messages", "pyType": "list[str]", "inputKind": "primitive"},
            ],
            "returns": "list[bool]",
        },
        "starterCode": (
            "class Solution:\n"
            "    def shouldPrintMessages(self, timestamps: list[int], messages: list[str]) -> list[bool]:\n"
            "        # write your solution here\n"
            "        pass\n"
        ),
        "equality": "exact",
        "visibleExamples": [
            {
                "input": {
                    "timestamps": [1, 2, 3, 8, 10, 11],
                    "messages": ["foo", "bar", "foo", "bar", "foo", "foo"],
                },
                "output": [True, True, False, False, False, True],
                "explanation": (
                    "foo prints at t=1; at t=3 and t=10 it is still inside the 10-second window "
                    "(3-1 < 10, 10-1 < 10), and at t=11 it prints again because 11-1 >= 10. "
                    "bar prints at t=2 and is blocked at t=8."
                ),
            },
            {
                "input": {"timestamps": [1, 11, 21], "messages": ["a", "a", "a"]},
                "output": [True, True, True],
                "explanation": "Each call is exactly 10 seconds after the last printed one, so every call prints.",
            },
            {
                "input": {"timestamps": [0, 0, 0], "messages": ["x", "y", "x"]},
                "output": [True, True, False],
                "explanation": "Different messages have independent windows; the repeat of x at the same second is blocked.",
            },
        ],
        "reference": LOGGER_RATE_LIMITER_REF,
        "cases": cases_logger_rate_limiter,
    },
    {
        "slug": "design-hit-counter",
        "number": 362,
        "title": "Design Hit Counter",
        "difficulty": "Medium",
        "category": "Design",
        "url": "https://leetcode.com/problems/design-hit-counter/",
        "statement": (
            "Design a hit counter that counts the number of hits received in the past 5 minutes "
            "(300 seconds). Each call carries a timestamp in seconds, and calls arrive in "
            "chronological order (timestamps are non-decreasing). Several hits may share the same "
            "timestamp. A hit at time h counts for a query at time t when t - h < 300. "
            "Adapted for this judge: instead of the stateful HitCounter class, implement one batch "
            "call. ops[i] is either \"hit\" (record a hit at timestamps[i]) or \"getHits\" (query the "
            "count at timestamps[i]). Return the list of results for the \"getHits\" calls, in order."
        ),
        "constraints": [
            "0 <= len(ops) == len(timestamps) <= 500",
            'ops[i] is either "hit" or "getHits"',
            "1 <= timestamps[i] <= 10^9, and timestamps is non-decreasing",
            "A hit at time h is counted by a query at time t if and only if t - h < 300",
            "The returned list contains one entry per \"getHits\" op (it is empty when there are none)",
        ],
        "signature": {
            "className": "Solution",
            "methodName": "countHits",
            "params": [
                {"name": "ops", "pyType": "list[str]", "inputKind": "primitive"},
                {"name": "timestamps", "pyType": "list[int]", "inputKind": "primitive"},
            ],
            "returns": "list[int]",
        },
        "starterCode": (
            "class Solution:\n"
            "    def countHits(self, ops: list[str], timestamps: list[int]) -> list[int]:\n"
            "        # write your solution here\n"
            "        pass\n"
        ),
        "equality": "exact",
        "visibleExamples": [
            {
                "input": {
                    "ops": ["hit", "hit", "hit", "getHits", "hit", "getHits", "getHits"],
                    "timestamps": [1, 2, 3, 4, 300, 300, 301],
                },
                "output": [3, 4, 3],
                "explanation": (
                    "At t=4 the three hits at 1, 2, 3 are all within 300 seconds. At t=300 the new hit "
                    "makes four. At t=301 the hit from t=1 has expired (301 - 1 = 300), leaving three."
                ),
            },
            {
                "input": {"ops": ["getHits", "hit", "getHits"], "timestamps": [1, 2, 2]},
                "output": [0, 1],
                "explanation": "The first query happens before any hit; the second sees the hit recorded in the same second.",
            },
            {
                "input": {"ops": ["hit", "hit", "getHits"], "timestamps": [5, 5, 400]},
                "output": [0],
                "explanation": "Both hits are older than 300 seconds by the time of the query (400 - 5 = 395), so the window is empty.",
            },
        ],
        "reference": HIT_COUNTER_REF,
        "cases": cases_hit_counter,
    },
    {
        "slug": "design-log-storage-system",
        "number": 635,
        "title": "Design Log Storage System",
        "difficulty": "Medium",
        "category": "Design",
        "url": "https://leetcode.com/problems/design-log-storage-system/",
        "statement": (
            "You are given several logs, each with a unique id and a timestamp of the form "
            "Year:Month:Day:Hour:Minute:Second, for example \"2017:01:01:23:59:59\" (all fields are "
            "zero-padded and every timestamp has the same length). Answer range queries of the form "
            "[start, end, granularity]: return the ids of every log whose timestamp lies between "
            "start and end inclusive, comparing only the fields down to the given granularity and "
            "ignoring the finer ones. granularity is one of \"Year\", \"Month\", \"Day\", \"Hour\", "
            "\"Minute\", \"Second\". "
            "Adapted for this judge: instead of the stateful LogSystem class, implement one batch "
            "call. ids[i] and timestamps[i] describe the i-th stored log. Return one list per query, "
            "each holding the matching ids in ascending order."
        ),
        "constraints": [
            "0 <= len(ids) == len(timestamps) <= 300",
            "1 <= ids[i] <= 10^4 and the ids are distinct",
            'timestamps[i] matches "YYYY:MM:DD:HH:MM:SS" with 2000 <= YYYY <= 2020 style zero-padded fields',
            "0 <= len(queries) <= 20; each query is [start, end, granularity] with timestamps in the same format",
            'granularity is one of "Year", "Month", "Day", "Hour", "Minute", "Second"',
            "Each result list must be sorted in ascending id order; an empty match is an empty list",
        ],
        "signature": {
            "className": "Solution",
            "methodName": "retrieveLogs",
            "params": [
                {"name": "ids", "pyType": "list[int]", "inputKind": "primitive"},
                {"name": "timestamps", "pyType": "list[str]", "inputKind": "primitive"},
                {"name": "queries", "pyType": "list[list[str]]", "inputKind": "primitive"},
            ],
            "returns": "list[list[int]]",
        },
        "starterCode": (
            "class Solution:\n"
            "    def retrieveLogs(\n"
            "        self, ids: list[int], timestamps: list[str], queries: list[list[str]]\n"
            "    ) -> list[list[int]]:\n"
            "        # write your solution here\n"
            "        pass\n"
        ),
        "equality": "exact",
        "visibleExamples": [
            {
                "input": {
                    "ids": [1, 2, 3],
                    "timestamps": [
                        "2017:01:01:23:59:59",
                        "2017:01:01:22:59:59",
                        "2016:01:01:00:00:00",
                    ],
                    "queries": [
                        ["2016:01:01:01:01:01", "2017:01:01:23:00:00", "Year"],
                        ["2016:01:01:01:01:01", "2017:01:01:23:00:00", "Hour"],
                    ],
                },
                "output": [[1, 2, 3], [1, 2]],
                "explanation": (
                    "At Year granularity the range is 2016..2017, so all three logs match. At Hour "
                    "granularity the range is 2016:01:01:01 .. 2017:01:01:23: log 1 truncates to "
                    "2017:01:01:23 (equal to the end, so inside) and log 2 to 2017:01:01:22, while log 3 "
                    "truncates to 2016:01:01:00, one hour before the start, so it drops out."
                ),
            },
            {
                "input": {
                    "ids": [7, 4],
                    "timestamps": ["2020:02:29:12:00:00", "2020:02:29:12:00:01"],
                    "queries": [["2020:02:29:12:00:00", "2020:02:29:12:00:00", "Second"]],
                },
                "output": [[7]],
                "explanation": "At Second granularity only the log with the exact timestamp matches.",
            },
            {
                "input": {
                    "ids": [5],
                    "timestamps": ["2019:07:04:10:20:30"],
                    "queries": [["2018:01:01:00:00:00", "2018:12:31:23:59:59", "Year"]],
                },
                "output": [[]],
                "explanation": "The only log is from 2019, outside the 2018 range, so the query returns an empty list.",
            },
        ],
        "reference": LOG_STORAGE_REF,
        "cases": cases_log_storage,
    },
    {
        "slug": "number-of-recent-calls",
        "number": 933,
        "title": "Number of Recent Calls",
        "difficulty": "Easy",
        "category": "Design",
        "url": "https://leetcode.com/problems/number-of-recent-calls/",
        "statement": (
            "You have a request counter that records new requests (pings) and counts how many "
            "requests arrived in the past 3000 milliseconds. Each ping happens at a strictly "
            "increasing time t in milliseconds, and after recording it you report the number of "
            "pings that occurred in the inclusive range [t - 3000, t]. "
            "Adapted for this judge: instead of the stateful RecentCounter class, implement one "
            "batch call. Given the list of ping times in chronological order, return the list of "
            "counts, one per ping."
        ),
        "constraints": [
            "0 <= len(pings) <= 10^4",
            "1 <= pings[i] <= 10^9",
            "pings is strictly increasing",
            "The count for ping t includes every ping in [t - 3000, t], the ping itself included",
        ],
        "signature": {
            "className": "Solution",
            "methodName": "countRecentCalls",
            "params": [{"name": "pings", "pyType": "list[int]", "inputKind": "primitive"}],
            "returns": "list[int]",
        },
        "starterCode": (
            "class Solution:\n"
            "    def countRecentCalls(self, pings: list[int]) -> list[int]:\n"
            "        # write your solution here\n"
            "        pass\n"
        ),
        "equality": "exact",
        "visibleExamples": [
            {
                "input": {"pings": [1, 100, 3001, 3002]},
                "output": [1, 2, 3, 3],
                "explanation": (
                    "At t=3001 the window is [1, 3001] and holds all three pings. At t=3002 the window "
                    "is [2, 3002], so the ping at t=1 drops out and the ping at 3002 joins: still 3."
                ),
            },
            {
                "input": {"pings": [1, 3001, 3002]},
                "output": [1, 2, 2],
                "explanation": "A gap of exactly 3000 keeps the older ping inside the window; a gap of 3001 pushes it out.",
            },
            {
                "input": {"pings": [10, 5000, 10000]},
                "output": [1, 1, 1],
                "explanation": "Every ping is more than 3000 ms after the previous one, so each window holds only itself.",
            },
        ],
        "reference": RECENT_CALLS_REF,
        "cases": cases_recent_calls,
    },
]


def check_visible_examples(problem: dict[str, Any], solve: Callable[..., Any]) -> None:
    """The reference must reproduce every documented example."""
    for i, ex in enumerate(problem["visibleExamples"]):
        actual = solve(**json.loads(json.dumps(ex["input"])))
        if actual != ex["output"]:
            raise SystemExit(
                f"{problem['slug']}: visible example {i + 1} mismatch\n"
                f"  expected {ex['output']!r}\n  reference {actual!r}"
            )


def write_json(path: str, obj: Any) -> None:
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with open(path, "w", encoding="utf8") as f:
        f.write(json.dumps(obj, indent=2) + "\n")


def main() -> None:
    manifest_path = f"{PUBLIC_DIR}/index.json"
    with open(manifest_path, encoding="utf8") as f:
        manifest = json.load(f)
    by_slug = {p["slug"]: p for p in manifest["problems"]}

    for problem in PROBLEMS:
        slug = problem["slug"]
        solve = load_reference(problem["reference"], problem["signature"]["methodName"])
        check_visible_examples(problem, solve)

        visible_inputs = {
            json.dumps(ex["input"], sort_keys=True) for ex in problem["visibleExamples"]
        }
        hidden: list[dict[str, Any]] = []
        for name, inp in problem["cases"]():
            key = json.dumps(inp, sort_keys=True)
            if key in visible_inputs:
                continue  # never duplicate a visible example as a hidden case
            visible_inputs.add(key)
            # Deep-copy the input through JSON the way the judge does, so a
            # reference that mutated its arguments could not poison the case.
            expected = solve(**json.loads(json.dumps(inp)))
            hidden.append({"name": name, "input": inp, "expected": expected})
        if len(hidden) < 5:
            raise SystemExit(f"{slug}: only {len(hidden)} hidden cases (need >= 5)")

        # Key order mirrors what gen-hidden-tests.ts writes, so these files sit
        # next to the generated ones without a diff-visible reshuffle.
        head = {
            "slug": slug,
            "title": problem["title"],
            "number": problem["number"],
            "difficulty": problem["difficulty"],
            "category": problem["category"],
            "url": problem["url"],
            "statement": problem["statement"],
            "constraints": problem["constraints"],
            "signature": problem["signature"],
            "starterCode": problem["starterCode"],
        }

        write_json(
            f"{NORM_DIR}/{slug}.json",
            {
                "slug": slug,
                "number": problem["number"],
                "title": problem["title"],
                "difficulty": problem["difficulty"],
                "category": problem["category"],
                "url": problem["url"],
                "statement": problem["statement"],
                "constraints": problem["constraints"],
                "signature": problem["signature"],
                "starterCode": problem["starterCode"],
                "equality": problem["equality"],
                "visibleExamples": problem["visibleExamples"],
                "jsonFriendly": True,
                "jsonFriendlyReason": None,
                "referenceCode": problem["reference"].rstrip("\n"),
            },
        )
        write_json(
            f"{SERVER_DIR}/{slug}.json",
            {
                **head,
                "equality": problem["equality"],
                "visibleExamples": problem["visibleExamples"],
                "hiddenCases": hidden,
            },
        )
        write_json(
            f"{PUBLIC_DIR}/{slug}.public.json",
            {
                **head,
                "visibleExamples": problem["visibleExamples"],
                "hiddenCount": len(hidden),
            },
        )

        by_slug[slug] = {
            "slug": slug,
            "title": problem["title"],
            "number": problem["number"],
            "difficulty": problem["difficulty"],
            "category": problem["category"],
        }
        print(f"  [{slug}] {len(hidden)} hidden cases")

    # Merge into the manifest in place; generatedAt keeps whatever the last
    # full pipeline run stamped, since this script only adds entries.
    manifest["problems"] = sorted(by_slug.values(), key=lambda p: p["number"])
    write_json(manifest_path, manifest)
    print(f"manifest: {len(manifest['problems'])} problems")


if __name__ == "__main__":
    main()
