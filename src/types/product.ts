import type {
  ReductoCitation,
  ReductoExtractedProduct,
  ReductoFieldValue,
} from "./reducto";

export interface Product extends ReductoExtractedProduct {
  id: string;
  specDocumentId: string;
  createdAt: Date;
}

// Type for table columns - only the fields with bboxes
export type ProductFieldKey = keyof Pick<
  Product,
  | "itemName"
  | "manufacturer"
  | "productKey"
  | "tag"
  | "specIdNumber"
  | "project"
  | "color"
  | "size"
  | "price"
  | "details"
>;

// Helper function to get field value safely
export function getFieldValue(field: ReductoFieldValue<string>): string {
  return field.value;
}

// Helper function to get field bbox safely
export function getFieldCitations(
  field: ReductoFieldValue<string>,
): ReductoCitation[] {
  return field.citations;
}

export interface SpecDocument {
  id: string;
  filename: string;
  uploadDate: Date;
  status: "processing" | "completed" | "error";
}
