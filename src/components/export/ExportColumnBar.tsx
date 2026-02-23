import { cn } from "@/lib/utils";
import type { ExportColumn } from "@/utils/export";

interface ExportColumnBarProps {
  columns: ExportColumn[];
  onToggleColumn: (key: string) => void;
  onToggleAll: () => void;
}

export function ExportColumnBar({
  columns,
  onToggleColumn,
  onToggleAll,
}: ExportColumnBarProps) {
  const allEnabled = columns.every((col) => col.enabled);
  const enabledCount = columns.filter((col) => col.enabled).length;

  return (
    <div className="flex items-center gap-2 flex-wrap">
      <span className="text-[11px] font-medium text-gray-400 uppercase tracking-wide mr-1">
        Columns
      </span>

      <button
        onClick={onToggleAll}
        className={cn(
          "px-2.5 py-1 rounded-md text-[12px] font-medium transition-colors cursor-pointer",
          allEnabled
            ? "bg-gray-900 text-white"
            : "bg-gray-100 text-gray-500 hover:bg-gray-200",
        )}
      >
        All ({enabledCount}/{columns.length})
      </button>

      <div className="w-px h-4 bg-gray-200" />

      {columns.map((column) => (
        <button
          key={column.key}
          onClick={() => onToggleColumn(column.key)}
          className={cn(
            "px-2.5 py-1 rounded-md text-[12px] font-medium transition-colors cursor-pointer",
            column.enabled
              ? "bg-gray-900 text-white"
              : "bg-gray-100 text-gray-400 hover:bg-gray-200 hover:text-gray-600",
          )}
        >
          {column.label}
        </button>
      ))}
    </div>
  );
}
