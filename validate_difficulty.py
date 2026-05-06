"""
Validate that every {name, slug, difficulty} entry in patterns.ts matches
the difficulty in the latest LeetCode snapshot (leetcode-difficulty.json).

Default: report mismatches and exit 1 if any.
With --fix: rewrite patterns.ts in place to match the snapshot.

Slugs that do not exist in the snapshot are reported as warnings (link rot)
but do not fail the run unless --strict is also passed.
"""

import argparse
import json
import pathlib
import re
import sys

PATTERNS_TS = pathlib.Path("leetcode-patterns/src/data/patterns.ts")
SNAPSHOT = pathlib.Path("leetcode-difficulty.json")

ENTRY_RE = re.compile(
    r'\{\s*name:\s*"([^"]+)",\s*slug:\s*"([^"]+)",\s*difficulty:\s*"(Easy|Medium|Hard)"\s*\}'
)


def load_snapshot() -> dict[str, str]:
    if not SNAPSHOT.exists():
        print(f"ERROR: {SNAPSHOT} not found. Run fetch_leetcode_difficulty.py first.", file=sys.stderr)
        sys.exit(2)
    return json.loads(SNAPSHOT.read_text())["problems"]


def collect_entries(src: str) -> list[tuple[str, str, str]]:
    return [(name, slug, diff) for name, slug, diff in ENTRY_RE.findall(src)]


def fix_file(src: str, corrections: dict[str, str]) -> tuple[str, int]:
    n = 0

    def repl(m: re.Match[str]) -> str:
        nonlocal n
        name, slug, diff = m.group(1), m.group(2), m.group(3)
        target = corrections.get(slug)
        if target and target != diff:
            n += 1
            return f'{{ name: "{name}", slug: "{slug}", difficulty: "{target}" }}'
        return m.group(0)

    return ENTRY_RE.sub(repl, src), n


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--fix", action="store_true", help="rewrite patterns.ts to match the snapshot")
    parser.add_argument("--strict", action="store_true", help="also fail on slugs missing from the snapshot")
    args = parser.parse_args()

    truth = load_snapshot()
    src = PATTERNS_TS.read_text()
    entries = collect_entries(src)

    seen: set[str] = set()
    matches, mismatches, missing = 0, [], []
    corrections: dict[str, str] = {}
    for _name, slug, diff in entries:
        if slug in seen:
            continue
        seen.add(slug)
        real = truth.get(slug)
        if real is None:
            missing.append((slug, diff))
        elif real != diff:
            mismatches.append((slug, diff, real))
            corrections[slug] = real
        else:
            matches += 1

    print(f"Patterns.ts unique slugs:    {len(seen)}")
    print(f"  Matches snapshot:          {matches}")
    print(f"  Mismatches:                {len(mismatches)}")
    print(f"  Missing from snapshot:     {len(missing)}")
    print()

    if mismatches:
        print("Mismatches (slug: ours -> upstream):")
        for slug, ours, real in mismatches:
            print(f"  {slug}: {ours} -> {real}")
        print()

    if missing:
        print("Slugs not present in the snapshot (likely typos or retired problems):")
        for slug, diff in missing[:30]:
            print(f"  {slug} (ours: {diff})")
        if len(missing) > 30:
            print(f"  ... and {len(missing) - 30} more")
        print()

    if args.fix and mismatches:
        new_src, n = fix_file(src, corrections)
        PATTERNS_TS.write_text(new_src)
        print(f"--fix: rewrote {n} entries in {PATTERNS_TS}")
        return 0

    if mismatches:
        print("Run `python3 validate_difficulty.py --fix` to auto-correct.")
        return 1
    if missing and args.strict:
        return 1
    return 0


if __name__ == "__main__":
    sys.exit(main())
