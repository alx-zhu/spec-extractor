import { flexRender, type Row } from "@tanstack/react-table";
import type { Product } from "@/types/product";
import { cn } from "@/lib/utils";

interface ProductRowProps {
  row: Row<Product>;
  onClick?: () => void;
  isSelected?: boolean;
}

export function ProductRow({ row, onClick, isSelected }: ProductRowProps) {
  return (
    <div
      className={cn(
        "flex border-b border-gray-100 transition-colors duration-150 cursor-pointer",
        isSelected ? "bg-blue-50" : "hover:bg-gray-50"
      )}
      onClick={onClick}
    >
      {row.getVisibleCells().map((cell) => {
        const size = cell.column.columnDef.size;
        const isItemName = cell.column.id === "itemName";
        const minWidth = isItemName ? 250 : size;

        return (
          <div
            key={cell.id}
            className={cn(
              "px-3 py-3 flex items-center border-r border-gray-100 last:border-r-0",
              cell.column.id === "select" && "justify-center"
            )}
            style={{
              width: size ? `${size}px` : undefined,
              minWidth: minWidth ? `${minWidth}px` : undefined,
              flex: isItemName ? "1" : undefined,
            }}
          >
            {flexRender(cell.column.columnDef.cell, cell.getContext())}
          </div>
        );
      })}
    </div>
  );
}
