import type { ProductFieldKey } from "@/types/product";
import type { ResolvedProduct } from "@/types/resolvedProduct";
import { PRODUCT_FIELDS } from "@/config/fields";

export interface SortConfig {
  columnId: string;
  direction: "asc" | "desc";
}

export const DEFAULT_SORT: SortConfig = {
  columnId: "updatedAt",
  direction: "desc",
};

export const SORT_OPTIONS: { value: string; label: string }[] = [
  { value: "updatedAt", label: "Last updated" },
  ...PRODUCT_FIELDS.map((f) => ({ value: f.key, label: f.label })),
];

export function createSortComparator(
  sortConfig: SortConfig,
): (a: ResolvedProduct, b: ResolvedProduct) => number {
  const { columnId, direction } = sortConfig;
  const multiplier = direction === "asc" ? 1 : -1;

  return (a, b) => {
    if (columnId === "updatedAt") {
      return (
        multiplier *
        (new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime())
      );
    }

    const aVal =
      a.fields[columnId as ProductFieldKey]?.value?.toLowerCase() ?? "";
    const bVal =
      b.fields[columnId as ProductFieldKey]?.value?.toLowerCase() ?? "";

    // Push empty values to the bottom regardless of direction
    if (!aVal && !bVal) return 0;
    if (!aVal) return 1;
    if (!bVal) return -1;

    return multiplier * aVal.localeCompare(bVal);
  };
}
