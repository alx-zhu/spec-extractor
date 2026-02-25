/**
 * Merge Logic for ExtractedProducts → MergedProducts
 *
 * Architecture: composable primitives that all delegate to `buildMergedProduct`.
 *
 * Layer 1: Pure helpers (isEmptyValue, normalizeTag)
 * Layer 2: Core primitive (buildMergedProduct) — all other operations compose this
 * Layer 3: Operations (mergeTwoProducts, unmergeProduct) — user-facing actions
 * Layer 4: Batch orchestrator (rebuildAllMergedProducts) — "rebuild the world"
 * Resolution: resolveMergedField — look up actual values at read time
 */

import type { ExtractedProduct, ProductFieldKey } from "@/types/product";
import type {
  MergedProduct,
  MergedFieldSelection,
} from "@/types/mergedProduct";
import type { ReductoFieldValue } from "@/types/reducto";
import { PRODUCT_FIELDS } from "@/config/fields";

const ALL_FIELD_KEYS: ProductFieldKey[] = PRODUCT_FIELDS.map((f) => f.key);

// ---------------------------------------------------------------------------
// Layer 1: Pure helpers
// ---------------------------------------------------------------------------

/**
 * Check if a field value is empty or N/A (i.e. not a meaningful extracted value).
 */
export function isEmptyValue(value: string | undefined): boolean {
  if (!value) return true;
  const normalized = value.trim().toLowerCase();
  return normalized === "" || normalized === "n/a";
}

/**
 * Normalize a tag for matching: trim whitespace, uppercase.
 * Returns null if the tag is empty/N/A (not mergeable).
 */
export function normalizeTag(tag: string | undefined): string | null {
  if (isEmptyValue(tag)) return null;
  return tag!.trim().toUpperCase();
}

/**
 * Create an ExtractedProduct lookup map from an array.
 */
export function buildExtractedProductsMap(
  products: ExtractedProduct[],
): Map<string, ExtractedProduct> {
  const map = new Map<string, ExtractedProduct>();
  for (const p of products) {
    map.set(p.id, p);
  }
  return map;
}

// ---------------------------------------------------------------------------
// Layer 2: Core primitive — buildMergedProduct
// ---------------------------------------------------------------------------

/**
 * For a single field, pick the default selected ExtractedProduct:
 * the most recently created product that has a non-empty value.
 *
 * @param products - Must be sorted oldest-first (ascending createdAt).
 */
function pickDefaultSource(
  products: ExtractedProduct[],
  fieldKey: ProductFieldKey,
): string | null {
  // Iterate newest-first
  for (let i = products.length - 1; i >= 0; i--) {
    const product = products[i];
    const fieldValue = product[fieldKey]?.value;
    if (!isEmptyValue(fieldValue)) {
      return product.id;
    }
  }
  return null;
}

/**
 * Resolve field selections for a set of ExtractedProducts,
 * preserving user overrides from an existing MergedProduct if available.
 */
function resolveFieldSelections(
  products: ExtractedProduct[],
  existingMerged?: MergedProduct,
): Record<ProductFieldKey, MergedFieldSelection> {
  const selections: Partial<Record<ProductFieldKey, MergedFieldSelection>> = {};
  const productIdSet = new Set(products.map((p) => p.id));

  for (const fieldKey of ALL_FIELD_KEYS) {
    const existingSelection = existingMerged?.fieldSelections[fieldKey];

    // Preserve user override if the source product still exists in the pool
    if (
      existingSelection?.isUserOverride &&
      productIdSet.has(existingSelection.selectedProductId)
    ) {
      selections[fieldKey] = existingSelection;
      continue;
    }

    // Auto-resolve: pick latest non-empty value, fall back to newest product
    const selectedId =
      pickDefaultSource(products, fieldKey) ??
      products[products.length - 1].id;
    selections[fieldKey] = {
      selectedProductId: selectedId,
      isUserOverride: false,
    };
  }

  return selections as Record<ProductFieldKey, MergedFieldSelection>;
}

/**
 * Generate a unique MergedProduct ID.
 */
function generateMergedId(): string {
  return `merged-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

/**
 * Build a single MergedProduct from a list of ExtractedProducts.
 *
 * This is the fundamental merge operation. All other merge operations
 * (manual merge, auto-merge, re-merge) decompose into calls to this function.
 *
 * The caller is responsible for setting the `tag` and `id` on the result.
 * This function sets a generated `id` and an empty `tag` by default.
 * Use the returned object and override `tag`/`id` as needed.
 *
 * @param extractedProducts - Products to merge (must have ≥1).
 * @param existingMerged - Previous MergedProduct to preserve user overrides from.
 * @returns A new MergedProduct with resolved field selections.
 */
export function buildMergedProduct(
  extractedProducts: ExtractedProduct[],
  existingMerged?: MergedProduct,
): MergedProduct {
  if (extractedProducts.length === 0) {
    throw new Error(
      "buildMergedProduct requires at least one ExtractedProduct",
    );
  }

  // Sort oldest-first for consistent ordering and "latest wins" field resolution
  const sorted = [...extractedProducts].sort(
    (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
  );

  const fieldSelections = resolveFieldSelections(sorted, existingMerged);

  return {
    id: existingMerged?.id ?? generateMergedId(),
    tag: "", // Caller must set this
    extractedProductIds: sorted.map((p) => p.id),
    fieldSelections,
    updatedAt: new Date(),
  };
}

// ---------------------------------------------------------------------------
// Layer 3: Merge & unmerge operations
// ---------------------------------------------------------------------------

/**
 * Collect ExtractedProducts for a MergedProduct from the lookup map.
 */
function collectExtractedProducts(
  mergedProduct: MergedProduct,
  extractedProductsMap: Map<string, ExtractedProduct>,
): ExtractedProduct[] {
  const products: ExtractedProduct[] = [];
  for (const id of mergedProduct.extractedProductIds) {
    const product = extractedProductsMap.get(id);
    if (product) {
      products.push(product);
    }
  }
  return products;
}

/**
 * Resolve the tag for a merged result.
 * Prefers the target's tag; falls back to source's tag; falls back to generated standalone key.
 */
function resolveTag(target: MergedProduct, source: MergedProduct): string {
  const targetTag = target.tag.startsWith("__standalone_") ? null : target.tag;
  const sourceTag = source.tag.startsWith("__standalone_") ? null : source.tag;
  return targetTag ?? sourceTag ?? target.tag; // last fallback keeps existing standalone key
}

/**
 * Merge two MergedProducts into one.
 *
 * Combines their ExtractedProduct pools and rebuilds field selections.
 * User overrides from `target` take precedence over `source`.
 * No tag-matching gate — any two products can be merged regardless of tags.
 *
 * @param target - The MergedProduct that absorbs the other (keeps its ID).
 * @param source - The MergedProduct being merged in (caller should delete it).
 * @param extractedProductsMap - Lookup for ExtractedProduct data.
 * @returns The merged result (single MergedProduct with target's ID).
 */
export function mergeTwoProducts(
  target: MergedProduct,
  source: MergedProduct,
  extractedProductsMap: Map<string, ExtractedProduct>,
): MergedProduct {
  const targetProducts = collectExtractedProducts(target, extractedProductsMap);
  const sourceProducts = collectExtractedProducts(source, extractedProductsMap);
  const allProducts = [...targetProducts, ...sourceProducts];

  if (allProducts.length === 0) {
    throw new Error(
      "Cannot merge: no ExtractedProducts found for either product",
    );
  }

  // Build with target as the existing merged (preserves target's overrides)
  const merged = buildMergedProduct(allProducts, target);

  // Set identity: keep target's ID, resolve tag
  merged.id = target.id;
  merged.tag = resolveTag(target, source);

  return merged;
}

/**
 * Remove an ExtractedProduct from a MergedProduct.
 *
 * Rebuilds field selections for the remaining products.
 * Returns null if the MergedProduct would become empty (caller should delete it).
 *
 * @param mergedProduct - The MergedProduct to remove from.
 * @param extractedProductId - The ExtractedProduct ID to remove.
 * @param extractedProductsMap - Lookup for ExtractedProduct data.
 * @returns Updated MergedProduct, or null if empty.
 */
export function unmergeProduct(
  mergedProduct: MergedProduct,
  extractedProductId: string,
  extractedProductsMap: Map<string, ExtractedProduct>,
): MergedProduct | null {
  const remainingIds = mergedProduct.extractedProductIds.filter(
    (id) => id !== extractedProductId,
  );

  if (remainingIds.length === 0) {
    return null;
  }

  const remainingProducts: ExtractedProduct[] = [];
  for (const id of remainingIds) {
    const product = extractedProductsMap.get(id);
    if (product) {
      remainingProducts.push(product);
    }
  }

  if (remainingProducts.length === 0) {
    return null;
  }

  // Rebuild with existing overrides preserved
  const rebuilt = buildMergedProduct(remainingProducts, mergedProduct);
  rebuilt.id = mergedProduct.id;
  rebuilt.tag = mergedProduct.tag;

  return rebuilt;
}

// ---------------------------------------------------------------------------
// Layer 4: Batch orchestrator
// ---------------------------------------------------------------------------

/**
 * Group ExtractedProducts by their normalized tag.
 * Products without a tag are each placed in their own standalone group.
 */
function groupByTag(
  products: ExtractedProduct[],
): Map<string, ExtractedProduct[]> {
  const groups = new Map<string, ExtractedProduct[]>();

  for (const product of products) {
    const tag = normalizeTag(product.tag?.value);
    const key = tag ?? `__standalone_${product.id}`;

    const group = groups.get(key);
    if (group) {
      group.push(product);
    } else {
      groups.set(key, [product]);
    }
  }

  return groups;
}

/**
 * Build an index of existing MergedProducts by tag for fast lookup.
 */
function indexByTag(
  mergedProducts: MergedProduct[],
): Map<string, MergedProduct> {
  const index = new Map<string, MergedProduct>();
  for (const mp of mergedProducts) {
    index.set(mp.tag, mp);
  }
  return index;
}

/**
 * Rebuild all MergedProducts from the full set of ExtractedProducts.
 *
 * Groups by tag, calls buildMergedProduct per group, preserves user overrides
 * from existing MergedProducts.
 *
 * This is the "rebuild the world" function, called after extraction or
 * when products change.
 *
 * @param extractedProducts - All ExtractedProducts.
 * @param existingMergedProducts - Previous MergedProducts for override preservation.
 * @returns New array of MergedProducts.
 */
export function rebuildAllMergedProducts(
  extractedProducts: ExtractedProduct[],
  existingMergedProducts: MergedProduct[] = [],
): MergedProduct[] {
  // Group all products by normalized tag
  const groups = groupByTag(extractedProducts);

  // Index existing merged products for override preservation
  const existingIndex = indexByTag(existingMergedProducts);

  // Build one MergedProduct per group
  const result: MergedProduct[] = [];

  for (const [groupKey, products] of groups) {
    const tag = normalizeTag(products[0].tag?.value);
    const mergedTag = tag ?? groupKey;

    const existingMerged = existingIndex.get(mergedTag);
    const merged = buildMergedProduct(products, existingMerged);

    // Set the tag (buildMergedProduct leaves it empty for caller to set)
    merged.tag = mergedTag;

    result.push(merged);
  }

  return result;
}

// ---------------------------------------------------------------------------
// Resolution utility
// ---------------------------------------------------------------------------

/**
 * Resolve a MergedProduct field to its actual ReductoFieldValue by looking up
 * the selected ExtractedProduct.
 *
 * @param mergedProduct - The merged product.
 * @param fieldKey - The field to resolve.
 * @param extractedProductsMap - Map of ExtractedProduct ID → ExtractedProduct.
 * @returns The ReductoFieldValue from the selected source, or undefined.
 */
export function resolveMergedField(
  mergedProduct: MergedProduct,
  fieldKey: ProductFieldKey,
  extractedProductsMap: Map<string, ExtractedProduct>,
): ReductoFieldValue<string> | undefined {
  const selection = mergedProduct.fieldSelections[fieldKey];
  const sourceProduct = extractedProductsMap.get(selection.selectedProductId);
  if (!sourceProduct) return undefined;

  return sourceProduct[fieldKey];
}
