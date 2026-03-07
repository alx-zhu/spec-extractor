import { useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import type { DocumentYieldStat } from "@/hooks/useDashboardAnalytics";
import { DOCUMENT_TYPES } from "@/types/product";

const DEFAULT_VISIBLE = 6;

interface DocumentYieldChartProps {
  data: DocumentYieldStat[];
}

const TRUNCATE_LENGTH = 26;

function truncate(str: string, maxLen: number) {
  return str.length > maxLen ? str.slice(0, maxLen) + "…" : str;
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: { value: number }[];
  label?: string;
}

function CustomTooltip({ active, payload, label }: CustomTooltipProps) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-gray-200 rounded-lg px-3 py-2 shadow-md text-sm">
      <p className="font-medium text-gray-900 mb-0.5">{label}</p>
      <p className="text-gray-500">
        {payload[0].value}{" "}
        {payload[0].value === 1 ? "product" : "products"} extracted
      </p>
    </div>
  );
}

// Deterministic fill color per document type
const TYPE_COLORS: Record<string, string> = {
  purchase_order: "#93c5fd",   // blue-300
  specification:  "#c4b5fd",   // violet-300
  drawing:        "#86efac",   // green-300
  rfi:            "#fcd34d",   // amber-300
  submittal:      "#f9a8d4",   // pink-300
};

export function DocumentYieldChart({ data }: DocumentYieldChartProps) {
  const [expanded, setExpanded] = useState(false);

  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-48 text-sm text-gray-400">
        No documents uploaded yet
      </div>
    );
  }

  const chartData = data.map((d) => ({
    ...d,
    label: truncate(d.filename, TRUNCATE_LENGTH),
    typeLabel: DOCUMENT_TYPES[d.type]?.abbreviation ?? d.type,
  }));

  const visibleData = expanded ? chartData : chartData.slice(0, DEFAULT_VISIBLE);
  const maxCount = Math.max(...data.map((d) => d.productCount));
  const hasMore = data.length > DEFAULT_VISIBLE;

  return (
    <div className="space-y-4">
      {/* Type legend */}
      <div className="flex flex-wrap gap-3">
        {Object.entries(TYPE_COLORS).map(([type, color]) => {
          const hasType = data.some((d) => d.type === type);
          if (!hasType) return null;
          return (
            <div key={type} className="flex items-center gap-1.5 text-xs text-gray-500">
              <div
                className="w-2.5 h-2.5 rounded-sm"
                style={{ backgroundColor: color }}
              />
              {DOCUMENT_TYPES[type as keyof typeof DOCUMENT_TYPES]?.label ?? type}
            </div>
          );
        })}
      </div>

      <ResponsiveContainer
        width="100%"
        height={Math.max(200, visibleData.length * 44)}
      >
        <BarChart
          data={visibleData}
          layout="vertical"
          margin={{ top: 0, right: 16, bottom: 0, left: 8 }}
          barCategoryGap="30%"
        >
          <CartesianGrid
            strokeDasharray="3 3"
            horizontal={false}
            stroke="#f3f4f6"
          />
          <XAxis
            type="number"
            domain={[0, maxCount + 1]}
            tick={{ fontSize: 12, fill: "#9ca3af" }}
            tickLine={false}
            axisLine={false}
            allowDecimals={false}
          />
          <YAxis
            type="category"
            dataKey="label"
            width={170}
            tick={{ fontSize: 11, fill: "#374151" }}
            tickLine={false}
            axisLine={false}
          />
          <Tooltip
            content={<CustomTooltip />}
            cursor={{ fill: "#f9fafb" }}
          />
          <Bar dataKey="productCount" radius={[0, 4, 4, 0]} maxBarSize={28}>
            {visibleData.map((entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill={TYPE_COLORS[entry.type] ?? "#d1d5db"}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>

      {hasMore && (
        <button
          onClick={() => setExpanded((prev) => !prev)}
          className="w-full text-center text-xs text-gray-400 hover:text-gray-600 transition-colors py-1 cursor-pointer"
        >
          {expanded
            ? "Show less ↑"
            : `Show all ${data.length} documents ↓`}
        </button>
      )}
    </div>
  );
}
