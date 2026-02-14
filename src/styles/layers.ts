// Reusable interaction state layers (Material Design pattern).
// These are generic class fragments — usable on tables, cards, lists, etc.

// ::after overlay that darkens any background on hover without replacing it.
export const hoverOverlay =
  "after:absolute after:inset-0 after:pointer-events-none after:transition-colors hover:after:bg-black/4";

// Blue left-edge stripe using ::before. Use on the leftmost cell of a selected row.
export const selectionIndicator =
  "before:absolute before:left-0 before:top-0 before:bottom-0 before:w-1 before:bg-blue-500 before:z-30";
