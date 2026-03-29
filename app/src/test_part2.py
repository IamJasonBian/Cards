"""
Part 2: Dependencies — blocking, unblocking, cascading failure

add_task gains optional dependencies: List[int].
  - If any parent not SUCCEEDED -> child starts BLOCKED
  - If all parents SUCCEEDED (or none) -> starts READY
  - Validate dependency IDs exist (raise ValueError)

update_status triggers side effects:
  - SUCCEEDED -> unblock children whose deps are all done
  - FAILED -> recursively fail all descendants
"""
from todo_list import ToDoList, TaskStatus


def test_simple_chain():
    """t1 -> t2 -> t3"""
    todo = ToDoList()
    t1 = todo.add_task("First")
    t2 = todo.add_task("Second", dependencies=[t1.task_id])
    t3 = todo.add_task("Third", dependencies=[t2.task_id])

    assert t1.status == TaskStatus.READY
    assert t2.status == TaskStatus.BLOCKED
    assert t3.status == TaskStatus.BLOCKED


def test_unblocking():
    todo = ToDoList()
    t1 = todo.add_task("First")
    t2 = todo.add_task("Second", dependencies=[t1.task_id])

    todo.update_status(t1.task_id, TaskStatus.IN_PROGRESS)
    assert todo.get_task(t2.task_id).status == TaskStatus.BLOCKED

    todo.update_status(t1.task_id, TaskStatus.SUCCEEDED)
    assert todo.get_task(t2.task_id).status == TaskStatus.READY


def test_unblock_does_not_cascade():
    """Completing t1 unblocks t2, but t3 stays blocked (waits on t2)."""
    todo = ToDoList()
    t1 = todo.add_task("First")
    t2 = todo.add_task("Second", dependencies=[t1.task_id])
    t3 = todo.add_task("Third", dependencies=[t2.task_id])

    todo.update_status(t1.task_id, TaskStatus.IN_PROGRESS)
    todo.update_status(t1.task_id, TaskStatus.SUCCEEDED)

    assert todo.get_task(t2.task_id).status == TaskStatus.READY
    assert todo.get_task(t3.task_id).status == TaskStatus.BLOCKED


def test_multiple_dependencies():
    """t3 depends on [t1, t2], only unblocks when BOTH done."""
    todo = ToDoList()
    t1 = todo.add_task("Task 1")
    t2 = todo.add_task("Task 2")
    t3 = todo.add_task("Task 3", dependencies=[t1.task_id, t2.task_id])

    assert t3.status == TaskStatus.BLOCKED

    todo.update_status(t1.task_id, TaskStatus.IN_PROGRESS)
    todo.update_status(t1.task_id, TaskStatus.SUCCEEDED)
    assert todo.get_task(t3.task_id).status == TaskStatus.BLOCKED

    todo.update_status(t2.task_id, TaskStatus.IN_PROGRESS)
    todo.update_status(t2.task_id, TaskStatus.SUCCEEDED)
    assert todo.get_task(t3.task_id).status == TaskStatus.READY


def test_diamond_dependency():
    """
        t1
       /  \\
      t2   t3
       \\  /
        t4
    """
    todo = ToDoList()
    t1 = todo.add_task("Root")
    t2 = todo.add_task("Left", dependencies=[t1.task_id])
    t3 = todo.add_task("Right", dependencies=[t1.task_id])
    t4 = todo.add_task("Join", dependencies=[t2.task_id, t3.task_id])

    todo.update_status(t1.task_id, TaskStatus.IN_PROGRESS)
    todo.update_status(t1.task_id, TaskStatus.SUCCEEDED)

    todo.update_status(t2.task_id, TaskStatus.IN_PROGRESS)
    todo.update_status(t2.task_id, TaskStatus.SUCCEEDED)
    assert todo.get_task(t4.task_id).status == TaskStatus.BLOCKED

    todo.update_status(t3.task_id, TaskStatus.IN_PROGRESS)
    todo.update_status(t3.task_id, TaskStatus.SUCCEEDED)
    assert todo.get_task(t4.task_id).status == TaskStatus.READY


def test_dependency_already_succeeded():
    todo = ToDoList()
    t1 = todo.add_task("Parent")
    todo.update_status(t1.task_id, TaskStatus.IN_PROGRESS)
    todo.update_status(t1.task_id, TaskStatus.SUCCEEDED)

    t2 = todo.add_task("Child", dependencies=[t1.task_id])
    assert t2.status == TaskStatus.READY


def test_nonexistent_dependency():
    todo = ToDoList()
    try:
        todo.add_task("Bad dep", dependencies=[999])
        assert False, "Should raise ValueError"
    except ValueError:
        pass


def test_ids_increment_on_failed_add():
    todo = ToDoList()
    todo.add_task("Good task")  # id=1
    try:
        todo.add_task("Bad dep", dependencies=[999])
    except ValueError:
        pass
    t = todo.add_task("After error")
    assert t.task_id == 3  # id=2 consumed by failed add


def test_cascade_failure_deep():
    """4 levels: L0 -> L1 -> L2 -> L3"""
    todo = ToDoList()
    l0 = todo.add_task("L0")
    l1 = todo.add_task("L1", dependencies=[l0.task_id])
    l2 = todo.add_task("L2", dependencies=[l1.task_id])
    l3 = todo.add_task("L3", dependencies=[l2.task_id])

    todo.update_status(l0.task_id, TaskStatus.FAILED)

    assert todo.get_task(l1.task_id).status == TaskStatus.FAILED
    assert todo.get_task(l2.task_id).status == TaskStatus.FAILED
    assert todo.get_task(l3.task_id).status == TaskStatus.FAILED


def test_cascade_failure_fanout():
    """1 parent, 5 children all fail."""
    todo = ToDoList()
    root = todo.add_task("Root")
    children = [todo.add_task(f"Child {i}", dependencies=[root.task_id]) for i in range(5)]

    todo.update_status(root.task_id, TaskStatus.FAILED)

    for child in children:
        assert todo.get_task(child.task_id).status == TaskStatus.FAILED


def test_diamond_cascade_no_infinite_loop():
    """A -> B, A -> C, B -> D, C -> D. Failing A must not loop."""
    todo = ToDoList()
    a = todo.add_task("A")
    b = todo.add_task("B", dependencies=[a.task_id])
    c = todo.add_task("C", dependencies=[a.task_id])
    d = todo.add_task("D", dependencies=[b.task_id, c.task_id])

    todo.update_status(a.task_id, TaskStatus.FAILED)

    assert todo.get_task(b.task_id).status == TaskStatus.FAILED
    assert todo.get_task(c.task_id).status == TaskStatus.FAILED
    assert todo.get_task(d.task_id).status == TaskStatus.FAILED


if __name__ == "__main__":
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
