/**
 * Pure resolver: MergedProduct → ResolvedProduct
 *
 * One-directional read-only projection. Mutations always operate on the
 * source types directly — there is no reverse transform.
 *
 * Every product goes through the merge pipeline, so there is a single
 * resolve path: MergedProduct + ExtractedProducts → ResolvedProduct.
 */

import type { ExtractedProduct, ProductFieldKey } from "@/types/product";
import type { MergedProduct } from "@/types/mergedProduct";
import type { ReductoFieldValue } from "@/types/reducto";
import type { ResolvedProduct } from "@/types/resolvedProduct";
import { PRODUCT_FIELDS } from "@/config/fields";

const ALL_FIELD_KEYS: ProductFieldKey[] = PRODUCT_FIELDS.map((f) => f.key);

/**
 * Resolve a MergedProduct into a ResolvedProduct by looking up
 * field selections in the extracted products map.
 */
export function resolveMergedProduct(
  merged: MergedProduct,
  extractedProductsMap: Map<string, ExtractedProduct>,
): ResolvedProduct {
  const fields: Partial<Record<ProductFieldKey, ReductoFieldValue<string>>> =
    {};
  const extractedProducts: ExtractedProduct[] = [];

  for (const id of merged.extractedProductIds) {
    const ep = extractedProductsMap.get(id);
    if (ep) extractedProducts.push(ep);
  }

  // Preserved for future confirmation workflow — true if all sources are reviewed
  const reviewed = extractedProducts.every((ep) => ep.reviewed);

  for (const key of ALL_FIELD_KEYS) {
    const selection = merged.fieldSelections[key];
    const sourceProduct = extractedProductsMap.get(selection.selectedProductId);
    if (!sourceProduct) continue;

    const field = sourceProduct[key];
    if (field) {
      fields[key] = field;
    }
  }

  return {
    id: merged.id,
    tag: merged.tag,
    fields,
    source: { mergedProduct: merged, extractedProducts },
    sourceCount: extractedProducts.length,
    reviewed,
    updatedAt: merged.updatedAt,
  };
}
