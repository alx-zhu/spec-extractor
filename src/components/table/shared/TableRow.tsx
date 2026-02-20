import { type Row } from "@tanstack/react-table";
import { cn } from "@/lib/utils";
import { TableCell } from "./TableCell";

interface TableRowProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  row: Row<any>;
  onClick?: (fieldKey?: string) => void;
  isSelected?: boolean;
  selectedFieldKey?: string | null;
  /** Slot for hover action bar (e.g. RowActions, unmerge button) */
  actions?: React.ReactNode;
  /** Extra className on the row container (e.g. bg-gray-50 for source rows) */
  className?: string;
  /** Per-cell overlay callback — returns extra content for a given field key */
  cellOverlay?: (fieldKey: string) => React.ReactNode;
}

export function TableRow({
  row,
  onClick,
  isSelected,
  selectedFieldKey,
  actions,
  className,
  cellOverlay,
}: TableRowProps) {
  const isChecked = row.getIsSelected?.() ?? false;

  return (
    <div
      className={cn(
        "flex border-b border-gray-100 transition-colors duration-150 relative group",
        isSelected ? "shadow-md z-10" : isChecked ? "bg-blue-50" : "bg-white",
        className,
      )}
    >
      {row.getVisibleCells().map((cell) => {
        const fieldName = cell.column.columnDef.meta?.fieldName as
          | string
          | undefined;

        const isFieldSelected =
          isSelected &&
          selectedFieldKey &&
          (fieldName === selectedFieldKey ||
            (fieldName === "itemName" &&
              selectedFieldKey === "productDescription"));

        const overlay = fieldName && cellOverlay ? cellOverlay(fieldName) : undefined;

        return (
          <TableCell
            key={cell.id}
            cell={cell}
            isFieldSelected={!!isFieldSelected}
            onClick={onClick}
            overlay={overlay}
          />
        );
      })}
      {actions}
    </div>
  );
}
