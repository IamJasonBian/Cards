from typing import List

class Solution:
    def minAvailableDuration(
        self, slots1: List[List[int]], slots2: List[List[int]], duration: int
    ) -> List[int]:
        """Find the earliest time slot common to both schedules of at least ``duration`` minutes.

        Args:
            slots1: List of [start, end] intervals representing the first person's free slots.
            slots2: List of [start, end] intervals representing the second person's free slots.
            duration: Required meeting duration.

        Returns:
            The earliest [start, start + duration] interval satisfying the requirement, or
            an empty list if no such interval exists.
        """
        # Sort both slot lists by start time so we can traverse them with two pointers.
        slots1.sort()
        slots2.sort()

        i = j = 0
        # Traverse slots to find overlapping intervals of sufficient length.
        while i < len(slots1) and j < len(slots2):
            start = max(slots1[i][0], slots2[j][0])
            end = min(slots1[i][1], slots2[j][1])
            if end - start >= duration:
                return [start, start + duration]
            # Advance the pointer that has the earlier ending slot.
            if slots1[i][1] < slots2[j][1]:
                i += 1
            else:
                j += 1
        return []
