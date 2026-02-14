import { flexRender, type Cell } from "@tanstack/react-table";
import type { Product, ProductFieldKey } from "@/types/product";
import { cn } from "@/lib/utils";
import { EditableCell } from "./EditableCell";

interface ProductCellProps {
  cell: Cell<Product, unknown>;
  isSelected: boolean;
  isFieldSelected: boolean;
  isViewed: boolean;
  onClick?: (fieldKey?: string) => void;
  onSave?: (fieldKey: ProductFieldKey, newValue: string) => void;
}

export function ProductCell({
  cell,
  isSelected,
  isFieldSelected,
  isViewed,
  onClick,
  onSave,
}: ProductCellProps) {
  const size = cell.column.columnDef.size;
  const isItemName = cell.column.id === "itemName";
  const minWidth = isItemName ? 250 : size;
  const fieldName = cell.column.columnDef.meta?.fieldName as
    | ProductFieldKey
    | undefined;
  const isCheckboxColumn = cell.column.id === "select";

  // Guard against undefined row
  if (!cell.row || !cell.row.original) {
    return (
      <div
        key={cell.id}
        className="px-3 py-3 flex items-center border-r border-gray-100 last:border-r-0 transition-colors box-border"
        style={{
          width: size ? `${size}px` : undefined,
          minWidth: minWidth ? `${minWidth}px` : undefined,
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
    } else if (!isCheckboxColumn) {
      onClick?.();
    }
  };

  const handleSave = (fieldKey: ProductFieldKey, newValue: string) => {
    onSave?.(fieldKey, newValue);
  };

  const cellContent = flexRender(cell.column.columnDef.cell, cell.getContext());

  return (
    <div
      key={cell.id}
      className={cn(
        "px-3 py-3 flex items-center border-r border-gray-200 last:border-r-0 transition-colors box-border group relative",
        isCheckboxColumn && "justify-center",
        // Unread rows get heavier font weight
        !isCheckboxColumn && !isViewed && "font-semibold",
        // Apply blue background for selected field
        isFieldSelected && "bg-blue-50",
        // Hover colors: step darker than the row's base background
        fieldName && !isViewed && "cursor-pointer hover:bg-gray-50",
        fieldName && isViewed && "cursor-pointer hover:bg-gray-100/80",
        fieldName &&
          (cell.row.getIsSelected() || isFieldSelected) &&
          "hover:bg-blue-100/80",
      )}
      style={{
        width: size ? `${size}px` : undefined,
        minWidth: minWidth ? `${minWidth}px` : undefined,
        flex: isItemName ? "1" : undefined,
      }}
      onClick={handleClick}
    >
      {fieldName && cell.row.original[fieldName] ? (
        <EditableCell
          value={cell.row.original[fieldName].value}
          fieldKey={fieldName}
          isSelected={isSelected}
          isFieldSelected={isFieldSelected}
          onSave={handleSave}
        >
          {cellContent}
        </EditableCell>
      ) : (
        cellContent
      )}
    </div>
  );
}
