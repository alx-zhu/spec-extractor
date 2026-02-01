/**
 * PDF Storage Utilities
 *
 * Handles saving uploaded PDFs to Supabase Storage.
 */

import { supabase } from "@/api/supabase.client";

const STORAGE_BUCKET = "uploads";

/**
 * Generate a unique filename while preserving the original base name
 * Example: "My Document.pdf" -> "my-document-1737584920-abc123.pdf"
 */
export function generateUniqueFilename(originalName: string): string {
  // Get extension
  const extension = originalName.split(".").pop() || "pdf";

  // Get base name without extension
  const baseName =
    originalName.substring(0, originalName.lastIndexOf(".")) || originalName;

  // Sanitize: lowercase, replace spaces and special chars with hyphens
  const sanitized = baseName
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-") // Replace non-alphanumeric with hyphens
    .replace(/^-+|-+$/g, ""); // Remove leading/trailing hyphens

  // Add timestamp and random string for uniqueness
  const timestamp = Date.now();
  const randomStr = Math.random().toString(36).substring(2, 9);

  return `${sanitized}-${timestamp}-${randomStr}.${extension}`;
}

/**
 * Upload PDF to Supabase Storage
 *
 * @param file - The PDF file to upload
 * @returns The storage path of the uploaded file
 */
export async function savePdfToPublic(file: File): Promise<string> {
  const filename = generateUniqueFilename(file.name);
  const filePath = `public/${filename}`;

  console.log(`[Storage] Uploading ${file.name} to Supabase Storage...`);

  const { data, error } = await supabase.storage
    .from(STORAGE_BUCKET)
    .upload(filePath, file, {
      cacheControl: "3600",
      upsert: false,
    });

  if (error) {
    console.error("[Storage] Upload failed:", error);
    throw new Error(`Failed to upload PDF: ${error.message}`);
  }

  console.log(`[Storage] Upload successful:`, data.path);
  return data.path;
}

/**
 * Get the public URL for a PDF stored in Supabase Storage
 *
 * @param path - The storage path of the file
 * @returns The public URL to access the file
 */
export function getPdfUrl(path: string): string {
  const { data } = supabase.storage.from(STORAGE_BUCKET).getPublicUrl(path);

  return data.publicUrl;
}

/**
 * Delete a PDF from Supabase Storage
 *
 * @param path - The storage path of the file to delete
 */
export async function deletePdfFromStorage(path: string): Promise<void> {
  const { error } = await supabase.storage.from(STORAGE_BUCKET).remove([path]);

  if (error) {
    console.error("[Storage] Delete failed:", error);
    throw new Error(`Failed to delete PDF: ${error.message}`);
  }

  console.log(`[Storage] Deleted file:`, path);
}
