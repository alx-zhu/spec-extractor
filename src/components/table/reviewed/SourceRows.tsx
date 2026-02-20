import { useMemo } from "react";
import {
  useReactTable,
  getCoreRowModel,
  type ColumnDef,
} from "@tanstack/react-table";
import type { ExtractedProduct, ProductFieldKey } from "@/types/product";
import type { ResolvedProduct } from "@/types/resolvedProduct";
import { inboxColumns } from "@/components/table/inbox/inboxColumns";
import { TableRow } from "@/components/table/shared/TableRow";
import { columnLayout } from "@/styles/tableLayout";
import { RowActions } from "@/components/table/shared/RowActions";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface SourceRowsProps {
  resolved: ResolvedProduct;
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
  onSourceRowClick?: (
    extractedProduct: ExtractedProduct,
    fieldKey?: string,
  ) => void;
  selectedProductId?: string | null;
}

/** Checkbox spacer column — matches the parent table's checkbox column width */
const checkboxSpacer: ColumnDef<ExtractedProduct> = {
  id: "select",
  header: "",
  size: columnLayout.checkbox.width,
  cell: () => null,
};

export function SourceRows({
  resolved,
  onOverrideField,
  onUnmerge: _onUnmerge,
  onUnreview,
  onSourceRowClick,
  selectedProductId,
}: SourceRowsProps) {
  const sources: ExtractedProduct[] =
    resolved.source.type === "extracted"
      ? [resolved.source.extractedProduct]
      : resolved.source.extractedProducts;

  const mergedProductId =
    resolved.source.type === "merged"
      ? resolved.source.mergedProduct.id
      : null;
  const canUnmerge = resolved.sourceCount > 1;

  // Reuse inbox columns (minus checkbox) with a checkbox spacer prepended
  const sourceColumns = useMemo<ColumnDef<ExtractedProduct>[]>(
    () => [checkboxSpacer, ...inboxColumns.filter((c) => c.id !== "select")],
    [],
  );

  const table = useReactTable({
    data: sources,
    columns: sourceColumns,
    getCoreRowModel: getCoreRowModel(),
  });

  /** Build per-cell overlay: selected check icon + "Use this" button */
  const renderCellOverlay = (ep: ExtractedProduct, fieldKey: string) => {
    const key = fieldKey as ProductFieldKey;

    // Check if this EP is the selected source for this field
    const isFieldSource =
      resolved.source.type === "merged" &&
      resolved.source.mergedProduct.fieldSelections[key]?.selectedProductId === ep.id;

    // Check if this EP's value differs from the resolved value
    const epValue = ep[key]?.value;
    const resolvedValue = resolved.fields[key]?.value;
    const isDifferent =
      canUnmerge && epValue !== resolvedValue && (epValue || resolvedValue);

    return (
      <>
        {isFieldSource && (
          <Check className="size-3 text-green-600 shrink-0 ml-1" />
        )}
        {isDifferent && mergedProductId && (
          <button
            className="absolute right-1 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 px-1.5 py-0.5 text-[10px] font-medium bg-blue-500 text-white rounded cursor-pointer hover:bg-blue-600 transition-opacity z-10"
            onClick={(e) => {
              e.stopPropagation();
              onOverrideField?.(mergedProductId, key, ep.id);
            }}
          >
            Use this
          </button>
        )}
      </>
    );
  };

  return (
    <div className="border-b border-gray-200">
      {table.getRowModel().rows.map((row) => {
        const ep = row.original;
        const isSelected = selectedProductId === ep.id;

        return (
          <TableRow
            key={row.id}
            row={row}
            onClick={(fieldKey) => onSourceRowClick?.(ep, fieldKey)}
            isSelected={isSelected}
            className={cn("bg-gray-50", !isSelected && "group/source")}
            cellOverlay={(fieldKey) => renderCellOverlay(ep, fieldKey)}
            actions={
              <RowActions
                productId={ep.id}
                isReviewed={true}
                onUnreview={onUnreview}
              />
            }
          />
        );
      })}
    </div>
  );
}
