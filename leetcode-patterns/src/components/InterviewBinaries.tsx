import { FileCode, ExternalLink, Calendar, Code2 } from "lucide-react";

export function InterviewBinaries() {
  const coderpadProblems = [
    {
      name: "ToDo List with Task Dependencies",
      path: "/coderpad/app/todo",
      description: "OOD problem: Build a task management system with states and dependencies",
      topics: ["OOD", "Data Structures", "Dependencies"],
      parts: ["Basic Features", "Dependencies", "Searching/Filtering", "Tags & Priority"],
    },
  ];

  return (
    <div className="max-w-5xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900 mb-3 flex items-center gap-3">
          <FileCode className="text-cyan-600" size={32} />
          Interview Binaries
        </h1>
        <p className="text-slate-700">
          Collection of interview problems and practice exercises from various platforms
        </p>
      </div>

      <div className="space-y-6">
        <section>
          <h2 className="text-xl font-semibold text-slate-900 mb-4 flex items-center gap-2">
            <Code2 size={20} className="text-cyan-600" />
            CoderPad Problems
          </h2>

          <div className="space-y-4">
            {coderpadProblems.map((problem, idx) => (
              <div
                key={idx}
                className="bg-white/85 sm:bg-white/65 backdrop-blur-2xl border border-slate-900/10 rounded-none p-6 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between mb-3">
                  <h3 className="text-lg font-semibold text-slate-900">
                    {problem.name}
                  </h3>
                  <a
                    href={`https://github.com/IamJasonBian/leetcode-contest/tree/main${problem.path}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 text-sm text-cyan-600 hover:text-cyan-700 font-medium"
                  >
                    View on GitHub
                    <ExternalLink size={14} />
                  </a>
                </div>

                <p className="text-slate-700 mb-4">{problem.description}</p>

                <div className="flex flex-wrap gap-2 mb-4">
                  {problem.topics.map((topic) => (
                    <span
                      key={topic}
                      className="px-2.5 py-1 bg-cyan-100 text-cyan-700 rounded-none text-xs font-medium"
                    >
                      {topic}
                    </span>
                  ))}
                </div>

                <div className="border-t border-slate-900/5 pt-4">
                  <p className="text-sm font-medium text-slate-700 mb-2">
                    Problem Parts:
                  </p>
                  <ul className="grid grid-cols-2 gap-2">
                    {problem.parts.map((part, partIdx) => (
                      <li
                        key={partIdx}
                        className="text-sm text-slate-700 flex items-center gap-2"
                      >
                        <span className="w-5 h-5 rounded-none bg-slate-100/90 sm:bg-slate-100/70 text-slate-700 flex items-center justify-center text-xs font-medium">
                          {partIdx + 1}
                        </span>
                        {part}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="bg-cyan-50 border border-cyan-500/30 rounded-none p-6">
          <h3 className="text-lg font-semibold text-slate-900 mb-2 flex items-center gap-2">
            <Calendar size={18} className="text-cyan-600" />
            How to Use
          </h3>
          <ul className="space-y-2 text-sm text-slate-700">
            <li className="flex items-start gap-2">
              <span className="text-cyan-600 font-bold">•</span>
              <span>
                Clone the repository and navigate to the problem directory
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-cyan-600 font-bold">•</span>
              <span>
                Each problem has multiple parts that build on each other
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-cyan-600 font-bold">•</span>
              <span>
                Run the test files to verify your implementation
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-cyan-600 font-bold">•</span>
              <span>
                Review the notes files for hints and implementation details
              </span>
            </li>
          </ul>
        </section>
      </div>
    </div>
  );
}
