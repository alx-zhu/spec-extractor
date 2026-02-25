import { ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface DivisionRowProps {
  /** Division code displayed before the name (e.g. "08", "??") */
  code: string;
  /** Human-readable name (e.g. "Openings", "Unclassified") */
  name: string;
  /** Product count shown in the trailing badge */
  count: number;
  /** Whether this row is the currently active filter */
  isActive: boolean;
  onClick: () => void;
  /** Show a collapsible chevron indicator */
  expandable?: boolean;
  /** Chevron rotation state (only relevant when `expandable`) */
  isExpanded?: boolean;
  /** Whether a child section of this row is currently active */
  hasActiveChild?: boolean;
  /** Compact sizing for tighter layouts (e.g. export modal) */
  compact?: boolean;
}

export function DivisionRow({
  code,
  name,
  count,
  isActive,
  onClick,
  expandable = false,
  isExpanded = false,
  hasActiveChild = false,
  compact = false,
}: DivisionRowProps) {
  return (
    <button
      onClick={onClick}
      {...(expandable ? { "aria-expanded": isExpanded } : {})}
      className={cn(
        "w-full flex items-center text-left transition-colors rounded-r-md cursor-pointer",
        compact
          ? "gap-2 px-3 py-2 text-[12px]"
          : "gap-2.5 px-4 py-2.5 text-[13px]",
        isActive
          ? "bg-blue-50 text-blue-700 font-medium"
          : hasActiveChild
            ? "text-blue-600 font-medium hover:bg-gray-50"
            : "text-gray-700 hover:bg-gray-50",
      )}
    >
      {/* Chevron or equal-width spacer to keep text alignment consistent */}
      {expandable ? (
        <ChevronRight
          className={cn(
            "shrink-0 transition-transform duration-200",
            compact ? "h-3 w-3" : "h-3.5 w-3.5",
            isActive || hasActiveChild ? "text-blue-500" : "text-gray-400",
            isExpanded && "rotate-90",
          )}
        />
      ) : (
        <div
          className={cn("shrink-0", compact ? "h-3 w-3" : "h-3.5 w-3.5")}
        />
      )}

      <span className="truncate">
        <span
          className={cn(
            "font-mono",
            compact ? "mr-1" : "mr-1.5",
            hasActiveChild ? "text-blue-400" : "text-gray-400",
          )}
        >
          {code}
        </span>
        {name}
      </span>

      <span className="ml-auto inline-flex items-center justify-center px-1.5 py-0.5 rounded-full text-[10px] font-medium tabular-nums shrink-0 bg-gray-100 text-gray-500">
        {count}
      </span>
    </button>
  );
}
