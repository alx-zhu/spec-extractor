import { flexRender, type Cell } from "@tanstack/react-table";
import type { Product, ProductFieldKey } from "@/types/product";
import { cn } from "@/lib/utils";
import { EditableCell } from "./EditableCell";
import { EditableProductCell } from "./EditableProductCell";

interface ProductCellProps {
  cell: Cell<Product, unknown>;
  isSelected: boolean;
  isFieldSelected: boolean;
  isRowChecked?: boolean;
  onClick?: (fieldKey?: string) => void;
  onSave?: (fieldKey: ProductFieldKey, newValue: string) => void;
}

export function ProductCell({
  cell,
  isSelected,
  isFieldSelected,
  isRowChecked,
  onClick,
  onSave,
}: ProductCellProps) {
  const size = cell.column.columnDef.size;
  const isItemName = cell.column.id === "itemName";
  const width = isItemName ? 280 : size;
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
        "px-3 py-3 flex items-center border-r border-gray-100 last:border-r-0 transition-colors box-border group relative",
        isCheckboxColumn && "justify-center",
        // Left selection indicator on checkbox cell
        isCheckboxColumn && isSelected && "before:absolute before:left-0 before:top-0 before:bottom-0 before:w-1 before:bg-blue-500 before:z-30",
        // Sticky frozen columns
        isCheckboxColumn && "sticky left-0 z-20",
        isItemName && "sticky left-[48px] z-20 shadow-[2px_0_4px_-2px_rgba(0,0,0,0.1)]",
        // Background for sticky cells (must be opaque to cover scrolling content)
        (isCheckboxColumn || isItemName) && !isFieldSelected && !isRowChecked && "bg-white",
        (isCheckboxColumn || isItemName) && !isFieldSelected && isRowChecked && "bg-blue-50",
        // Apply blue background for selected field
        isFieldSelected && "bg-blue-50",
        // Hover state layer: pseudo-element overlay that composites on top of any background (Material Design pattern)
        fieldName && "cursor-pointer after:absolute after:inset-0 after:pointer-events-none after:transition-colors hover:after:bg-black/[0.04]",
      )}
      style={{
        width: width ? `${width}px` : undefined,
        minWidth: width ? `${width}px` : undefined,
      }}
      onClick={handleClick}
    >
      {isItemName && cell.row.original.itemName ? (
        <EditableProductCell
          itemNameValue={cell.row.original.itemName.value}
          descriptionValue={cell.row.original.productDescription?.value || ""}
          isSelected={isSelected}
          isFieldSelected={isFieldSelected}
          onSave={handleSave}
        >
          {cellContent}
        </EditableProductCell>
      ) : fieldName && cell.row.original[fieldName] ? (
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
