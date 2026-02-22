/**
 * MergedProduct API Operations
 *
 * All functions return Promises to simulate async API calls.
 * Future implementation will replace localStorage with Supabase.
 */

import type { ProductFieldKey } from "@/types/product";
import type { MergedProduct } from "@/types/mergedProduct";
import { simulateApiCall } from "./client";
import { mockProducts, mockReviewedProducts } from "@/data/mockData";
import { rebuildAllMergedProducts } from "@/utils/mergeProducts";

// Storage key for localStorage
const MERGED_PRODUCTS_STORAGE_KEY = "sabana:merged-products";

/**
 * Initialize localStorage with merged products from reviewed mock data if empty
 */
const initializeStorage = (): void => {
  if (!localStorage.getItem(MERGED_PRODUCTS_STORAGE_KEY)) {
    const seeded = rebuildAllMergedProducts([...mockProducts, ...mockReviewedProducts]);
    localStorage.setItem(MERGED_PRODUCTS_STORAGE_KEY, JSON.stringify(seeded));
  }
};

/**
 * Get merged products from storage
 */
const getMergedProductsFromStorage = (): MergedProduct[] => {
  initializeStorage();
  const stored = localStorage.getItem(MERGED_PRODUCTS_STORAGE_KEY);
  return stored ? JSON.parse(stored) : [];
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
