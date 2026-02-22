import { cn } from "@/lib/utils";

interface RadioIndicatorProps {
  selected: boolean;
}

/**
 * Pure CSS radio circle indicator for source row field selection.
 * Renders a 14px circle — hollow when unselected, filled blue dot when selected.
 */
export function RadioIndicator({ selected }: RadioIndicatorProps) {
  return (
    <div
      role="radio"
      aria-checked={selected}
      className={cn(
        "size-3.5 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors",
        selected
          ? "border-blue-500 bg-white"
          : "border-gray-300 bg-white group-hover/cell:border-gray-400",
      )}
    >
      {selected && (
        <div className="size-1.5 rounded-full bg-blue-500" />
      )}
    </div>
  );
}
