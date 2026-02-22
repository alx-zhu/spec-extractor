import { cva } from "class-variance-authority";
import { hoverOverlay } from "@/styles/layers";

// Body cell variants.
export const cellVariants = cva(
  "px-3 flex items-center border-r border-gray-100 last:border-r-0 box-border group relative",
  {
    variants: {
      column: {
        checkbox: "justify-center",
        expand: "justify-center px-0",
        sourceAction: "justify-center px-0",
        itemName: "",
        data: "",
      },
      density: {
        default: "py-3",
        compact: "py-2 text-xs",
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
    defaultVariants: {
      column: "data",
      density: "default",
      selected: false,
      interactive: false,
    },
  },
);

// Header cell variants.
export const headerCellVariants = cva(
  "px-3 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wide flex items-center border-r border-gray-200 last:border-r-0",
  {
    variants: {
      column: {
        checkbox: "justify-center",
        expand: "px-0",
        sourceAction: "px-0",
        itemName: "",
        data: "",
      },
    },
    defaultVariants: { column: "data" },
  },
);
