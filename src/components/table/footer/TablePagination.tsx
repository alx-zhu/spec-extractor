import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

const PAGE_SIZE_OPTIONS = [10, 25, 50, 100] as const;

/** Build a compact page number list like: 1 … 5 [6] 7 … 12 */
function getPageNumbers(
  current: number,
  total: number,
): (number | "ellipsis")[] {
  if (total <= 5) {
    return Array.from({ length: total }, (_, i) => i + 1);
  }

  const pages: (number | "ellipsis")[] = [];
  const nearStart = current <= 3;
  const nearEnd = current >= total - 2;

  if (nearStart) {
    for (let i = 1; i <= 3; i++) pages.push(i);
    pages.push("ellipsis", total);
  } else if (nearEnd) {
    pages.push(1, "ellipsis");
    for (let i = total - 2; i <= total; i++) pages.push(i);
  } else {
    pages.push(1, "ellipsis", current, "ellipsis", total);
  }

  return pages;
}

interface TablePaginationProps {
  totalItems: number;
  pageSize: number;
  onPageSizeChange: (size: number) => void;
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

export function TablePagination({
  totalItems,
  pageSize,
  onPageSizeChange,
  currentPage,
  totalPages,
  onPageChange,
}: TablePaginationProps) {
  const safePage = Math.min(currentPage, totalPages);
  const rangeStart = totalItems === 0 ? 0 : (safePage - 1) * pageSize + 1;
  const rangeEnd = Math.min(safePage * pageSize, totalItems);

  return (
    <div className="px-6 py-3 border-t border-gray-200 flex justify-between items-center bg-white">
      <div className="flex items-center gap-3">
        <span className="text-sm text-gray-500">
          {totalItems === 0
            ? "No products"
            : `Showing ${rangeStart}-${rangeEnd} of ${totalItems}`}
        </span>
        <Select
          value={String(pageSize)}
          onValueChange={(v) => onPageSizeChange(Number(v))}
        >
          <SelectTrigger
            size="sm"
            className="h-7 min-w-14 px-2 text-xs text-gray-500 border-gray-200"
          >
            <SelectValue />
          </SelectTrigger>
          <SelectContent position="popper" align="start">
            {PAGE_SIZE_OPTIONS.map((size) => (
              <SelectItem key={size} value={String(size)}>
                {size}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <span className="text-xs text-gray-400">per page</span>
      </div>
      <div className="flex items-center gap-0.5">
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-gray-400 hover:text-gray-600"
          disabled={safePage <= 1}
          onClick={() => onPageChange(Math.max(1, safePage - 1))}
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        {getPageNumbers(safePage, totalPages).map((item, i) =>
          item === "ellipsis" ? (
            <span
              key={`ellipsis-${i}`}
              className="h-8 min-w-5 flex items-center justify-center text-xs text-gray-300 select-none"
            >
              …
            </span>
          ) : (
            <Button
              key={item}
              variant={item === safePage ? "outline" : "ghost"}
              size="sm"
              className={cn(
                "h-8 min-w-8 px-2 text-xs",
                item === safePage
                  ? "bg-gray-900 text-white border-gray-900 hover:bg-gray-800 hover:text-white"
                  : "text-gray-400 hover:text-gray-600",
              )}
              onClick={() => onPageChange(item)}
            >
              {item}
            </Button>
          ),
        )}
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-gray-400 hover:text-gray-600"
          disabled={safePage >= totalPages}
          onClick={() => onPageChange(Math.min(totalPages, safePage + 1))}
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
