import { useState, useCallback, useEffect } from "react";
import {
  useReactTable,
  getCoreRowModel,
  type RowSelectionState,
} from "@tanstack/react-table";
import { AnimatePresence, motion } from "motion/react";
import type { ExtractedProduct, ProductFieldKey } from "@/types/product";
import type { ResolvedProduct } from "@/types/resolvedProduct";
import type { SortConfig } from "@/components/table/shared/sorting";
import { resolvedColumns } from "./resolvedColumns";
import { TableRow } from "@/components/table/shared/TableRow";
import { ColumnHeaders } from "@/components/table/shared/ColumnHeaders";
import { SourceRows } from "./SourceRows";
import { ManualSourceRow } from "./ManualSourceRow";
import { Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface ReviewedTableProps {
  data: ResolvedProduct[];
  /** Opens the PDF viewer for a given EP, optionally focused on a specific field */
  onViewSource?: (
    extractedProduct: ExtractedProduct,
    resolvedProductId?: string,
    fieldKey?: ProductFieldKey,
  ) => void;
  onOverrideField?: (
    mergedProductId: string,
    fieldKey: ProductFieldKey,
    selectedProductId: string,
  ) => void;
  selectedProductId?: string | null;
  selectedFieldKey?: string | null;
  onSelectionChange?: (selectedProducts: ResolvedProduct[]) => void;
  /** Increment to imperatively clear selection */
  selectionKey?: number;
  /** Map of document ID → document filename for source document display */
  documentMap?: Map<string, string>;
  /** Called to add a manual source EP to a merged product */
  onAddManualSource?: (
    mergedProductId: string,
    fields: Partial<Record<ProductFieldKey, string>>,
  ) => void;
  /** Current sort configuration for header indicators */
  sortConfig?: SortConfig;
  /** Called when a column header is clicked to change sort */
  onSortChange?: (config: SortConfig) => void;
  /** Whether the inline manual-product creation row is visible */
  isCreatingManual?: boolean;
  /** Called to save the new manual product */
  onCreateManualProduct?: (
    fields: Partial<Record<ProductFieldKey, string>>,
  ) => void;
  /** Called to cancel manual product creation */
  onCancelCreateManual?: () => void;
  /** Called to open the upload modal from the empty state */
  onUploadClick?: () => void;
  /** Called when a product row is expanded */
  onExpand?: (productId: string) => void;
  /** Called when a product row is collapsed */
  onCollapse?: (productId: string) => void;
}

/** Check if a resolved product or any of its source EPs match the selected id */
function isResolvedSelected(
  resolved: ResolvedProduct,
  selectedProductId: string | null | undefined,
): boolean {
  if (!selectedProductId) return false;
  if (resolved.id === selectedProductId) return true;
  return resolved.source.extractedProducts.some(
    (ep) => ep.id === selectedProductId,
  );
}

export function ReviewedTable({
  data,
  onViewSource,
  onOverrideField,
  selectedProductId,
  selectedFieldKey,
  onSelectionChange,
  selectionKey,
  documentMap,
  onAddManualSource,
  sortConfig,
  onSortChange,
  isCreatingManual,
  onCreateManualProduct,
  onCancelCreateManual,
  onUploadClick,
  onExpand,
  onCollapse,
}: ReviewedTableProps) {
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});

  const toggleExpand = useCallback((id: string) => {
    setExpandedIds((prev) => {
      if (prev.has(id)) {
        onCollapse?.(id);
        return new Set();
      }
      onExpand?.(id);
      return new Set([id]);
    });
  }, [onExpand, onCollapse]);

  const table = useReactTable({
    data,
    columns: resolvedColumns,
    getCoreRowModel: getCoreRowModel(),
    enableRowSelection: true,
    onRowSelectionChange: setRowSelection,
    getRowId: (row) => row.id,
    state: {
      rowSelection,
    },
    meta: {
      expandedIds,
    },
  });

  // Report selection changes to parent
  useEffect(() => {
    const selectedIds = Object.keys(rowSelection).filter(
      (id) => rowSelection[id],
    );
    const selectedRows = data.filter((p) => selectedIds.includes(p.id));
    onSelectionChange?.(selectedRows);
  }, [rowSelection, data, onSelectionChange]);

  // Clear selection when parent requests it
  useEffect(() => {
    setRowSelection({});
  }, [selectionKey]);

  const isEmpty = table.getRowModel().rows.length === 0 && !isCreatingManual;

  return (
    <div className="relative h-full">
      <div className="h-full overflow-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent hover:scrollbar-thumb-gray-400">
        <div className="min-w-min">
          <ColumnHeaders
            headerGroups={table.getHeaderGroups()}
            sortConfig={sortConfig}
            onSortChange={onSortChange}
          />

          {/* Inline manual product creation — scrolls with the table */}
          {isCreatingManual && onCreateManualProduct && onCancelCreateManual && (
            <ManualSourceRow
              onSave={(fields) => {
                onCreateManualProduct(fields);
              }}
              onCancel={onCancelCreateManual}
            />
          )}

          {!isEmpty &&
            table.getRowModel().rows.map((row) => {
              const resolved = row.original;
              const isSelected = isResolvedSelected(
                resolved,
                selectedProductId,
              );
              const isExpanded = expandedIds.has(resolved.id);

              // Every row toggles expand on click — uniform behavior
              // regardless of source count. Source rows open the PDF viewer.
              const handleRowClick = () => toggleExpand(resolved.id);

              return (
                <div
                  key={row.id}
                  data-product-id={resolved.id}
                  className={cn(
                    "transition-[border-color,box-shadow,margin] duration-200 ease-out overflow-hidden",
                    isExpanded
                      ? "border border-gray-800 shadow-md"
                      : "border-none",
                  )}
                >
                  {/* Main resolved row — transforms to dark group header when expanded */}
                  <TableRow
                    row={row}
                    onClick={handleRowClick}
                    isSelected={isSelected}
                    selectedFieldKey={isExpanded ? null : selectedFieldKey}
                    isExpanded={isExpanded}
                    className="cursor-pointer"
                  />

                  {/* Expanded source rows — animated height */}
                  <AnimatePresence initial={false}>
                    {isExpanded && (
                      <motion.div
                        key="source-rows"
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{
                          height: {
                            duration: 0.25,
                            ease: [0.4, 0, 0.2, 1],
                          },
                          opacity: { duration: 0.2, ease: "easeOut" },
                        }}
                        className="overflow-hidden"
                      >
                        <SourceRows
                          resolved={resolved}
                          onOverrideField={onOverrideField}
                          onViewSource={onViewSource}
                          selectedProductId={selectedProductId}
                          documentMap={documentMap}
                          onAddManualSource={onAddManualSource}
                        />
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
        </div>
      </div>

      {/* Empty state — centered over the full table area */}
      {isEmpty && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="flex flex-col items-center gap-3 pointer-events-auto">
            <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center">
              <Upload className="h-5 w-5 text-gray-400" />
            </div>
            <div className="text-center">
              <p className="text-sm font-medium text-gray-900">No products yet</p>
              <p className="text-sm text-gray-500 mt-1">
                Upload a document to start extracting products
              </p>
            </div>
            {onUploadClick && (
              <Button size="sm" onClick={onUploadClick} className="gap-2 mt-1">
                <Upload className="h-4 w-4" />
                Upload Documents
              </Button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
