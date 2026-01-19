export interface ReductoExtraction {
  result: {
    [fieldName: string]: ReductoFieldValue;
  };
}

export interface ReductoFieldValue {
  value: string | number;
  citations: ReductoCitation[];
}

export interface ReductoCitation {
  type: "Table" | "Text" | "List" | "Image";
  content: string;
  bbox: ReductoBBox;
  confidence: "high" | "medium" | "low";
  granular_confidence: {
    extract_confidence: number;
    parse_confidence: number;
  };
  parentBlock?: {
    type: string;
    content: string;
    bbox: ReductoBBox;
  };
}

export interface ReductoBBox {
  left: number;
  top: number;
  width: number;
  height: number;
  page: number;
  original_page?: number;
}
