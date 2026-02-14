import { type Row } from "@tanstack/react-table";
import type { Product, ProductFieldKey } from "@/types/product";
import { cn } from "@/lib/utils";
import { ProductCell } from "./ProductCell";

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
  const isChecked = row.getIsSelected();
  const isVisuallySelected = isSelected || isChecked;

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
        isChecked && "bg-blue-50",
      )}
    >
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
            isRowChecked={isChecked}
            onClick={onClick}
            onSave={handleCellSave}
          />
        );
      })}
    </div>
  );
}
