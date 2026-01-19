import { useState } from "react";
import { Header } from "@/components/Header";
import { ProductTable } from "@/components/table/ProductTable";
import { UploadModal } from "@/components/upload/UploadModal";
import { PdfViewer } from "@/components/pdf-viewer/PdfViewer";
import { mockProducts } from "@/data/mockData";
import type { Product } from "@/types/product";
import {
  ChevronLeft,
  ChevronRight,
  Search,
  SlidersHorizontal,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

function App() {
  const [products, setProducts] = useState<Product[]>(mockProducts);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);

  // Filter products based on search query
  const filteredProducts = products.filter((product) => {
    const query = searchQuery.toLowerCase();
    return (
      product.itemName.value.toLowerCase().includes(query) ||
      product.manufacturer.value.toLowerCase().includes(query) ||
      product.specIdNumber.value.toLowerCase().includes(query) ||
      product.project.value.toLowerCase().includes(query)
    );
  });

  const handleUploadClick = () => {
    setIsUploadModalOpen(true);
  };

  const handleExportClick = () => {
    // TODO: Implement CSV export
    console.log("Export clicked");
  };

  const handleRowClick = (product: Product) => {
    setSelectedProduct(product);

    // Reference a PDF from the public folder
    // Place your PDF in /public and reference it like this:
    setPdfUrl("/sample_spec.pdf");
  };

  const handleClosePdfViewer = () => {
    setSelectedProduct(null);
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
        <div
          className={`flex flex-col bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden transition-all duration-300 ${
            selectedProduct && pdfUrl ? "flex-[0.5]" : "flex-1"
          }`}
        >
          {/* Panel Header */}
          <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center bg-white">
            <div className="flex items-center gap-3">
              <h2 className="text-base font-semibold text-gray-900">
                Extracted Products
              </h2>
              <span className="inline-flex items-center justify-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
                {filteredProducts.length}
              </span>
            </div>
            <div className="flex items-center gap-3">
              {/* Search Box */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  type="text"
                  placeholder="Search products..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 w-48 h-8 text-sm bg-gray-50 border-gray-200"
                />
              </div>
              <Button variant="outline" size="icon" className="h-8 w-8">
                <SlidersHorizontal className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Table */}
          <div className="flex-1 overflow-hidden">
            <ProductTable
              data={filteredProducts}
              onRowClick={handleRowClick}
              selectedProductId={selectedProduct?.id}
            />
          </div>

          {/* Table Footer */}
          <div className="px-6 py-3 border-t border-gray-200 flex justify-between items-center bg-white">
            <span className="text-sm text-gray-500">
              Showing 1-{filteredProducts.length} of {filteredProducts.length}{" "}
              products
            </span>
            <div className="flex gap-1">
              <Button
                variant="outline"
                size="icon"
                disabled
                className="h-8 w-8"
              >
                <ChevronLeft className="h-4 w-4 text-gray-400" />
              </Button>
              <Button variant="outline" size="sm" className="h-8 min-w-8 px-2">
                1
              </Button>
              <Button
                variant="outline"
                size="icon"
                disabled
                className="h-8 w-8"
              >
                <ChevronRight className="h-4 w-4 text-gray-400" />
              </Button>
            </div>
          </div>
        </div>

        {/* PDF Viewer Panel - Only show when a product is selected */}
        {selectedProduct && pdfUrl && (
          <div className="flex-[0.5] animate-in slide-in-from-right duration-300">
            <div className="h-full bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
              <PdfViewer
                product={selectedProduct}
                pdfUrl={pdfUrl}
                onClose={handleClosePdfViewer}
              />
            </div>
          </div>
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
