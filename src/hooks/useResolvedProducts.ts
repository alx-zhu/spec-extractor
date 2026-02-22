/**
 * TanStack Query hook for resolved product data.
 *
 * Combines ExtractedProducts and MergedProducts into a single
 * ResolvedProduct[] for display, export, and table consumption.
 *
 * Every product goes through the merge pipeline. Orphaned EPs (not yet
 * covered by a MergedProduct) are wrapped in a synthetic MergedProduct
 * so the table has a uniform data shape.
 *
 * Updates automatically when either source query is invalidated.
 */

import { useMemo } from "react";
import { useProducts } from "./useProducts";
import { useMergedProducts } from "./useMergedProducts";
import type { ResolvedProduct } from "@/types/resolvedProduct";
import {
  buildExtractedProductsMap,
  buildMergedProduct,
} from "@/utils/mergeProducts";
import { resolveMergedProduct } from "@/utils/resolveProducts";

/**
 * Returns all products as ResolvedProducts.
 *
 * Products with a MergedProduct are resolved through it.
 * Orphaned EPs (e.g. from stale localStorage) are wrapped in a
 * synthetic MergedProduct so every row has a uniform source shape.
 */
export function useResolvedProducts() {
  const { data: extractedProducts, isLoading: epLoading } = useProducts();
  const { data: mergedProducts, isLoading: mpLoading } = useMergedProducts();

  const resolved = useMemo((): ResolvedProduct[] => {
    if (!extractedProducts) return [];

    const epMap = buildExtractedProductsMap(extractedProducts);
    const result: ResolvedProduct[] = [];

    // Track which EPs are covered by a MergedProduct
    const coveredEpIds = new Set<string>();

    // Resolve all MergedProducts
    if (mergedProducts) {
      for (const mp of mergedProducts) {
        result.push(resolveMergedProduct(mp, epMap));
        for (const id of mp.extractedProductIds) {
          coveredEpIds.add(id);
        }
      }
    }

    // Wrap orphaned EPs in a synthetic MergedProduct so the table
    // has a uniform source shape. This handles stale localStorage
    // and the brief window before a rebuild runs after extraction.
    for (const ep of extractedProducts) {
      if (!coveredEpIds.has(ep.id)) {
        const synthetic = buildMergedProduct([ep]);
        synthetic.tag = ep.tag?.value ?? `__standalone_${ep.id}`;
        result.push(resolveMergedProduct(synthetic, epMap));
      }
    }

    return result;
  }, [extractedProducts, mergedProducts]);

  return {
    data: resolved,
    isLoading: epLoading || mpLoading,
  };
}
