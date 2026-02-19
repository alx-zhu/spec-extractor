import { useState, useCallback } from "react";
import {
  useReactTable,
  getCoreRowModel,
  type RowSelectionState,
} from "@tanstack/react-table";
import type { ExtractedProduct, ProductFieldKey } from "@/types/product";
import type { ResolvedProduct } from "@/types/resolvedProduct";
import { resolvedColumns } from "./resolvedColumns";
import { TableRow } from "@/components/table/shared/TableRow";
import { TableHeader } from "@/components/table/shared/TableHeader";
import { SourceRows } from "./SourceRows";

interface ReviewedTableProps {
  data: ResolvedProduct[];
  onSourceClick?: (extractedProduct: ExtractedProduct, fieldKey?: string) => void;
  onOverrideField?: (
    mergedProductId: string,
    fieldKey: ProductFieldKey,
    selectedProductId: string,
  ) => void;
  onUnmerge?: (
    mergedProductId: string,
    extractedProductId: string,
  ) => void;
  onUnreview?: (productId: string) => void;
  selectedProductId?: string | null;
  selectedFieldKey?: string | null;
}

/** Check if a resolved product or any of its source EPs match the selected id */
function isResolvedSelected(
  resolved: ResolvedProduct,
  selectedProductId: string | null | undefined,
): boolean {
  if (!selectedProductId) return false;
  if (resolved.id === selectedProductId) return true;
  if (
    resolved.source.type === "merged" &&
    resolved.source.extractedProducts.some((ep) => ep.id === selectedProductId)
  ) {
    return true;
  }
  if (
    resolved.source.type === "extracted" &&
    resolved.source.extractedProduct.id === selectedProductId
  ) {
    return true;
  }
  return false;
}

export function ReviewedTable({
  data,
  onSourceClick,
  onOverrideField,
  onUnmerge,
  onUnreview,
  selectedProductId,
  selectedFieldKey,
}: ReviewedTableProps) {
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});

  const toggleExpand = useCallback((id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
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
  });

  return (
    <div className="h-full overflow-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent hover:scrollbar-thumb-gray-400">
      <div className="min-w-min">
        <TableHeader headerGroups={table.getHeaderGroups()} />

        {table.getRowModel().rows.length === 0 ? (
          <div className="p-8 text-center text-gray-400 text-sm">
            No reviewed products yet.
          </div>
        ) : (
          table.getRowModel().rows.map((row) => {
            const resolved = row.original;
            const isSelected = isResolvedSelected(resolved, selectedProductId);
            const isExpanded = expandedIds.has(resolved.id);

            return (
              <div key={row.id}>
                {/* Main resolved row — click toggles expansion */}
                <TableRow
                  row={row}
                  onClick={() => toggleExpand(resolved.id)}
                  isSelected={isSelected}
                  selectedFieldKey={selectedFieldKey}
                  className={isExpanded && !isSelected ? "bg-gray-50" : undefined}
                />

                {/* Expanded source rows */}
                {isExpanded && (
                  <SourceRows
                    resolved={resolved}
                    onOverrideField={onOverrideField}
                    onUnmerge={onUnmerge}
                    onUnreview={onUnreview}
                    onSourceRowClick={onSourceClick}
                    selectedProductId={selectedProductId}
                  />
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
