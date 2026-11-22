const stats = [
  { value: "639", label: "Problems solved" },
  { value: "75", label: "Blind 75" },
  { value: "150", label: "NeetCode 150" },
  { value: "Python3", label: "Language" },
];

export function StatBand() {
  return (
    <section className="w-full">
      <div className="mx-auto w-full max-w-5xl px-4 sm:px-6 mt-16 sm:mt-24">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
          {stats.map((stat) => (
            <div
              key={stat.label}
              className="rounded-2xl border border-slate-900/10 bg-white/95 sm:bg-white/50 backdrop-blur-sm p-6 sm:p-8 flex flex-col gap-1"
            >
              <span className="text-4xl sm:text-5xl font-bold tracking-tight text-slate-900">
                {stat.value}
              </span>
              <span className="text-sm font-semibold text-slate-500">
                {stat.label}
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
