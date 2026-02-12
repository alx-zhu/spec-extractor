import { type Row } from "@tanstack/react-table";
import type { Product, ProductFieldKey } from "@/types/product";
import { cn } from "@/lib/utils";
import { ProductCell } from "./ProductCell";
import {
  useViewedProducts,
  useMarkProductViewed,
} from "@/hooks/useViewedProducts";

interface ProductRowProps {
  row: Row<Product>;
  onClick?: (fieldKey?: string) => void;
  isSelected?: boolean;
  selectedFieldKey?: string | null;
  onCellSave?: (
    productId: string,
    fieldKey: ProductFieldKey,
    newValue: string,
  ) => void;
}

export function ProductRow({
  row,
  onClick,
  isSelected,
  selectedFieldKey,
  onCellSave,
}: ProductRowProps) {
  const { data: viewedIds } = useViewedProducts();
  const markViewed = useMarkProductViewed();

  const isChecked = row.getIsSelected();
  const isVisuallySelected = isSelected || isChecked;
  const isViewed = viewedIds?.has(row.original.id) ?? true;

  const handleClick = (fieldKey?: string) => {
    if (!isViewed) {
      markViewed.mutate(row.original.id);
    }
    onClick?.(fieldKey);
  };

  const handleCellSave = (fieldKey: ProductFieldKey, newValue: string) => {
    if (row.original?.id) {
      onCellSave?.(row.original.id, fieldKey, newValue);
    }
  };

  return (
    <div
      className={cn(
        "flex border-b border-gray-100 transition-colors duration-150 relative",
        !isVisuallySelected && "bg-white",
        isSelected && "shadow-md z-10",
        // Left inset border
        isSelected &&
          "before:absolute before:left-0 before:top-0 before:bottom-0 before:w-1 before:bg-blue-500 before:z-10",
        isChecked && "bg-blue-50",
      )}
    >
      {/* Unviewed notification dot */}
      {!isViewed && (
        <span className="absolute left-1.5 top-1/2 -translate-y-1/2 z-20 size-1.5 rounded-full bg-blue-500" />
      )}

      {row.getVisibleCells().map((cell) => {
        const fieldName = cell.column.columnDef.meta?.fieldName as
          | string
          | undefined;

        // Check if this field is the selected field for the selected row
        // productDescription lives inside the itemName column, so highlight it too
        const isFieldSelected =
          isSelected &&
          selectedFieldKey &&
          (fieldName === selectedFieldKey ||
            (fieldName === "itemName" &&
              selectedFieldKey === "productDescription"));

        return (
          <ProductCell
            key={cell.id}
            cell={cell}
            isSelected={isSelected ?? false}
            isFieldSelected={!!isFieldSelected}
            onClick={handleClick}
            onSave={handleCellSave}
          />
        );
      })}
    </div>
  );
}
