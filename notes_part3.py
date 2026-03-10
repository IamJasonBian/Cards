"""
Part 3 Notes: Searching and Filtering
=======================================
Goal: Find tasks by status.

Key points:
- get_tasks_by_status(status) -> filter self.tasks.values()
- get_ready_tasks() -> shortcut for get_tasks_by_status(READY)
- get_blocked_tasks() -> shortcut for get_tasks_by_status(BLOCKED)
- get_task_dependencies_info(task_id) -> debug helper

Implementation is just list comprehensions:

    def get_tasks_by_status(self, status):
        return [t for t in self.tasks.values() if t.status == status]

Test cases to remember:
- Mix of READY and BLOCKED, verify counts
- After succeeding a parent, blocked child moves to ready list
- Empty ToDoList returns empty lists (no crash)
- All tasks same status
"""
