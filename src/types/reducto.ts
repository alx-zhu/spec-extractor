/**
 * Reducto Extract API Response (with citations enabled)
 */
export interface ReductoExtractResponse {
  result: ReductoExtractedProduct[];
  job_id: string;
  usage: {
    num_fields: number;
    num_pages: number;
    credits: number;
  };
  studio_link: string;
}

/**
 * Single extracted product from Reducto (with citations)
 */
export interface ReductoExtractedProduct {
  itemName: ReductoFieldValue<string>;
  manufacturer: ReductoFieldValue<string>;
  productKey: ReductoFieldValue<string>;
  tag?: ReductoFieldValue<string>; // architect tag (optional)
  specIdNumber: ReductoFieldValue<string>;
  project: ReductoFieldValue<string>;
  color?: ReductoFieldValue<string>;
  size?: ReductoFieldValue<string>;
  price?: ReductoFieldValue<string>;
  details?: ReductoFieldValue<string>;

  // Legacy / optional fields kept for compatibility
  linkToProduct?: ReductoFieldValue<string>;
  quantity?: ReductoFieldValue<string>;
  extendedPrice?: ReductoFieldValue<string>;
}

/**
 * Field value with citations
 */
export interface ReductoFieldValue<T = string> {
  value: T;
  citations: ReductoCitation[];
}

/**
 * Citation with source location
 */
export interface ReductoCitation {
  type:
    | "Table"
    | "Text"
    | "List"
    | "List Item"
    | "Image"
    | "Section Header"
    | "Header"
    | "Title";
  content: string;
  bbox: ReductoBBox;
  confidence: "high" | "medium" | "low";
  granular_confidence?: {
    extract_confidence: number | null;
    parse_confidence: number;
  };
  image_url?: string | null;
  chart_data?: unknown | null;
  extra?: unknown | null;
  parentBlock?: {
    type: string;
    content: string;
    bbox: ReductoBBox;
  };
}

/**
 * Bounding box coordinates (normalized 0-1)
 */
export interface ReductoBBox {
  left: number;
  top: number;
  width: number;
  height: number;
  page: number;
  original_page?: number;
}
