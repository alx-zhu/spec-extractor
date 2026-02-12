/**
 * Viewed Products API Operations
 *
 * Tracks which products have been viewed (clicked on) by the user.
 * Stored separately from product data — in production this becomes
 * a `product_views` table joined at query time.
 *
 * Future Supabase implementation:
 * ```ts
 * const { data, error } = await supabase
 *   .from('product_views')
 *   .select('product_id')
 *   .eq('user_id', userId);
 * ```
 */

import { simulateApiCall } from "./client";

const STORAGE_KEY = "sabana:viewed-products";

const getViewedIdsFromStorage = (): string[] => {
  const stored = localStorage.getItem(STORAGE_KEY);
  return stored ? JSON.parse(stored) : [];
};

const saveViewedIdsToStorage = (ids: string[]): void => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(ids));
};

/**
 * Fetch all viewed product IDs
 */
export const fetchViewedProductIds = async (): Promise<string[]> => {
  return simulateApiCall(getViewedIdsFromStorage());
};

/**
 * Mark a product as viewed
 *
 * Future Supabase implementation:
 * ```ts
 * const { error } = await supabase
 *   .from('product_views')
 *   .upsert({ user_id: userId, product_id: productId });
 * ```
 */
export const markProductViewed = async (productId: string): Promise<void> => {
  const ids = getViewedIdsFromStorage();
  if (!ids.includes(productId)) {
    saveViewedIdsToStorage([...ids, productId]);
  }
  return simulateApiCall(undefined);
};
