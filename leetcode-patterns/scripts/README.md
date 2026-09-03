# Build-time problem generation

These scripts build the runnable problem judges under `public/problems/` and
`server/problems/`. Run them from `leetcode-patterns/`:

```bash
npm run build-problems
```

That runs, in order: `fetch-problems` → `normalize-references` →
`gen-hidden-tests` → `rebuild-manifest`.

## LLM provider

Two passes call an LLM:

- `normalize-references.ts` — extracts problem metadata from a reference
  solution.
- `gen-hidden-tests.ts` — generates adversarial test inputs.

By **default** both use Anthropic Claude Haiku (`claude-haiku-4-5-20251001`)
via `@anthropic-ai/sdk`, with ephemeral prompt caching. This needs
`ANTHROPIC_API_KEY` (a `.env` file at `leetcode-patterns/` works) and is a paid
API. No behavior changes unless you opt in below.

### Optional: run locally with Qwen (Ollama, no paid API)

You can point the scripts at any OpenAI-compatible chat-completions endpoint —
for example a local [Ollama](https://ollama.com/) server running Qwen — by
setting `LLM_PROVIDER=qwen` (`ollama` is an accepted alias).

```bash
ollama pull qwen2.5:7b-instruct      # one-time: download the model
ollama serve                          # if not already running

LLM_PROVIDER=qwen \
  QWEN_BASE_URL=http://localhost:11434/v1 \
  QWEN_MODEL=qwen2.5:7b-instruct \
  npm run build-problems
```

`QWEN_BASE_URL` defaults to `http://localhost:11434/v1` and `QWEN_MODEL`
defaults to `qwen2.5:7b-instruct`, so with a standard Ollama setup
`LLM_PROVIDER=qwen npm run build-problems` is enough. If your endpoint requires
a bearer token, set `QWEN_API_KEY` (or `OPENAI_API_KEY`); it is only sent when
present and is never hardcoded.

**Quality note:** a local 7B Qwen is meaningfully weaker than Haiku at this
task, so expect more rejected generations. That's safe — the pipeline still
validates every output by **executing the reference solution** (`python3`
subprocess) against the produced examples/inputs and discards anything that
errors, times out, or disagrees with the reference. Bad generations are dropped,
not shipped. If too many cases are rejected a problem is reported as failed
rather than written.

## Hand-authored sets: `gen-logger-cases.py`

```bash
python3 scripts/gen-logger-cases.py     # no API key, no network
```

The LLM pipeline only handles pure-function problems. LeetCode *design*
problems — where you implement a stateful class driven by a call sequence —
are marked `jsonFriendly: false` by `normalize-references.ts` and skipped,
because the judge calls `Solution().method(**input)` exactly once per case.

`gen-logger-cases.py` ships the logger / log-stream family anyway by adapting
each one to a single batch call that replays the whole call stream:

| Problem | Adapted signature |
| --- | --- |
| #359 Logger Rate Limiter | `shouldPrintMessages(timestamps, messages) -> list[bool]` |
| #362 Design Hit Counter | `countHits(ops, timestamps) -> list[int]` |
| #635 Design Log Storage System | `retrieveLogs(ids, timestamps, queries) -> list[list[int]]` |
| #933 Number of Recent Calls | `countRecentCalls(pings) -> list[int]` |

Hidden cases are hand-picked boundary cases (window edges at exactly 10 / 300 /
3000, same-timestamp repeats, empty streams, granularity truncation) plus
seeded-random streams, so the script is deterministic — rerunning it produces
byte-identical files. Every case's expected output comes from executing the
reference solution in-process, and the script refuses to write a problem whose
reference disagrees with its own documented examples. It writes the same four
outputs the TS pipeline does and merges its entries into the manifest.

To extend the set, add an entry to `PROBLEMS` (reference solution, statement,
visible examples, case generator) and rerun.
