const stats = [
  { value: "639", label: "Problems solved" },
  { value: "75", label: "Blind 75" },
  { value: "150", label: "NeetCode 150" },
  { value: "Python3", label: "Language" },
];

export function StatBand() {
  return (
    <section className="w-full">
      <div className="mx-auto w-full max-w-5xl px-4 sm:px-6 pt-16 sm:pt-24 pb-8 text-center">
        <p className="text-xs font-semibold uppercase tracking-[0.15em] text-slate-500 [text-shadow:_0_1px_12px_rgb(255_255_255_/_80%)]">
          By the numbers
        </p>
      </div>

      <div className="mx-auto w-full max-w-5xl border-l border-t border-slate-900/10">
        <div className="grid grid-cols-2 md:grid-cols-4">
          {stats.map((stat) => (
            <div
              key={stat.label}
              className="border-r border-b border-slate-900/10 bg-white/50 backdrop-blur-sm p-6 sm:p-8 flex flex-col gap-1"
            >
              <span className="text-4xl sm:text-5xl font-bold tracking-tight text-slate-900">
                {stat.value}
              </span>
              <span className="text-xs font-semibold uppercase tracking-[0.15em] text-slate-500">
                {stat.label}
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
