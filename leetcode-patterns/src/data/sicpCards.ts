// A small experimental deck: exercises from our SICP (JavaScript edition) copy.
//
// The prompt is the book's own wording, transcribed from the PDF, rather than a
// paraphrase — `prompt` is a block list so the interleaved code the exercises
// print comes through as code.
//
// SICP ships no official solutions: Source Academy's worked material is
// instructor-only, so every public set is reader-written. Cards therefore link
// out rather than carrying an answer of their own.
//
// The links point at mk12.github.io/sicp, which is the one set that is live,
// covers chapter 3, and deep-links per exercise. It solves the *Scheme*
// original, so the reasoning carries over but the code does not — worth saying
// on the card, since our copy is the JavaScript edition. The community Scheme
// wiki that these solutions are often credited to has been offline since 2018
// (it answers every URL with a maintenance notice), and the JavaScript solution
// repos on GitHub stop before chapter 3.

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
  /** Reader-written solutions. SICP publishes none of its own. */
  solutions: SicpSolutionLink[];
}

export interface SicpSolutionLink {
  label: string;
  url: string;
  /** How this source differs from our copy, where it does. */
  caveat?: string;
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
    solutions: [
      {
        label: "mk12.github.io/sicp — exercise 3.10",
        url: "https://mk12.github.io/sicp/exercise/3/2.html#ex3.10",
        caveat:
          "Scheme, where the original writes let rather than an immediately invoked lambda — the book notes the two are the same thing, so the environment argument carries over unchanged.",
      },
    ],
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
    solutions: [
      {
        label: "mk12.github.io/sicp — exercise 3.23",
        url: "https://mk12.github.io/sicp/exercise/3/3.html#ex3.23",
        caveat:
          "Scheme, so the pair operations are set-car!/set-cdr! rather than set_head/set_tail; the doubly linked representation is the same.",
      },
    ],
  },
];

/** Deep-links a card at its exercise page in the PDF the Theory view reads. */
export const SICP_PDF_URL = "https://sicp.sourceacademy.org/sicpjs.pdf";
