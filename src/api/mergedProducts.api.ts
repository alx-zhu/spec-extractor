/**
 * MergedProduct API Operations
 *
 * All functions return Promises to simulate async API calls.
 * Future implementation will replace localStorage with Supabase.
 */

import type { ProductFieldKey } from "@/types/product";
import type {
  MergedFieldSelection,
  MergedProduct,
} from "@/types/mergedProduct";
import { PRODUCT_FIELDS } from "@/config/fields";
import { simulateApiCall } from "./client";
// import { rebuildAllMergedProducts } from "@/utils/mergeProducts";

// Storage key for localStorage
const MERGED_PRODUCTS_STORAGE_KEY = "sabana:merged-products";

const ALL_FIELD_KEYS = PRODUCT_FIELDS.map((f) => f.key);

/**
 * One-time migration: fill any missing fieldSelections entries that were
 * stored before the non-partial type guarantee was introduced.
 * Falls back to the newest ExtractedProduct in the pool (last by insertion order).
 * Writes back to storage only if changes were made.
 */
function migrateFieldSelections(products: MergedProduct[]): MergedProduct[] {
  let didMigrate = false;

  const migrated = products.map((mp) => {
    const missing = ALL_FIELD_KEYS.filter((k) => !mp.fieldSelections[k]);
    if (missing.length === 0) return mp;

    didMigrate = true;
    const fallbackId =
      mp.extractedProductIds[mp.extractedProductIds.length - 1];
    const additions: Partial<Record<ProductFieldKey, MergedFieldSelection>> =
      {};
    for (const key of missing) {
      additions[key] = { selectedProductId: fallbackId, isUserOverride: false };
    }
    return {
      ...mp,
      fieldSelections: {
        ...mp.fieldSelections,
        ...additions,
      } as Record<ProductFieldKey, MergedFieldSelection>,
    };
  });

  if (didMigrate) {
    localStorage.setItem(MERGED_PRODUCTS_STORAGE_KEY, JSON.stringify(migrated));
  }

  return migrated;
}

/**
 * Get merged products from storage
 */
const getMergedProductsFromStorage = (): MergedProduct[] => {
  const stored = localStorage.getItem(MERGED_PRODUCTS_STORAGE_KEY);
  if (!stored) return [];
  return migrateFieldSelections(JSON.parse(stored));
};

/**
 * Save merged products to storage
 */
const saveMergedProductsToStorage = (products: MergedProduct[]): void => {
  localStorage.setItem(MERGED_PRODUCTS_STORAGE_KEY, JSON.stringify(products));
};

/**
 * Fetch all merged products
 *
 * Future Supabase implementation:
 * ```ts
 * const { data, error } = await supabase
 *   .from('merged_products')
 *   .select('*')
 *   .order('updated_at', { ascending: false });
 * if (error) throw error;
 * return data;
 * ```
 */
export const fetchMergedProducts = async (): Promise<MergedProduct[]> => {
  const products = getMergedProductsFromStorage();
  return simulateApiCall(products);
};

/**
 * Save all merged products (replaces entire collection).
 * Used after a full re-merge of ExtractedProducts.
 *
 * Future Supabase implementation:
 * ```ts
 * const { error: deleteError } = await supabase
 *   .from('merged_products')
 *   .delete()
 *   .neq('id', '');
 * const { data, error } = await supabase
 *   .from('merged_products')
 *   .upsert(products)
 *   .select();
 * if (error) throw error;
 * return data;
 * ```
 */
export const saveMergedProducts = async (
  products: MergedProduct[],
): Promise<MergedProduct[]> => {
  saveMergedProductsToStorage(products);
  return simulateApiCall(products);
};

/**
 * Override which ExtractedProduct is used for a specific field.
 * Sets isUserOverride to true so re-merges preserve this choice.
 *
 * Future Supabase implementation:
 * ```ts
 * const { data, error } = await supabase
 *   .from('merged_products')
 *   .update({
 *     field_selections: {
 *       ...existingSelections,
 *       [fieldKey]: { selectedProductId, isUserOverride: true }
 *     }
 *   })
 *   .eq('id', mergedProductId)
 *   .select()
 *   .single();
 * if (error) throw error;
 * return data;
 * ```
 */
export const overrideMergedField = async (
  mergedProductId: string,
  fieldKey: ProductFieldKey,
  selectedProductId: string,
): Promise<MergedProduct> => {
  const products = getMergedProductsFromStorage();

  const updatedProducts = products.map((product) => {
    if (product.id === mergedProductId) {
      return {
        ...product,
        fieldSelections: {
          ...product.fieldSelections,
          [fieldKey]: {
            selectedProductId,
            isUserOverride: true,
          },
        },
        updatedAt: new Date(),
      };
    }
    return product;
  });

  saveMergedProductsToStorage(updatedProducts);

  const updated = updatedProducts.find((p) => p.id === mergedProductId);
  if (!updated) {
    throw new Error(`MergedProduct ${mergedProductId} not found`);
  }

  return simulateApiCall(updated);
};

/**
 * Delete a merged product
 *
 * Future Supabase implementation:
 * ```ts
 * const { error } = await supabase
 *   .from('merged_products')
 *   .delete()
 *   .eq('id', mergedProductId);
 * if (error) throw error;
 * ```
 */
export const deleteMergedProduct = async (
  mergedProductId: string,
): Promise<void> => {
  const products = getMergedProductsFromStorage();
  const updatedProducts = products.filter(
    (product) => product.id !== mergedProductId,
  );
  saveMergedProductsToStorage(updatedProducts);

  return simulateApiCall(undefined);
};

/**
 * Delete multiple merged products by IDs
 *
 * Future Supabase implementation:
 * ```ts
 * const { error } = await supabase
 *   .from('merged_products')
 *   .delete()
 *   .in('id', mergedProductIds);
 * if (error) throw error;
 * ```
 */
export const deleteMergedProducts = async (
  mergedProductIds: string[],
): Promise<void> => {
  const products = getMergedProductsFromStorage();
  const idSet = new Set(mergedProductIds);
  const updatedProducts = products.filter((product) => !idSet.has(product.id));
  saveMergedProductsToStorage(updatedProducts);

  return simulateApiCall(undefined);
};
