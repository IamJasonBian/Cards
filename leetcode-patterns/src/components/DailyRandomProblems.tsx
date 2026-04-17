import { useEffect, useState } from "react";
import { Shuffle } from "lucide-react";

interface DailyProblem {
  title: string;
  titleSlug: string;
  difficulty: string;
}

interface DailyPayload {
  updatedAt: string;
  easy: DailyProblem;
  medium: DailyProblem;
  hard: DailyProblem;
}

const DIFFICULTY_STYLES: Record<string, string> = {
  Easy: "bg-green-50 text-green-700 border-green-200 hover:bg-green-100",
  Medium: "bg-yellow-50 text-yellow-700 border-yellow-200 hover:bg-yellow-100",
  Hard: "bg-red-50 text-red-700 border-red-200 hover:bg-red-100",
};

export function DailyRandomProblems() {
  const [data, setData] = useState<DailyPayload | null>(null);

  useEffect(() => {
    fetch("/daily-problems.json", { cache: "no-cache" })
      .then((r) => (r.ok ? r.json() : null))
      .then((json) => setData(json))
      .catch(() => setData(null));
  }, []);

  if (!data) return null;

  const items: DailyProblem[] = [data.easy, data.medium, data.hard];

  return (
    <div className="bg-white border-b border-gray-200">
      <div className="px-6 py-3 flex items-center gap-3 flex-wrap">
        <div className="flex items-center gap-1.5 text-xs font-medium text-gray-500">
          <Shuffle size={14} />
          Daily picks
        </div>
        <div className="flex gap-2 flex-wrap">
          {items.map((p) => (
            <a
              key={p.titleSlug}
              href={`https://leetcode.com/problems/${p.titleSlug}/`}
              target="_blank"
              rel="noopener noreferrer"
              className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors cursor-pointer ${
                DIFFICULTY_STYLES[p.difficulty] ??
                "bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100"
              }`}
            >
              <span className="uppercase tracking-wide mr-1.5">
                {p.difficulty}
              </span>
              <span className="text-gray-800">{p.title}</span>
            </a>
          ))}
        </div>
        <span className="ml-auto text-[11px] text-gray-400">
          updated {data.updatedAt}
        </span>
      </div>
    </div>
  );
}
