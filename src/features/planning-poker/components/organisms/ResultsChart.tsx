import { useMemo } from "react";

interface Vote {
  value: number | null;
}

interface ResultsChartProps {
  votes: Vote[];
}

export function ResultsChart({ votes }: ResultsChartProps) {
  const distribution = useMemo(() => {
    const counts = new Map<string, number>();
    votes.forEach((v) => {
      const key = v.value === null ? "?" : String(v.value);
      counts.set(key, (counts.get(key) || 0) + 1);
    });
    return Array.from(counts.entries()).sort((a, b) => {
      if (a[0] === "?") return 1;
      if (b[0] === "?") return -1;
      return Number(a[0]) - Number(b[0]);
    });
  }, [votes]);

  const maxCount = Math.max(...distribution.map(([, count]) => count), 1);
  const total = votes.length;

  if (total === 0) return null;

  return (
    <div className="flex flex-col gap-3">
      <h3 className="text-sm font-semibold text-slate-300">
        Distribution
      </h3>
      <div className="flex flex-col gap-2">
        {distribution.map(([value, count]) => {
          const percentage = (count / maxCount) * 100;
          return (
            <div key={value} className="flex items-center gap-3">
              <span className="w-8 text-sm font-medium text-slate-300">
                {value}
              </span>
              <div className="flex-1">
                <div
                  className="h-6 rounded-md transition-all duration-700 ease-out bg-indigo-600"
                  style={{ width: `${percentage}%`, minWidth: "4px" }}
                />
              </div>
              <span className="w-8 text-right text-xs text-slate-400">
                {count}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
