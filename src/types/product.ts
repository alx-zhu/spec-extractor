import type {
  ReductoCitation,
  ReductoExtractedProduct,
  ReductoFieldValue,
} from "./reducto";

export interface Product extends ReductoExtractedProduct {
  id: string;
  specDocumentId: string;
  documentType: DocumentType;
  createdAt: Date;
}

// Type for table columns - only the fields with bboxes
export type ProductFieldKey = keyof Pick<
  Product,
  | "itemName"
  | "manufacturer"
  | "modelNumber"
  | "tag"
  | "specIdNumber"
  | "project"
  | "finish"
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
  type: DocumentType;
}

export type DocumentType =
  | "purchase_order"
  | "specification"
  | "drawing"
  | "rfi"
  | "submittal";

export interface DocumentTypeConfig {
  value: DocumentType;
  label: string;
  abbreviation: string;
  color: string;
  bgColor: string;
}

export const DOCUMENT_TYPES: Record<DocumentType, DocumentTypeConfig> = {
  purchase_order: {
    value: "purchase_order",
    label: "Purchase Order",
    abbreviation: "PO",
    color: "text-blue-700",
    bgColor: "bg-blue-50",
  },
  specification: {
    value: "specification",
    label: "Specification",
    abbreviation: "SPEC",
    color: "text-purple-700",
    bgColor: "bg-purple-50",
  },
  drawing: {
    value: "drawing",
    label: "Drawing",
    abbreviation: "DWG",
    color: "text-green-700",
    bgColor: "bg-green-50",
  },
  rfi: {
    value: "rfi",
    label: "RFI",
    abbreviation: "RFI",
    color: "text-orange-700",
    bgColor: "bg-orange-50",
  },
  submittal: {
    value: "submittal",
    label: "Submittal",
    abbreviation: "SUB",
    color: "text-pink-700",
    bgColor: "bg-pink-50",
  },
};
