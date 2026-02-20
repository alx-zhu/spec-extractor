/**
 * TanStack Query hooks for merged product data
 *
 * These hooks provide:
 * - Fetching merged products
 * - Rebuilding merged products from reviewed ExtractedProducts
 * - Manually merging two products together
 * - Unmerging an ExtractedProduct from a MergedProduct
 * - Overriding per-field source selection
 * - Deleting merged products
 */

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { ProductFieldKey } from "@/types/product";
import * as mergedProductsApi from "@/api/mergedProducts.api";
import * as productsApi from "@/api/products.api";
import {
  rebuildAllMergedProducts,
  mergeTwoProducts,
  unmergeProduct,
  buildMergedProduct,
  buildExtractedProductsMap,
} from "@/utils/mergeProducts";

// Query keys for cache management
export const mergedProductKeys = {
  all: ["merged-products"] as const,
  lists: () => [...mergedProductKeys.all, "list"] as const,
  detail: (id: string) => [...mergedProductKeys.all, "detail", id] as const,
};

/**
 * Fetch all merged products
 */
export const useMergedProducts = () => {
  return useQuery({
    queryKey: mergedProductKeys.lists(),
    queryFn: mergedProductsApi.fetchMergedProducts,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
};

/**
 * Rebuild all merged products from reviewed ExtractedProducts.
 *
 * Fetches current ExtractedProducts and existing MergedProducts,
 * runs the merge algorithm (preserving user overrides), and saves the result.
 *
 * Should be called:
 * - After new products are extracted from a document
 * - After a product's reviewed status changes
 */
export const useRebuildMergedProducts = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const [extractedProducts, existingMergedProducts] = await Promise.all([
        productsApi.fetchProducts(),
        mergedProductsApi.fetchMergedProducts(),
      ]);

      const newMergedProducts = rebuildAllMergedProducts(
        extractedProducts,
        existingMergedProducts,
      );

      return mergedProductsApi.saveMergedProducts(newMergedProducts);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: mergedProductKeys.all });
    },
  });
};

/**
 * Manually merge two MergedProducts into one.
 *
 * Combines their ExtractedProduct pools and rebuilds field selections.
 * Target keeps its ID; source is deleted. Any two products can be merged
 * regardless of tags.
 */
export const useMergeTwoProducts = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      targetId,
      sourceId,
    }: {
      targetId: string;
      sourceId: string;
    }) => {
      const [mergedProducts, extractedProducts] = await Promise.all([
        mergedProductsApi.fetchMergedProducts(),
        productsApi.fetchProducts(),
      ]);

      const target = mergedProducts.find((p) => p.id === targetId);
      const source = mergedProducts.find((p) => p.id === sourceId);

      if (!target) throw new Error(`Target MergedProduct ${targetId} not found`);
      if (!source) throw new Error(`Source MergedProduct ${sourceId} not found`);

      const extractedMap = buildExtractedProductsMap(extractedProducts);
      const merged = mergeTwoProducts(target, source, extractedMap);

      // Replace target with merged result, remove source
      const updatedList = mergedProducts
        .filter((p) => p.id !== sourceId)
        .map((p) => (p.id === targetId ? merged : p));

      return mergedProductsApi.saveMergedProducts(updatedList);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: mergedProductKeys.all });
    },
  });
};

/**
 * Remove an ExtractedProduct from a MergedProduct.
 *
 * Rebuilds field selections for the remaining products in the MergedProduct.
 * The removed ExtractedProduct becomes its own standalone MergedProduct.
 * If the original MergedProduct becomes empty, it is deleted.
 */
export const useUnmergeProduct = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      mergedProductId,
      extractedProductId,
    }: {
      mergedProductId: string;
      extractedProductId: string;
    }) => {
      const [mergedProducts, extractedProducts] = await Promise.all([
        mergedProductsApi.fetchMergedProducts(),
        productsApi.fetchProducts(),
      ]);

      const mergedProduct = mergedProducts.find((p) => p.id === mergedProductId);
      if (!mergedProduct) {
        throw new Error(`MergedProduct ${mergedProductId} not found`);
      }

      const extractedMap = buildExtractedProductsMap(extractedProducts);
      const updatedMerged = unmergeProduct(
        mergedProduct,
        extractedProductId,
        extractedMap,
      );

      // Build a standalone MergedProduct for the removed ExtractedProduct
      const removedProduct = extractedMap.get(extractedProductId);
      let standaloneMerged = null;
      if (removedProduct) {
        standaloneMerged = buildMergedProduct([removedProduct]);
        standaloneMerged.tag = `__standalone_${removedProduct.id}`;
      }

      // Update the list
      let updatedList = mergedProducts.filter((p) => p.id !== mergedProductId);

      // Add back the original (updated) if it still has products
      if (updatedMerged) {
        updatedList.push(updatedMerged);
      }

      // Add the standalone
      if (standaloneMerged) {
        updatedList.push(standaloneMerged);
      }

      return mergedProductsApi.saveMergedProducts(updatedList);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: mergedProductKeys.all });
    },
  });
};

/**
 * Override which ExtractedProduct is used for a specific field.
 * Sets isUserOverride to true so re-merges preserve this choice.
 */
export const useOverrideMergedField = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      mergedProductId,
      fieldKey,
      selectedProductId,
    }: {
      mergedProductId: string;
      fieldKey: ProductFieldKey;
      selectedProductId: string;
    }) =>
      mergedProductsApi.overrideMergedField(
        mergedProductId,
        fieldKey,
        selectedProductId,
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: mergedProductKeys.all });
    },
  });
};

/**
 * Delete a merged product
 */
export const useDeleteMergedProduct = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: mergedProductsApi.deleteMergedProduct,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: mergedProductKeys.all });
    },
  });
};
