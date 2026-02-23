import type { ExtractedProduct } from "@/types/product";

export function isSpecIdGenerated(product: ExtractedProduct): boolean {
  const specId = product.specIdNumber;
  const hasValue = specId?.value !== undefined && specId.value !== "N/A";
  return hasValue && (!specId.citations || specId.citations.length === 0);
}

export function isManualProduct(product: ExtractedProduct): boolean {
  return product.sourceType === "manual";
}
