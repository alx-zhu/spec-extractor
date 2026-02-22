import type { ExtractedProduct, ProductFieldKey } from "./product";
import type { MergedProduct } from "./mergedProduct";
import type { ReductoFieldValue } from "./reducto";

/**
 * Source of a ResolvedProduct — always backed by a MergedProduct.
 *
 * Every product goes through the merge pipeline (even single-source products
 * get a MergedProduct with one EP). This means there is always a
 * mergedProduct and an extractedProducts array (length >= 1).
 */
export interface ResolvedProductSource {
  mergedProduct: MergedProduct;
  extractedProducts: ExtractedProduct[];
}

/**
 * Read-only view type computed from MergedProduct + ExtractedProducts.
 *
 * Never stored — always derived at read time.
 * Display, export, and table components consume this uniform type.
 *
 * Fields use ReductoFieldValue directly so that consumers can use the same
 * `field?.value` / `field?.citations` access pattern as ExtractedProduct.
 */
export interface ResolvedProduct {
  id: string;
  tag: string;
  fields: Partial<Record<ProductFieldKey, ReductoFieldValue<string>>>;
  source: ResolvedProductSource;
  sourceCount: number;
  reviewed: boolean;
  updatedAt: Date;
}
