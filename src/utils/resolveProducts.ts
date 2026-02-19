/**
 * Pure resolver functions: ExtractedProduct / MergedProduct → ResolvedProduct
 *
 * One-directional read-only projection. Mutations always operate on the
 * source types directly — there is no reverse transform.
 *
 * Fields stay as ReductoFieldValue so consumers use the same access pattern
 * as ExtractedProduct (field?.value, field?.citations).
 */

import type { ExtractedProduct, ProductFieldKey } from "@/types/product";
import type { MergedProduct } from "@/types/mergedProduct";
import type { ReductoFieldValue } from "@/types/reducto";
import type { ResolvedProduct } from "@/types/resolvedProduct";
import { PRODUCT_FIELDS } from "@/config/fields";

const ALL_FIELD_KEYS: ProductFieldKey[] = PRODUCT_FIELDS.map((f) => f.key);

/**
 * Resolve a single ExtractedProduct into a ResolvedProduct.
 */
export function resolveExtractedProduct(
  product: ExtractedProduct,
): ResolvedProduct {
  const fields: Partial<Record<ProductFieldKey, ReductoFieldValue<string>>> =
    {};

  for (const key of ALL_FIELD_KEYS) {
    const field = product[key];
    if (field) {
      fields[key] = field;
    }
  }

  return {
    id: product.id,
    tag: product.tag?.value ?? "",
    fields,
    source: { type: "extracted", extractedProduct: product },
    sourceCount: 1,
    reviewed: product.reviewed,
    updatedAt: product.createdAt,
  };
}

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

  // All contributing products must be reviewed (rebuildAll filters for this),
  // so treat the merged product as reviewed if it has any sources.
  const reviewed = extractedProducts.length > 0;

  for (const key of ALL_FIELD_KEYS) {
    const selection = merged.fieldSelections[key];
    if (!selection) continue;

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
    source: { type: "merged", mergedProduct: merged, extractedProducts },
    sourceCount: extractedProducts.length,
    reviewed,
    updatedAt: merged.updatedAt,
  };
}

/**
 * Check if a field has conflicting values across the sources of a resolved product.
 * Used to show the blue dot indicator in the reviewed table.
 *
 * Always returns false for single-source products.
 */
export function hasFieldConflict(
  resolved: ResolvedProduct,
  fieldKey: ProductFieldKey,
): boolean {
  if (resolved.source.type === "extracted") return false;

  const resolvedValue = resolved.fields[fieldKey]?.value;

  return resolved.source.extractedProducts.some((ep) => {
    const epValue = ep[fieldKey]?.value;
    // Both empty = no conflict
    if (!epValue && !resolvedValue) return false;
    return epValue !== resolvedValue;
  });
}
