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
import type { ExtractedProduct, ProductFieldKey } from "@/types/product";
import type { ReductoFieldValue } from "@/types/reducto";
import * as mergedProductsApi from "@/api/mergedProducts.api";
import * as productsApi from "@/api/products.api";
import {
  rebuildAllMergedProducts,
  integrateNewProducts,
  mergeTwoProducts,
  unmergeProduct,
  buildMergedProduct,
  buildExtractedProductsMap,
} from "@/utils/mergeProducts";
import { productKeys } from "./useProducts";

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
      queryClient.invalidateQueries({ queryKey: productKeys.all });
      queryClient.invalidateQueries({ queryKey: mergedProductKeys.all });
    },
  });
};

/**
 * Integrate newly extracted products into existing merged products.
 *
 * Unlike useRebuildMergedProducts, this preserves existing MP groupings
 * (including manual merges) and only processes new EPs.
 */
export const useIntegrateNewProducts = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const [extractedProducts, existingMergedProducts] = await Promise.all([
        productsApi.fetchProducts(),
        mergedProductsApi.fetchMergedProducts(),
      ]);

      const updatedMergedProducts = integrateNewProducts(
        extractedProducts,
        existingMergedProducts,
      );

      return mergedProductsApi.saveMergedProducts(updatedMergedProducts);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: productKeys.all });
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

      if (!target)
        throw new Error(`Target MergedProduct ${targetId} not found`);
      if (!source)
        throw new Error(`Source MergedProduct ${sourceId} not found`);

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

      const mergedProduct = mergedProducts.find(
        (p) => p.id === mergedProductId,
      );
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
      const updatedList = mergedProducts.filter(
        (p) => p.id !== mergedProductId,
      );

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

/**
 * Delete multiple merged products by IDs
 */
export const useDeleteMergedProducts = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: mergedProductsApi.deleteMergedProducts,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: mergedProductKeys.all });
    },
  });
};

/**
 * Delete a single source (ExtractedProduct) from a MergedProduct.
 *
 * Deletes the EP, then updates the parent MergedProduct:
 * - If the MP has no remaining EPs, it is deleted entirely.
 * - Otherwise, field selections are rebuilt from remaining EPs.
 */
export const useDeleteSourceFromMergedProduct = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      mergedProductId,
      extractedProductId,
    }: {
      mergedProductId: string;
      extractedProductId: string;
    }) => {
      // Delete the EP first
      await productsApi.deleteProduct(extractedProductId);

      // Fetch current state after EP deletion
      const [mergedProducts, allProducts] = await Promise.all([
        mergedProductsApi.fetchMergedProducts(),
        productsApi.fetchProducts(),
      ]);

      const mp = mergedProducts.find((p) => p.id === mergedProductId);
      if (!mp) return;

      const remainingIds = mp.extractedProductIds.filter(
        (id) => id !== extractedProductId,
      );

      if (remainingIds.length === 0) {
        // MP is now empty — delete it
        const updatedList = mergedProducts.filter(
          (p) => p.id !== mergedProductId,
        );
        return mergedProductsApi.saveMergedProducts(updatedList);
      }

      // Rebuild the MP with remaining EPs, preserving user overrides
      const epMap = buildExtractedProductsMap(allProducts);
      const remainingEps = remainingIds
        .map((id) => epMap.get(id))
        .filter((ep): ep is ExtractedProduct => ep != null);

      const rebuilt = buildMergedProduct(remainingEps, mp);
      rebuilt.id = mp.id;
      rebuilt.tag = mp.tag;

      const updatedList = mergedProducts.map((p) =>
        p.id === mergedProductId ? rebuilt : p,
      );
      return mergedProductsApi.saveMergedProducts(updatedList);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: productKeys.all });
      queryClient.invalidateQueries({ queryKey: mergedProductKeys.all });
    },
  });
};

/**
 * Build an EP data object from user-entered field strings.
 * Shared by useAddManualSource and useCreateManualProduct.
 */
function buildManualEpData(
  fields: Partial<Record<ProductFieldKey, string>>,
): Omit<ExtractedProduct, "id" | "reviewed" | "createdAt"> {
  const epData: Omit<ExtractedProduct, "id" | "reviewed" | "createdAt"> = {
    productDocumentId: "",
    documentType: "purchase_order",
    sourceType: "manual",
  };

  for (const [key, value] of Object.entries(fields)) {
    if (value && value.trim()) {
      const fieldValue: ReductoFieldValue<string> = {
        value: value.trim(),
        citations: [],
      };
      (epData as Record<string, unknown>)[key] = fieldValue;
    }
  }

  return epData;
}

/**
 * Add a manual source (ExtractedProduct) to an existing MergedProduct.
 *
 * Creates a new EP with sourceType "manual" and empty citations,
 * then surgically adds it to the target MergedProduct (avoids global rebuild).
 * Since the manual EP is newest, its non-empty fields auto-win in field selection.
 */
export const useAddManualSource = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      mergedProductId,
      fields,
    }: {
      mergedProductId: string;
      fields: Partial<Record<ProductFieldKey, string>>;
    }) => {
      const [createdEp] = await productsApi.createProducts([
        buildManualEpData(fields),
      ]);

      // Fetch current state
      const [mergedProducts, allProducts] = await Promise.all([
        mergedProductsApi.fetchMergedProducts(),
        productsApi.fetchProducts(),
      ]);

      const epMap = buildExtractedProductsMap(allProducts);
      const target = mergedProducts.find((p) => p.id === mergedProductId);
      if (!target) {
        throw new Error(`MergedProduct ${mergedProductId} not found`);
      }

      // Collect all EPs for this merged product including the new one
      const epIds = [...target.extractedProductIds, createdEp.id];
      const eps = epIds
        .map((id) => epMap.get(id))
        .filter((ep): ep is ExtractedProduct => ep != null);

      // Rebuild field selections preserving user overrides
      const rebuilt = buildMergedProduct(eps, target);
      rebuilt.id = target.id;
      rebuilt.tag = target.tag;

      // Replace in the list and save
      const updatedList = mergedProducts.map((p) =>
        p.id === mergedProductId ? rebuilt : p,
      );

      return mergedProductsApi.saveMergedProducts(updatedList);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: productKeys.all });
      queryClient.invalidateQueries({ queryKey: mergedProductKeys.all });
    },
  });
};

/**
 * Create a brand-new manual product (merged product with a single manual source).
 *
 * Creates a manual EP, wraps it in a new MergedProduct, and appends to the list.
 */
export const useCreateManualProduct = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      fields,
    }: {
      fields: Partial<Record<ProductFieldKey, string>>;
    }) => {
      const [createdEp] = await productsApi.createProducts([
        buildManualEpData(fields),
      ]);

      // Build a MergedProduct wrapping the single EP
      const merged = buildMergedProduct([createdEp]);
      merged.tag = createdEp.tag?.value ?? `__manual_${createdEp.id}`;

      // Prepend so the new product appears at the top of the list
      const mergedProducts = await mergedProductsApi.fetchMergedProducts();
      return mergedProductsApi.saveMergedProducts([
        merged,
        ...mergedProducts,
      ]);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: productKeys.all });
      queryClient.invalidateQueries({ queryKey: mergedProductKeys.all });
    },
  });
};
