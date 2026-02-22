import { flexRender, type Cell } from "@tanstack/react-table";
import type { ProductFieldKey } from "@/types/product";
import { cn } from "@/lib/utils";
import { getColumnType, getColumnWidth } from "@/styles/tableLayout";
import { cellVariants } from "./tableVariants";

interface TableCellProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  cell: Cell<any, unknown>;
  isFieldSelected: boolean;
  onClick?: (fieldKey?: string) => void;
  overlay?: React.ReactNode;
  /** Inline content rendered before cell content (e.g. radio indicator) */
  prefix?: React.ReactNode;
  /** Cell density — controls padding and text size */
  density?: "default" | "compact";
  /** Color theme — controls border and text colors */
  theme?: "default" | "dark";
}

export function TableCell({
  cell,
  isFieldSelected,
  onClick,
  overlay,
  prefix,
  density = "default",
  theme = "default",
}: TableCellProps) {
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
    // Check if user clicked on a sub-element with its own data-field attribute
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
          density,
          theme,
          selected: isFieldSelected,
          interactive: !!fieldName,
        }),
        "group/cell",
        prefix && "gap-2",
      )}
      style={{
        width: width ? `${width}px` : undefined,
        minWidth: width ? `${width}px` : undefined,
      }}
      onClick={handleClick}
    >
      {prefix}
      {cellContent}
      {overlay}
    </div>
  );
}
