import type { ProductFieldKey } from "@/types/product";

export interface FieldConfig {
  key: ProductFieldKey;
  label: string;
}

/**
 * Single source of truth for product field keys and their display labels.
 * Used by both the table columns and the sheet components.
 */
export const PRODUCT_FIELDS: FieldConfig[] = [
  { key: "tag", label: "Tag" },
  { key: "itemName", label: "Name" },
  { key: "productDescription", label: "Description" },
  { key: "manufacturer", label: "Manufacturer" },
  { key: "specIdNumber", label: "Spec ID" },
  { key: "project", label: "Project" },
  { key: "finish", label: "Finish" },
  { key: "size", label: "Size" },
  { key: "price", label: "Price" },
  { key: "details", label: "Details" },
];

export function getFieldLabel(key: ProductFieldKey): string {
  return PRODUCT_FIELDS.find((f) => f.key === key)?.label ?? key;
}
