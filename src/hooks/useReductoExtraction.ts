/**
 * React Query Hook for Reducto Extraction
 *
 * Wraps the Reducto client in a React Query mutation for easy use in components.
 */

import { useMutation } from "@tanstack/react-query";
import { getReductoClient } from "@/api/reducto.client";
import type { ProductDocumentType, Product } from "@/types/product";

interface ReductoExtractionParams {
  file: File;
  documentId: string;
  documentType: ProductDocumentType;
  pdfPath: string;
}

/**
 * Hook for extracting products from a PDF using Reducto
 *
 * Usage:
 * ```tsx
 * const extraction = useReductoExtraction();
 *
 * const handleExtract = async () => {
 *   const products = await extraction.mutateAsync({
 *     file: pdfFile,
 *     documentId: "doc-123",
 *     pdfPath: "/uploads/document.pdf"
 *   });
 * };
 * ```
 */
export function useReductoExtraction() {
  return useMutation<Product[], Error, ReductoExtractionParams>({
    mutationFn: async ({ file, documentId, documentType, pdfPath }) => {
      const client = getReductoClient();
      return client.uploadAndExtract(file, documentId, documentType, pdfPath);
    },
    onError: (error) => {
      console.error("[useReductoExtraction] Error:", error);
    },
  });
}
