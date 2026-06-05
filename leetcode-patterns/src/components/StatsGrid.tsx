import { Code, Target, Zap, Award } from "lucide-react";
import { stats } from "../data/patterns";

const statItems = [
  { label: "Total Solved", value: stats.totalSolved, icon: Target, color: "bg-sky-50 text-sky-700" },
  { label: "Easy", value: stats.easy, icon: Zap, color: "bg-emerald-50 text-emerald-700" },
  { label: "Medium", value: stats.medium, icon: Code, color: "bg-amber-50 text-amber-700" },
  { label: "Hard", value: stats.hard, icon: Award, color: "bg-rose-50 text-rose-700" },
];

export function StatsGrid() {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
      {statItems.map((item) => (
        <div
          key={item.label}
          className="bg-white/85 sm:bg-white/65 backdrop-blur-2xl rounded-none shadow-sm border border-slate-900/10 p-5 hover:shadow-md transition-shadow"
        >
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-none ${item.color}`}>
              <item.icon size={20} />
            </div>
            <div>
              <p className="text-sm text-slate-500">{item.label}</p>
              <p className="text-2xl font-bold text-slate-900">{item.value}</p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
