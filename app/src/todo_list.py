"""
ToDo List with Task Dependencies (OOD)

Build a task management system where tasks have states and dependencies.
Starts simple, gets harder. Old features must keep working (regression testing).

Parts:
  1. Basic Features      — add_task, get_task, update_status
  2. Dependencies        — blocking, unblocking, cascading failure
  3. Searching/Filtering — filter by status
  4. Tags & Priority     — tags, priority sorting, topological sort
"""
from enum import Enum
from typing import Dict, List, Set
from dataclasses import dataclass, field


class TaskStatus(Enum):
    READY = "READY"
    IN_PROGRESS = "IN_PROGRESS"
    SUCCEEDED = "SUCCEEDED"
    FAILED = "FAILED"
    BLOCKED = "BLOCKED"


@dataclass
class Task:
    task_id: int
    description: str
    status: TaskStatus = TaskStatus.READY
    dependencies: Set[int] = field(default_factory=set)

    def __repr__(self):
        return f"Task({self.task_id}, {self.status.value})"


class ToDoList:
    """
    Part 1: Basic task CRUD with auto-incrementing IDs.
    Part 2: Add dependency support — update add_task, update_status.
    Part 3: Add filtering methods.
    Part 4: Add tags, priority, topological sort to Task and ToDoList.
    """
    def __init__(self):
        self.tasks: Dict[int, Task] = {}
        self.dependents: Dict[int, Set[int]] = {}  # parent_id -> {child_ids}
        self._next_id: int = 1

    # ── Part 1 ──

    def add_task(self, description: str) -> Task:
        """
        Create a new task with auto-assigned task_id (starts at 1, increments).
        Status defaults to READY.

        Part 2: Add optional dependencies: List[int].
          - If any parent not SUCCEEDED -> start BLOCKED.
          - If all parents SUCCEEDED (or none) -> start READY.
          - Validate dependency IDs exist (raise ValueError).
          - Update self.dependents reverse map.

        Part 4: Add optional tags: Set[str] and priority: int = 0.
        """
        pass

    def get_task(self, task_id: int) -> Task:
        """Return task by ID. Raise ValueError if not found."""
        pass

    def update_status(self, task_id: int, new_status: TaskStatus) -> None:
        """
        Change a task's status.

        Part 2: Trigger side effects after setting status:
          - SUCCEEDED -> call _try_unblock_dependents
          - FAILED    -> call _cascade_failure

        Part 4: Validate transition using VALID_TRANSITIONS dict.
          READY       -> {IN_PROGRESS, FAILED}
          IN_PROGRESS -> {SUCCEEDED, FAILED}
          BLOCKED     -> {READY, FAILED}
          SUCCEEDED   -> {} (terminal)
          FAILED      -> {} (terminal)
        """
        pass

    # ── Part 2 ──

    def _try_unblock_dependents(self, task_id: int) -> None:
        """
        When a task succeeds, check its children (self.dependents[task_id]).
        For each BLOCKED child: if ALL its dependencies are SUCCEEDED,
        set child status to READY.
        """
        pass

    def _cascade_failure(self, task_id: int) -> None:
        """
        When a task fails, recursively fail all descendants.
        Guard: skip children already FAILED (prevents infinite loop on diamonds).
        Must recurse — children's children must also fail.
        """
        pass

    # ── Part 3 ──

    def get_tasks_by_status(self, status: TaskStatus) -> List[Task]:
        """Return all tasks matching the given status."""
        pass

    def get_ready_tasks(self) -> List[Task]:
        """Shortcut: return all READY tasks."""
        pass

    def get_blocked_tasks(self) -> List[Task]:
        """Shortcut: return all BLOCKED tasks."""
        pass

    # ── Part 4 ──

    def get_tasks_by_tag(self, tag: str) -> List[Task]:
        """Return all tasks that have the given tag."""
        pass

    def get_ready_tasks_sorted_by_priority(self) -> List[Task]:
        """Return READY tasks sorted by priority, highest first."""
        pass

    def get_topological_order(self) -> List[int]:
        """
        Return task IDs in topological order using Kahn's algorithm.
        Raise ValueError if a cycle is detected.

        Steps:
          1. Compute in_degree for each task (len of its dependencies).
          2. Queue all tasks with in_degree == 0.
          3. Pop from queue, append to result, decrement children's in_degree.
          4. If child hits 0 -> add to queue.
          5. If len(result) != len(tasks) -> cycle.
        """
        pass
