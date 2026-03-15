import { useState } from "react";
import { CheckSquare, ChevronDown, ChevronUp, Square } from "lucide-react";

interface SubChecklist {
  title: string;
  items: string[];
}

interface Section {
  title: string;
  color: string;
  items: string[];
  subChecklists?: SubChecklist[];
}

const selfCheckItems: SubChecklist = {
  title: "Post-Interview Retro",
  items: [
    "You clearly clarified the system requirements upfront",
    "You followed a logical and structured design flow",
    "You demonstrated depth when asked to zoom in",
    "You discussed tradeoffs clearly and confidently",
    "The interviewer stayed engaged and collaborative",
    "You proactively brought up scaling and failure scenarios",
    "You summarized your design and offered thoughtful next steps",
    "You stayed calm and adaptable under pressure",
    "You made the conversation feel like a real-world design session",
  ],
};

const frameworkOne: SubChecklist = {
  title: "Interview Framework 1",
  items: [
    "Dealing with ambiguity -- spend the first 5 min clarifying requirements. Have a mental checklist: scale, performance, consistency, business priorities.",
    "Context-driven decisions -- don't just pick a technology. Articulate how each option affects the overall success of the project.",
    "Tradeoff navigation -- follow every design decision with 'The trade-off here is...' Make it a reflex.",
    "Collaboration and feedback -- treat interviewer suggestions as valuable info, not criticism. 'That's an interesting perspective I hadn't considered -- let me explore that.'",
    "Practical intuition -- don't just say 'we'll use a message queue'. Say 'we'll use a queue, but I've seen these cause oncall pain -- we need retry policies, DLQs, or something like Temporal for explicit failure modes.'",
    "Depth flexibility -- seamlessly shift between high-level architecture, component-level interactions, and implementation specifics. Signal transitions: 'Let's zoom in on the storage layer' or 'Let me step back to the overall architecture.'",
  ],
};

const frameworkTwo: SubChecklist = {
  title: "Interview Framework 2",
  items: [
    "The final decision isn't about whether you dropped in a Redis. The interviewer is thinking: 'I wish they had talked more coherently about tradeoffs.'",
    "Don't just name components -- justify them. Why Redis and not Memcached? Why Kafka and not SQS? Tie every choice to a requirement.",
    "When diving deeper, explicitly signal: 'Let's zoom in on X since that's critical for this system.'",
    "When returning to high-level, signal: 'Before we go deeper, let's make sure this approach aligns with our overall requirements.'",
    "Show you can operate at different levels of abstraction -- executives to junior devs. Extract from details for the big picture, dive deep for critical issues.",
    "The most impressive thing you can do is acknowledge when you're changing levels of abstraction.",
  ],
};

const beforeCoding: SubChecklist = {
  title: "Phase 1: Before Coding",
  items: [
    "Restate the problem in your own words -- confirm understanding",
    "Clarify inputs, outputs, and return types",
    "Ask about constraints -- input size, value ranges, duplicates, nulls",
    "Identify edge cases -- empty input, single element, all same, negative values",
    "Confirm expected time/space complexity given input size",
  ],
};

const planSolution: SubChecklist = {
  title: "Phase 2: Plan",
  items: [
    "Think out loud -- state your approach in 2-3 sentences before coding",
    "Start brute force, identify bottleneck, then optimize",
    "Select data structures -- hash map, heap, stack, deque, sorted set",
    "Get interviewer buy-in on approach before writing code",
    "State target time and space complexity",
  ],
};

const whileCoding: SubChecklist = {
  title: "Phase 3: While Coding",
  items: [
    "Use clear variable names -- narrate as you write",
    "Code incrementally -- build core logic first, then edge cases",
    "Handle edge cases explicitly at the top",
    "If stuck, say what you're stuck on -- silence is your enemy",
    "Reassess time/space as you code -- list alternatives if suboptimal",
  ],
};

const afterCoding: SubChecklist = {
  title: "Phase 4: After Coding",
  items: [
    "Dry-run with a sample input -- trace through step by step",
    "Test an edge case -- check off-by-one, empty, boundary values",
    "State final time and space complexity",
    "Be open to feedback -- if they hint, pivot. Say 'good catch', don't panic.",
    "Volunteer optimizations or follow-ups -- leave nothing on the table",
  ],
};

const preInterviewChecklist: SubChecklist = {
  title: "Pre-Interview Checklist",
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
};

const sections: Section[] = [
  {
    title: "Coding Interview",
    color: "indigo",
    items: [],
    subChecklists: [beforeCoding, planSolution, whileCoding, afterCoding, selfCheckItems],
  },
  {
    title: "System Design",
    color: "emerald",
    items: [],
    subChecklists: [preInterviewChecklist, frameworkOne, frameworkTwo, selfCheckItems],
  },
];

function SubChecklistSection({
  sub,
  idx,
  checked,
  toggle,
  subColors,
  subBorders,
}: {
  sub: SubChecklist;
  idx: number;
  checked: Set<string>;
  toggle: (key: string) => void;
  subColors: string[];
  subBorders: string[];
}) {
  const [subOpen, setSubOpen] = useState(false);
  const color = subColors[idx % subColors.length];
  const border = subBorders[idx % subBorders.length];
  const checkedCount = sub.items.filter((item) => checked.has(item)).length;

  return (
    <div className={`mt-3 ml-3 pl-3 border-l-2 ${border}`}>
      <button
        onClick={() => setSubOpen(!subOpen)}
        className="flex items-center gap-2 w-full text-left cursor-pointer"
      >
        <p className={`text-xs font-semibold ${color} uppercase tracking-wide`}>
          {sub.title}
        </p>
        <span className="text-xs text-gray-400">
          {checkedCount}/{sub.items.length}
        </span>
        {subOpen ? (
          <ChevronUp size={14} className="text-gray-400" />
        ) : (
          <ChevronDown size={14} className="text-gray-400" />
        )}
      </button>
      {subOpen && (
        <div className="space-y-1.5 mt-2">
          {sub.items.map((item) => {
            const isChecked = checked.has(item);
            return (
              <button
                key={item}
                onClick={() => toggle(item)}
                className="flex items-start gap-2 w-full text-left cursor-pointer group"
              >
                {isChecked ? (
                  <CheckSquare size={16} className={`${color} mt-0.5 shrink-0`} />
                ) : (
                  <Square size={16} className="text-gray-300 group-hover:text-gray-400 mt-0.5 shrink-0" />
                )}
                <span className={`text-sm ${isChecked ? "text-gray-400 line-through" : "text-gray-600"}`}>
                  {item}
                </span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

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

  const subTotal = section.subChecklists
    ? section.subChecklists.reduce((acc, sc) => acc + sc.items.length, 0)
    : 0;
  const allItems = section.items.length + subTotal;
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

  const subColors = ["text-amber-600", "text-violet-600", "text-rose-500"];
  const subBorders = ["border-amber-200", "border-violet-200", "border-rose-200"];

  const renderCheckItem = (item: string, color: string) => {
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
            className={`${color} mt-0.5 shrink-0`}
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
  };

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
                {checkedCount} / {allItems} items
              </span>
              <div className="w-24 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className={`h-full ${progressBg} rounded-full transition-all`}
                  style={{
                    width: `${allItems > 0 ? (checkedCount / allItems) * 100 : 0}%`,
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
            {section.items.map((item) => renderCheckItem(item, textColor))}
          </div>

          {section.subChecklists?.map((sub, idx) => (
            <SubChecklistSection
              key={sub.title}
              sub={sub}
              idx={idx}
              checked={checked}
              toggle={toggle}
              subColors={subColors}
              subBorders={subBorders}
            />
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
