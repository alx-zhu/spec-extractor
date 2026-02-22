import { useCallback, useState } from "react";
import { ReviewedTable } from "@/components/table/reviewed/ReviewedTable";
import { BulkActionBar } from "@/components/table/shared/BulkActionBar";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
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
}: TablePanelProps) {
  const [selectedProducts, setSelectedProducts] = useState<ResolvedProduct[]>(
    [],
  );
  const [selectionKey, setSelectionKey] = useState(0);

  const handleSelectionChange = useCallback(
    (products: ResolvedProduct[]) => {
      setSelectedProducts(products);
    },
    [],
  );

  const handleClearSelection = useCallback(() => {
    setSelectionKey((k) => k + 1);
  }, []);

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
              placeholder="Search products..."
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="pl-9 w-48 h-8 text-sm bg-gray-50 border-gray-200"
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
          data={resolvedProducts}
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
        />
      </div>

      {/* Table Footer */}
      <div className="px-6 py-3 border-t border-gray-200 flex justify-between items-center bg-white">
        <span className="text-sm text-gray-500">
          Showing 1-{resolvedProducts.length} of {resolvedProducts.length} products
        </span>
        <div className="flex gap-1">
          <Button variant="outline" size="icon" disabled className="h-8 w-8">
            <ChevronLeft className="h-4 w-4 text-gray-400" />
          </Button>
          <Button variant="outline" size="sm" className="h-8 min-w-8 px-2">
            1
          </Button>
          <Button variant="outline" size="icon" disabled className="h-8 w-8">
            <ChevronRight className="h-4 w-4 text-gray-400" />
          </Button>
        </div>
      </div>
    </div>
  );
}
