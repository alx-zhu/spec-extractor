import type { ExtractedProduct, ProductFieldKey } from "./product";
import type { MergedProduct } from "./mergedProduct";
import type { ReductoFieldValue } from "./reducto";

/**
 * Discriminated union identifying the underlying source of a ResolvedProduct.
 *
 * Mutation-side code reaches through `source` to call the appropriate hook
 * (e.g. useUpdateProduct vs useOverrideMergedField).
 *
 * The merge detail UI accesses `source.extractedProducts` directly to render
 * each contributing ExtractedProduct with the existing row components.
 */
export type ResolvedProductSource =
  | {
      type: "extracted";
      extractedProduct: ExtractedProduct;
    }
  | {
      type: "merged";
      mergedProduct: MergedProduct;
      extractedProducts: ExtractedProduct[];
    };

/**
 * Read-only view type computed from ExtractedProduct or MergedProduct.
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
