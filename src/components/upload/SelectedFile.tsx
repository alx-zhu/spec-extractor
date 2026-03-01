import { Button } from "@/components/ui/button";
import type { ProductDocumentType } from "@/types/product";
import { FileText, X, Loader2, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { DocumentTypeSelector } from "./DocumentTypeSelector";

export type FileProcessingStatus = "idle" | "processing" | "completed";

interface SelectedFileProps {
  file: File;
  documentType: ProductDocumentType;
  onRemove: () => void;
  onDocumentTypeChange: (type: ProductDocumentType) => void;
  isProcessing: boolean;
  status?: FileProcessingStatus;
  stageLabel?: string;
}

export function SelectedFile({
  file,
  documentType,
  onRemove,
  onDocumentTypeChange,
  isProcessing,
  status = "idle",
  stageLabel,
}: SelectedFileProps) {
  return (
    <div
      className={cn(
        "flex items-center gap-3 p-2.5 bg-white border rounded-lg group transition-colors",
        status === "processing"
          ? "border-blue-300 bg-blue-50/30"
          : status === "completed"
            ? "border-green-200 bg-green-50/20"
            : "border-gray-200 hover:border-gray-300",
      )}
    >
      <div
        className={cn(
          "w-8 h-8 rounded flex items-center justify-center shrink-0",
          status === "processing"
            ? "bg-blue-100"
            : status === "completed"
              ? "bg-green-100"
              : "bg-red-50",
        )}
      >
        {status === "processing" ? (
          <Loader2 className="w-4 h-4 text-blue-600 animate-spin" />
        ) : status === "completed" ? (
          <CheckCircle2 className="w-4 h-4 text-green-600" />
        ) : (
          <FileText className="w-4 h-4 text-red-600" />
        )}
      </div>

      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-900 truncate">
          {file.name}
        </p>
        <div className="flex items-center gap-2 mt-0.5">
          {status === "processing" && stageLabel ? (
            <p className="text-xs text-blue-600 font-medium">{stageLabel}</p>
          ) : (
            <>
              <p className="text-xs text-gray-400">
                {(file.size / 1024).toFixed(1)} KB
              </p>
              <span className="text-gray-200">·</span>
              <DocumentTypeSelector
                value={documentType}
                onChange={onDocumentTypeChange}
                disabled={isProcessing}
              />
            </>
          )}
        </div>
      </div>

      {status === "idle" && (
        <Button
          variant="ghost"
          size="icon"
          onClick={onRemove}
          className="h-5 w-5 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
          disabled={isProcessing}
        >
          <X className="h-3 w-3 text-gray-400" />
        </Button>
      )}
    </div>
  );
}
