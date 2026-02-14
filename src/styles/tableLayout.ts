// Frozen column layout — widths, sticky offsets, and shared visual constants.
// Single source of truth: column widths here are used by both column definitions
// (columns.tsx) and sticky positioning (tableVariants.ts).
//
// IMPORTANT: The `left` values are Tailwind class literals (not interpolated)
// so Tailwind v4's Vite plugin can detect them during static scanning.

export const columnLayout = {
  checkbox: { width: 48, left: "left-0" },
  itemName: { width: 280, left: "left-[48px]" },
} as const;

// Shadow cast by the last frozen column to visually separate it from scrollable content.
export const frozenEdgeShadow = "shadow-[2px_0_4px_-2px_rgba(0,0,0,0.1)]";

export type ColumnType = "checkbox" | "itemName" | "data";

export function getColumnType(columnId: string): ColumnType {
  if (columnId === "select") return "checkbox";
  if (columnId === "itemName") return "itemName";
  return "data";
}

// Returns the override width for frozen columns, or undefined for regular columns
// (which use their own `size` from column definitions).
export function getColumnWidth(columnId: string): number | undefined {
  if (columnId === "select") return columnLayout.checkbox.width;
  if (columnId === "itemName") return columnLayout.itemName.width;
  return undefined;
}
