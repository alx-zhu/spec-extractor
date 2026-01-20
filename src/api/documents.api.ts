/**
 * Document API Operations
 *
 * Manages PDF document metadata and upload tracking.
 * Future Supabase implementation will include file storage URLs.
 */

import type { SpecDocument } from "@/types/product";
import { simulateApiCall } from "./client";

// Storage key for localStorage
const DOCUMENTS_STORAGE_KEY = "sabana:documents";

/**
 * Initialize localStorage with empty array if not exists
 */
const initializeStorage = (): void => {
  if (!localStorage.getItem(DOCUMENTS_STORAGE_KEY)) {
    localStorage.setItem(DOCUMENTS_STORAGE_KEY, JSON.stringify([]));
  }
};

/**
 * Get documents from storage
 */
const getDocumentsFromStorage = (): SpecDocument[] => {
  initializeStorage();
  const stored = localStorage.getItem(DOCUMENTS_STORAGE_KEY);
  return stored ? JSON.parse(stored) : [];
};

/**
 * Save documents to storage
 */
const saveDocumentsToStorage = (documents: SpecDocument[]): void => {
  localStorage.setItem(DOCUMENTS_STORAGE_KEY, JSON.stringify(documents));
};

/**
 * Fetch all documents
 *
 * Future Supabase implementation:
 * ```ts
 * const { data, error } = await supabase
 *   .from('documents')
 *   .select('*')
 *   .order('upload_date', { ascending: false });
 * ```
 */
export const fetchDocuments = async (): Promise<SpecDocument[]> => {
  const documents = getDocumentsFromStorage();
  return simulateApiCall(documents);
};

/**
 * Create a new document entry
 *
 * Future Supabase implementation will include file upload to storage:
 * ```ts
 * // Upload file to storage
 * const { data: fileData, error: uploadError } = await supabase.storage
 *   .from('spec-documents')
 *   .upload(`${userId}/${fileName}`, file);
 *
 * // Create document record
 * const { data, error } = await supabase
 *   .from('documents')
 *   .insert([{ filename, file_url: fileData.path, status: 'processing' }])
 *   .select()
 *   .single();
 * ```
 */
export const createDocument = async (
  file: File,
  localPath?: string,
): Promise<SpecDocument> => {
  const documents = getDocumentsFromStorage();

  // Generate ID (in production, DB generates this)
  const id = `doc-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;

  const document: SpecDocument = {
    id,
    filename: localPath || file.name,
    uploadDate: new Date(),
    status: "processing", // Will be updated to "completed" after extraction
  };

  const updatedDocuments = [...documents, document];
  saveDocumentsToStorage(updatedDocuments);

  return simulateApiCall(document);
};

/**
 * Update document status (e.g., from "processing" to "completed")
 *
 * Future Supabase implementation:
 * ```ts
 * const { data, error } = await supabase
 *   .from('documents')
 *   .update({ status })
 *   .eq('id', documentId)
 *   .select()
 *   .single();
 * ```
 */
export const updateDocumentStatus = async (
  documentId: string,
  status: SpecDocument["status"],
): Promise<SpecDocument> => {
  const documents = getDocumentsFromStorage();

  const updatedDocuments = documents.map((doc) => {
    if (doc.id === documentId) {
      return { ...doc, status };
    }
    return doc;
  });

  saveDocumentsToStorage(updatedDocuments);

  const updatedDocument = updatedDocuments.find((d) => d.id === documentId);
  if (!updatedDocument) throw new Error(`Document ${documentId} not found`);

  return simulateApiCall(updatedDocument);
};

/**
 * Delete a document
 *
 * Future Supabase implementation will also delete the file from storage:
 * ```ts
 * // Delete file from storage
 * await supabase.storage
 *   .from('spec-documents')
 *   .remove([fileUrl]);
 *
 * // Delete document record
 * const { error } = await supabase
 *   .from('documents')
 *   .delete()
 *   .eq('id', documentId);
 * ```
 */
export const deleteDocument = async (documentId: string): Promise<void> => {
  const documents = getDocumentsFromStorage();
  const updatedDocuments = documents.filter((doc) => doc.id !== documentId);
  saveDocumentsToStorage(updatedDocuments);

  return simulateApiCall(undefined);
};
