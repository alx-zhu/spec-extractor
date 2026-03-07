import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

interface KpiCardProps {
  label: string;
  value: string | number;
  subtext?: string;
  icon: ReactNode;
  progress?: number; // 0–100, renders a thin progress bar if provided
  className?: string;
}

export function KpiCard({
  label,
  value,
  subtext,
  icon,
  progress,
  className,
}: KpiCardProps) {
  return (
    <div
      className={cn(
        "bg-white rounded-xl border border-gray-200 p-6 flex flex-col gap-4 shadow-xs",
        className,
      )}
    >
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-gray-500">{label}</span>
        <span className="text-gray-400">{icon}</span>
      </div>

      <div className="flex flex-col gap-1">
        <span className="text-3xl font-semibold text-gray-900 tracking-tight">
          {value}
        </span>
        {subtext && (
          <span className="text-sm text-gray-500">{subtext}</span>
        )}
      </div>

      {progress !== undefined && (
        <div className="w-full bg-gray-100 rounded-full h-1.5 overflow-hidden">
          <div
            className="h-1.5 rounded-full bg-gray-900 transition-all duration-500"
            style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
          />
        </div>
      )}
    </div>
  );
}
