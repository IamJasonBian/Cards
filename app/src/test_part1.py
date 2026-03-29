"""
Part 1: Basic Features — add_task, get_task, update_status

Build a task management system where tasks have states and dependencies.
task_id is auto-incremented (starts at 1). Store tasks in a dict for O(1) lookup.

add_task(description) -> Task    Create task, auto-assign ID, status = READY
get_task(task_id) -> Task        Lookup by ID, raise ValueError if missing
update_status(task_id, status)   Change status, raise ValueError if missing
"""
from todo_list import ToDoList, TaskStatus


def test_add_and_get():
    todo = ToDoList()

    t1 = todo.add_task("First task")
    assert t1.task_id == 1
    assert t1.status == TaskStatus.READY

    t2 = todo.add_task("Second task")
    assert t2.task_id == 2

    assert todo.get_task(1).description == "First task"


def test_ids_always_increment():
    todo = ToDoList()
    ids = [todo.add_task(f"Task {i}").task_id for i in range(5)]
    assert ids == [1, 2, 3, 4, 5]


def test_get_nonexistent():
    todo = ToDoList()
    try:
        todo.get_task(999)
        assert False, "Should raise ValueError"
    except ValueError:
        pass


def test_update_status():
    todo = ToDoList()
    t = todo.add_task("Do something")

    todo.update_status(t.task_id, TaskStatus.IN_PROGRESS)
    assert todo.get_task(t.task_id).status == TaskStatus.IN_PROGRESS

    todo.update_status(t.task_id, TaskStatus.SUCCEEDED)
    assert todo.get_task(t.task_id).status == TaskStatus.SUCCEEDED


if __name__ == "__main__":
    test_add_and_get()
    test_ids_always_increment()
    test_get_nonexistent()
    test_update_status()
    print("Part 1 tests passed!")
