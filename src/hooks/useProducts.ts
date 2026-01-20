/**
 * TanStack Query hooks for product data fetching
 *
 * These hooks provide:
 * - Automatic caching
 * - Background refetching
 * - Loading and error states
 * - Optimistic updates
 */

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { Product } from "@/types/product";
import * as productsApi from "@/api/products.api";

// Query keys for cache management
export const productKeys = {
  all: ["products"] as const,
  lists: () => [...productKeys.all, "list"] as const,
  list: (filters?: Record<string, unknown>) =>
    [...productKeys.lists(), { filters }] as const,
  details: () => [...productKeys.all, "detail"] as const,
  detail: (id: string) => [...productKeys.details(), id] as const,
  byDocument: (documentId: string) =>
    [...productKeys.all, "by-document", documentId] as const,
};

/**
 * Fetch all products
 */
export const useProducts = () => {
  return useQuery({
    queryKey: productKeys.lists(),
    queryFn: productsApi.fetchProducts,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
};

/**
 * Fetch products by document ID
 */
export const useProductsByDocument = (documentId: string) => {
  return useQuery({
    queryKey: productKeys.byDocument(documentId),
    queryFn: () => productsApi.fetchProductsByDocument(documentId),
    staleTime: 1000 * 60 * 5,
  });
};

/**
 * Create new products (bulk)
 */
export const useCreateProducts = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: productsApi.createProducts,
    onSuccess: () => {
      // Invalidate all product queries to refetch
      queryClient.invalidateQueries({ queryKey: productKeys.all });
    },
  });
};

/**
 * Update a product
 */
export const useUpdateProduct = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      productId,
      updates,
    }: {
      productId: string;
      updates: Partial<Product>;
    }) => productsApi.updateProduct(productId, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: productKeys.all });
    },
  });
};

/**
 * Delete a product
 */
export const useDeleteProduct = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: productsApi.deleteProduct,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: productKeys.all });
    },
  });
};

/**
 * Delete all products from a document
 */
export const useDeleteProductsByDocument = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: productsApi.deleteProductsByDocument,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: productKeys.all });
    },
  });
};
