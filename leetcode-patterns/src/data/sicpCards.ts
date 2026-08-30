// A small experimental deck: exercises from our SICP (JavaScript edition) copy.
// Deliberately plainer than the main deck — prompt, short answer, one takeaway,
// and a page link into the PDF. These are reading aids, not spaced-repetition
// cards, so they carry no review state and never hit /api.

export interface SicpCard {
  id: string;
  exercise: string;
  /** Subsection the exercise belongs to, as printed in the outline. */
  section: string;
  /** Absolute PDF viewer page of the exercise itself, not of its subsection. */
  page: number;
  q: string;
  a: string;
  /** The one line worth remembering a week later. */
  key: string;
  code?: string;
}

export const sicpCards: SicpCard[] = [
  {
    id: "sicp-3-10",
    exercise: "3.10",
    section: "3.2.3 Frames as the Repository of Local State",
    page: 249,
    q: "make_withdraw can take balance as a parameter, or create it with an immediately invoked lambda. Show that both versions behave the same, and say how their environment structures differ.",
    a: "Both behave identically: each gives the returned function exactly one binding of balance on its environment chain, created fresh per call and kept alive because the returned function points at its frame. The extra frame in the lambda version binds a different name, initial_amount, and is never assigned to, so it cannot intercept a lookup. The structures differ in depth — one frame per withdrawal processor becomes two — and in what is retained: the lambda version keeps the opening amount for the life of the object, while the parameter version overwrites its only record of it on the first withdrawal.",
    key: "The extra frame sits above balance, not around it — so balance is still one hop out, and only names in the program environment cost more.",
    code: `A:  make_withdraw(balance)
      → E1{balance} → program

B:  make_withdraw(initial_amount)
      → E2{balance} → E1{initial_amount} → program`,
  },
  {
    id: "sicp-3-23",
    exercise: "3.23",
    section: "3.3.2 Representing Queues",
    page: 267,
    q: "Represent a deque using pairs — constructor, empty test, front and rear selectors, and insert/delete at both ends. Every operation must run in Θ(1) steps.",
    a: "Of the four mutators, the section's queue can already do three in constant time. The one it cannot is rear_delete_deque: it needs the rear's predecessor, and a singly linked list has to walk the whole chain to find it. Give every node a backward link as well as a forward one and that walk becomes a single hop, which puts all eight operations in Θ(1). The deque itself stays what it was — a pair of pointers at the two ends.",
    key: "node = pair(item, pair(prev, next)). The back-pointer is the entire exercise; everything else is the queue you already had.",
    code: `function make_node(item) {
    return pair(item, pair(null, null));
}

function rear_delete_deque(dq) {
    const prv = node_prev(rear_ptr(dq));  // one link, no walk
    if (is_null(prv)) {
        set_front_ptr(dq, null);
        set_rear_ptr(dq, null);
    } else {
        set_node_next(prv, null);
        set_rear_ptr(dq, prv);
    }
    return dq;
}`,
  },
];

/** Deep-links a card at its exercise page in the PDF the Theory view uses. */
export const SICP_PDF_URL = "https://sicp.sourceacademy.org/sicpjs.pdf";
