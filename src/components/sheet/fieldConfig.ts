import type { ProductFieldKey } from "@/types/product";

export interface FieldConfig {
  key: ProductFieldKey;
  label: string;
}

export const FIELD_STRIP_CONFIG: FieldConfig[] = [
  { key: "itemName", label: "Name" },
  { key: "productDescription", label: "Description" },
  { key: "manufacturer", label: "Manufacturer" },
  { key: "specIdNumber", label: "Spec ID" },
  { key: "tag", label: "Tag" },
  { key: "project", label: "Project" },
  { key: "finish", label: "Finish" },
  { key: "size", label: "Size" },
  { key: "price", label: "Price" },
  { key: "details", label: "Details" },
];

export function getFieldLabel(key: ProductFieldKey): string {
  return FIELD_STRIP_CONFIG.find((f) => f.key === key)?.label ?? key;
}
