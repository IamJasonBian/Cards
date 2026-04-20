class ListNode:
    def __init__(self, val=0, next=None):
        self.val = val
        self.next = next


# Iterative
def reverse_iterative(head: ListNode | None) -> ListNode | None:
    prev = None
    curr = head
    while curr:
        nxt = curr.next
        curr.next = prev
        prev = curr
        curr = nxt
    return prev


# Recursive
def reverse_recursive(head: ListNode | None) -> ListNode | None:
    if not head or not head.next:
        return head
    new_head = reverse_recursive(head.next)
    head.next.next = head
    head.next = None
    return new_head


# Stack
def reverse_stack(head: ListNode | None) -> ListNode | None:
    if not head:
        return head
    stack = []
    while head:
        stack.append(head)
        head = head.next
    new_head = cur = stack.pop()
    while stack:
        cur.next = stack.pop()
        cur = cur.next
    cur.next = None
    return new_head
