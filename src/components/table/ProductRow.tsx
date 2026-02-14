import { type Row } from "@tanstack/react-table";
import type { Product } from "@/types/product";
import { cn } from "@/lib/utils";
import { ProductCell } from "./ProductCell";

interface ProductRowProps {
  row: Row<Product>;
  onClick?: (fieldKey?: string) => void;
  isSelected?: boolean;
  selectedFieldKey?: string | null;
}

export function ProductRow({
  row,
  onClick,
  isSelected,
  selectedFieldKey,
}: ProductRowProps) {
  const isChecked = row.getIsSelected();

  return (
    <div
      className={cn(
        "flex border-b border-gray-100 transition-colors duration-150 relative",
        isSelected ? "shadow-md z-10" : isChecked ? "bg-blue-50" : "bg-white",
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
          />
        );
      })}
    </div>
  );
}
