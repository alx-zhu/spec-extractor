/**
 * TanStack Query hooks for document data fetching
 */

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { SpecDocument, DocumentType } from "@/types/product";
import * as documentsApi from "@/api/documents.api";
import { productKeys } from "./useProducts";

// Query keys for cache management
export const documentKeys = {
  all: ["documents"] as const,
  lists: () => [...documentKeys.all, "list"] as const,
  details: () => [...documentKeys.all, "detail"] as const,
  detail: (id: string) => [...documentKeys.details(), id] as const,
};

/**
 * Fetch all documents
 */
export const useDocuments = () => {
  return useQuery({
    queryKey: documentKeys.lists(),
    queryFn: documentsApi.fetchDocuments,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
};

/**
 * Create a new document (upload)
 */
export const useCreateDocument = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      file,
      localPath,
      documentType,
    }: {
      file: File;
      localPath?: string;
      documentType?: DocumentType;
    }) => documentsApi.createDocument(file, localPath, documentType),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: documentKeys.all });
    },
  });
};

/**
 * Update document status
 */
export const useUpdateDocumentStatus = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      documentId,
      status,
    }: {
      documentId: string;
      status: SpecDocument["status"];
    }) => documentsApi.updateDocumentStatus(documentId, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: documentKeys.all });
    },
  });
};

/**
 * Delete a document and its associated products
 */
export const useDeleteDocument = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: documentsApi.deleteDocument,
    onSuccess: () => {
      // Invalidate both documents and products
      queryClient.invalidateQueries({ queryKey: documentKeys.all });
      queryClient.invalidateQueries({ queryKey: productKeys.all });
    },
  });
};
