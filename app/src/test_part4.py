"""
Part 4: Tags & Priority — tags, priority sorting, topological sort

Task gets new fields (with defaults so old code doesn't break):
  tags: Set[str]    priority: int = 0

New methods:
  get_tasks_by_tag(tag)                  Filter by tag
  get_ready_tasks_sorted_by_priority()   READY tasks, highest priority first
  get_topological_order()                Kahn's algorithm, raises on cycles

Transition validation (VALID_TRANSITIONS):
  READY -> {IN_PROGRESS, FAILED}     BLOCKED -> {READY, FAILED}
  IN_PROGRESS -> {SUCCEEDED, FAILED} SUCCEEDED/FAILED -> {} (terminal)
"""
from todo_list import ToDoList, TaskStatus


def test_tags():
    todo = ToDoList()
    todo.add_task("Backend work", tags={"backend", "urgent"})
    todo.add_task("Frontend work", tags={"frontend"})
    todo.add_task("Backend cleanup", tags={"backend"})

    assert len(todo.get_tasks_by_tag("backend")) == 2
    assert len(todo.get_tasks_by_tag("frontend")) == 1
    assert todo.get_tasks_by_tag("nonexistent") == []


def test_priority_sorting():
    todo = ToDoList()
    todo.add_task("Low", priority=1)
    todo.add_task("High", priority=10)
    todo.add_task("Med", priority=5)

    priorities = [t.priority for t in todo.get_ready_tasks_sorted_by_priority()]
    assert priorities == [10, 5, 1]


def test_priority_excludes_blocked():
    todo = ToDoList()
    root = todo.add_task("Root", priority=1)
    todo.add_task("Blocked high pri", dependencies=[root.task_id], priority=100)

    sorted_tasks = todo.get_ready_tasks_sorted_by_priority()
    assert len(sorted_tasks) == 1
    assert sorted_tasks[0].task_id == root.task_id


def test_topological_order():
    todo = ToDoList()
    t1 = todo.add_task("A")
    t2 = todo.add_task("B", dependencies=[t1.task_id])
    t3 = todo.add_task("C", dependencies=[t1.task_id])
    t4 = todo.add_task("D", dependencies=[t2.task_id, t3.task_id])

    order = todo.get_topological_order()
    assert order.index(t1.task_id) < order.index(t2.task_id)
    assert order.index(t1.task_id) < order.index(t3.task_id)
    assert order.index(t2.task_id) < order.index(t4.task_id)
    assert order.index(t3.task_id) < order.index(t4.task_id)


def test_topological_no_deps():
    todo = ToDoList()
    todo.add_task("A")
    todo.add_task("B")
    todo.add_task("C")

    order = todo.get_topological_order()
    assert len(order) == 3
    assert set(order) == {1, 2, 3}


def test_cycle_detection():
    todo = ToDoList()
    t1 = todo.add_task("X")
    t2 = todo.add_task("Y", dependencies=[t1.task_id])

    # Inject cycle bypassing add_task validation
    todo.tasks[t1.task_id].dependencies.add(t2.task_id)
    todo.dependents.setdefault(t2.task_id, set()).add(t1.task_id)

    try:
        todo.get_topological_order()
        assert False, "Should detect cycle"
    except ValueError as e:
        assert "Circular" in str(e)


def test_invalid_transition():
    todo = ToDoList()
    t = todo.add_task("Task")

    # READY -> SUCCEEDED not allowed
    try:
        todo.update_status(t.task_id, TaskStatus.SUCCEEDED)
        assert False
    except ValueError:
        pass

    # READY -> IN_PROGRESS -> SUCCEEDED is valid
    todo.update_status(t.task_id, TaskStatus.IN_PROGRESS)
    todo.update_status(t.task_id, TaskStatus.SUCCEEDED)

    # SUCCEEDED is terminal
    try:
        todo.update_status(t.task_id, TaskStatus.READY)
        assert False
    except ValueError:
        pass


def test_failed_is_terminal():
    todo = ToDoList()
    t = todo.add_task("Task")
    todo.update_status(t.task_id, TaskStatus.FAILED)

    try:
        todo.update_status(t.task_id, TaskStatus.IN_PROGRESS)
        assert False
    except ValueError:
        pass


if __name__ == "__main__":
    test_tags()
    test_priority_sorting()
    test_priority_excludes_blocked()
    test_topological_order()
    test_topological_no_deps()
    test_cycle_detection()
    test_invalid_transition()
    test_failed_is_terminal()
    print("Part 4 tests passed!")
