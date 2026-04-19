#!/usr/bin/env python3
"""
LeetCode Key Problems Refresh
==============================
Fetches the latest LeetCode submission data for one or all key problems
and saves a per-problem snapshot under data/problems/<slug>.json.

This script is the backend for the "Refresh Key Problems" GitHub Actions
workflow (see .github/workflows/refresh_key_problems.yml).  It can also
be run locally at any time.

Usage
-----
    python3 refresh.py                         # refresh all key problems
    python3 refresh.py --problem two-sum       # refresh one problem
    python3 refresh.py --list                  # list refreshable problems
    python3 refresh.py --username slenderman73 # override LeetCode username

Data written
------------
    data/problems/<slug>.json   -- latest submission snapshot for each slug
    data/key_problems_status.json -- summary of last refresh per problem
"""

import argparse
import json
import os
import sys
import time
import urllib.request
from datetime import datetime, timezone

# Default username -- override with LEETCODE_USERNAME env var or --username flag.
USERNAME = os.environ.get("LEETCODE_USERNAME", "slenderman73")
BASE_URL = "https://alfa-leetcode-api.onrender.com"
REPO_DIR = os.path.dirname(os.path.abspath(__file__))
DATA_DIR = os.path.join(REPO_DIR, "data")
PROBLEMS_DATA_DIR = os.path.join(DATA_DIR, "problems")
KEY_PROBLEMS_FILE = os.path.join(REPO_DIR, "key_problems.json")


# ---------------------------------------------------------------------------
# HTTP helper
# ---------------------------------------------------------------------------

def fetch(path: str, retries: int = 3, delay: int = 5):
    url = f"{BASE_URL}/{path}"
    for attempt in range(retries):
        try:
            req = urllib.request.Request(url)
            req.add_header("User-Agent", "leetcode-sync/1.0")
            with urllib.request.urlopen(req, timeout=30) as resp:
                return json.loads(resp.read())
        except urllib.error.HTTPError as e:
            if e.code == 429 and attempt < retries - 1:
                wait = delay * (2 ** attempt)
                print(f"  Rate limited, waiting {wait}s...")
                time.sleep(wait)
                continue
            print(f"  HTTP {e.code} for {path}, skipping")
            return None
        except Exception as exc:
            if attempt < retries - 1:
                time.sleep(delay)
                continue
            print(f"  Error fetching {path}: {exc}, skipping")
            return None
    return None


# ---------------------------------------------------------------------------
# Refresh logic
# ---------------------------------------------------------------------------

def refresh_problem(problem: dict, username: str) -> dict:
    """
    Fetch the latest accepted-submission record for a single problem slug.

    The alfa-leetcode-api does not offer a per-problem endpoint, so we pull
    the user's full recent-AC list and filter by slug.  For a more targeted
    lookup the problem detail endpoint ``/select?titleSlug=<slug>`` is also
    fetched to capture the question metadata.

    Returns a snapshot dict that is written to data/problems/<slug>.json.
    """
    slug = problem["slug"]
    title = problem["title"]
    print(f"  Refreshing: {title} ({slug})...", end=" ", flush=True)

    # 1. Problem metadata (public, no auth)
    problem_detail = fetch(f"select?titleSlug={slug}")
    time.sleep(1)

    # 2. Scan recent accepted submissions for this slug
    submission_record = None
    ac_data = fetch(f"{username}/acSubmission?limit=50")
    time.sleep(1)
    if ac_data and "submission" in ac_data:
        for sub in ac_data["submission"]:
            if sub.get("titleSlug") == slug:
                submission_record = sub
                break

    snapshot = {
        "slug": slug,
        "title": title,
        "difficulty": problem.get("difficulty"),
        "refreshed_at": datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
        "username": username,
        "problem_detail": problem_detail,
        "latest_submission": submission_record,
    }

    print("done" if (problem_detail or submission_record) else "no data found")
    return snapshot


def save_snapshot(slug: str, snapshot: dict) -> None:
    os.makedirs(PROBLEMS_DATA_DIR, exist_ok=True)
    path = os.path.join(PROBLEMS_DATA_DIR, f"{slug}.json")
    with open(path, "w") as f:
        json.dump(snapshot, f, indent=2)


def update_status(statuses: list[dict]) -> None:
    """Write a summary file listing the last refresh time for each problem."""
    path = os.path.join(DATA_DIR, "key_problems_status.json")
    existing: dict = {}
    if os.path.exists(path):
        with open(path) as f:
            existing = json.load(f)

    for s in statuses:
        existing[s["slug"]] = {
            "title": s["title"],
            "difficulty": s["difficulty"],
            "refreshed_at": s["refreshed_at"],
            "has_submission": s["latest_submission"] is not None,
        }

    with open(path, "w") as f:
        json.dump(existing, f, indent=2)
    print(f"\nUpdated data/key_problems_status.json ({len(existing)} entries)")


# ---------------------------------------------------------------------------
# CLI
# ---------------------------------------------------------------------------

def main() -> int:
    parser = argparse.ArgumentParser(
        description="Refresh LeetCode data for key problems.",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog=__doc__,
    )
    parser.add_argument("--problem", "-p", metavar="SLUG",
                        help="Refresh a single problem by slug")
    parser.add_argument("--list", "-l", action="store_true",
                        help="List key problems that can be refreshed and exit")
    parser.add_argument("--username", "-u", metavar="USER",
                        default=USERNAME,
                        help="LeetCode username (default: %(default)s)")
    args = parser.parse_args()

    if not os.path.exists(KEY_PROBLEMS_FILE):
        print(f"Error: {KEY_PROBLEMS_FILE} not found.", file=sys.stderr)
        return 1

    with open(KEY_PROBLEMS_FILE) as f:
        config = json.load(f)

    problems: list[dict] = config.get("key_problems", [])

    if args.list:
        print(f"{'Slug':<45} Difficulty  Title")
        print("-" * 80)
        for p in problems:
            print(f"{p['slug']:<45} {p['difficulty']:<10}  {p['title']}")
        return 0

    if args.problem:
        matches = [p for p in problems if p["slug"] == args.problem]
        if not matches:
            print(f"Problem '{args.problem}' not found in key_problems.json.",
                  file=sys.stderr)
            return 1
        problems = matches

    print(f"Refreshing {len(problems)} key problem(s) for user: {args.username}")
    snapshots: list[dict] = []
    for problem in problems:
        snapshot = refresh_problem(problem, args.username)
        save_snapshot(problem["slug"], snapshot)
        snapshots.append(snapshot)

    update_status(snapshots)
    return 0


if __name__ == "__main__":
    sys.exit(main())
