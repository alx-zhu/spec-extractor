import { useState, useEffect } from "react";
import { Document, Page, pdfjs } from "react-pdf";
import { X, ChevronLeft, ChevronRight, ZoomIn, ZoomOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Product } from "@/types/product";
import { cn } from "@/lib/utils";

// Set up PDF.js worker
pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

interface PdfViewerProps {
  product: Product;
  pdfUrl: string;
  onClose: () => void;
}

export function PdfViewer({ product, pdfUrl, onClose }: PdfViewerProps) {
  const [numPages, setNumPages] = useState<number>(0);
  const [pageNumber, setPageNumber] = useState<number>(1);
  const [scale, setScale] = useState<number>(1.0);

  console.log("pdfUrl:", pdfUrl);

  // Get the page number from the first field with a bbox (use itemName as default)
  const productPage = product.itemName.bbox.page;

  function onDocumentLoadSuccess({ numPages }: { numPages: number }) {
    setNumPages(numPages);

    console.log("Document loaded with", numPages, "pages.");
    // Navigate to the page where the product was found, but ensure it's valid
    if (productPage && productPage >= 1 && productPage <= numPages) {
      setPageNumber(productPage);
    } else {
      setPageNumber(1);
    }
  }

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

  return (
    <div className="h-full flex flex-col bg-white border-l border-gray-200">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center bg-white">
        <div className="flex flex-col gap-1">
          <h2 className="text-base font-semibold text-gray-900">
            Source Document
          </h2>
          <p className="text-sm text-gray-500">
            {product.itemName.value} • Page {pageNumber}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-500">
            Page {pageNumber} of {numPages}
          </span>
          <div className="flex items-center gap-1 ml-2">
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
          <div className="flex items-center gap-1 ml-2">
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
            className="h-8 w-8 ml-2"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* PDF Content */}
      <div className="flex-1 overflow-auto bg-gray-50 p-8">
        <div className="flex justify-center">
          <div className="relative bg-white shadow-lg">
            <Document
              file={pdfUrl}
              onLoadSuccess={onDocumentLoadSuccess}
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

            {/* Highlight Box - Show the itemName bbox */}
            {pageNumber === productPage && (
              <div
                className={cn(
                  "absolute border-2 border-blue-500 bg-blue-500/10 pointer-events-none",
                )}
                style={{
                  left: `${product.itemName.bbox.left * 100}%`,
                  top: `${product.itemName.bbox.top * 100}%`,
                  width: `${product.itemName.bbox.width * 100}%`,
                  height: `${product.itemName.bbox.height * 100}%`,
                }}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
