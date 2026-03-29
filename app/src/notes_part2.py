"""
Part 2 Notes: Dependencies
===========================
Goal: Tasks can depend on other tasks.

Key points:
- add_task gains optional dependencies: List[int]
- If any parent is not SUCCEEDED -> child starts BLOCKED
- If all parents SUCCEEDED (or no parents) -> starts READY
- Need reverse map: self.dependents[parent_id] = {child_ids}
- On SUCCEEDED: check children, unblock if all their deps done
- On FAILED: recursively fail all descendants

Gotchas:
- Validate dependency IDs exist (raise ValueError)
- _next_id increments BEFORE validation -> failed add consumes an ID
- Diamond cascade: D reachable from B and C. Guard with `if status != FAILED`
  to avoid infinite recursion
- Unblocking only checks BLOCKED children (skip READY/FAILED/etc.)
- Completing t1 unblocks t2, but does NOT cascade-unblock t3 (t3 waits on t2)

Implementation:

    def add_task(self, description, dependencies=None):
        task_id = self._next_id
        self._next_id += 1

        dep_set = set(dependencies or [])
        for dep_id in dep_set:
            if dep_id not in self.tasks:
                raise ValueError(...)

        initial_status = READY
        if dep_set and not all parents SUCCEEDED:
            initial_status = BLOCKED

        task = Task(task_id, description, initial_status, dep_set)
        self.tasks[task_id] = task

        # reverse map
        for dep_id in dep_set:
            self.dependents[dep_id].add(task_id)

        return task

    def _try_unblock_dependents(self, task_id):
        for child_id in self.dependents[task_id]:
            if child.status == BLOCKED and all child.deps SUCCEEDED:
                child.status = READY

    def _cascade_failure(self, task_id):
        for child_id in self.dependents[task_id]:
            if child.status != FAILED:
                child.status = FAILED
                self._cascade_failure(child_id)  # recurse!

Test cases to remember:
- Simple chain: t1 -> t2 -> t3
- Multiple deps: t3 depends on [t1, t2], only unblocks when BOTH done
- Nonexistent dependency raises error
- IDs increment even on failed adds
- Dep already succeeded -> child starts READY
- Deep cascade (4 levels)
- Diamond cascade (no infinite loop)
- Fan-out: 1 parent, 5 children all fail
"""
