// Column layout constants.
// Single source of truth for ALL column widths — used by column definitions,
// cell variants, and source row rendering.

export const columnLayout = {
  checkbox: { width: 48 },
  itemName: { width: 280 },
  manufacturer: { width: 140 },
  specIdNumber: { width: 140 },
  tag: { width: 100 },
  finish: { width: 280 },
  size: { width: 280 },
  price: { width: 140 },
  details: { width: 220 },
} as const;

export type ColumnType = "checkbox" | "itemName" | "data";

export function getColumnType(columnId: string): ColumnType {
  if (columnId === "select") return "checkbox";
  if (columnId === "itemName") return "itemName";
  return "data";
}

// Returns the width for a column. Checks columnLayout first, falls back to undefined
// for columns not in the layout (which use their own `size` from column definitions).
export function getColumnWidth(columnId: string): number | undefined {
  const entry = columnLayout[columnId as keyof typeof columnLayout];
  if (entry) return entry.width;
  return undefined;
}
