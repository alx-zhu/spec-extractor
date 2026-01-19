import { PdfViewer } from "@/components/pdf-viewer/PdfViewer";
import type { Product } from "@/types/product";

interface PdfViewerPanelProps {
  product: Product;
  pdfUrl: string;
  selectedFieldKey: string | null;
  onClose: () => void;
}

export function PdfViewerPanel({
  product,
  pdfUrl,
  selectedFieldKey,
  onClose,
}: PdfViewerPanelProps) {
  return (
    <div className="flex-[0.5] animate-in slide-in-from-right duration-300">
      <div className="h-full bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
        <PdfViewer
          product={product}
          pdfUrl={pdfUrl}
          selectedFieldKey={selectedFieldKey}
          onClose={onClose}
        />
      </div>
    </div>
  );
}
