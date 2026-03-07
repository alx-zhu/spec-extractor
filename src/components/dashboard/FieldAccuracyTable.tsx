import { cn } from "@/lib/utils";
import type { FieldAccuracyStat } from "@/hooks/useDashboardAnalytics";

interface FieldAccuracyTableProps {
  data: FieldAccuracyStat[];
  totalProducts: number;
}

function StackedBar({ filled, na, empty }: { filled: number; na: number; empty: number }) {
  // Ensure segments add to exactly 100 to avoid rounding gaps
  const total = filled + na + empty;
  if (total === 0) {
    return (
      <div className="h-2 w-full rounded-full bg-gray-100" />
    );
  }
  // Use exact pixel-percentages via flex
  return (
    <div className="h-2 w-full rounded-full overflow-hidden flex bg-gray-100">
      {filled > 0 && (
        <div
          className="h-full bg-gray-900 transition-all duration-500"
          style={{ width: `${filled}%` }}
          title={`Filled: ${filled}%`}
        />
      )}
      {na > 0 && (
        <div
          className="h-full bg-amber-400 transition-all duration-500"
          style={{ width: `${na}%` }}
          title={`N/A: ${na}%`}
        />
      )}
      {/* empty fills the rest automatically via flex */}
    </div>
  );
}

function QualityBadge({ fillRate }: { fillRate: number }) {
  if (fillRate >= 90) {
    return (
      <span className="text-xs font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
        Good
      </span>
    );
  }
  if (fillRate >= 60) {
    return (
      <span className="text-xs font-medium text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full">
        Review
      </span>
    );
  }
  return (
    <span className="text-xs font-medium text-red-700 bg-red-50 px-2 py-0.5 rounded-full">
      Low
    </span>
  );
}

export function FieldAccuracyTable({ data, totalProducts }: FieldAccuracyTableProps) {
  if (totalProducts === 0) {
    return (
      <div className="flex items-center justify-center h-40 text-sm text-gray-400">
        No products extracted yet
      </div>
    );
  }

  return (
    <div className="space-y-1">
      {/* Legend */}
      <div className="flex items-center gap-4 pb-3 border-b border-gray-100">
        <div className="flex items-center gap-1.5 text-xs text-gray-500">
          <div className="w-2.5 h-2.5 rounded-full bg-gray-900" />
          Filled
        </div>
        <div className="flex items-center gap-1.5 text-xs text-gray-500">
          <div className="w-2.5 h-2.5 rounded-full bg-amber-400" />
          N/A (field not applicable in document)
        </div>
        <div className="flex items-center gap-1.5 text-xs text-gray-500">
          <div className="w-2.5 h-2.5 rounded-full bg-gray-100 border border-gray-200" />
          Not extracted
        </div>
      </div>

      {/* Rows */}
      {data.map((stat) => (
        <div
          key={stat.field}
          className={cn(
            "grid items-center gap-4 py-3 border-b border-gray-50 last:border-0",
          )}
          style={{ gridTemplateColumns: "130px 1fr 52px 64px 64px 64px" }}
        >
          {/* Field name + quality badge */}
          <div className="flex items-center gap-2 min-w-0">
            <span className="text-sm font-medium text-gray-700 truncate">
              {stat.label}
            </span>
          </div>

          {/* Stacked bar */}
          <StackedBar
            filled={stat.fillRate}
            na={stat.naRate}
            empty={stat.emptyRate}
          />

          {/* Fill % */}
          <span
            className={cn(
              "text-sm font-semibold text-right tabular-nums",
              stat.fillRate >= 90
                ? "text-gray-900"
                : stat.fillRate >= 60
                  ? "text-amber-600"
                  : "text-red-600",
            )}
          >
            {stat.fillRate}%
          </span>

          {/* Filled count */}
          <span className="text-xs text-gray-500 text-right tabular-nums">
            {stat.filledCount} filled
          </span>

          {/* N/A count */}
          <span className="text-xs text-amber-600 text-right tabular-nums">
            {stat.naCount > 0 ? `${stat.naCount} N/A` : "—"}
          </span>

          {/* Quality badge */}
          <div className="flex justify-end">
            <QualityBadge fillRate={stat.fillRate} />
          </div>
        </div>
      ))}

      {/* Footer summary */}
      <div className="pt-3 flex items-center justify-between text-xs text-gray-400">
        <span>Sorted by fill rate — lowest first</span>
        <span>
          Based on {totalProducts} {totalProducts === 1 ? "product" : "products"}
        </span>
      </div>
    </div>
  );
}
