import { useState, useCallback } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Upload, Loader2, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  useCreateDocument,
  useUpdateDocumentStatus,
} from "@/hooks/useDocuments";
import { useCreateProducts } from "@/hooks/useProducts";
import { useReductoExtraction } from "@/hooks/useReductoExtraction";
import { savePdfToPublic } from "@/utils/storage";
import { SelectedFile } from "./SelectedFile";
import type { DocumentType } from "@/types/product";

interface UploadModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function UploadModal({ open, onOpenChange }: UploadModalProps) {
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [documentTypeMap, setDocumentTypeMap] = useState<
    Record<string, DocumentType>
  >({});
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStatus, setProcessingStatus] = useState<string>("");
  const [error, setError] = useState<string | null>(null);

  const createDocument = useCreateDocument();
  const updateDocumentStatus = useUpdateDocumentStatus();
  const createProducts = useCreateProducts();
  const reductoExtraction = useReductoExtraction();

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  // Should likely combine handleFileSelect and handleDrop into a single helper
  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const files = Array.from(e.dataTransfer.files).filter(
      (file) => file.type === "application/pdf",
    );

    if (files.length > 0) {
      setSelectedFiles((prev) => [...prev, ...files]);

      const newTypes: Record<string, DocumentType> = {};
      files.forEach((file) => {
        newTypes[file.name] = "specification";
      });
      setDocumentTypeMap((prev) => ({ ...prev, ...newTypes }));
    }
  }, []);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      const pdfFiles = Array.from(files).filter(
        (file) => file.type === "application/pdf",
      );
      setSelectedFiles((prev) => [...prev, ...pdfFiles]);

      const newTypes: Record<string, DocumentType> = {};
      pdfFiles.forEach((file) => {
        newTypes[file.name] = "specification";
      });
      setDocumentTypeMap((prev) => ({ ...prev, ...newTypes }));
    }
  };

  const removeFile = (index: number) => {
    const fileToRemove = selectedFiles[index];
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
    setDocumentTypeMap((prev) => {
      const updated = { ...prev };
      delete updated[fileToRemove.name];
      return updated;
    });
  };

  const handleUpload = async () => {
    if (selectedFiles.length === 0) return;

    setIsProcessing(true);
    setError(null);

    try {
      // Process each file
      for (let i = 0; i < selectedFiles.length; i++) {
        const file = selectedFiles[i];
        setProcessingStatus(
          `Processing ${i + 1}/${selectedFiles.length}: ${file.name}`,
        );

        console.log(
          `[Upload] Processing file ${i + 1}/${selectedFiles.length}:`,
          file.name,
        );

        // Step 1: Save PDF to public folder (for localhost demo)
        const pdfPath = await savePdfToPublic(file);
        console.log(`[Upload] PDF path:`, pdfPath);

        // Step 2: Create document entry in "processing" state
        setProcessingStatus(`Creating document record...`);
        const document = await createDocument.mutateAsync({
          file,
          localPath: pdfPath,
          documentType: documentTypeMap[file.name] || "specification",
        });
        console.log(`[Upload] Document created:`, document.id);

        // Step 3: Extract products using Reducto
        setProcessingStatus(`Extracting products with Reducto AI...`);
        const extractedProducts = await reductoExtraction.mutateAsync({
          file,
          documentId: document.id,
          documentType: documentTypeMap[file.name] || "specification",
          pdfPath,
        });

        console.log(
          `[Upload] Extracted ${extractedProducts.length} products from ${file.name}`,
        );

        // Step 4: Save extracted products
        if (extractedProducts.length > 0) {
          setProcessingStatus(`Saving ${extractedProducts.length} products...`);
          await createProducts.mutateAsync(
            extractedProducts.map((p) => ({
              itemName: p.itemName,
              manufacturer: p.manufacturer,
              specIdNumber: p.specIdNumber,
              productKey: p.productKey,
              tag: p.tag,
              color: p.color,
              size: p.size,
              price: p.price,
              project: p.project,
              details: p.details,
              specDocumentId: p.specDocumentId,
              documentType: p.documentType,
            })),
          );
        }

        // Step 5: Update document status to completed
        await updateDocumentStatus.mutateAsync({
          documentId: document.id,
          status: "completed",
        });

        console.log(`[Upload] Completed processing ${file.name}`);
      }

      // Success - reset and close
      setSelectedFiles([]);
      setProcessingStatus("");
      onOpenChange(false);

      // Show success message
      alert(
        `Successfully processed ${selectedFiles.length} document(s)!\n\nNote: PDFs are referenced from /public/uploads/. Make sure files are saved there.`,
      );
    } catch (error) {
      console.error("[Upload] Processing failed:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error occurred";
      setError(errorMessage);
      setProcessingStatus("");

      // Update any documents to error state if needed
      // (In production, you'd track which document failed)
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCancel = () => {
    setSelectedFiles([]);
    setError(null);
    setProcessingStatus("");
    onOpenChange(false);
  };

  const handleDocumentTypeChange = (file: File, type: DocumentType) =>
    setDocumentTypeMap((prev) => ({
      ...prev,
      [file.name]: type,
    }));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] p-0 gap-0">
        <DialogHeader className="px-6 pt-6 pb-4">
          <DialogTitle className="text-xl font-semibold">
            Upload Specifications
          </DialogTitle>
          <DialogDescription className="text-sm text-gray-500">
            Upload PDF specification files to extract product information using
            Reducto AI
          </DialogDescription>
        </DialogHeader>

        <div className="px-6 pb-6 overflow-auto">
          {/* Drop Zone */}
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={cn(
              "relative border-2 border-dashed rounded-lg transition-all",
              isDragging
                ? "border-blue-500 bg-blue-50"
                : "border-gray-200 bg-gray-50 hover:bg-gray-100",
            )}
          >
            <input
              type="file"
              multiple
              accept=".pdf"
              onChange={handleFileSelect}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              id="file-upload"
              disabled={isProcessing}
            />
            <div className="flex flex-col items-center justify-center py-12 px-6">
              <div
                className={cn(
                  "w-12 h-12 rounded-full flex items-center justify-center mb-4 transition-colors",
                  isDragging
                    ? "bg-blue-100 text-blue-600"
                    : "bg-gray-100 text-gray-400",
                )}
              >
                <Upload className="w-6 h-6" />
              </div>
              <p className="text-sm font-medium text-gray-900 mb-1">
                Drop PDF files here, or click to browse
              </p>
              <p className="text-xs text-gray-500">
                Support for multiple files • PDF only
              </p>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
              <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-medium text-red-900">
                  Extraction Failed
                </p>
                <p className="text-xs text-red-700 mt-1">{error}</p>
              </div>
            </div>
          )}

          {/* Processing Status */}
          {isProcessing && processingStatus && (
            <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg flex items-center gap-3">
              <Loader2 className="w-5 h-5 text-blue-600 animate-spin shrink-0" />
              <p className="text-sm text-blue-900">{processingStatus}</p>
            </div>
          )}

          {/* Selected Files */}
          {selectedFiles.length > 0 && (
            <div className="mt-4 space-y-2">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-medium text-gray-700">
                  Selected Files ({selectedFiles.length})
                </p>
              </div>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {selectedFiles.map((file, index) => (
                  <SelectedFile
                    key={index}
                    file={file}
                    documentType={documentTypeMap[file.name] || "specification"}
                    onDocumentTypeChange={(type) =>
                      handleDocumentTypeChange(file, type)
                    }
                    onRemove={() => removeFile(index)}
                    isProcessing={isProcessing}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 mt-6 pt-4 border-t border-gray-200">
            <Button
              variant="outline"
              onClick={handleCancel}
              disabled={isProcessing}
            >
              Cancel
            </Button>
            <Button
              onClick={handleUpload}
              disabled={selectedFiles.length === 0 || isProcessing}
              className="gap-2"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4" />
                  Extract with Reducto
                  {selectedFiles.length > 0 && ` (${selectedFiles.length})`}
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
