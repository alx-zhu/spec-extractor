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
import type { ProductStat } from "@/hooks/useDashboardAnalytics";

interface ProductChartProps {
  data: ProductStat[];
}

const TRUNCATE_LENGTH = 22;

function truncate(str: string, maxLen: number) {
  return str.length > maxLen ? str.slice(0, maxLen) + "…" : str;
}

interface TooltipPayloadItem {
  value: number;
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: TooltipPayloadItem[];
  label?: string;
}

function CustomTooltip({ active, payload, label }: CustomTooltipProps) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-gray-200 rounded-lg px-3 py-2 shadow-md text-sm">
      <p className="font-medium text-gray-900 mb-0.5">{label}</p>
      <p className="text-gray-500">
        {payload[0].value}{" "}
        {payload[0].value === 1 ? "occurrence" : "occurrences"}
      </p>
    </div>
  );
}

export function ProductChart({ data }: ProductChartProps) {
  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-48 text-sm text-gray-400">
        No product data yet
      </div>
    );
  }

  const chartData = data.map((d) => ({
    ...d,
    label: truncate(d.name, TRUNCATE_LENGTH),
  }));

  const maxCount = Math.max(...data.map((d) => d.count));

  return (
    <ResponsiveContainer width="100%" height={Math.max(200, data.length * 44)}>
      <BarChart
        data={chartData}
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
          width={140}
          tick={{ fontSize: 12, fill: "#374151" }}
          tickLine={false}
          axisLine={false}
        />
        <Tooltip content={<CustomTooltip />} cursor={{ fill: "#f9fafb" }} />
        <Bar dataKey="count" radius={[0, 4, 4, 0]} maxBarSize={28}>
          {chartData.map((_entry, index) => (
            <Cell
              key={`cell-${index}`}
              fill={index === 0 ? "#374151" : "#e5e7eb"}
            />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
