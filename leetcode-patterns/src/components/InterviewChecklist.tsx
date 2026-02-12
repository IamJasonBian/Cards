import { useState } from "react";
import { CheckSquare, ChevronDown, ChevronUp, Square } from "lucide-react";

interface CheckItem {
  label: string;
  sub?: string[];
}

interface Section {
  title: string;
  color: string;
  items: CheckItem[];
}

const sections: Section[] = [
  {
    title: "Coding Interview",
    color: "indigo",
    items: [
      {
        label: "Clarify the Problem",
        sub: [
          "Restate the problem in your own words",
          "Identify inputs, outputs, and return type",
          "Ask about edge cases (empty, single element, negatives, duplicates)",
          "Confirm constraints (size of n, value range, sorted?)",
          "Ask: can I modify the input in-place?",
        ],
      },
      {
        label: "Explore Approaches & Alternates",
        sub: [
          "Start with brute force -- state its time/space complexity",
          "Identify the bottleneck in brute force",
          "Consider 2-3 alternate approaches (hash map, sort + two pointers, sliding window, etc.)",
          "Pick the best approach and justify why (runtime, space, simplicity)",
          "State the expected time and space complexity before coding",
        ],
      },
      {
        label: "Explain Your Plan",
        sub: [
          "Walk through the algorithm step by step in plain English",
          "Describe the data structures you'll use and why",
          "Mention key variables (left/right, window, visited, dp)",
          "Identify the loop invariant or recursion base case",
          "Get interviewer buy-in before writing code",
        ],
      },
      {
        label: "Code It",
        sub: [
          "Write clean, readable code (meaningful variable names)",
          "Handle base cases / edge cases first",
          "Keep it simple -- avoid over-engineering",
          "Talk while you code (narrate your decisions)",
          "Don't get stuck on syntax -- pseudocode a line and move on",
        ],
      },
      {
        label: "Verify & Test",
        sub: [
          "Dry-run through a simple example step by step",
          "Trace through an edge case (empty, min/max, duplicates)",
          "Check off-by-one errors (loop bounds, indices, len vs len-1)",
          "Verify return value matches expected output",
          "If time: discuss how you'd test this in production",
        ],
      },
      {
        label: "Optimize & Discuss",
        sub: [
          "Confirm final time and space complexity",
          "Can you reduce space? (rolling variables, in-place)",
          "Can you reduce time? (sort + binary search, prefix sums)",
          "Mention trade-offs (readability vs performance)",
          "Discuss follow-ups if prompted (streaming, distributed, larger n)",
        ],
      },
    ],
  },
  {
    title: "LLD / System Design",
    color: "emerald",
    items: [
      {
        label: "Gather Requirements (5 min)",
        sub: [
          "Who are the users? (B2C, B2B, internal)",
          "What are the core use cases? (list top 3-5)",
          "What is the expected scale? (DAU, QPS, storage)",
          "What are the read/write ratios?",
          "What consistency model? (strong, eventual)",
          "What are the latency requirements? (p99 targets)",
          "Any compliance / geographic constraints?",
        ],
      },
      {
        label: "Define API & Data Model (5 min)",
        sub: [
          "List key API endpoints (REST or RPC)",
          "Define request/response schemas",
          "Identify core entities and relationships",
          "Choose SQL vs NoSQL (and justify)",
          "Design the primary table schema / document structure",
          "Identify indexes needed for query patterns",
        ],
      },
      {
        label: "High-Level Architecture (10 min)",
        sub: [
          "Draw client -> load balancer -> service -> DB",
          "Identify read-heavy vs write-heavy paths",
          "Add caching layer (Redis/Memcached) -- what to cache?",
          "Add message queue if async processing needed",
          "Consider CDN for static content",
          "Identify single points of failure",
        ],
      },
      {
        label: "Deep Dive & Scale (10 min)",
        sub: [
          "How to partition/shard the database?",
          "Replication strategy (leader-follower, multi-leader)",
          "Cache invalidation strategy (TTL, write-through, write-behind)",
          "Rate limiting and throttling",
          "How to handle hot partitions / celebrity problem?",
          "Monitoring, alerting, and observability",
        ],
      },
      {
        label: "Trade-offs & Edge Cases (5 min)",
        sub: [
          "CAP theorem: which two are you prioritizing?",
          "What happens during a network partition?",
          "How do you handle failures gracefully? (retries, circuit breakers)",
          "Data migration and backward compatibility",
          "Cost considerations (compute vs storage vs network)",
          "What would you change at 10x / 100x scale?",
        ],
      },
    ],
  },
];

function ChecklistSection({ section }: { section: Section }) {
  const [open, setOpen] = useState(false);
  const [checked, setChecked] = useState<Set<string>>(new Set());

  const toggle = (key: string) => {
    setChecked((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const totalItems = section.items.reduce(
    (acc, item) => acc + (item.sub?.length ?? 1),
    0,
  );
  const checkedCount = checked.size;

  const borderColor =
    section.color === "indigo" ? "border-indigo-200" : "border-emerald-200";
  const bgColor =
    section.color === "indigo" ? "bg-indigo-50" : "bg-emerald-50";
  const textColor =
    section.color === "indigo" ? "text-indigo-700" : "text-emerald-700";
  const progressBg =
    section.color === "indigo" ? "bg-indigo-500" : "bg-emerald-500";

  return (
    <div className={`rounded-xl border ${borderColor} bg-white`}>
      <button
        onClick={() => setOpen(!open)}
        className="w-full p-5 flex items-center justify-between text-left cursor-pointer"
      >
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-lg ${bgColor}`}>
            <CheckSquare size={20} className={textColor} />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">
              {section.title}
            </h3>
            <div className="flex items-center gap-3 mt-1">
              <span className="text-xs text-gray-400">
                {checkedCount} / {totalItems} items
              </span>
              <div className="w-24 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className={`h-full ${progressBg} rounded-full transition-all`}
                  style={{
                    width: `${totalItems > 0 ? (checkedCount / totalItems) * 100 : 0}%`,
                  }}
                />
              </div>
            </div>
          </div>
        </div>
        {open ? (
          <ChevronUp size={20} className="text-gray-400" />
        ) : (
          <ChevronDown size={20} className="text-gray-400" />
        )}
      </button>

      {open && (
        <div className="border-t border-gray-100 px-5 pb-5">
          {section.items.map((item) => (
            <div key={item.label} className="mt-4">
              <p className={`text-sm font-semibold ${textColor} mb-2`}>
                {item.label}
              </p>
              {item.sub && (
                <div className="space-y-1.5 ml-1">
                  {item.sub.map((s) => {
                    const key = `${item.label}::${s}`;
                    const isChecked = checked.has(key);
                    return (
                      <button
                        key={key}
                        onClick={() => toggle(key)}
                        className="flex items-start gap-2 w-full text-left cursor-pointer group"
                      >
                        {isChecked ? (
                          <CheckSquare
                            size={16}
                            className={`${textColor} mt-0.5 shrink-0`}
                          />
                        ) : (
                          <Square
                            size={16}
                            className="text-gray-300 group-hover:text-gray-400 mt-0.5 shrink-0"
                          />
                        )}
                        <span
                          className={`text-sm ${isChecked ? "text-gray-400 line-through" : "text-gray-600"}`}
                        >
                          {s}
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export function InterviewChecklist() {
  return (
    <div className="mt-12">
      <h2 className="text-lg font-bold text-gray-900 mb-4">
        Interview Checklists
      </h2>
      <div className="space-y-3">
        {sections.map((section) => (
          <ChecklistSection key={section.title} section={section} />
        ))}
      </div>
    </div>
  );
}
