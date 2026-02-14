import { useState, useEffect } from "react";
import { Document, Page, pdfjs } from "react-pdf";
import { ChevronLeft, ChevronRight, ZoomIn, ZoomOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  getFieldCitations,
  type Product,
  type ProductFieldKey,
} from "@/types/product";
import { cn } from "@/lib/utils";
import type { ReductoFieldValue } from "@/types/reducto";

// Set up PDF.js worker
pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

interface SheetPdfViewerProps {
  pdfUrl: string;
  product: Product;
  selectedFieldKey: ProductFieldKey | null;
}

export function SheetPdfViewer({
  pdfUrl,
  product,
  selectedFieldKey,
}: SheetPdfViewerProps) {
  const [numPages, setNumPages] = useState<number>(0);
  const [pageNumber, setPageNumber] = useState<number>(1);
  const [scale, setScale] = useState<number>(1.0);
  const [documentError, setDocumentError] = useState<string | null>(null);

  // Get the target page from the selected field's first citation
  const targetPage = (() => {
    const fieldKey = (selectedFieldKey as ProductFieldKey) || "itemName";
    const field = product[fieldKey] as ReductoFieldValue<string> | undefined;
    const citations = getFieldCitations(field);
    if (citations && citations.length > 0) {
      return citations[0].bbox.page;
    }
    return null;
  })();

  const onDocumentLoadSuccess = ({ numPages }: { numPages: number }) => {
    setNumPages(numPages);
    setDocumentError(null);
    if (targetPage && targetPage >= 1 && targetPage <= numPages) {
      setPageNumber(targetPage);
    } else {
      setPageNumber(1);
    }
  };

  const onDocumentLoadError = (error: Error) => {
    console.error("Error loading PDF document:", error);
    setDocumentError(error.message);
  };

  // Auto-navigate to citation page when product or field changes
  useEffect(() => {
    if (
      numPages > 0 &&
      targetPage &&
      targetPage >= 1 &&
      targetPage <= numPages
    ) {
      setPageNumber(targetPage);
    }
  }, [product.id, targetPage, numPages]);

  const goToPrevPage = () =>
    setPageNumber((prev) => Math.max(prev - 1, 1));
  const goToNextPage = () =>
    setPageNumber((prev) => Math.min(prev + 1, numPages));
  const zoomIn = () => setScale((prev) => Math.min(prev + 0.2, 2.0));
  const zoomOut = () => setScale((prev) => Math.max(prev - 0.2, 0.5));

  // Render citation bounding boxes for the current page
  const renderCitations = () => {
    const fieldKey = (selectedFieldKey as ProductFieldKey) || "itemName";
    const field = product[fieldKey] as ReductoFieldValue<string>;
    const citations = getFieldCitations(field);

    if (!citations) return null;

    return citations
      .filter((citation) => citation.bbox.page === pageNumber)
      .map((citation, i) => (
        <div
          key={`citation-${i}`}
          className={cn(
            "absolute border-2 border-blue-500 bg-blue-500/10 pointer-events-none",
          )}
          style={{
            left: `${citation.bbox.left * 100}%`,
            top: `${citation.bbox.top * 100}%`,
            width: `${citation.bbox.width * 100}%`,
            height: `${citation.bbox.height * 100}%`,
          }}
        />
      ));
  };

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-gray-50">
      {/* Compact toolbar */}
      <div className="flex items-center justify-between px-5 py-2 border-b border-gray-200 bg-white shrink-0">
        <div className="flex items-center gap-1.5">
          <Button
            variant="outline"
            size="icon"
            onClick={goToPrevPage}
            disabled={pageNumber <= 1}
            className="h-7 w-7"
          >
            <ChevronLeft className="h-3.5 w-3.5" />
          </Button>
          <span className="text-xs text-gray-500 tabular-nums min-w-[80px] text-center">
            Page {pageNumber} of {numPages}
          </span>
          <Button
            variant="outline"
            size="icon"
            onClick={goToNextPage}
            disabled={pageNumber >= numPages}
            className="h-7 w-7"
          >
            <ChevronRight className="h-3.5 w-3.5" />
          </Button>
        </div>
        <div className="flex items-center gap-1.5">
          <Button
            variant="outline"
            size="icon"
            onClick={zoomOut}
            disabled={scale <= 0.5}
            className="h-7 w-7"
          >
            <ZoomOut className="h-3.5 w-3.5" />
          </Button>
          <span className="text-xs text-gray-500 tabular-nums min-w-[36px] text-center">
            {Math.round(scale * 100)}%
          </span>
          <Button
            variant="outline"
            size="icon"
            onClick={zoomIn}
            disabled={scale >= 2.0}
            className="h-7 w-7"
          >
            <ZoomIn className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      {/* PDF content */}
      <div className="flex-1 overflow-auto bg-gray-100">
        <div className="p-6 inline-block min-w-full">
          <div className="relative bg-white shadow-lg inline-block">
            <Document
              file={pdfUrl}
              onLoadSuccess={onDocumentLoadSuccess}
              onLoadError={onDocumentLoadError}
              loading={
                <div className="flex items-center justify-center p-12">
                  <div className="text-sm text-gray-500">Loading PDF...</div>
                </div>
              }
              error={
                <div className="flex items-center justify-center p-12">
                  <div className="text-sm text-red-600">
                    Failed to load PDF. Please check the file path.
                  </div>
                </div>
              }
            >
              <Page
                pageNumber={pageNumber}
                scale={scale}
                renderTextLayer={false}
                renderAnnotationLayer={false}
              />
            </Document>

            {/* Citation bounding boxes */}
            {!documentError && renderCitations()}
          </div>
        </div>
      </div>
    </div>
  );
}
