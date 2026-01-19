import { flexRender, type Row } from "@tanstack/react-table";
import type { Product } from "@/types/product";
import { cn } from "@/lib/utils";

interface ProductRowProps {
  row: Row<Product>;
  onClick?: (fieldKey?: string) => void;
  isSelected?: boolean;
}

export function ProductRow({ row, onClick, isSelected }: ProductRowProps) {
  return (
    <div
      className={cn(
        "flex border-b border-gray-100 transition-colors duration-150",
        isSelected ? "bg-blue-50" : "hover:bg-gray-50",
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
              "px-3 py-3 flex items-center border-r border-gray-100 last:border-r-0",
              cell.column.id === "select" && "justify-center",
              fieldName &&
                "cursor-pointer hover:bg-blue-50/50 transition-colors",
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
