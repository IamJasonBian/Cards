"""
Part 3: Searching/Filtering — filter by status

get_tasks_by_status(status) -> List[Task]   Filter all tasks by status
get_ready_tasks() -> List[Task]             Shortcut for READY
get_blocked_tasks() -> List[Task]           Shortcut for BLOCKED

Implementation is just list comprehensions over self.tasks.values().
"""
from todo_list import ToDoList, TaskStatus


def test_basic_filtering():
    todo = ToDoList()
    t1 = todo.add_task("Ready 1")
    t2 = todo.add_task("Ready 2")
    t3 = todo.add_task("Blocked 1", dependencies=[t1.task_id])
    t4 = todo.add_task("Blocked 2", dependencies=[t2.task_id])

    assert len(todo.get_ready_tasks()) == 2
    assert len(todo.get_blocked_tasks()) == 2
    assert len(todo.get_tasks_by_status(TaskStatus.SUCCEEDED)) == 0


def test_filtering_after_status_change():
    todo = ToDoList()
    t1 = todo.add_task("Root")
    t2 = todo.add_task("Blocked", dependencies=[t1.task_id])

    todo.update_status(t1.task_id, TaskStatus.IN_PROGRESS)
    todo.update_status(t1.task_id, TaskStatus.SUCCEEDED)

    ready = todo.get_ready_tasks()
    assert len(ready) == 1
    assert ready[0].task_id == t2.task_id
    assert len(todo.get_blocked_tasks()) == 0


def test_empty_list():
    todo = ToDoList()
    assert todo.get_ready_tasks() == []
    assert todo.get_blocked_tasks() == []
    assert todo.get_tasks_by_status(TaskStatus.FAILED) == []


def test_all_same_status():
    todo = ToDoList()
    todo.add_task("A")
    todo.add_task("B")
    todo.add_task("C")

    assert len(todo.get_ready_tasks()) == 3
    assert len(todo.get_blocked_tasks()) == 0


if __name__ == "__main__":
    test_basic_filtering()
    test_filtering_after_status_change()
    test_empty_list()
    test_all_same_status()
    print("Part 3 tests passed!")
