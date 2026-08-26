// Chapter/page data extracted from each PDF's embedded outline (via pypdf).
// Pages are absolute, 1-based viewer pages — exactly what the `#page=N` PDF
// open parameter expects, so `${pdfUrl}#page=${page}` deep-links a chapter.

export interface TheoryChapter {
  title: string;
  page: number;
  depth: 0 | 1; // 0 = part/chapter, 1 = section
}

export interface TheoryDoc {
  docId: string; // stable bookmark-storage key — never rename
  pdfUrl: string;
  pages: number;
  chapters: TheoryChapter[];
}

export const theoryDocs = {
  "sicp-js": {
    docId: "sicp-js",
    pdfUrl:
      "https://sicp.sourceacademy.org/sicpjs.pdf",
    pages: 640,
    chapters: [
      { title: "Foreword", page: 13, depth: 0 },
      { title: "Preface", page: 21, depth: 0 },
      { title: "1 Building Abstractions with Functions", page: 33, depth: 0 },
      { title: "1.1 The Elements of Programming", page: 35, depth: 1 },
      { title: "1.2 Functions and the Processes They Generate", page: 58, depth: 1 },
      { title: "1.3 Formulating Abstractions with Higher-Order Functions", page: 80, depth: 1 },
      { title: "2 Building Abstractions with Data", page: 101, depth: 0 },
      { title: "2.1 Introduction to Data Abstraction", page: 104, depth: 1 },
      { title: "2.2 Hierarchical Data and the Closure Property", page: 116, depth: 1 },
      { title: "2.3 Symbolic Data", page: 156, depth: 1 },
      { title: "2.4 Multiple Representations for Abstract Data", page: 179, depth: 1 },
      { title: "2.5 Systems with Generic Operations", page: 195, depth: 1 },
      { title: "3 Modularity, Objects, and State", page: 221, depth: 0 },
      { title: "3.1 Assignment and Local State", page: 222, depth: 1 },
      { title: "3.2 The Environment Model of Evaluation", page: 238, depth: 1 },
      { title: "3.3 Modeling with Mutable Data", page: 254, depth: 1 },
      { title: "3.4 Concurrency: Time Is of the Essence", page: 295, depth: 1 },
      { title: "3.5 Streams", page: 313, depth: 1 },
      { title: "4 Metalinguistic Abstraction", page: 349, depth: 0 },
      { title: "4.1 The Metacircular Evaluator", page: 351, depth: 1 },
      { title: "4.2 Lazy Evaluation", page: 392, depth: 1 },
      { title: "4.3 Nondeterministic Computing", page: 405, depth: 1 },
      { title: "4.4 Logic Programming", page: 430, depth: 1 },
      { title: "5 Computing with Register Machines", page: 481, depth: 0 },
      { title: "5.1 Designing Register Machines", page: 482, depth: 1 },
      { title: "5.2 A Register-Machine Simulator", page: 500, depth: 1 },
      { title: "5.3 Storage Allocation and Garbage Collection", page: 519, depth: 1 },
      { title: "5.4 The Explicit-Control Evaluator", page: 531, depth: 1 },
      { title: "5.5 Compilation", page: 551, depth: 1 },
      { title: "References", page: 597, depth: 0 },
      { title: "Index", page: 603, depth: 0 },
    ],
  },
  "ddia": {
    docId: "ddia",
    pdfUrl:
      "https://0-lucas.github.io/digital-garden/99.-Books/Martin-Kleppmann---Designing-Data-Intensive-Applications_-O%E2%80%99Reilly-Media-(2017).pdf",
    pages: 491,
    chapters: [
      { title: "About this Book", page: 15, depth: 0 },
      { title: "Part I. Foundations of Data Systems", page: 21, depth: 0 },
      { title: "Chapter 1. Reliable, Scalable and Maintainable Applications", page: 23, depth: 0 },
      { title: "Thinking About Data Systems", page: 24, depth: 1 },
      { title: "Reliability", page: 26, depth: 1 },
      { title: "Scalability", page: 30, depth: 1 },
      { title: "Maintainability", page: 38, depth: 1 },
      { title: "Summary", page: 42, depth: 1 },
      { title: "Chapter 2. Data Models and Query Languages", page: 47, depth: 0 },
      { title: "Relational Model vs. Document Model", page: 48, depth: 1 },
      { title: "Query Languages for Data", page: 64, depth: 1 },
      { title: "Graph-like Data Models", page: 70, depth: 1 },
      { title: "Summary", page: 84, depth: 1 },
      { title: "Chapter 3. Storage and Retrieval", page: 89, depth: 0 },
      { title: "Data Structures that Power Your Database", page: 90, depth: 1 },
      { title: "Transaction Processing or Analytics?", page: 109, depth: 1 },
      { title: "Column-oriented storage", page: 115, depth: 1 },
      { title: "Summary", page: 122, depth: 1 },
      { title: "Chapter 4. Encoding and Evolution", page: 129, depth: 0 },
      { title: "Formats for Encoding Data", page: 130, depth: 1 },
      { title: "Modes of Data Flow", page: 146, depth: 1 },
      { title: "Summary", page: 157, depth: 1 },
      { title: "Part II. Distributed Data", page: 163, depth: 0 },
      { title: "Chapter 5. Replication", page: 167, depth: 0 },
      { title: "Leaders and Followers", page: 168, depth: 1 },
      { title: "Problems With Replication Lag", page: 177, depth: 1 },
      { title: "Multi-leader replication", page: 183, depth: 1 },
      { title: "Leaderless replication", page: 193, depth: 1 },
      { title: "Summary", page: 208, depth: 1 },
      { title: "Chapter 6. Partitioning", page: 213, depth: 0 },
      { title: "Partitioning and replication", page: 214, depth: 1 },
      { title: "Partitioning of key-value data", page: 215, depth: 1 },
      { title: "Partitioning and secondary indexes", page: 219, depth: 1 },
      { title: "Rebalancing partitions", page: 223, depth: 1 },
      { title: "Request routing", page: 227, depth: 1 },
      { title: "Summary", page: 230, depth: 1 },
      { title: "Chapter 7. Transactions", page: 235, depth: 0 },
      { title: "The slippery concept of a transaction", page: 236, depth: 1 },
      { title: "Weak isolation levels", page: 246, depth: 1 },
      { title: "Serializability", page: 264, depth: 1 },
      { title: "Summary", page: 279, depth: 1 },
      { title: "Chapter 8. The Trouble with Distributed Systems", page: 287, depth: 0 },
      { title: "Faults and Partial Failures", page: 288, depth: 1 },
      { title: "Unreliable Networks", page: 291, depth: 1 },
      { title: "Unreliable Clocks", page: 300, depth: 1 },
      { title: "Knowledge, Truth and Lies", page: 313, depth: 1 },
      { title: "Summary", page: 324, depth: 1 },
      { title: "Chapter 9. Consistency and Consensus", page: 333, depth: 0 },
      { title: "Consistency Guarantees", page: 334, depth: 1 },
      { title: "Linearizability", page: 336, depth: 1 },
      { title: "Ordering Guarantees", page: 351, depth: 1 },
      { title: "Distributed Transactions and Consensus", page: 365, depth: 1 },
      { title: "Summary", page: 385, depth: 1 },
      { title: "Part III. Derived Data", page: 397, depth: 0 },
      { title: "Chapter 10. Batch Processing", page: 399, depth: 0 },
      { title: "Batch Processing with Unix Tools", page: 401, depth: 1 },
      { title: "MapReduce and Distributed Filesystems", page: 407, depth: 1 },
      { title: "Beyond MapReduce", page: 428, depth: 1 },
      { title: "Summary", page: 438, depth: 1 },
      { title: "Chapter 11. Stream Processing", page: 447, depth: 0 },
      { title: "Transmitting Event Streams", page: 448, depth: 1 },
      { title: "Databases and streams", page: 458, depth: 1 },
      { title: "Processing Streams", page: 470, depth: 1 },
      { title: "Summary", page: 484, depth: 1 },
    ],
  },
  "garey-johnson-np-appendix": {
    docId: "garey-johnson-np-appendix",
    pdfUrl:
      "/garey-johnson-appendix-np-list.pdf",
    pages: 52,
    chapters: [],
  },
} satisfies Record<string, TheoryDoc>;

export type TheoryDocId = keyof typeof theoryDocs;
