from enum import Enum
from dataclasses import dataclass, field
from typing import Optional, Iterable, Set, List
from collections import deque

class TaskStatus(Enum):
    READY = "READY"
    IN_PROGRESS = "IN_PROGRESS"
    SUCCEEDED = "SUCCEEDED"
    BLOCKED = "BLOCKED"
    FAILED = "FAILED"


VALID_TRANSITIONS: dict[TaskStatus, Set[TaskStatus]] = {
    TaskStatus.READY: {TaskStatus.IN_PROGRESS, TaskStatus.FAILED},
    TaskStatus.IN_PROGRESS: {TaskStatus.SUCCEEDED, TaskStatus.FAILED},
    TaskStatus.BLOCKED: {TaskStatus.READY, TaskStatus.FAILED},
    TaskStatus.SUCCEEDED: set(),
    TaskStatus.FAILED: set(),
}


@dataclass
class Task:
    task_id: int
    description: str
    status: TaskStatus = TaskStatus.READY
    dependencies: Set[int] = field(default_factory=set)
    tags: Set[str] = field(default_factory=set)
    priority: int = 0


class ToDoList:
    def __init__(self):
        self.tasks = {}
        self.next_id = 1
        self.dependents = {}

    def add_task(
        self,
        description: str,
        dependencies: Optional[Iterable[int]] = None,
        tags: Optional[Iterable[str]] = None,
        priority: int = 0,
    ) -> Task:
        task_id = self.next_id
        self.next_id += 1

        dep_set = set(dependencies) if dependencies else set()
        for pid in dep_set:
            if pid not in self.tasks:
                raise ValueError(f"Dependency task {pid} not found")

        initial_status = TaskStatus.READY
        if dep_set and not all(
            self.tasks[pid].status == TaskStatus.SUCCEEDED for pid in dep_set
        ):
            initial_status = TaskStatus.BLOCKED

        tag_set = set(tags) if tags else set()
        task = Task(task_id, description, initial_status, dep_set, tag_set, priority)
        self.tasks[task_id] = task
        self.dependents.setdefault(task_id, set())
        for pid in dep_set:
            self.dependents.setdefault(pid, set()).add(task_id)
        return task

    def get_task(self, task_id: int):
        if task_id not in self.tasks:
            return None
        return self.tasks[task_id]

    def update_status(self, task_id: int, status: TaskStatus):
        task = self.get_task(task_id)
        if task is None:
            raise ValueError(f"Task {task_id} not found")
        if status not in VALID_TRANSITIONS[task.status]:
            raise ValueError(
                f"Invalid transition: {task.status.value} -> {status.value}"
            )
        task.status = status
        if status == TaskStatus.SUCCEEDED:
            self._try_unblock_dependents(task_id)
        elif status == TaskStatus.FAILED:
            self._cascade_failure(task_id)


    def _try_unblock_dependents(self, task_id: int):
        for child_id in self.dependents.get(task_id, set()):
            child = self.tasks[child_id]
            if child.status == TaskStatus.BLOCKED and all(
                self.tasks[dep].status == TaskStatus.SUCCEEDED
                for dep in child.dependencies
            ):
                child.status = TaskStatus.READY

    def _cascade_failure(self, task_id: int):
        for child_id in self.dependents.get(task_id, set()):
            child = self.tasks[child_id]
            if child.status != TaskStatus.FAILED:
                child.status = TaskStatus.FAILED
                self._cascade_failure(child_id)

    def get_tasks_by_status(self, status: TaskStatus) -> List[Task]:
        return [t for t in self.tasks.values() if t.status == status]

    def get_ready_tasks(self) -> List[Task]:
        return self.get_tasks_by_status(TaskStatus.READY)

    def get_blocked_tasks(self) -> List[Task]:
        return self.get_tasks_by_status(TaskStatus.BLOCKED)

    def get_task_dependencies_info(self, task_id: int) -> dict:
      task = self.tasks.get(task_id)
      if task is None:
          raise ValueError(f"Task {task_id} not found")
      return {
          "task_id": task.task_id,
          "status": task.status,
          "dependencies": {
              dep_id: self.tasks[dep_id].status for dep_id in task.dependencies
          },
          "dependents": {
              cid: self.tasks[cid].status
              for cid in self.dependents.get(task_id, set())
          },
      }


    def get_tasks_by_tag(self, tag: str) -> List[Task]:
        return [t for t in self.tasks.values() if tag in t.tags]

    def get_ready_tasks_sorted_by_priority(self) -> List[Task]:
        return sorted(self.get_ready_tasks(), key=lambda t: t.priority, reverse=True)

    def get_topological_order(self):
        in_degree = {
            tid: len(t.dependencies & self.tasks.keys())
            for tid, t in self.tasks.items()
        }

        q = deque(tid for tid, d in in_degree.items() if d == 0)
        result = []

        while q:
            tid = q.popleft()
            result.append(tid)
            for child_id in self.dependents.get(tid, set()):
                in_degree[child_id] -= 1
                if in_degree[child_id] == 0:
                    q.append(child_id)

        if len(result) != len(self.tasks):
            raise ValueError("Circular dependency detected")

        return result