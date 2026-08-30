// A small experimental deck: exercises from our SICP (JavaScript edition) copy.
//
// The prompt is the book's own wording, transcribed from the PDF, rather than a
// paraphrase — `prompt` is a block list so the interleaved code the exercises
// print comes through as code.
//
// SICP ships no official solutions: Source Academy's worked material is
// instructor-only, and every public set (the Scheme community wiki, the JS
// solution repos) is reader-written. So what a card carries under the problem
// is our own working, labelled as such — never presented as the book's answer.

export type SicpBlock =
  | { kind: "p"; text: string }
  | { kind: "code"; text: string };

export interface SicpCard {
  id: string;
  exercise: string;
  /** Subsection the exercise belongs to, as printed in the outline. */
  section: string;
  /** Absolute PDF viewer page of the exercise itself, not of its subsection. */
  page: number;
  /** The exercise as printed, transcribed verbatim. */
  prompt: SicpBlock[];
  /** The book's footnote on the exercise, where it has one. */
  footnote?: string;
  /** Our working — not the book's, which does not exist. */
  notes: string;
  /** The one line worth remembering a week later. */
  key: string;
  notesCode?: string;
}

export const sicpCards: SicpCard[] = [
  {
    id: "sicp-3-10",
    exercise: "3.10",
    section: "3.2.3 Frames as the Repository of Local State",
    page: 249,
    prompt: [
      {
        kind: "p",
        text: "In the make_withdraw function the local variable balance is created as a parameter of make_withdraw. We could also create the local state variable separately, using what we might call an immediately invoked lambda expression as follows:",
      },
      {
        kind: "code",
        text: `function make_withdraw(initial_amount) {
    return (balance =>
              amount => {
                  if (balance >= amount) {
                      balance = balance - amount;
                      return balance;
                  } else {
                      return "insufficient funds";
                  }
              })(initial_amount);
}`,
      },
      {
        kind: "p",
        text: "The outer lambda expression is invoked immediately after it is evaluated. Its only purpose is to create a local variable balance and initialize it to initial_amount. Use the environment model to analyze this alternate version of make_withdraw, drawing figures like the ones above to illustrate the interactions",
      },
      {
        kind: "code",
        text: `const W1 = make_withdraw(100);
W1(50);
const W2 = make_withdraw(100);`,
      },
      {
        kind: "p",
        text: "Show that the two versions of make_withdraw create objects with the same behavior. How do the environment structures differ for the two versions?",
      },
    ],
    notes:
      "Both behave identically: each gives the returned function exactly one binding of balance on its environment chain, created fresh per call and kept alive because the returned function points at its frame. The extra frame in the lambda version binds a different name, initial_amount, and is never assigned to, so it cannot intercept a lookup. The structures differ in depth — one frame per withdrawal processor becomes two — and in what is retained: the lambda version keeps the opening amount for the life of the object, while the parameter version overwrites its only record of it on the first withdrawal.",
    key: "The extra frame sits above balance, not around it — so balance is still one hop out, and only names in the program environment cost more.",
    notesCode: `A:  make_withdraw(balance)
      → E1{balance} → program

B:  make_withdraw(initial_amount)
      → E2{balance} → E1{initial_amount} → program`,
  },
  {
    id: "sicp-3-23",
    exercise: "3.23",
    section: "3.3.2 Representing Queues",
    page: 267,
    prompt: [
      {
        kind: "p",
        text: "A deque (“double-ended queue”) is a sequence in which items can be inserted and deleted either at the front or at the rear. Operations on deques are the constructor make_deque, the predicate is_empty_deque, selectors front_deque and rear_deque, and mutators front_insert_deque, front_delete_deque, rear_insert_deque, and rear_delete_deque. Show how to represent deques using pairs, and give implementations of the operations. All operations should be accomplished in Θ(1) steps.",
      },
    ],
    footnote:
      "Be careful not to make the interpreter try to print a structure that contains cycles. (See exercise 3.13.)",
    notes:
      "Of the four mutators, the section's queue can already do three in constant time. The one it cannot is rear_delete_deque: it needs the rear's predecessor, and a singly linked list has to walk the whole chain to find it. Give every node a backward link as well as a forward one and that walk becomes a single hop, which puts all eight operations in Θ(1). The deque itself stays what it was — a pair of pointers at the two ends.",
    key: "node = pair(item, pair(prev, next)). The back-pointer is the entire exercise; everything else is the queue you already had.",
    notesCode: `function make_node(item) {
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

/** Deep-links a card at its exercise page in the PDF the Theory view reads. */
export const SICP_PDF_URL = "https://sicp.sourceacademy.org/sicpjs.pdf";
