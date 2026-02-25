import type { ProductFieldKey } from "./product";

/**
 * Per-field selection: which ExtractedProduct's value to use for this field.
 */
export interface MergedFieldSelection {
  /** ID of the ExtractedProduct whose value is selected for this field */
  selectedProductId: string;
  /** Whether the user manually chose this source (vs auto-resolved by merge algorithm) */
  isUserOverride: boolean;
}

/**
 * A product merged from one or more ExtractedProducts.
 *
 * Stores only identity and per-field source pointers — no duplicated field data.
 * Actual field values and citations are resolved at read time by looking up
 * the selected ExtractedProduct.
 */
export interface MergedProduct {
  id: string;
  /** The tag that links ExtractedProducts together (merge key, e.g. "C-01") */
  tag: string;
  /** IDs of all contributing ExtractedProducts (ordered by createdAt ascending) */
  extractedProductIds: string[];
  /** Per-field: which ExtractedProduct's value to use */
  fieldSelections: Record<ProductFieldKey, MergedFieldSelection>;
  /** Timestamp of last merge/update */
  updatedAt: Date;
}
