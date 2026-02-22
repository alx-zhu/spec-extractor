// Column layout constants.
// Single source of truth for ALL column widths — used by column definitions,
// cell variants, and source row rendering.

/** Standard data column widths */
const colWidth = {
  sm: 160,
  md: 200,
  lg: 300,
} as const;

export const columnLayout = {
  checkbox: { width: 48 },
  expand: { width: 32 },
  /** Combined expand + checkbox width, used for source row action column */
  sourceAction: { width: 80 },
  tag: { width: colWidth.sm },
  itemName: { width: colWidth.md },
  productDescription: { width: colWidth.lg },
  manufacturer: { width: colWidth.md },
  specIdNumber: { width: colWidth.sm },
  finish: { width: colWidth.lg },
  size: { width: colWidth.lg },
  price: { width: colWidth.sm },
  details: { width: colWidth.lg },
} as const;

export type ColumnType = "checkbox" | "expand" | "sourceAction" | "itemName" | "data";

export function getColumnType(columnId: string): ColumnType {
  if (columnId === "select") return "checkbox";
  if (columnId === "expand") return "expand";
  if (columnId === "sourceAction") return "sourceAction";
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
