import { type Row } from "@tanstack/react-table";
import type { ExtractedProduct } from "@/types/product";
import { cn } from "@/lib/utils";
import { ProductCell } from "./ProductCell";
import { RowActions } from "./RowActions";

interface ProductRowProps {
  row: Row<ExtractedProduct>;
  onClick?: (fieldKey?: string) => void;
  onReview?: (productId: string) => void;
  onUnreview?: (productId: string) => void;
  isSelected?: boolean;
  selectedFieldKey?: string | null;
}

export function ProductRow({
  row,
  onClick,
  onReview,
  onUnreview,
  isSelected,
  selectedFieldKey,
}: ProductRowProps) {
  const isChecked = row.getIsSelected();

  return (
    <div
      className={cn(
        "flex border-b border-gray-100 transition-colors duration-150 relative group",
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
            isFieldSelected={!!isFieldSelected}
            onClick={onClick}
          />
        );
      })}
      <RowActions
        productId={row.original.id}
        isReviewed={row.original.reviewed}
        onReview={onReview}
        onUnreview={onUnreview}
      />
    </div>
  );
}
