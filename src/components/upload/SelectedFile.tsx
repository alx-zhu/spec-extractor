import { Button } from "@/components/ui/button";
import type { DocumentType } from "@/types/product";
import { FileText, X } from "lucide-react";
import { DocumentTypeSelector } from "./DocumentTypeSelector";

interface SelectedFileProps {
  file: File;
  documentType: DocumentType;
  onRemove: () => void;
  onDocumentTypeChange: (type: DocumentType) => void;
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
    <div className="flex items-center justify-between p-3 bg-white border border-gray-200 rounded-lg group hover:border-gray-300 transition-colors truncate">
      <div className="flex items-center gap-3 flex-1 min-w-0">
        <div className="w-8 h-8 rounded bg-red-50 flex items-center justify-center shrink-0">
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
      <DocumentTypeSelector
        value={documentType}
        onChange={onDocumentTypeChange}
      />
      <Button
        variant="ghost"
        size="icon"
        onClick={onRemove}
        className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
        disabled={isProcessing}
      >
        <X className="h-4 w-4 text-gray-400" />
      </Button>
    </div>
  );
}
