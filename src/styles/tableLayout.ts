// Column layout constants.
// Single source of truth: column widths here are used by both column definitions
// (columns.tsx) and cell variants (tableVariants.ts).

export const columnLayout = {
  checkbox: { width: 48 },
  itemName: { width: 280 },
} as const;

export type ColumnType = "checkbox" | "itemName" | "data";

export function getColumnType(columnId: string): ColumnType {
  if (columnId === "select") return "checkbox";
  if (columnId === "itemName") return "itemName";
  return "data";
}

// Returns the override width for checkbox and itemName columns, or undefined
// for regular columns (which use their own `size` from column definitions).
export function getColumnWidth(columnId: string): number | undefined {
  if (columnId === "select") return columnLayout.checkbox.width;
  if (columnId === "itemName") return columnLayout.itemName.width;
  return undefined;
}
