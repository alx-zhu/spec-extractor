import { useState } from "react";
import { Header } from "@/components/Header";
import { TablePanel } from "@/components/panels/TablePanel";
import { PdfViewerPanel } from "@/components/panels/PdfViewerPanel";
import { UploadModal } from "@/components/upload/UploadModal";
import { useProducts } from "@/hooks/useProducts";
import type { Product } from "@/types/product";
import { useDocuments } from "./hooks/useDocuments";

function App() {
  // Fetch products from React Query
  const { data: products = [], isLoading } = useProducts();
  const { data: documents = [] } = useDocuments();

  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [selectedFieldKey, setSelectedFieldKey] = useState<string | null>(null);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);

  const handleUploadClick = () => {
    setIsUploadModalOpen(true);
  };

  const handleExportClick = () => {
    // TODO: Implement CSV export
    console.log("Export clicked");
  };

  const handleRowClick = (product: Product, fieldKey?: string) => {
    setSelectedProduct(product);
    setSelectedFieldKey(fieldKey || null);

    const document = documents.find((d) => d.id === product.specDocumentId);
    console.log(document);
    setPdfUrl(document?.filename || "sample_spec.pdf");
  };

  const handleClosePdfViewer = () => {
    setSelectedProduct(null);
    setSelectedFieldKey(null);
    setPdfUrl(null);
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-50">
        <div className="text-sm text-gray-500">Loading products...</div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      <Header
        onUploadClick={handleUploadClick}
        onExportClick={handleExportClick}
      />

      <main className="flex-1 flex overflow-hidden p-8 gap-8">
        {/* Table Panel */}
        <TablePanel
          products={products}
          selectedProduct={selectedProduct}
          selectedFieldKey={selectedFieldKey}
          onRowClick={handleRowClick}
          isPdfViewerOpen={!!(selectedProduct && pdfUrl)}
        />

        {/* PDF Viewer Panel - Only show when a product is selected */}
        {selectedProduct && pdfUrl && (
          <PdfViewerPanel
            product={selectedProduct}
            pdfUrl={pdfUrl}
            selectedFieldKey={selectedFieldKey}
            onClose={handleClosePdfViewer}
          />
        )}
      </main>

      <UploadModal
        open={isUploadModalOpen}
        onOpenChange={setIsUploadModalOpen}
      />
    </div>
  );
}

export default App;
