import pytest
from solution import ListNode, reverse_iterative, reverse_recursive, reverse_stack


def to_list(head):
    result = []
    while head:
        result.append(head.val)
        head = head.next
    return result


def from_list(vals):
    if not vals:
        return None
    head = ListNode(vals[0])
    cur = head
    for v in vals[1:]:
        cur.next = ListNode(v)
        cur = cur.next
    return head


CASES = [
    ([], []),
    ([1], [1]),
    ([1, 2], [2, 1]),
    ([1, 2, 3], [3, 2, 1]),
    ([1, 2, 3, 4, 5], [5, 4, 3, 2, 1]),
    ([1, 1, 1], [1, 1, 1]),
    ([-3, -2, -1], [-1, -2, -3]),
    ([1, 3, 4, 2, 5], [5, 2, 4, 3, 1]),
]


@pytest.mark.parametrize("fn", [reverse_iterative, reverse_recursive, reverse_stack])
@pytest.mark.parametrize("input_vals, expected", CASES)
def test_reverse(fn, input_vals, expected):
    assert to_list(fn(from_list(input_vals))) == expected
