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
  {
    title: "Behavioural & Soft Skills",
    color: "amber",
    items: [
      {
        label: "Read the Interviewer",
        sub: [
          "Watch for nods, frowns, or confused looks -- adjust your pace",
          "If they lean in or ask a follow-up, dig deeper on that point",
          "If they seem impatient, speed up and cut to the key insight",
          "Mirror their energy level -- match formal or casual tone",
          "If they hint at something, take the hint -- don't ignore it",
          "Notice if they're trying to help you -- accept the lifeline",
        ],
      },
      {
        label: "Communicate Proactively",
        sub: [
          "Think out loud -- silence is your enemy",
          "State your approach BEFORE writing code, not after",
          "When stuck, say what you're stuck on instead of going silent",
          "Narrate trade-offs as you make decisions",
          "Ask 'does this direction make sense?' before going deep",
          "Summarize your solution at the end without being asked",
          "If you change your approach, explain why explicitly",
        ],
      },
      {
        label: "Show Ownership & Drive",
        sub: [
          "Treat it like a real problem, not an exercise -- show you care",
          "Volunteer edge cases and failure modes before asked",
          "Suggest tests and verification steps proactively",
          "If you finish early, offer optimizations or follow-ups",
          "Ask thoughtful questions about the team/product at the end",
          "Show curiosity -- 'I wonder if we could also...'",
        ],
      },
      {
        label: "Manage Your Energy",
        sub: [
          "You should feel spent at the end -- leave nothing on the table",
          "Don't coast after solving it -- push for the optimal solution",
          "If you have time left, discuss testing, monitoring, or scale",
          "Stay engaged even when you're confident -- don't check out",
          "Bring the same intensity to the last round as the first",
          "Pace yourself across rounds -- don't burn out in round 1",
        ],
      },
      {
        label: "Handle Mistakes & Pressure",
        sub: [
          "If you make an error, correct it calmly -- don't panic",
          "Say 'good catch' when the interviewer finds a bug -- not defensive",
          "If you don't know something, say so honestly, then reason through it",
          "Don't apologize repeatedly -- fix the issue and move forward",
          "Use silence strategically: 10 seconds of thinking > rambling",
          "Remember: they want you to succeed -- it's collaborative, not adversarial",
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

  const colorMap: Record<string, { border: string; bg: string; text: string; progress: string }> = {
    indigo: { border: "border-indigo-200", bg: "bg-indigo-50", text: "text-indigo-700", progress: "bg-indigo-500" },
    emerald: { border: "border-emerald-200", bg: "bg-emerald-50", text: "text-emerald-700", progress: "bg-emerald-500" },
    amber: { border: "border-amber-200", bg: "bg-amber-50", text: "text-amber-700", progress: "bg-amber-500" },
  };
  const c = colorMap[section.color] ?? colorMap.indigo;
  const borderColor = c.border;
  const bgColor = c.bg;
  const textColor = c.text;
  const progressBg = c.progress;

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
