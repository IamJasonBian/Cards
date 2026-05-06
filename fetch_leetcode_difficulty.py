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
    with urllib.request.urlopen(req, timeout=30) as resp:
        data = json.loads(resp.read())

    pairs = data.get("stat_status_pairs", [])
    if not pairs:
        print("ERROR: empty problem list from LeetCode API", file=sys.stderr)
        return 1

    problems: dict[str, str] = {}
    for entry in pairs:
        slug = entry["stat"]["question__title_slug"]
        level = entry["difficulty"]["level"]
        difficulty = LEVEL_TO_DIFFICULTY.get(level)
        if difficulty is None:
            continue
        problems[slug] = difficulty

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
