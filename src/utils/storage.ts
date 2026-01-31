/**
 * PDF Storage Utilities
 *
 * Handles saving uploaded PDFs to the public folder for localhost demo.
 * In production, this would be replaced with cloud storage (S3, Supabase Storage, etc.)
 */

/**
 * Generate a unique filename while preserving the original base name
 * Example: "My Document.pdf" -> "my-document-1737584920-abc123.pdf"
 */
export function generateUniqueFilename(originalName: string): string {
  return originalName;
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
 * Save PDF to public/uploads folder
 *
 * NOTE: This is a localhost-only solution. In a real browser environment,
 * you cannot write directly to the filesystem. This function returns the
 * path where the file SHOULD be saved, and you need to manually copy files
 * to public/uploads/ for the demo to work.
 *
 * For production, use cloud storage and return the uploaded URL.
 */
export async function savePdfToPublic(file: File): Promise<string> {
  const filename = generateUniqueFilename(file.name);
  const publicPath = `/uploads/${filename}`;

  // In a real implementation with a backend:
  // const formData = new FormData();
  // formData.append('file', file);
  // const response = await fetch('/api/upload', { method: 'POST', body: formData });
  // return response.json().path;

  // For localhost demo: Return the path where file should be placed
  // User needs to manually copy uploaded files to public/uploads/
  console.warn(
    `[Storage] File should be saved to: public${publicPath}\n` +
      `For localhost demo, manually copy "${file.name}" to "public/uploads/${filename}"`,
  );

  return publicPath;
}

/**
 * Get the full URL for a PDF stored in public folder
 */
export function getPdfUrl(path: string): string {
  // Remove leading slash if present
  const cleanPath = path.startsWith("/") ? path.substring(1) : path;
  return `/${cleanPath}`;
}
