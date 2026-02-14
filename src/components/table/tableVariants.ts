import { cva } from "class-variance-authority";
import { hoverOverlay } from "@/styles/layers";
import { columnLayout, frozenEdgeShadow } from "@/styles/tableLayout";

// Body cell variants.
// Frozen columns (checkbox, itemName) get bg-white by default for opacity.
// When `selected: true`, bg-blue-50 overrides bg-white via twMerge.
export const cellVariants = cva(
  "px-3 py-3 flex items-center border-r border-gray-100 last:border-r-0 box-border group relative",
  {
    variants: {
      column: {
        checkbox: `justify-center sticky ${columnLayout.checkbox.left} z-20 bg-white`,
        itemName: `sticky ${columnLayout.itemName.left} z-20 bg-white ${frozenEdgeShadow}`,
        data: "",
      },
      selected: {
        true: "bg-blue-50",
        false: "",
      },
      interactive: {
        true: `cursor-pointer ${hoverOverlay}`,
        false: "",
      },
    },
    defaultVariants: { column: "data", selected: false, interactive: false },
  },
);

// Header cell variants.
// Frozen headers use bg-gray-50 and a higher z-index (z-30) to stay above body cells.
export const headerCellVariants = cva(
  "px-3 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wide flex items-center border-r border-gray-200 last:border-r-0",
  {
    variants: {
      column: {
        checkbox: `justify-center sticky ${columnLayout.checkbox.left} z-30 bg-gray-50`,
        itemName: `sticky ${columnLayout.itemName.left} z-30 bg-gray-50 ${frozenEdgeShadow}`,
        data: "",
      },
    },
    defaultVariants: { column: "data" },
  },
);
