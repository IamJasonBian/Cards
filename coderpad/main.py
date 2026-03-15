import subprocess
import sys
import os

os.chdir(os.path.join(os.path.dirname(__file__), "app", "todo"))

for test in ["test_part1.py", "test_part2.py", "test_part3.py", "test_part4.py"]:
    result = subprocess.run([sys.executable, test])
    if result.returncode != 0:
        sys.exit(result.returncode)
