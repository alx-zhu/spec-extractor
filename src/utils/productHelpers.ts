import type { Product } from "@/types/product";

export function isSpecIdGenerated(product: Product): boolean {
  const specId = product.specIdNumber;
  const hasValue = specId?.value !== undefined && specId.value !== "N/A";
  return hasValue && (!specId.citations || specId.citations.length === 0);
}
