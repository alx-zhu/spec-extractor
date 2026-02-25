import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  ArrowDownNarrowWide,
  ArrowUpNarrowWide,
  Plus,
  Search,
  SlidersHorizontal,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  type SortConfig,
  SORT_OPTIONS,
} from "@/components/table/shared/sorting";

interface TableToolbarProps {
  // Sort
  sortConfig: SortConfig;
  onSortChange: (config: SortConfig) => void;
  // Search
  searchQuery: string;
  onSearchChange: (query: string) => void;
  // Filter
  onFilterToggle: () => void;
  activeFilterLabel: string | null;
  onClearFilter: () => void;
  // Create
  isCreating: boolean;
  onToggleCreate: () => void;
  showCreateButton: boolean;
}

export function TableToolbar({
  sortConfig,
  onSortChange,
  searchQuery,
  onSearchChange,
  onFilterToggle,
  activeFilterLabel,
  onClearFilter,
  isCreating,
  onToggleCreate,
  showCreateButton,
}: TableToolbarProps) {
  return (
    <div className="px-6 py-3 border-b border-gray-200 flex justify-between items-center bg-white gap-2">
      {/* Left: sort, search, filter */}
      <div className="flex items-center gap-2">
        {/* Search Box */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            type="text"
            placeholder="Search by name, tag..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-9 w-80 h-8 text-sm bg-gray-50 border-gray-200"
          />
        </div>

        {/* Sort control — dropdown + direction toggle as a single unit */}
        <div className="inline-flex items-center h-8 rounded-md border border-gray-200 bg-white overflow-hidden">
          <Select
            value={sortConfig.columnId}
            onValueChange={(columnId) => {
              onSortChange(
                sortConfig.columnId === columnId
                  ? {
                      ...sortConfig,
                      direction:
                        sortConfig.direction === "asc" ? "desc" : "asc",
                    }
                  : { columnId, direction: "asc" },
              );
            }}
          >
            <SelectTrigger
              size="sm"
              className="h-full border-0 shadow-none rounded-none px-2.5 text-xs text-gray-600 gap-1 focus:ring-0"
            >
              <span className="text-gray-400 shrink-0">Sort:</span>
              <SelectValue />
            </SelectTrigger>
            <SelectContent position="popper" align="start">
              {SORT_OPTIONS.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <button
            type="button"
            className="h-full px-2 border-l border-gray-200 text-gray-500 hover:bg-gray-50 hover:text-gray-700 transition-colors cursor-pointer"
            onClick={() =>
              onSortChange({
                ...sortConfig,
                direction: sortConfig.direction === "asc" ? "desc" : "asc",
              })
            }
            aria-label={`Sort ${sortConfig.direction === "asc" ? "descending" : "ascending"}`}
          >
            {sortConfig.direction === "asc" ? (
              <ArrowUpNarrowWide className="h-3.5 w-3.5" />
            ) : (
              <ArrowDownNarrowWide className="h-3.5 w-3.5" />
            )}
          </button>
        </div>

        {/* Filter toggle */}
        <Button
          variant="outline"
          size="icon"
          className={cn(
            "h-8 w-8",
            activeFilterLabel &&
              "border-blue-200 bg-blue-50 text-blue-600 hover:bg-blue-100",
          )}
          onClick={onFilterToggle}
        >
          <SlidersHorizontal className="h-4 w-4" />
        </Button>

        {/* Active filter chip */}
        {activeFilterLabel && (
          <button
            onClick={onClearFilter}
            className="inline-flex items-center gap-2 pl-3 pr-2 py-1.5 bg-blue-50 text-blue-700 rounded-lg text-xs font-medium hover:bg-blue-100 transition-colors"
            aria-label="Clear filter"
          >
            <span className="truncate max-w-[180px]">{activeFilterLabel}</span>
            <X className="h-3.5 w-3.5 text-blue-400 hover:text-blue-600 cursor-pointer" />
          </button>
        )}
      </div>

      {/* Right: add product */}
      {showCreateButton && (
        <Button
          variant="outline"
          size="sm"
          className={cn(
            "h-8 gap-1.5 text-xs shrink-0",
            isCreating
              ? "border-blue-200 bg-blue-50 text-blue-600 hover:bg-blue-100 hover:text-blue-700"
              : "",
          )}
          onClick={onToggleCreate}
        >
          <Plus className="h-4 w-4" />
          Add manual product
        </Button>
      )}
    </div>
  );
}
