/**
 * Product API Operations
 *
 * All functions return Promises to simulate async API calls.
 * Future implementation will replace localStorage with Supabase.
 */

import type { ExtractedProduct } from "@/types/product";
import { simulateApiCall } from "./client";

// Storage key for localStorage
const PRODUCTS_STORAGE_KEY = "sabana:products";

/**
 * Get products from storage
 */
const getProductsFromStorage = (): ExtractedProduct[] => {
  const stored = localStorage.getItem(PRODUCTS_STORAGE_KEY);
  return stored ? JSON.parse(stored) : [];
};

/**
 * Save products to storage
 */
const saveProductsToStorage = (products: ExtractedProduct[]): void => {
  localStorage.setItem(PRODUCTS_STORAGE_KEY, JSON.stringify(products));
};

/**
 * Fetch all products
 *
 * Future Supabase implementation:
 * ```ts
 * const { data, error } = await supabase
 *   .from('products')
 *   .select('*')
 *   .order('created_at', { ascending: false });
 * if (error) throw error;
 * return data;
 * ```
 */
export const fetchProducts = async (): Promise<ExtractedProduct[]> => {
  const products = getProductsFromStorage();
  return simulateApiCall(products);
};

/**
 * Fetch products by document ID
 *
 * Future Supabase implementation:
 * ```ts
 * const { data, error } = await supabase
 *   .from('products')
 *   .select('*')
 *   .eq('spec_document_id', documentId)
 *   .order('created_at', { ascending: false });
 * ```
 */
export const fetchProductsByDocument = async (
  documentId: string,
): Promise<ExtractedProduct[]> => {
  const products = getProductsFromStorage();
  const filtered = products.filter((p) => p.productDocumentId === documentId);
  return simulateApiCall(filtered);
};

/**
 * Create new products (typically in bulk from PDF extraction)
 *
 * Future Supabase implementation:
 * ```ts
 * const { data, error } = await supabase
 *   .from('products')
 *   .insert(newProducts)
 *   .select();
 * if (error) throw error;
 * return data;
 * ```
 */
export const createProducts = async (
  newProducts: Omit<ExtractedProduct, "id" | "reviewed" | "createdAt">[],
): Promise<ExtractedProduct[]> => {
  const products = getProductsFromStorage();

  // Generate IDs and timestamps (in production, DB generates these)
  const productsWithIds: ExtractedProduct[] = newProducts.map((product) => ({
    ...product,
    id: `prod-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
    reviewed: false,
    createdAt: new Date(),
  }));

  const updatedProducts = [...productsWithIds, ...products];
  saveProductsToStorage(updatedProducts);

  return simulateApiCall(productsWithIds);
};

/**
 * Update a product
 *
 * Future Supabase implementation:
 * ```ts
 * const { data, error } = await supabase
 *   .from('products')
 *   .update(updates)
 *   .eq('id', productId)
 *   .select()
 *   .single();
 * if (error) throw error;
 * return data;
 * ```
 */
export const updateProduct = async (
  productId: string,
  updates: Partial<ExtractedProduct>,
): Promise<ExtractedProduct> => {
  const products = getProductsFromStorage();

  const updatedProducts = products.map((product) => {
    if (product.id === productId) {
      return { ...product, ...updates };
    }
    return product;
  });

  saveProductsToStorage(updatedProducts);

  const updatedProduct = updatedProducts.find((p) => p.id === productId);
  if (!updatedProduct) throw new Error(`Product ${productId} not found`);

  return simulateApiCall(updatedProduct);
};

/**
 * Delete a product
 *
 * Future Supabase implementation:
 * ```ts
 * const { error } = await supabase
 *   .from('products')
 *   .delete()
 *   .eq('id', productId);
 * if (error) throw error;
 * ```
 */
export const deleteProduct = async (productId: string): Promise<void> => {
  const products = getProductsFromStorage();
  const updatedProducts = products.filter(
    (product) => product.id !== productId,
  );
  saveProductsToStorage(updatedProducts);

  return simulateApiCall(undefined);
};

/**
 * Delete multiple products by IDs
 *
 * Future Supabase implementation:
 * ```ts
 * const { error } = await supabase
 *   .from('products')
 *   .delete()
 *   .in('id', productIds);
 * if (error) throw error;
 * ```
 */
export const deleteProducts = async (productIds: string[]): Promise<void> => {
  const products = getProductsFromStorage();
  const idSet = new Set(productIds);
  const updatedProducts = products.filter((product) => !idSet.has(product.id));
  saveProductsToStorage(updatedProducts);

  return simulateApiCall(undefined);
};

/**
 * Delete all products from a document
 * Useful when re-processing a document
 *
 * Future Supabase implementation:
 * ```ts
 * const { error } = await supabase
 *   .from('products')
 *   .delete()
 *   .eq('spec_document_id', documentId);
 * ```
 */
export const deleteProductsByDocument = async (
  documentId: string,
): Promise<void> => {
  const products = getProductsFromStorage();
  const updatedProducts = products.filter(
    (product) => product.productDocumentId !== documentId,
  );
  saveProductsToStorage(updatedProducts);

  return simulateApiCall(undefined);
};
