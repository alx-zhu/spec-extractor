/**
 * TanStack Query hook for resolved product data.
 *
 * Combines ExtractedProducts and MergedProducts into a single
 * ResolvedProduct[] for display, export, and table consumption.
 *
 * Updates automatically when either source query is invalidated.
 */

import { useMemo } from "react";
import { useProducts } from "./useProducts";
import { useMergedProducts } from "./useMergedProducts";
import type { ResolvedProduct } from "@/types/resolvedProduct";
import { buildExtractedProductsMap } from "@/utils/mergeProducts";
import {
  resolveExtractedProduct,
  resolveMergedProduct,
} from "@/utils/resolveProducts";

/**
 * Returns all products as ResolvedProducts.
 *
 * For reviewed products that have a MergedProduct, the merged version is used.
 * For unreviewed products (or reviewed products not yet part of a merge),
 * the ExtractedProduct is resolved directly.
 *
 * This ensures every product appears exactly once in the output.
 */
export function useResolvedProducts() {
  const { data: extractedProducts, isLoading: epLoading } = useProducts();
  const { data: mergedProducts, isLoading: mpLoading } = useMergedProducts();

  const resolved = useMemo((): ResolvedProduct[] => {
    if (!extractedProducts) return [];

    const epMap = buildExtractedProductsMap(extractedProducts);

    // Track which ExtractedProducts are already represented by a MergedProduct
    const mergedExtractedIds = new Set<string>();

    const result: ResolvedProduct[] = [];

    // Resolve all MergedProducts
    if (mergedProducts) {
      for (const mp of mergedProducts) {
        result.push(resolveMergedProduct(mp, epMap));
        for (const id of mp.extractedProductIds) {
          mergedExtractedIds.add(id);
        }
      }
    }

    // Resolve remaining ExtractedProducts not covered by a merge
    for (const ep of extractedProducts) {
      if (!mergedExtractedIds.has(ep.id)) {
        result.push(resolveExtractedProduct(ep));
      }
    }

    return result;
  }, [extractedProducts, mergedProducts]);

  return {
    data: resolved,
    isLoading: epLoading || mpLoading,
  };
}
