import { useCallback, useEffect, useMemo, useState } from "react";
import { ReviewedTable } from "@/components/table/reviewed/ReviewedTable";
import { BulkActionBar } from "@/components/table/shared/BulkActionBar";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ChevronLeft,
  ChevronRight,
  Search,
  SlidersHorizontal,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { ExtractedProduct, ProductFieldKey } from "@/types/product";
import type { ResolvedProduct } from "@/types/resolvedProduct";

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

interface TablePanelProps {
  // Data
  resolvedProducts: ResolvedProduct[];
  /** Opens the PDF viewer for a given EP, optionally focused on a specific field */
  onViewSource?: (
    ep: ExtractedProduct,
    resolvedProductId?: string,
    fieldKey?: ProductFieldKey,
  ) => void;
  onOverrideField?: (
    mergedProductId: string,
    fieldKey: ProductFieldKey,
    selectedProductId: string,
  ) => void;

  // Shared
  selectedProductId: string | null;
  selectedFieldKey: string | null;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onFilterToggle: () => void;
  activeFilterLabel: string | null;
  onClearFilter: () => void;
  /** Map of document ID → document filename for source document display */
  documentMap?: Map<string, string>;
  onExportSelection?: (products: ResolvedProduct[]) => void;
}

export function TablePanel({
  resolvedProducts,
  onViewSource,
  onOverrideField,
  selectedProductId,
  selectedFieldKey,
  searchQuery,
  onSearchChange,
  onFilterToggle,
  activeFilterLabel,
  onClearFilter,
  documentMap,
  onExportSelection,
}: TablePanelProps) {
  const [selectedProducts, setSelectedProducts] = useState<ResolvedProduct[]>(
    [],
  );
  const [selectionKey, setSelectionKey] = useState(0);

  const handleSelectionChange = useCallback((products: ResolvedProduct[]) => {
    setSelectedProducts(products);
  }, []);

  const handleClearSelection = useCallback(() => {
    setSelectionKey((k) => k + 1);
  }, []);

  // Pagination
  const PAGE_SIZE_OPTIONS = [10, 25, 50, 100] as const;
  const [pageSize, setPageSize] = useState<number>(25);
  const [currentPage, setCurrentPage] = useState(1);
  const totalPages = Math.max(1, Math.ceil(resolvedProducts.length / pageSize));

  // Reset to page 1 when the data or page size changes
  useEffect(() => {
    setCurrentPage(1);
  }, [resolvedProducts.length, pageSize]);

  // Clamp page if it exceeds total (e.g. after filter narrows results)
  const safePage = Math.min(currentPage, totalPages);

  const paginatedProducts = useMemo(() => {
    const start = (safePage - 1) * pageSize;
    return resolvedProducts.slice(start, start + pageSize);
  }, [resolvedProducts, safePage, pageSize]);

  const rangeStart =
    resolvedProducts.length === 0 ? 0 : (safePage - 1) * pageSize + 1;
  const rangeEnd = Math.min(safePage * pageSize, resolvedProducts.length);

  return (
    <div className="flex flex-col flex-1 bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
      {/* Panel Header */}
      <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center bg-white">
        {/* Title */}
        <div className="flex items-center gap-2">
          <h2 className="text-sm font-semibold text-gray-900">Products</h2>
          <span className="inline-flex items-center justify-center px-1.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-500">
            {resolvedProducts.length}
          </span>
        </div>
        <div className="flex items-center gap-2">
          {/* Active filter chip */}
          {activeFilterLabel && (
            <button
              onClick={onClearFilter}
              className="inline-flex items-center gap-2 pl-3 pr-2 py-1.5 bg-blue-50 text-blue-700 rounded-lg text-xs font-medium hover:bg-blue-100 transition-colors"
              aria-label="Clear filter"
            >
              <span className="truncate max-w-[180px]">
                {activeFilterLabel}
              </span>
              <X className="h-3.5 w-3.5 text-blue-400 hover:text-blue-600 cursor-pointer" />
            </button>
          )}
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
        </div>
      </div>

      {/* Table + Bulk Action Bar container */}
      <div className="flex-1 overflow-hidden relative">
        <ReviewedTable
          data={paginatedProducts}
          onViewSource={onViewSource}
          onOverrideField={onOverrideField}
          selectedProductId={selectedProductId}
          selectedFieldKey={selectedFieldKey}
          onSelectionChange={handleSelectionChange}
          selectionKey={selectionKey}
          documentMap={documentMap}
        />

        <BulkActionBar
          selectedProducts={selectedProducts}
          onClearSelection={handleClearSelection}
          onExport={onExportSelection ?? (() => {})}
        />
      </div>

      {/* Table Footer */}
      <div className="px-6 py-3 border-t border-gray-200 flex justify-between items-center bg-white">
        <div className="flex items-center gap-3">
          <span className="text-sm text-gray-500">
            {resolvedProducts.length === 0
              ? "No products"
              : `Showing ${rangeStart}-${rangeEnd} of ${resolvedProducts.length}`}
          </span>
          <Select
            value={String(pageSize)}
            onValueChange={(v) => setPageSize(Number(v))}
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
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
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
                onClick={() => setCurrentPage(item)}
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
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
