import { flexRender, type Cell } from "@tanstack/react-table";
import type { Product, ProductFieldKey } from "@/types/product";
import { cn } from "@/lib/utils";
import { getColumnType, getColumnWidth } from "@/styles/tableLayout";
import { cellVariants } from "./tableVariants";

interface ProductCellProps {
  cell: Cell<Product, unknown>;
  isFieldSelected: boolean;
  onClick?: (fieldKey?: string) => void;
}

export function ProductCell({
  cell,
  isFieldSelected,
  onClick,
}: ProductCellProps) {
  const columnType = getColumnType(cell.column.id);
  const width = getColumnWidth(cell.column.id) ?? cell.column.columnDef.size;
  const fieldName = cell.column.columnDef.meta?.fieldName as
    | ProductFieldKey
    | undefined;

  // Guard against undefined row
  if (!cell.row || !cell.row.original) {
    return (
      <div
        key={cell.id}
        className={cellVariants({ column: columnType })}
        style={{
          width: width ? `${width}px` : undefined,
          minWidth: width ? `${width}px` : undefined,
        }}
      >
        <span className="text-gray-400">—</span>
      </div>
    );
  }

  const handleClick = (e: React.MouseEvent) => {
    // Check if user clicked on a sub-element with its own data-field (e.g. productDescription)
    const target = e.target as HTMLElement;
    const overrideField = target.closest<HTMLElement>("[data-field]")?.dataset
      .field as ProductFieldKey | undefined;

    if (overrideField) {
      e.stopPropagation();
      onClick?.(overrideField);
    } else if (fieldName) {
      e.stopPropagation();
      onClick?.(fieldName);
    } else if (columnType !== "checkbox") {
      onClick?.();
    }
  };

  const cellContent = flexRender(cell.column.columnDef.cell, cell.getContext());

  return (
    <div
      key={cell.id}
      className={cn(
        cellVariants({
          column: columnType,
          selected: isFieldSelected,
          interactive: !!fieldName,
        }),
      )}
      style={{
        width: width ? `${width}px` : undefined,
        minWidth: width ? `${width}px` : undefined,
      }}
      onClick={handleClick}
    >
      {cellContent}
    </div>
  );
}
