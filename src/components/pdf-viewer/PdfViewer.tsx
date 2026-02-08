import { useState, useEffect } from "react";
import { Document, Page, pdfjs } from "react-pdf";
import { X, ChevronLeft, ChevronRight, ZoomIn, ZoomOut } from "lucide-react";
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

interface PdfViewerProps {
  product: Product;
  pdfUrl: string;
  selectedFieldKey?: string | null;
  onClose: () => void;
}

export function PdfViewer({
  product,
  pdfUrl,
  selectedFieldKey,
  onClose,
}: PdfViewerProps) {
  const [numPages, setNumPages] = useState<number>(0);
  const [pageNumber, setPageNumber] = useState<number>(1);
  const [scale, setScale] = useState<number>(1.0);
  const [documentError, setDocumentError] = useState<string | null>(null);

  // Get the page number from the first field with a bbox (use first citation of itemName as default)
  const productPage = (() => {
    const fieldKey = (selectedFieldKey as ProductFieldKey) || "itemName";
    const field = product[fieldKey] as ReductoFieldValue<string> | undefined;
    const citations = getFieldCitations(field);
    // By default, use the first citation's page, even if there are multiple
    if (citations && citations.length > 0) {
      return citations[0].bbox.page;
    }
    return null;
  })();

  const onDocumentLoadSuccess = ({ numPages }: { numPages: number }) => {
    setNumPages(numPages);
    setDocumentError(null);
    // Navigate to the page where the product was found, but ensure it's valid
    if (productPage && productPage >= 1 && productPage <= numPages) {
      setPageNumber(productPage);
    } else {
      setPageNumber(1);
    }
  };

  const onDocumentLoadError = (error: Error) => {
    console.error("Error loading PDF document:", error);
    setDocumentError(error.message);
  };

  // Update page when product changes
  useEffect(() => {
    if (
      numPages > 0 &&
      productPage &&
      productPage >= 1 &&
      productPage <= numPages
    ) {
      setPageNumber(productPage);
    }
  }, [product.id, productPage, numPages]);

  const goToPrevPage = () => {
    setPageNumber((prev) => Math.max(prev - 1, 1));
  };

  const goToNextPage = () => {
    setPageNumber((prev) => Math.min(prev + 1, numPages));
  };

  const zoomIn = () => {
    setScale((prev) => Math.min(prev + 0.2, 2.0));
  };

  const zoomOut = () => {
    setScale((prev) => Math.max(prev - 0.2, 0.5));
  };

  const displayFieldCitations = () => {
    // Get the field to highlight - default to itemName if no specific field selected
    const fieldKey = (selectedFieldKey as ProductFieldKey) || "itemName";
    const field = product[fieldKey] as ReductoFieldValue<string>;
    const citations = getFieldCitations(field);

    if (!citations) return null;

    return citations
      .filter((citation) => citation.bbox.page === pageNumber)
      .map((citation) => (
        <div
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
    <div className="h-full flex flex-col bg-white border-l border-gray-200">
      {/* Header */}
      <div className="border-b border-gray-200 bg-white">
        {/* Top toolbar */}
        <div className="px-6 py-4 flex justify-between items-center border-b border-gray-200">
          <h2 className="font-semibold text-gray-700">Source Document</h2>
          <div className="flex items-center gap-2 shrink-0">
            <div className="flex items-center gap-1">
              <Button
                variant="outline"
                size="icon"
                onClick={goToPrevPage}
                disabled={pageNumber <= 1}
                className="h-8 w-8"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={goToNextPage}
                disabled={pageNumber >= numPages}
                className="h-8 w-8"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
            <div className="flex items-center gap-1">
              <Button
                variant="outline"
                size="icon"
                onClick={zoomOut}
                disabled={scale <= 0.5}
                className="h-8 w-8"
              >
                <ZoomOut className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={zoomIn}
                disabled={scale >= 2.0}
                className="h-8 w-8"
              >
                <ZoomIn className="h-4 w-4" />
              </Button>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="h-8 w-8"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Product info section */}
        <div className="px-6 py-3 bg-gray-white">
          <div className="flex flex-col gap-1">
            <p className="text-sm text-gray-900 font-medium truncate">
              {product?.itemName?.value || "Product"}
            </p>
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-gray-500">
              <span>
                Page {pageNumber} of {numPages}
              </span>
              {selectedFieldKey && (
                <>
                  <span className="text-gray-300">•</span>
                  <span className="text-blue-600 font-medium">
                    Highlighting: {selectedFieldKey}
                  </span>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* PDF Content */}
      <div className="flex-1 overflow-auto bg-gray-100">
        <div className="p-8 inline-block min-w-full">
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

            {/* Highlight Box - Show the selected field's bbox or default to itemName */}
            {!documentError && displayFieldCitations()}
          </div>
        </div>
      </div>
    </div>
  );
}
