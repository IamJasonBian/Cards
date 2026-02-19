import { useState } from "react";
import { CheckSquare, ChevronDown, ChevronUp, Square } from "lucide-react";

interface Section {
  title: string;
  color: string;
  items: string[];
}

const sections: Section[] = [
  {
    title: "Coding Interview",
    color: "indigo",
    items: [
      "Clarify -- restate the problem, ask about edge cases, confirm constraints and input size",
      "List your approach high level first -- outline the strategy in 2-3 sentences before diving in. Stay on rails, talk with clarity, don't meander.",
      "Brute force first -- state its complexity, identify the bottleneck, then propose 2-3 better approaches",
      "Think out loud -- walk through your plan in plain English and get interviewer buy-in BEFORE coding",
      "Read signals -- if they hint, pivot, or say 'what if...', STOP and listen. They're guiding you.",
      "Code clean -- meaningful names, handle edge cases first, narrate as you write",
      "Dry-run your solution -- trace through a simple example, then an edge case, check off-by-one errors",
      "State final time and space complexity -- mention trade-offs and possible optimizations",
      "Be precise, not verbose -- say what matters in few words. Overcommunicating wastes time and buries the signal.",
      "When stuck, say what you're stuck on -- silence is your enemy, keep communicating",
      "If you make an error, fix it calmly -- say 'good catch', don't panic or over-apologize",
      "Leave nothing on the table -- push for optimal, volunteer follow-ups, you should feel spent at the end",
    ],
  },
  {
    title: "System Design",
    color: "emerald",
    items: [
      "Ask every clarifying question you can -- users, geo, scale, SLAs, edge cases. More questions = better scope = better design.",
      "Functional requirements -- list the core use cases (3-5). What can users DO? This is your scope.",
      "Non-functional requirements -- latency (p99), availability (99.9%?), consistency model, scale (DAU/QPS/storage)",
      "Think out loud -- state your assumptions, check in with 'does this direction make sense?'",
      "Draw high-level architecture -- client, LB, services, DB, cache, queue. Keep it big-picture first.",
      "Map each component to a non-functional requirement -- why this cache? (latency). Why this queue? (availability). Justify every box.",
      "Read signals -- if they push on a component, that's where they want depth. Follow their lead.",
      "Deep dive on scale -- sharding, replication, cache invalidation, hot partitions, rate limiting",
      "Discuss trade-offs -- CAP theorem, consistency vs availability, cost vs performance. Every choice has a cost.",
      "Handle failures -- retries, circuit breakers, graceful degradation. What happens during partitions?",
      "Be precise, not verbose -- every sentence should advance the design. Don't ramble or over-explain.",
      "Leave nothing on the table -- discuss monitoring, 10x/100x scale, show curiosity and ownership",
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

  const totalItems = section.items.length;
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
        <div className="border-t border-gray-100 px-5 pb-5 pt-3">
          <div className="space-y-1.5">
            {section.items.map((item) => {
              const isChecked = checked.has(item);
              return (
                <button
                  key={item}
                  onClick={() => toggle(item)}
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
                    {item}
                  </span>
                </button>
              );
            })}
          </div>
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
