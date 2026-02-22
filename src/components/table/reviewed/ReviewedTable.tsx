import { useState, useCallback, useEffect } from "react";
import {
  useReactTable,
  getCoreRowModel,
  type RowSelectionState,
} from "@tanstack/react-table";
import { AnimatePresence, motion } from "motion/react";
import type { ExtractedProduct, ProductFieldKey } from "@/types/product";
import type { ResolvedProduct } from "@/types/resolvedProduct";
import { resolvedColumns } from "./resolvedColumns";
import { TableRow } from "@/components/table/shared/TableRow";
import { TableHeader } from "@/components/table/shared/TableHeader";
import { SourceRows } from "./SourceRows";
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
}: ReviewedTableProps) {
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});

  const toggleExpand = useCallback((id: string) => {
    setExpandedIds((prev) => {
      // Accordion: only one group open at a time
      if (prev.has(id)) {
        return new Set();
      }
      return new Set([id]);
    });
  }, []);

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

  return (
    <div className="h-full overflow-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent hover:scrollbar-thumb-gray-400">
      <div className="min-w-min">
        <TableHeader headerGroups={table.getHeaderGroups()} />

        {table.getRowModel().rows.length === 0 ? (
          <div className="p-8 text-center text-gray-400 text-sm">
            No products found.
          </div>
        ) : (
          table.getRowModel().rows.map((row) => {
            const resolved = row.original;
            const isSelected = isResolvedSelected(resolved, selectedProductId);
            const isExpanded = expandedIds.has(resolved.id);

            // Every row toggles expand on click — uniform behavior
            // regardless of source count. Source rows open the PDF viewer.
            const handleRowClick = () => toggleExpand(resolved.id);

            return (
              <div
                key={row.id}
                className={cn(
                  "transition-[border-color,box-shadow,margin] duration-200 ease-out overflow-hidden",
                  isExpanded
                    ? "border border-gray-800 shadow-md"
                    : "border border-transparent",
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
                        height: { duration: 0.25, ease: [0.4, 0, 0.2, 1] },
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
                      />
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
