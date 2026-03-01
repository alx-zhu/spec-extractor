import { useState, useCallback, useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Upload, Loader2, AlertCircle } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";
import {
  useCreateDocument,
  useUpdateDocumentStatus,
} from "@/hooks/useDocuments";
import { useCreateProducts } from "@/hooks/useProducts";
import { useIntegrateNewProducts } from "@/hooks/useMergedProducts";
import { useReductoExtraction } from "@/hooks/useReductoExtraction";
import { useSpecIdGeneration } from "@/hooks/useSpecIdGeneration";
import { savePdfToPublic } from "@/utils/storage";
import { SelectedFile } from "./SelectedFile";
import type { ProductDocumentType } from "@/types/product";
import type { ExtractionStage } from "@/api/reducto.client";

const STAGE_LABELS: Record<ExtractionStage | "preparing" | "saving" | "specIds", string> = {
  preparing: "Preparing document...",
  uploading: "Uploading to Reducto...",
  parsing: "Parsing layout...",
  cropping: "Cropping schedule...",
  extracting: "Extracting products...",
  specIds: "Generating spec IDs...",
  saving: "Saving products...",
};

interface UploadModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function UploadModal({ open, onOpenChange }: UploadModalProps) {
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [documentTypeMap, setProductDocumentTypeMap] = useState<
    Record<string, ProductDocumentType>
  >({});
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingDoc, setProcessingDoc] = useState<{ index: number; total: number } | null>(null);
  const [processingStage, setProcessingStage] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const [generateSpecIds, setGenerateSpecIds] = useState(true);

  const createDocument = useCreateDocument();
  const updateDocumentStatus = useUpdateDocumentStatus();
  const createProducts = useCreateProducts();
  const integrateNewProducts = useIntegrateNewProducts();
  const reductoExtraction = useReductoExtraction();
  const specIdGeneration = useSpecIdGeneration();

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

      const newTypes: Record<string, ProductDocumentType> = {};
      files.forEach((file) => {
        newTypes[file.name] = "specification";
      });
      setProductDocumentTypeMap((prev) => ({ ...prev, ...newTypes }));
    }
  }, []);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      const pdfFiles = Array.from(files).filter(
        (file) => file.type === "application/pdf",
      );
      setSelectedFiles((prev) => [...prev, ...pdfFiles]);

      const newTypes: Record<string, ProductDocumentType> = {};
      pdfFiles.forEach((file) => {
        newTypes[file.name] = "specification";
      });
      setProductDocumentTypeMap((prev) => ({ ...prev, ...newTypes }));
    }
  };

  const removeFile = (index: number) => {
    const fileToRemove = selectedFiles[index];
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
    setProductDocumentTypeMap((prev) => {
      const updated = { ...prev };
      delete updated[fileToRemove.name];
      return updated;
    });
  };

  const handleUpload = async () => {
    if (selectedFiles.length === 0) return;

    const abortController = new AbortController();
    abortControllerRef.current = abortController;
    const { signal } = abortController;

    setIsProcessing(true);
    setError(null);

    try {
      // Process each file
      for (let i = 0; i < selectedFiles.length; i++) {
        // Stop iterating if cancelled between files
        if (signal.aborted) break;

        const file = selectedFiles[i];
        setProcessingDoc({ index: i + 1, total: selectedFiles.length });

        console.log(
          `[Upload] Processing file ${i + 1}/${selectedFiles.length}:`,
          file.name,
        );

        // Step 1: Save PDF to public folder (for localhost demo)
        setProcessingStage(STAGE_LABELS.preparing);
        const pdfPath = await savePdfToPublic(file);
        console.log(`[Upload] PDF path:`, pdfPath);

        // Step 2: Create document entry in "processing" state
        const document = await createDocument.mutateAsync({
          file,
          localPath: pdfPath,
          documentType: documentTypeMap[file.name] || "specification",
        });
        console.log(`[Upload] Document created:`, document.id);

        // Step 3: Extract products using Reducto
        // onProgress fires at each sub-stage so the user sees live updates
        const extractedProducts = await reductoExtraction.mutateAsync({
          file,
          documentId: document.id,
          documentType: documentTypeMap[file.name] || "specification",
          pdfPath,
          onProgress: (stage) => setProcessingStage(STAGE_LABELS[stage]),
          signal,
        });

        console.log(
          `[Upload] Extracted ${extractedProducts.length} products from ${file.name}`,
        );

        // Step 3.5: Generate missing spec IDs if enabled
        let productsToSave = extractedProducts;
        if (generateSpecIds && extractedProducts.length > 0) {
          setProcessingStage(STAGE_LABELS.specIds);
          productsToSave =
            await specIdGeneration.mutateAsync(extractedProducts);
        }

        // Step 4: Save extracted products
        if (productsToSave.length > 0) {
          setProcessingStage(STAGE_LABELS.saving);
          await createProducts.mutateAsync(
            productsToSave.map((p) => ({
              itemName: p.itemName,
              productDescription: p.productDescription,
              manufacturer: p.manufacturer,
              specIdNumber: p.specIdNumber,
              tag: p.tag,
              finish: p.finish,
              size: p.size,
              price: p.price,
              project: p.project,
              details: p.details,
              productDocumentId: p.productDocumentId,
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

      // Rebuild merged products after all files are processed
      await integrateNewProducts.mutateAsync();

      // Success - reset and close
      setSelectedFiles([]);
      setProcessingDoc(null);
      setProcessingStage("");
      onOpenChange(false);

      // Show success message
      alert(
        `Successfully processed ${selectedFiles.length} document(s)!\n\nNote: PDFs are referenced from /public/uploads/. Make sure files are saved there.`,
      );
    } catch (error) {
      // User-initiated cancellation — reset silently, keep files selected so
      // they can retry without re-adding everything.
      if (abortControllerRef.current?.signal.aborted) {
        console.log("[Upload] Extraction cancelled by user");
        setProcessingDoc(null);
        setProcessingStage("");
        return;
      }

      console.error("[Upload] Processing failed:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error occurred";
      setError(errorMessage);
      setProcessingDoc(null);
      setProcessingStage("");
    } finally {
      abortControllerRef.current = null;
      setIsProcessing(false);
    }
  };

  const handleCancel = () => {
    setSelectedFiles([]);
    setError(null);
    setProcessingDoc(null);
    setProcessingStage("");
    onOpenChange(false);
  };

  const handleCancelProcessing = () => {
    abortControllerRef.current?.abort();
  };

  const handleDocumentTypeChange = (file: File, type: ProductDocumentType) =>
    setProductDocumentTypeMap((prev) => ({
      ...prev,
      [file.name]: type,
    }));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] p-0 gap-0">
        <DialogHeader className="px-6 pt-6 pb-4">
          <DialogTitle className="text-xl font-semibold">
            Upload Documents
          </DialogTitle>
          <DialogDescription className="text-sm text-gray-500">
            Upload PDF files to extract product information using Reducto AI
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
          {isProcessing && processingDoc && (
            <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg flex items-center gap-3">
              <Loader2 className="w-5 h-5 text-blue-600 animate-spin shrink-0" />
              <div className="flex flex-col min-w-0">
                <p className="text-sm font-medium text-blue-900">
                  Document {processingDoc.index} of {processingDoc.total}
                </p>
                {processingStage && (
                  <p className="text-xs text-blue-700 mt-0.5">{processingStage}</p>
                )}
              </div>
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
          <div className="flex items-center justify-between gap-3 mt-6 pt-4 border-t border-gray-200">
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <Checkbox
                checked={generateSpecIds}
                onCheckedChange={(checked) =>
                  setGenerateSpecIds(checked === true)
                }
                disabled={isProcessing}
              />
              <span className="text-sm text-gray-600">
                Generate missing CSI Spec Numbers
              </span>
            </label>
          </div>
          <div className="flex items-center justify-end gap-3 mt-3">
            <Button
              variant="outline"
              onClick={isProcessing ? handleCancelProcessing : handleCancel}
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
