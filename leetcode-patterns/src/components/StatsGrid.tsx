import { Code, Target, Zap, Award } from "lucide-react";
import { stats } from "../data/patterns";

const statItems = [
  { label: "Total Solved", value: stats.totalSolved, icon: Target, color: "bg-sky-500/10 text-sky-300" },
  { label: "Easy", value: stats.easy, icon: Zap, color: "bg-emerald-500/10 text-emerald-300" },
  { label: "Medium", value: stats.medium, icon: Code, color: "bg-amber-500/10 text-amber-300" },
  { label: "Hard", value: stats.hard, icon: Award, color: "bg-rose-500/10 text-rose-300" },
];

export function StatsGrid() {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
      {statItems.map((item) => (
        <div
          key={item.label}
          className="bg-slate-900/85 sm:bg-slate-900/70 backdrop-blur-2xl rounded-none shadow-sm border border-white/10 p-5 hover:shadow-md transition-shadow"
        >
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-none ${item.color}`}>
              <item.icon size={20} />
            </div>
            <div>
              <p className="text-sm text-slate-400">{item.label}</p>
              <p className="text-2xl font-bold text-slate-100">{item.value}</p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
