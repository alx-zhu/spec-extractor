import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import type { DocumentTypeStat } from "@/hooks/useDashboardAnalytics";

interface DocumentTypeBreakdownProps {
  data: DocumentTypeStat[];
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: { name: string; value: number; color: string }[];
  label?: string;
}

function CustomTooltip({ active, payload, label }: CustomTooltipProps) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-gray-200 rounded-lg px-3 py-2 shadow-md text-sm">
      <p className="font-medium text-gray-900 mb-1">{label}</p>
      {payload.map((entry) => (
        <p key={entry.name} className="text-gray-500">
          <span style={{ color: entry.color }} className="font-medium">
            {entry.name}:{" "}
          </span>
          {entry.value}
        </p>
      ))}
    </div>
  );
}

export function DocumentTypeBreakdown({ data }: DocumentTypeBreakdownProps) {
  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-40 text-sm text-gray-400">
        No documents uploaded yet
      </div>
    );
  }

  const chartData = data.map((d) => ({
    name: d.label,
    "Documents": d.docCount,
    "Products": d.productCount,
  }));

  return (
    <div className="space-y-5">
      {/* Summary rows */}
      <div className="grid grid-cols-1 gap-2">
        {data.map((stat) => (
          <div
            key={stat.type}
            className="flex items-center justify-between py-2.5 border-b border-gray-50 last:border-0"
          >
            <div className="flex items-center gap-3">
              <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-gray-100 text-gray-600 font-mono">
                {stat.abbreviation}
              </span>
              <span className="text-sm text-gray-700">{stat.label}</span>
            </div>
            <div className="flex items-center gap-6 text-sm">
              <span className="text-gray-500">
                <span className="font-semibold text-gray-900">
                  {stat.docCount}
                </span>{" "}
                {stat.docCount === 1 ? "doc" : "docs"}
              </span>
              <span className="text-gray-500">
                <span className="font-semibold text-gray-900">
                  {stat.productCount}
                </span>{" "}
                products
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Chart */}
      <ResponsiveContainer width="100%" height={Math.max(160, data.length * 52)}>
        <BarChart
          data={chartData}
          margin={{ top: 4, right: 8, bottom: 0, left: 8 }}
          barCategoryGap="25%"
          barGap={4}
        >
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
          <XAxis
            dataKey="name"
            tick={{ fontSize: 11, fill: "#6b7280" }}
            tickLine={false}
            axisLine={false}
          />
          <YAxis
            tick={{ fontSize: 11, fill: "#9ca3af" }}
            tickLine={false}
            axisLine={false}
            allowDecimals={false}
          />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: "#f9fafb" }} />
          <Legend
            iconType="circle"
            iconSize={8}
            wrapperStyle={{ fontSize: 12, paddingTop: 8 }}
          />
          <Bar dataKey="Documents" fill="#d1d5db" radius={[4, 4, 0, 0]} maxBarSize={32} />
          <Bar dataKey="Products" fill="#111827" radius={[4, 4, 0, 0]} maxBarSize={32} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
