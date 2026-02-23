import { Button } from "@/components/ui/button";
import type { ProductDocumentType } from "@/types/product";
import { FileText, X } from "lucide-react";
import { DocumentTypeSelector } from "./DocumentTypeSelector";

interface SelectedFileProps {
  file: File;
  documentType: ProductDocumentType;
  onRemove: () => void;
  onDocumentTypeChange: (type: ProductDocumentType) => void;
  isProcessing: boolean;
}

export function SelectedFile({
  file,
  documentType,
  onRemove,
  onDocumentTypeChange,
  isProcessing,
}: SelectedFileProps) {
  return (
    <div className="flex items-center gap-3 p-2.5 bg-white border border-gray-200 rounded-lg group hover:border-gray-300 transition-colors">
      <div className="w-8 h-8 rounded bg-red-50 flex items-center justify-center shrink-0">
        <FileText className="w-4 h-4 text-red-600" />
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="text-sm font-medium text-gray-900 truncate">
            {file.name}
          </p>
          <Button
            variant="ghost"
            size="icon"
            onClick={onRemove}
            className="h-5 w-5 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
            disabled={isProcessing}
          >
            <X className="h-3 w-3 text-gray-400" />
          </Button>
        </div>
        <div className="flex items-center gap-2 mt-0.5">
          <p className="text-xs text-gray-400">
            {(file.size / 1024).toFixed(1)} KB
          </p>
          <span className="text-gray-200">·</span>
          <DocumentTypeSelector
            value={documentType}
            onChange={onDocumentTypeChange}
            disabled={isProcessing}
          />
        </div>
      </div>
    </div>
  );
}
