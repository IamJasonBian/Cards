"""
Part 4 Notes: Tags, Priority, Topological Sort
================================================
Goal: Tags, priority sorting, topo sort, transition validation.

Key points:

1. Task gets new fields (with defaults so old code doesn't break):
   - tags: Set[str] = field(default_factory=set)
   - priority: int = 0

2. add_task gains optional params: tags=None, priority=0

3. New methods:
   - get_tasks_by_tag(tag) -> filter by tag membership
   - get_ready_tasks_sorted_by_priority() -> READY tasks, highest first
   - get_topological_order() -> Kahn's algorithm

4. Transition validation (VALID_TRANSITIONS dict):
   READY       -> {IN_PROGRESS, FAILED}
   IN_PROGRESS -> {SUCCEEDED, FAILED}
   BLOCKED     -> {READY, FAILED}
   SUCCEEDED   -> {} (terminal)
   FAILED      -> {} (terminal)

5. Kahn's algorithm for topo sort:
   - Compute in_degree for each task
   - Start queue with in_degree == 0
   - Pop from queue, decrement children's in_degree
   - If child hits 0, add to queue
   - If result length != total tasks -> cycle detected

Test cases to remember:
- Tags: multiple tags per task, filter returns correct count, nonexistent tag -> []
- Priority: [1, 10, 5] sorted -> [10, 5, 1]. Blocked tasks excluded.
- Topo order: diamond graph, verify parent-before-child invariant
- Topo with no deps: any order valid, just check length and set
- Cycle detection: inject cycle manually, verify ValueError
- Transition: READY->SUCCEEDED rejected, SUCCEEDED->anything rejected,
  FAILED->anything rejected
"""
