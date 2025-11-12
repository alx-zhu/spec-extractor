import { useState, useCallback } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Upload, FileText, X, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface UploadModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUploadComplete: (files: File[]) => void;
}

export function UploadModal({
  open,
  onOpenChange,
  onUploadComplete,
}: UploadModalProps) {
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const files = Array.from(e.dataTransfer.files).filter(
      (file) => file.type === "application/pdf"
    );

    if (files.length > 0) {
      setSelectedFiles((prev) => [...prev, ...files]);
    }
  }, []);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      const pdfFiles = Array.from(files).filter(
        (file) => file.type === "application/pdf"
      );
      setSelectedFiles((prev) => [...prev, ...pdfFiles]);
    }
  };

  const removeFile = (index: number) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleUpload = async () => {
    if (selectedFiles.length === 0) return;

    setIsProcessing(true);

    // Simulate processing delay
    await new Promise((resolve) => setTimeout(resolve, 1500));

    onUploadComplete(selectedFiles);
    setIsProcessing(false);
    setSelectedFiles([]);
    onOpenChange(false);
  };

  const handleCancel = () => {
    setSelectedFiles([]);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] p-0 gap-0">
        <DialogHeader className="px-6 pt-6 pb-4">
          <DialogTitle className="text-xl font-semibold">
            Upload Specifications
          </DialogTitle>
          <DialogDescription className="text-sm text-gray-500">
            Upload PDF specification files to extract product information
          </DialogDescription>
        </DialogHeader>

        <div className="px-6 pb-6">
          {/* Drop Zone */}
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={cn(
              "relative border-2 border-dashed rounded-lg transition-all",
              isDragging
                ? "border-blue-500 bg-blue-50"
                : "border-gray-200 bg-gray-50 hover:bg-gray-100"
            )}
          >
            <input
              type="file"
              multiple
              accept=".pdf"
              onChange={handleFileSelect}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              id="file-upload"
            />
            <div className="flex flex-col items-center justify-center py-12 px-6">
              <div
                className={cn(
                  "w-12 h-12 rounded-full flex items-center justify-center mb-4 transition-colors",
                  isDragging
                    ? "bg-blue-100 text-blue-600"
                    : "bg-gray-100 text-gray-400"
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
                  <div
                    key={index}
                    className="flex items-center justify-between p-3 bg-white border border-gray-200 rounded-lg group hover:border-gray-300 transition-colors"
                  >
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div className="w-8 h-8 rounded bg-red-50 flex items-center justify-center flex-shrink-0">
                        <FileText className="w-4 h-4 text-red-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {file.name}
                        </p>
                        <p className="text-xs text-gray-500">
                          {(file.size / 1024).toFixed(1)} KB
                        </p>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => removeFile(index)}
                      className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="h-4 w-4 text-gray-400" />
                    </Button>
                  </div>
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
                  Upload{" "}
                  {selectedFiles.length > 0 && `(${selectedFiles.length})`}
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
