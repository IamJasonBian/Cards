"""
Fetch every LeetCode problem's difficulty from the public problems API
and write a slug -> difficulty snapshot to leetcode-difficulty.json.

The snapshot is the source of truth for validate_difficulty.py.
Refresh nightly via .github/workflows/validate-difficulty.yml.
"""

import datetime as dt
import json
import sys
import urllib.request

URL = "https://leetcode.com/api/problems/all/"
OUT = "leetcode-difficulty.json"
LEVEL_TO_DIFFICULTY = {1: "Easy", 2: "Medium", 3: "Hard"}


def main() -> int:
    req = urllib.request.Request(URL, headers={"User-Agent": "leetcards-validator/1.0"})
    try:
        with urllib.request.urlopen(req, timeout=30) as resp:
            raw = resp.read()
    except Exception as exc:  # network/HTTP/timeout errors
        print(f"ERROR: failed to fetch {URL}: {exc}", file=sys.stderr)
        return 1

    try:
        data = json.loads(raw)
    except (json.JSONDecodeError, ValueError) as exc:
        print(f"ERROR: invalid JSON from LeetCode API: {exc}", file=sys.stderr)
        return 1

    pairs = data.get("stat_status_pairs", [])
    if not pairs:
        print("ERROR: empty problem list from LeetCode API", file=sys.stderr)
        return 1

    problems: dict[str, str] = {}
    skipped = 0
    for entry in pairs:
        try:
            slug = entry["stat"]["question__title_slug"]
            level = entry["difficulty"]["level"]
        except (KeyError, TypeError):
            skipped += 1
            continue
        difficulty = LEVEL_TO_DIFFICULTY.get(level)
        if difficulty is None:
            continue
        problems[slug] = difficulty

    # A successful response should yield far more than a handful of problems;
    # a near-empty result means the API returned partial/garbage data.
    if not problems:
        print("ERROR: no usable problems parsed from LeetCode API response", file=sys.stderr)
        return 1
    if skipped:
        print(f"WARNING: skipped {skipped} malformed entries", file=sys.stderr)

    snapshot = {
        "fetched_at": dt.datetime.now(dt.timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
        "source": URL,
        "count": len(problems),
        "problems": dict(sorted(problems.items())),
    }

    with open(OUT, "w") as f:
        json.dump(snapshot, f, indent=2)
        f.write("\n")
    print(f"Wrote {len(problems)} problems to {OUT}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
