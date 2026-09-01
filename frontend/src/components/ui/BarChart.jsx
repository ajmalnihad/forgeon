import { formatMoney } from "../../utils/format.js";
import { cn } from "../../utils/cn.js";

/**
 * Deliberately dependency-free chart (no charting library) to keep the
 * bundle small and rendering fast on low-end phones.
 */
export function BarChart({ data = [], className, height = 132 }) {
  const max = Math.max(...data.map((d) => d.value), 1);
  return (
    <div className={cn("w-full", className)}>
      <div className="flex items-end gap-1.5" style={{ height }}>
        {data.map((d) => {
          const pct = Math.max((d.value / max) * 100, 2);
          return (
            <div key={d.label} className="group flex h-full min-w-0 flex-1 flex-col justify-end">
              <span className="mb-1 truncate text-center text-[10px] font-medium text-subtle opacity-0 transition-opacity group-hover:opacity-100 tnum">
                {formatMoney(d.value, { compact: true })}
              </span>
              <div
                className="w-full rounded-t-md bg-accent/80 transition-[height] duration-300 group-hover:bg-accent"
                style={{ height: `${pct}%` }}
                title={`${d.label}: ${formatMoney(d.value)}`}
              />
            </div>
          );
        })}
      </div>
      <div className="mt-2 flex gap-1.5">
        {data.map((d) => (
          <span key={d.label} className="min-w-0 flex-1 truncate text-center text-[10px] text-subtle">
            {d.label}
          </span>
        ))}
      </div>
    </div>
  );
}

export default BarChart;
