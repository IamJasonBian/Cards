// Outline + original short summaries of a third-party system design guide.
// Only the headings mirror the source; the summary bullets are written fresh
// and are a scaffold for the owner's own notes, not a substitute for the
// articles. Do not paste source prose, tables, code or images in here.

export interface Section {
  id: string;
  title: string;
  /** Heading anchor on the source page (sourceUrl + "#" + anchor). */
  anchor: string;
  /** Subsection headings in source order, so later notes line up with it. */
  subsections: string[];
  /** Self-contained facts, one per bullet (future flashcards). */
  summary: string[];
  terms: string[];
  /** Owner annotations go here. */
  notes: string[];
}

export interface Chapter {
  id: string;
  title: string;
  /** Short line for landing cards and nav. */
  description: string;
  sourceUrl: string;
  sections: Section[];
}

export const SOURCE_NAME = "Hello Interview: System Design in a Hurry";

const BASE = "https://www.hellointerview.com/learn/system-design/in-a-hurry";

export const chapters: Chapter[] = [
  {
    id: "core-concepts",
    title: "Core Concepts",
    description: "Networking, APIs, data modeling, indexes, caching, sharding, and CAP.",
    sourceUrl: `${BASE}/core-concepts`,
    sections: [
      {
        id: "networking-essentials",
        title: "Networking Essentials",
        anchor: "networking-essentials",
        subsections: [],
        summary: [
          "HTTP over TCP is the default protocol; pick something else only with a stated reason.",
          "SSE is one-way server push over a plain HTTP connection; WebSockets are two-way and only worth their stateful complexity when clients also push often.",
          "gRPC (binary encoding on HTTP/2) suits internal service-to-service calls; browsers lack native support, so REST stays on the public edge.",
          "L7 load balancers route on request content; L4 balancers just spread TCP connections, which is what long-lived WebSockets usually need.",
          "New York to London costs roughly 80 ms of round-trip physics before any work is done, which is why global low latency needs regional deployments and CDNs.",
        ],
        terms: ["HTTP", "TCP", "SSE", "WebSocket", "gRPC", "L4 vs L7", "long polling", "CDN"],
        notes: [],
      },
      {
        id: "api-design",
        title: "API Design",
        anchor: "api-design",
        subsections: [],
        summary: [
          "REST is the default: resources as URLs, HTTP verbs as the actions.",
          "Budget a couple of minutes for 4-5 key endpoints; still polishing the API ten minutes in means too much depth.",
          "Cursor pagination suits feeds that change while being read; offset pagination is fine otherwise.",
          "JWTs for user sessions, API keys for service-to-service calls, rate limiting when abuse is plausible.",
        ],
        terms: ["REST", "pagination", "cursor", "JWT", "API key", "rate limiting"],
        notes: [],
      },
      {
        id: "data-modeling",
        title: "Data Modeling",
        anchor: "data-modeling",
        subsections: [],
        summary: [
          "Relational fits structured, related data that needs transactions and strong consistency; NoSQL fits shifting schemas and join-free horizontal scale.",
          "Normalization stores each fact once (consistent, but reads need joins); denormalization duplicates data for fast reads and pays on every update.",
          "Safe default: start normalized, then denormalize only the specific hot read paths you can point to.",
          "In DynamoDB-style stores the partition and sort keys are chosen from known access patterns; a query you did not design for becomes a full scan.",
        ],
        terms: ["normalization", "denormalization", "join", "partition key", "sort key", "access pattern"],
        notes: [],
      },
      {
        id: "database-indexing",
        title: "Database Indexing",
        anchor: "database-indexing",
        subsections: [],
        summary: [
          "An index turns a full-table scan into a direct lookup; choose indexes from the fields your queries filter on.",
          "B-trees are the default because they serve both equality and range queries; hash indexes serve equality only.",
          "Multi-field filters (city plus date) call for a compound index.",
          "Full-text and geospatial needs often go to external indexes such as Elasticsearch or PostGIS, usually fed by CDC, so they trail the primary slightly.",
        ],
        terms: ["B-tree", "hash index", "compound index", "full-text index", "geospatial index", "CDC"],
        notes: [],
      },
      {
        id: "caching",
        title: "Caching",
        anchor: "caching",
        subsections: [],
        summary: [
          "A Redis hit is about 1 ms versus 20-50 ms for a typical database query, and it takes read load off the database.",
          "Cache-aside is the workhorse: read the cache, on a miss read the database, then populate the cache with a TTL.",
          "Invalidation is the hard part: delete on write, lean on short TTLs, or do both, depending on how fresh the data must be.",
          "A stampede is many simultaneous misses on one expired hot key; counter it with a rebuild lock, early refresh, or jittered TTLs.",
          "Cache only data that is read often and changes rarely; CDN caches cover static assets and in-process caches cover small config-like values.",
        ],
        terms: ["cache-aside", "TTL", "invalidation", "cache stampede", "thundering herd", "circuit breaker", "Redis"],
        notes: [],
      },
      {
        id: "sharding",
        title: "Sharding",
        anchor: "sharding",
        subsections: [],
        summary: [
          "Shard only after a single node plus read replicas is exhausted: terabytes of storage or tens of thousands of writes per second.",
          "The shard key decides which queries stay on one shard (fast) and which must fan out to all of them (slow); say that trade-off out loud.",
          "Hash sharding spreads load evenly, range sharding risks hot spots, and directory sharding adds a lookup hop to every request.",
          "Costs of sharding: cross-shard transactions (sagas or distributed transactions), celebrity hot shards, and painful resharding.",
        ],
        terms: ["shard key", "hash sharding", "range sharding", "directory sharding", "hot spot", "saga", "resharding"],
        notes: [],
      },
      {
        id: "consistent-hashing",
        title: "Consistent Hashing",
        anchor: "consistent-hashing",
        subsections: [],
        summary: [
          "With hash-mod-N placement, changing N remaps almost every key.",
          "Consistent hashing puts nodes and keys on a ring and assigns each key to the next node clockwise, so a membership change moves only the neighbouring range.",
          "Growing a 10-node cluster by one moves about 90% of keys under modulo hashing and about 10% on a ring.",
          "It underlies cache clusters, Cassandra and DynamoDB partitioning, and some load balancers and CDNs; mention it when nodes scale elastically.",
        ],
        terms: ["hash ring", "modulo hashing", "rebalancing", "elastic scaling"],
        notes: [],
      },
      {
        id: "cap-theorem",
        title: "CAP Theorem",
        anchor: "cap-theorem",
        subsections: [],
        summary: [
          "Partitions are a given in a distributed system, so the real choice during one is consistency or availability.",
          "Default to availability with eventual consistency; require strong consistency where stale reads cost money: balances, inventory, seat booking.",
          "Consistency can be chosen per feature, for example eventual for reviews and strong for stock counts.",
          "PACELC extends CAP: even with a healthy network, stronger consistency is paid for in latency because replicas must coordinate.",
        ],
        terms: ["consistency", "availability", "partition tolerance", "eventual consistency", "strong consistency", "PACELC"],
        notes: [],
      },
      {
        id: "numbers-to-know",
        title: "Numbers to Know",
        anchor: "numbers-to-know",
        subsections: [],
        summary: [
          "Do estimates at the moment they decide something (shard or not, one cache node or many), not as an opening ritual.",
          "Latency ladder: memory in nanoseconds, SSD in microseconds, same-datacenter network 1-10 ms, cross-continent tens to hundreds of ms.",
          "Modern single nodes are big: a database handles tens of thousands of queries per second and several terabytes; a Redis node handles 100k+ ops per second.",
          "Rough ceilings to scale against: about 10k write TPS per database, about 100k connections per app server, up to about 1M messages per second per broker.",
        ],
        terms: ["back-of-the-envelope", "QPS", "TPS", "latency", "headroom", "consumer lag"],
        notes: [],
      },
    ],
  },
  {
    id: "delivery-framework",
    title: "Delivery Framework",
    description: "Requirements → entities → API → high-level design → deep dives, timed for the interview room.",
    sourceUrl: `${BASE}/delivery`,
    sections: [
      {
        id: "requirements",
        title: "Requirements (~5 minutes)",
        anchor: "requirements-5-minutes",
        subsections: [
          "1) Functional Requirements",
          "2) Non-functional Requirements",
          "3) Capacity Estimation",
        ],
        summary: [
          "Functional requirements are user-facing capabilities; negotiate them with the interviewer and keep only the top three or so.",
          "Non-functional requirements are system qualities; pick the 3-5 that matter here and attach a number and a scope (search under 500 ms, not just \"fast\").",
          "Quality checklist: CAP stance, environment limits, scale shape and read/write mix, latency, durability, security, fault tolerance, compliance.",
          "Skip up-front capacity math and say so; calculate later only when the result would change the design.",
        ],
        terms: ["functional requirements", "non-functional requirements", "DAU", "read/write ratio", "capacity estimation"],
        notes: [],
      },
      {
        id: "core-entities",
        title: "Core Entities (~2 minutes)",
        anchor: "core-entities-2-minutes",
        subsections: [],
        summary: [
          "List the handful of nouns the API exchanges and the system stores, as an explicit first draft.",
          "Leave fields and columns for the high-level design, once it is clear what state each request touches.",
          "Find entities by asking who the actors are and which resources the functional requirements need; name them well.",
        ],
        terms: ["entity", "actor", "resource", "data model"],
        notes: [],
      },
      {
        id: "api-or-system-interface",
        title: "API or System Interface (~5 minutes)",
        anchor: "api-or-system-interface-5-minutes",
        subsections: [],
        summary: [
          "The API is the contract that drives the design and usually maps one-to-one onto the functional requirements.",
          "Default to REST with plural-noun resources; choose GraphQL for clients with varied data needs and RPC for fast internal calls.",
          "Take the caller's identity from the auth token, never from the request body or path.",
          "Design the core request/response API first; layer WebSockets or SSE on afterwards for real-time features.",
        ],
        terms: ["REST", "GraphQL", "RPC", "resource", "auth token"],
        notes: [],
      },
      {
        id: "data-flow",
        title: "[Optional] Data Flow (~5 minutes)",
        anchor: "optional-data-flow-5-minutes",
        subsections: [],
        summary: [
          "For pipeline-style systems, write the ordered steps that turn inputs into outputs as a short list.",
          "That list seeds the high-level design; skip the step when there is no long processing sequence.",
        ],
        terms: ["data flow", "pipeline"],
        notes: [],
      },
      {
        id: "high-level-design",
        title: "High Level Design (~10-15 minutes)",
        anchor: "high-level-design-10-15-minutes",
        subsections: [],
        summary: [
          "Draw boxes and arrows that satisfy the API one endpoint at a time; a simple, complete design comes first.",
          "When a cache or queue seems tempting, note it out loud and defer it to the deep dives.",
          "Narrate how each request moves through the system and which stored state it changes.",
          "Write only the design-relevant fields next to the datastore; skip obvious columns and types.",
        ],
        terms: ["component", "persistence layer", "schema", "whiteboarding"],
        notes: [],
      },
      {
        id: "deep-dives",
        title: "Deep Dives (~10 minutes)",
        anchor: "deep-dives-10-minutes",
        subsections: [],
        summary: [
          "Spend the remaining time hardening the design: meet each non-functional requirement, cover edge cases, remove bottlenecks.",
          "Senior candidates are expected to find and lead these topics; junior candidates can expect more prompting.",
          "Leave room for the interviewer's probes, since talking over them hides the signals they are looking for.",
          "Typical dive for a feed product: fan-out on read versus fan-out on write, plus caching.",
        ],
        terms: ["bottleneck", "horizontal scaling", "fan-out on read", "fan-out on write", "edge case"],
        notes: [],
      },
    ],
  },
  {
    id: "common-patterns",
    title: "Common Patterns",
    description: "Realtime push, long jobs, contention, scaling reads/writes, blobs, workflows, and geo.",
    sourceUrl: `${BASE}/patterns`,
    sections: [
      {
        id: "pushing-realtime-updates",
        title: "Pushing Realtime Updates",
        anchor: "pushing-realtime-updates",
        subsections: [],
        summary: [
          "Client-side protocol ladder: start with plain HTTP polling and move to SSE or WebSockets only when polling stops being good enough.",
          "Server-side fan-out options: pub/sub to decouple senders from connection holders, or stateful servers (for example on a consistent hash ring) when per-connection processing is heavy.",
        ],
        terms: ["polling", "SSE", "WebSocket", "pub/sub", "stateful server"],
        notes: [],
      },
      {
        id: "managing-long-running-tasks",
        title: "Managing Long-Running Tasks",
        anchor: "managing-long-running-tasks",
        subsections: [],
        summary: [
          "Split slow work into a fast acknowledgement and background processing: validate, enqueue, return a job ID, let workers do the rest.",
          "The split gives quick responses, independent scaling of web and worker tiers, and failure isolation.",
          "Do not queue short jobs; a synchronous answer is simpler and gives clearer back-pressure.",
          "Plan for job status tracking, retries, and a dead letter queue for poison messages.",
        ],
        terms: ["job queue", "worker pool", "job ID", "retry", "dead letter queue", "back-pressure"],
        notes: [],
      },
      {
        id: "dealing-with-contention",
        title: "Dealing with Contention",
        anchor: "dealing-with-contention",
        subsections: [],
        summary: [
          "Contention means concurrent writers on one resource, such as the last ticket or a live auction bid.",
          "Escalation path: single-database transactions and atomic operations, then pessimistic or optimistic locking, then distributed locks, two-phase commit, or queue serialization.",
          "Splitting data across databases gives up the contention handling a single database provides, so do it late and be ready to justify it.",
        ],
        terms: ["race condition", "pessimistic locking", "optimistic concurrency", "transaction", "distributed lock", "two-phase commit"],
        notes: [],
      },
      {
        id: "scaling-reads",
        title: "Scaling Reads",
        anchor: "scaling-reads",
        subsections: [],
        summary: [
          "Reads usually outgrow writes first; ratios start near 10:1 and commonly pass 100:1.",
          "Progression: tune inside the database (indexes, denormalization), add read replicas, then add external caches and CDNs.",
          "Each step brings a cost: replication lag on replicas, invalidation on caches, and hot keys for very popular content.",
        ],
        terms: ["read replica", "replication lag", "cache invalidation", "hot key", "denormalization"],
        notes: [],
      },
      {
        id: "scaling-writes",
        title: "Scaling Writes",
        anchor: "scaling-writes",
        subsections: [],
        summary: [
          "Core tools: horizontal sharding, vertical partitioning by data type, and batching to cut per-write overhead.",
          "A good partition key spreads load evenly while keeping related data on the same shard.",
          "Absorb bursts with a write queue, or shed low-priority writes when overloaded.",
        ],
        terms: ["sharding", "vertical partitioning", "partition key", "batching", "write queue", "load shedding"],
        notes: [],
      },
      {
        id: "handling-large-blobs",
        title: "Handling Large Blobs",
        anchor: "handling-large-blobs",
        subsections: [],
        summary: [
          "Keep large files off application servers: clients upload straight to blob storage using short-lived presigned URLs.",
          "Serve downloads through a CDN, with signed URLs for access control.",
          "The hard part is keeping database metadata in step with what is actually in storage; storage event notifications close that loop.",
        ],
        terms: ["presigned URL", "blob storage", "CDN", "resumable upload", "event notification"],
        notes: [],
      },
      {
        id: "multi-step-processes",
        title: "Multi-Step Processes",
        anchor: "multi-step-processes",
        subsections: [],
        summary: [
          "Workflows that span services (orders, onboarding, payments) must survive crashes, retries, and slow external dependencies.",
          "Options run from single-server orchestration, to event-driven steps, to workflow engines such as Temporal or Step Functions.",
          "Durable execution moves state tracking, retries, and audit history out of hand-written code and into the platform.",
        ],
        terms: ["orchestration", "workflow engine", "durable execution", "event sourcing", "Temporal", "Step Functions"],
        notes: [],
      },
      {
        id: "proximity-based-services",
        title: "Proximity-Based Services",
        anchor: "proximity-based-services",
        subsections: [],
        summary: [
          "Location search relies on a geospatial index that carves the map into regions so most of it can be skipped.",
          "Common choices: PostGIS on Postgres, Redis geo commands, or Elasticsearch geo queries.",
          "A geo index pays off at hundreds of thousands of items or more; for about a thousand, a plain scan is better.",
          "Queries are usually local to the user, not global.",
        ],
        terms: ["geospatial index", "PostGIS", "Redis geo", "geo query"],
        notes: [],
      },
      {
        id: "pattern-selection",
        title: "Pattern Selection",
        anchor: "pattern-selection",
        subsections: [],
        summary: [
          "Patterns combine: a video site uses large-blob upload, long-running transcoding, realtime progress, and a multi-step workflow together.",
          "Begin with the simplest variant (polling, one orchestrating server) and add machinery only for a stated requirement.",
        ],
        terms: ["pattern composition", "trade-off"],
        notes: [],
      },
    ],
  },
  {
    id: "key-technologies",
    title: "Key Technologies",
    description: "Databases, blob storage, search, gateways, load balancers, queues, streams, locks, cache, CDN.",
    sourceUrl: `${BASE}/key-technologies`,
    sections: [
      {
        id: "core-database",
        title: "Core Database",
        anchor: "core-database",
        subsections: ["Relational Databases", "NoSQL Databases"],
        summary: [
          "Know one database deeply (Postgres for product-style rounds, DynamoDB for infrastructure-style) and justify it by the features you will use.",
          "Avoid blanket SQL-versus-NoSQL claims; the two overlap heavily in what they can model and how far they scale.",
          "Relational strengths to cite: arbitrary joins (which are also a performance risk), many and specialised indexes, ACID transactions.",
          "NoSQL covers key-value, document, column-family, and graph models, with consistency from strong to eventual and scale-out via partitioning.",
          "Cassandra's append-only storage favours write-heavy workloads.",
        ],
        terms: ["ACID", "join", "index", "transaction", "key-value", "document store", "column-family", "Postgres", "DynamoDB", "Cassandra"],
        notes: [],
      },
      {
        id: "blob-storage",
        title: "Blob Storage",
        anchor: "blob-storage",
        subsections: [],
        summary: [
          "Put large unstructured files in an object store such as S3 and keep only metadata and a pointer in the main database.",
          "Upload and download go directly between client and storage through presigned URLs, with a CDN in front for reads.",
          "Treat durability and capacity as given; object storage costs a small fraction of database storage per gigabyte.",
          "Multipart (chunked) upload makes large transfers resumable and parallel.",
        ],
        terms: ["S3", "object store", "presigned URL", "multipart upload", "erasure coding", "origin"],
        notes: [],
      },
      {
        id: "search-optimized-database",
        title: "Search Optimized Database",
        anchor: "search-optimized-database",
        subsections: [],
        summary: [
          "Substring matching with LIKE forces a full table scan; a search engine instead keeps an inverted index from term to documents.",
          "Text is tokenized and stemmed before indexing, and fuzzy matching tolerates typos using edit distance.",
          "Elasticsearch (built on Lucene) is the standard pick and scales by sharding across nodes.",
          "Postgres GIN indexes can provide full-text search without adding a second system.",
        ],
        terms: ["inverted index", "tokenization", "stemming", "fuzzy search", "edit distance", "Elasticsearch", "GIN index"],
        notes: [],
      },
      {
        id: "api-gateway",
        title: "API Gateway",
        anchor: "api-gateway",
        subsections: [],
        summary: [
          "A gateway is the single client entry point that routes each request to the right backend service.",
          "It also owns cross-cutting concerns: authentication, rate limiting, logging.",
          "Include one in product-style designs, but expect little probing on it.",
        ],
        terms: ["routing", "authentication", "rate limiting", "microservices", "Kong", "nginx"],
        notes: [],
      },
      {
        id: "load-balancer",
        title: "Load Balancer",
        anchor: "load-balancer",
        subsections: [],
        summary: [
          "A load balancer spreads traffic across the identical instances of a horizontally scaled service.",
          "On the diagram, draw one at the front or simply state that services are horizontally scaled, not one per service.",
          "Rule of thumb: L4 for persistent connections such as WebSockets, L7 otherwise for flexible content-based routing.",
        ],
        terms: ["horizontal scaling", "L4", "L7", "sticky sessions", "ELB", "HAProxy"],
        notes: [],
      },
      {
        id: "queue",
        title: "Queue",
        anchor: "queue",
        subsections: [],
        summary: [
          "Queues buffer bursts and hand work to a pool of workers, decoupling producers from consumers so each scales on its own.",
          "A queue in a synchronous path with a tight latency target (around 500 ms) will almost certainly break that target.",
          "A queue hides a capacity shortfall but does not fix it; apply back-pressure by rejecting or slowing producers.",
          "Know ordering guarantees, retry settings, dead letter queues, and partitioning by key.",
        ],
        terms: ["FIFO", "retry", "dead letter queue", "partition key", "back-pressure", "Kafka", "SQS"],
        notes: [],
      },
      {
        id: "streams-event-sourcing",
        title: "Streams / Event Sourcing",
        anchor: "streams-event-sourcing",
        subsections: [],
        summary: [
          "A stream retains messages for a configured period, so consumers can re-read from an earlier position, unlike a queue.",
          "Event sourcing records state changes as an ordered event log that can be replayed to rebuild or audit state.",
          "Reach for streams for high-volume real-time processing, event sourcing, or several independent consumers of the same data.",
          "Concepts to know: partitions, consumer groups, replication, and time or count windows for aggregates.",
        ],
        terms: ["stream", "event sourcing", "consumer group", "partition", "windowing", "Kafka", "Flink", "Kinesis"],
        notes: [],
      },
      {
        id: "distributed-lock",
        title: "Distributed Lock",
        anchor: "distributed-lock",
        subsections: [],
        summary: [
          "Database transaction locks are short-lived; a distributed lock holds a resource across processes for minutes, such as a seat during checkout.",
          "It is built on an atomic set in a key-value store like Redis or ZooKeeper; Redlock is the multi-instance Redis variant.",
          "Always give the lock an expiry so a crashed holder cannot block everyone.",
          "Decide lock granularity (one item or a group) and guard against deadlock when taking more than one lock.",
        ],
        terms: ["distributed lock", "Redlock", "lock expiry", "TTL", "granularity", "deadlock", "ZooKeeper"],
        notes: [],
      },
      {
        id: "distributed-cache",
        title: "Distributed Cache",
        anchor: "distributed-cache",
        subsections: [],
        summary: [
          "An in-memory cache tier cuts latency and database load for expensive queries, precomputed aggregates, and session data.",
          "Eviction policies: LRU, LFU, FIFO.",
          "Write strategies: write-through (consistent, slower writes), write-around (misses after writes), write-back (fast, can lose data).",
          "State exactly what is cached and in which structure, for example a sorted set for a ranked list.",
        ],
        terms: ["LRU", "LFU", "write-through", "write-around", "write-back", "sorted set", "Redis", "Memcached"],
        notes: [],
      },
      {
        id: "cdn",
        title: "CDN",
        anchor: "cdn",
        subsections: [],
        summary: [
          "A CDN is a geographically distributed cache that answers from the edge nearest the user and pulls from the origin on a miss.",
          "Main use is static media, but it can also cache rarely-changing dynamic pages and API responses.",
          "Freshness is controlled with TTLs and explicit invalidation.",
        ],
        terms: ["edge location", "origin", "TTL", "invalidation", "Cloudflare", "CloudFront"],
        notes: [],
      },
    ],
  },
];
