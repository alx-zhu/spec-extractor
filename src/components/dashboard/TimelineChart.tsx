import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import type { TimelineStat } from "@/hooks/useDashboardAnalytics";

interface TimelineChartProps {
  data: TimelineStat[];
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
        {payload[0].value === 1 ? "product extracted" : "products extracted"}
      </p>
    </div>
  );
}

export function TimelineChart({ data }: TimelineChartProps) {
  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-40 text-sm text-gray-400">
        No extraction history yet
      </div>
    );
  }

  // Single data point — show a simple stat instead of a useless chart
  if (data.length === 1) {
    return (
      <div className="flex flex-col items-center justify-center h-40 gap-1">
        <span className="text-3xl font-semibold text-gray-900">
          {data[0].count}
        </span>
        <span className="text-sm text-gray-500">
          products extracted in {data[0].month}
        </span>
      </div>
    );
  }

  const maxCount = Math.max(...data.map((d) => d.count));

  return (
    <ResponsiveContainer width="100%" height={180}>
      <AreaChart
        data={data}
        margin={{ top: 8, right: 16, bottom: 0, left: 0 }}
      >
        <defs>
          <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#111827" stopOpacity={0.12} />
            <stop offset="95%" stopColor="#111827" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
        <XAxis
          dataKey="month"
          tick={{ fontSize: 12, fill: "#9ca3af" }}
          tickLine={false}
          axisLine={false}
        />
        <YAxis
          domain={[0, maxCount + 1]}
          tick={{ fontSize: 12, fill: "#9ca3af" }}
          tickLine={false}
          axisLine={false}
          allowDecimals={false}
          width={32}
        />
        <Tooltip content={<CustomTooltip />} cursor={{ stroke: "#e5e7eb" }} />
        <Area
          type="monotone"
          dataKey="count"
          stroke="#111827"
          strokeWidth={2}
          fill="url(#areaGradient)"
          dot={{ fill: "#111827", strokeWidth: 0, r: 4 }}
          activeDot={{ r: 5, fill: "#111827" }}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
