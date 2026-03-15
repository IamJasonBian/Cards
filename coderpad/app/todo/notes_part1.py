"""
Part 1 Notes: Basic Features
=============================
Goal: add_task, get_task, update_status

Key points:
- task_id is auto-incremented via self._next_id (starts at 1)
- Store tasks in a dict for O(1) lookup
- add_task only takes description — returns Task with assigned ID
- get_task / update_status raise ValueError if task_id not found

Implementation:

    def add_task(self, description):
        task_id = self._next_id
        self._next_id += 1
        task = Task(task_id=task_id, description=description)
        self.tasks[task_id] = task
        return task

    def get_task(self, task_id):
        if task_id not in self.tasks:
            raise ValueError(...)
        return self.tasks[task_id]

    def update_status(self, task_id, new_status):
        task = self.get_task(task_id)
        task.status = new_status
"""
