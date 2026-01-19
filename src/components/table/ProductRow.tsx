import { flexRender, type Row } from "@tanstack/react-table";
import type { Product } from "@/types/product";
import { cn } from "@/lib/utils";

interface ProductRowProps {
  row: Row<Product>;
  onClick?: (fieldKey?: string) => void;
  isSelected?: boolean;
}

export function ProductRow({ row, onClick, isSelected }: ProductRowProps) {
  const isChecked = row.getIsSelected();
  const isVisuallySelected = isSelected || isChecked;

  return (
    <div
      className={cn(
        "flex border-b border-gray-100 transition-colors duration-150 relative",
        !isVisuallySelected && "bg-white",
        isSelected && "shadow-md z-20",
        // Left inset border
        isSelected &&
          "before:absolute before:left-0 before:top-0 before:bottom-0 before:w-1 before:bg-blue-500 before:z-10",
        isChecked && "bg-blue-50",
      )}
    >
      {row.getVisibleCells().map((cell) => {
        const size = cell.column.columnDef.size;
        const isItemName = cell.column.id === "itemName";
        const minWidth = isItemName ? 250 : size;
        const fieldName = cell.column.columnDef.meta?.fieldName;

        return (
          <div
            key={cell.id}
            className={cn(
              "px-3 py-3 flex items-center border-r border-gray-200 last:border-r-0 transition-colors box-border",
              cell.column.id === "select" && "justify-center",
              // Different hover colors: darker blue for selected rows, light blue for non-selected
              fieldName && "cursor-pointer",
              fieldName &&
                (isChecked ? "hover:bg-blue-100/80" : "hover:bg-blue-50"),
            )}
            style={{
              width: size ? `${size}px` : undefined,
              minWidth: minWidth ? `${minWidth}px` : undefined,
              flex: isItemName ? "1" : undefined,
            }}
            onClick={(e) => {
              if (fieldName) {
                e.stopPropagation();
                onClick?.(fieldName);
              } else if (cell.column.id !== "select") {
                onClick?.();
              }
            }}
          >
            {flexRender(cell.column.columnDef.cell, cell.getContext())}
          </div>
        );
      })}
    </div>
  );
}
