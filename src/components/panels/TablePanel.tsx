import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ReviewedTable } from "@/components/table/reviewed/ReviewedTable";
import { BulkActionBar } from "@/components/table/shared/BulkActionBar";
import { SelectAllBanner } from "@/components/table/shared/SelectAllBanner";
import { TableToolbar } from "@/components/table/header/TableToolbar";
import { TablePagination } from "@/components/table/footer/TablePagination";
import {
  type SortConfig,
  DEFAULT_SORT,
  createSortComparator,
} from "@/components/table/shared/sorting";
import type { ExtractedProduct, ProductFieldKey } from "@/types/product";
import type { ResolvedProduct } from "@/types/resolvedProduct";

// Re-export SortConfig so existing consumers don't break
export type { SortConfig } from "@/components/table/shared/sorting";

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
  /** Called to add a manual source EP to a merged product */
  onAddManualSource?: (
    mergedProductId: string,
    fields: Partial<Record<ProductFieldKey, string>>,
  ) => void;
  /** Called to create a brand-new manual product */
  onCreateManualProduct?: (
    fields: Partial<Record<ProductFieldKey, string>>,
  ) => void;
  /** Called to open the upload modal from the empty state */
  onUploadClick?: () => void;
  /** Called whenever the effective selection changes (used by parent to share selection with other components) */
  onSelectionChange?: (products: ResolvedProduct[]) => void;
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
  onAddManualSource,
  onCreateManualProduct,
  onUploadClick,
  onSelectionChange,
}: TablePanelProps) {
  const [selectedProducts, setSelectedProducts] = useState<ResolvedProduct[]>(
    [],
  );
  const [selectionKey, setSelectionKey] = useState(0);
  const [selectAllMode, setSelectAllMode] = useState(false);

  const handleSelectionChange = useCallback((products: ResolvedProduct[]) => {
    setSelectedProducts(products);
  }, []);

  const handleClearSelection = useCallback(() => {
    setSelectionKey((k) => k + 1);
    setSelectAllMode(false);
  }, []);

  const [isCreating, setIsCreating] = useState(false);

  // Sorting
  const [sortConfig, setSortConfig] = useState<SortConfig>(DEFAULT_SORT);
  const [frozenOrder, setFrozenOrder] = useState<string[] | null>(null);

  const liveSortedProducts = useMemo(() => {
    return [...resolvedProducts].sort(createSortComparator(sortConfig));
  }, [resolvedProducts, sortConfig]);

  // Freeze order while a row is expanded, but show fresh data
  const sortedProducts = useMemo(() => {
    if (!frozenOrder) return liveSortedProducts;
    const dataMap = new Map(resolvedProducts.map((p) => [p.id, p]));
    return frozenOrder
      .map((id) => dataMap.get(id))
      .filter((p): p is ResolvedProduct => p != null);
  }, [frozenOrder, liveSortedProducts, resolvedProducts]);

  // Ref for latest live sort — used by handleCollapse without stale closures
  const liveSortedRef = useRef(liveSortedProducts);
  liveSortedRef.current = liveSortedProducts;

  const handleSortChange = useCallback((config: SortConfig) => {
    setSortConfig(config);
    setFrozenOrder(null);
  }, []);

  // Pagination
  const [pageSize, setPageSize] = useState<number>(25);
  const [currentPage, setCurrentPage] = useState(1);
  const totalPages = Math.max(1, Math.ceil(sortedProducts.length / pageSize));

  // Reset to page 1 and exit select-all when data, page size, or sort changes
  // Skip while sort is frozen (during row expansion) to avoid overriding navigation
  useEffect(() => {
    if (frozenOrder) return;
    setCurrentPage(1);
    setSelectAllMode(false);
  }, [resolvedProducts.length, pageSize, sortConfig]);

  // Clamp page if it exceeds total (e.g. after filter narrows results)
  const safePage = Math.min(currentPage, totalPages);

  const paginatedProducts = useMemo(() => {
    const start = (safePage - 1) * pageSize;
    return sortedProducts.slice(start, start + pageSize);
  }, [sortedProducts, safePage, pageSize]);

  // Show the "select all" banner when all page rows are selected and there are more products beyond this page
  const isAllPageSelected =
    selectedProducts.length > 0 &&
    selectedProducts.length === paginatedProducts.length;
  const showSelectAllBanner =
    isAllPageSelected && sortedProducts.length > paginatedProducts.length;

  // Exit select-all mode when user deselects a row
  useEffect(() => {
    if (selectAllMode && !isAllPageSelected) {
      setSelectAllMode(false);
    }
  }, [selectAllMode, isAllPageSelected]);

  // The products to pass to the bulk action bar: all products when in select-all mode, otherwise just the page selection
  const effectiveSelectedProducts = selectAllMode
    ? sortedProducts
    : selectedProducts;

  useEffect(() => {
    onSelectionChange?.(effectiveSelectedProducts);
  }, [effectiveSelectedProducts, onSelectionChange]);

  // Freeze sort order when a row expands; navigate + highlight on collapse
  const handleExpand = useCallback(() => {
    setFrozenOrder(liveSortedRef.current.map((p) => p.id));
  }, []);

  const handleCollapse = useCallback(
    (productId: string) => {
      const index = liveSortedRef.current.findIndex((p) => p.id === productId);
      const targetPage = index >= 0 ? Math.floor(index / pageSize) + 1 : 1;

      setFrozenOrder(null);
      setCurrentPage(targetPage);
    },
    [pageSize],
  );

  return (
    <div className="flex flex-col flex-1 bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
      <TableToolbar
        sortConfig={sortConfig}
        onSortChange={handleSortChange}
        searchQuery={searchQuery}
        onSearchChange={onSearchChange}
        onFilterToggle={onFilterToggle}
        activeFilterLabel={activeFilterLabel}
        onClearFilter={onClearFilter}
        isCreating={isCreating}
        onToggleCreate={() => setIsCreating((v) => !v)}
        showCreateButton={!!onCreateManualProduct}
        onUploadClick={() => onUploadClick?.()}
      />

      {/* Select-all banner — pinned above the table, outside scroll */}
      {showSelectAllBanner && (
        <SelectAllBanner
          selectAllMode={selectAllMode}
          pageCount={paginatedProducts.length}
          totalCount={sortedProducts.length}
          onSelectAll={() => setSelectAllMode(true)}
          onClearSelectAll={handleClearSelection}
        />
      )}

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
          onAddManualSource={onAddManualSource}
          sortConfig={sortConfig}
          onSortChange={handleSortChange}
          isCreatingManual={isCreating}
          onCreateManualProduct={
            onCreateManualProduct
              ? (fields) => {
                  onCreateManualProduct(fields);
                  setIsCreating(false);
                }
              : undefined
          }
          onCancelCreateManual={() => setIsCreating(false)}
          onUploadClick={onUploadClick}
          onExpand={handleExpand}
          onCollapse={handleCollapse}
        />

        <BulkActionBar
          selectedProducts={effectiveSelectedProducts}
          onClearSelection={handleClearSelection}
          onExport={onExportSelection ?? (() => {})}
        />
      </div>

      <TablePagination
        totalItems={sortedProducts.length}
        pageSize={pageSize}
        onPageSizeChange={setPageSize}
        currentPage={safePage}
        totalPages={totalPages}
        onPageChange={setCurrentPage}
      />
    </div>
  );
}
