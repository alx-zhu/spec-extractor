/**
 * Hook for generating missing MasterFormat spec IDs via OpenAI
 *
 * Processes an array of products, calling the LLM only for products
 * where specIdNumber is missing or "N/A".
 */

import { useMutation } from "@tanstack/react-query";
import { classifySpecId } from "@/api/openai.client";
import type { Product } from "@/types/product";

/**
 * Check if a spec ID value is missing/empty.
 */
function isMissingSpecId(value?: string): boolean {
  if (!value) return true;
  const normalized = value.trim().toLowerCase();
  return normalized === "" || normalized === "n/a";
}

/**
 * Hook that fills in missing specIdNumber fields on an array of products.
 * Returns the same array with spec IDs populated where possible.
 *
 * @param availableSections - Optional project-specific MasterFormat sections to constrain results
 */
export function useSpecIdGeneration(availableSections?: string[]) {
  return useMutation<Product[], Error, Product[]>({
    mutationFn: async (products) => {
      const results = await Promise.all(
        products.map(async (product) => {
          const currentSpecId = product.specIdNumber?.value;
          if (!isMissingSpecId(currentSpecId)) return product;

          const itemName = product.itemName?.value ?? "";
          const description = product.productDescription?.value ?? "";
          const manufacturer = product.manufacturer?.value ?? "";

          // Skip if we have nothing to classify
          if (!itemName && !description) return product;

          try {
            const specId = await classifySpecId(
              itemName,
              description,
              manufacturer,
              availableSections,
            );

            if (specId === "N/A") return product;

            return {
              ...product,
              specIdNumber: {
                value: specId,
                citations: [],
              },
            };
          } catch (error) {
            console.warn(
              `[SpecIdGeneration] Failed for "${itemName}":`,
              error,
            );
            return product;
          }
        }),
      );

      return results;
    },
    onError: (error) => {
      console.error("[useSpecIdGeneration] Error:", error);
    },
  });
}
