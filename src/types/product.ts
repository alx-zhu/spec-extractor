import type { ReductoCitation, ReductoBBox } from "./reducto";

export interface FieldWithBBox<T> {
  value: T;
  bbox: ReductoBBox;
  citation?: ReductoCitation; // Keep full Reducto citation for reference
}

export interface Product {
  id: string;

  // Product fields with Reducto bounding boxes
  itemName: FieldWithBBox<string>;
  manufacturer: FieldWithBBox<string>;
  productKey: FieldWithBBox<string>;
  tag?: FieldWithBBox<string>;
  specIdNumber: FieldWithBBox<string>;
  project: FieldWithBBox<string>;
  color?: FieldWithBBox<string>;
  size?: FieldWithBBox<string>;
  price?: FieldWithBBox<string>;
  details?: FieldWithBBox<string>;

  // Source tracking from Reducto
  specDocumentId: string;
  extractedText: string;

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

// Helper to create FieldWithBBox from Reducto citation
export function createFieldFromCitation(
  citation: ReductoCitation,
): FieldWithBBox<string> {
  return {
    value: String(citation.content),
    bbox: citation.bbox,
    citation,
  };
}

// Helper function to get field value safely
export function getFieldValue(field: FieldWithBBox<string>): string {
  return field.value;
}

// Helper function to get field bbox safely
export function getFieldBBox(field: FieldWithBBox<string>): ReductoBBox {
  return field.bbox;
}

export interface SpecDocument {
  id: string;
  filename: string;
  uploadDate: Date;
  status: "processing" | "completed" | "error";
}
