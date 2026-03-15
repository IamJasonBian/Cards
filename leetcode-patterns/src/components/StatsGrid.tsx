import { Code, Target, Zap, Award } from "lucide-react";
import { stats } from "../data/patterns";

const statItems = [
  { label: "Total Solved", value: stats.totalSolved, icon: Target, color: "bg-blue-100 text-blue-600" },
  { label: "Easy", value: stats.easy, icon: Zap, color: "bg-green-100 text-green-600" },
  { label: "Medium", value: stats.medium, icon: Code, color: "bg-yellow-100 text-yellow-600" },
  { label: "Hard", value: stats.hard, icon: Award, color: "bg-red-100 text-red-600" },
];

export function StatsGrid() {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
      {statItems.map((item) => (
        <div
          key={item.label}
          className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 hover:shadow-md transition-shadow"
        >
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${item.color}`}>
              <item.icon size={20} />
            </div>
            <div>
              <p className="text-sm text-gray-500">{item.label}</p>
              <p className="text-2xl font-bold text-gray-900">{item.value}</p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
