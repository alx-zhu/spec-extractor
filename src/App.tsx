import { useState } from "react";
import { Header } from "@/components/Header";
import { TablePanel } from "@/components/panels/TablePanel";
import { PdfViewerPanel } from "@/components/panels/PdfViewerPanel";
import { UploadModal } from "@/components/upload/UploadModal";
import { mockProducts } from "@/data/mockData";
import type { Product } from "@/types/product";

function App() {
  const [products, setProducts] = useState<Product[]>(mockProducts);
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

    // Reference a PDF from the public folder
    // Place your PDF in /public and reference it like this:
    setPdfUrl("/sample_spec.pdf");
  };

  const handleClosePdfViewer = () => {
    setSelectedProduct(null);
    setSelectedFieldKey(null);
    setPdfUrl(null);
  };

  const handleUploadComplete = (files: File[]) => {
    // Generate placeholder products for each uploaded file
    const newProducts: Product[] = files.flatMap((file, fileIndex) => {
      // Generate 3-5 products per file
      const productsPerFile = Math.floor(Math.random() * 3) + 3;

      return Array.from({ length: productsPerFile }, (_, productIndex) => {
        const id = `upload-${Date.now()}-${fileIndex}-${productIndex}`;
        const manufacturers = ["Pending", "Processing", "To Be Extracted"];
        const colors = ["—", "TBD", "Pending"];
        const sizes = ["—", "Standard", "Custom"];
        const pageNum = Math.floor(Math.random() * 50) + 1;

        // Helper to create field with bbox
        const createField = (value: string) => ({
          value,
          bbox: {
            left: 0.1,
            top: 0.2 + productIndex * 0.1,
            width: 0.4,
            height: 0.06,
            page: pageNum,
          },
        });

        return {
          id,
          itemName: createField(
            `Product ${productIndex + 1} from ${file.name}`,
          ),
          manufacturer: createField(
            manufacturers[Math.floor(Math.random() * manufacturers.length)],
          ),
          specIdNumber: createField("00 00 00"),
          color: createField(colors[Math.floor(Math.random() * colors.length)]),
          size: createField(sizes[Math.floor(Math.random() * sizes.length)]),
          price: createField("—"),
          project: createField("Pending Classification"),
          linkToProduct: createField("—"),
          specDocumentId: id,
          extractedText: `Placeholder text from ${file.name}`,
          createdAt: new Date(),
        };
      });
    });

    setProducts((prev) => [...newProducts, ...prev]);
    console.log(
      `Added ${newProducts.length} placeholder products from ${files.length} files`,
    );
  };

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
        onUploadComplete={handleUploadComplete}
      />
    </div>
  );
}

export default App;
