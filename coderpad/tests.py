import sys
sys.path.insert(0, "src/app/todo")

from test_part1 import *
from test_part2 import *
from test_part3 import *
from test_part4 import *

test_add_and_get()
test_ids_always_increment()
test_get_nonexistent()
test_update_status()
print("Part 1 tests passed!")

test_simple_chain()
test_unblocking()
test_unblock_does_not_cascade()
test_multiple_dependencies()
test_diamond_dependency()
test_dependency_already_succeeded()
test_nonexistent_dependency()
test_ids_increment_on_failed_add()
test_cascade_failure_deep()
test_cascade_failure_fanout()
test_diamond_cascade_no_infinite_loop()
print("Part 2 tests passed!")

test_basic_filtering()
test_filtering_after_status_change()
test_empty_list()
print("Part 3 tests passed!")

test_tags()
test_priority_sorting()
test_priority_excludes_blocked()
test_topological_order()
test_topological_no_deps()
test_cycle_detection()
test_invalid_transition()
test_failed_is_terminal()
print("Part 4 tests passed!")

print("\nAll tests passed!")
