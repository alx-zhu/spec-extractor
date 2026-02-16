import { useState } from "react";
import { Header } from "@/components/Header";
import { TablePanel } from "@/components/panels/TablePanel";
import { ProductSheet } from "@/components/sheet/ProductSheet";
import { UploadModal } from "@/components/upload/UploadModal";
import { ExportModal } from "@/components/export/ExportModal";
import { useProducts } from "@/hooks/useProducts";
import type { Product, ProductFieldKey } from "@/types/product";
import { useDocuments } from "./hooks/useDocuments";
import { getPdfUrl } from "./utils/storage";

function App() {
  // Fetch products from React Query
  const { data: products = [], isLoading } = useProducts();
  const { data: documents = [] } = useDocuments();

  // Selection state — store ID, derive the product from the array
  // This avoids stale references after React Query invalidation
  const [selectedProductId, setSelectedProductId] = useState<string | null>(
    null,
  );
  const [selectedFieldKey, setSelectedFieldKey] =
    useState<ProductFieldKey>("itemName");
  const [searchQuery, setSearchQuery] = useState("");
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);

  // Derive filtered products (lifted from TablePanel for sheet prev/next)
  const filteredProducts = products.filter((product) => {
    const query = searchQuery.toLowerCase();
    return (
      product?.itemName?.value?.toLowerCase().includes(query) ||
      product?.manufacturer?.value?.toLowerCase().includes(query) ||
      product?.specIdNumber?.value?.toLowerCase().includes(query) ||
      product?.project?.value?.toLowerCase().includes(query)
    );
  });

  // Derive selected product from fresh products array (never stale)
  const selectedProduct =
    filteredProducts.find((p) => p.id === selectedProductId) ?? null;

  // Derive PDF URL from the selected product's document
  const pdfUrl = (() => {
    if (!selectedProduct) return null;
    const document = documents.find(
      (d) => d.id === selectedProduct.productDocumentId,
    );
    if (document?.filename) {
      return getPdfUrl(document.filename);
    }
    return "sample_spec.pdf";
  })();

  const handleRowClick = (product: Product, fieldKey?: string) => {
    setSelectedProductId(product.id);
    setSelectedFieldKey((fieldKey as ProductFieldKey) || "itemName");
  };

  const handleSheetOpenChange = (open: boolean) => {
    if (!open) {
      setSelectedProductId(null);
    }
  };

  const handleProductChange = (productId: string) => {
    setSelectedProductId(productId);
    // Keep the same field selected — user is reviewing the same field across products
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
        onUploadClick={() => setIsUploadModalOpen(true)}
        onExportClick={() => setIsExportModalOpen(true)}
      />

      <main className="flex-1 flex overflow-hidden p-8">
        {/* Table Panel — always full width */}
        <TablePanel
          products={filteredProducts}
          selectedProductId={selectedProductId}
          selectedFieldKey={selectedFieldKey}
          onRowClick={handleRowClick}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
        />
      </main>

      {/* Product detail sheet — overlays the table */}
      <ProductSheet
        open={!!selectedProductId}
        onOpenChange={handleSheetOpenChange}
        product={selectedProduct}
        selectedFieldKey={selectedFieldKey}
        onFieldKeyChange={setSelectedFieldKey}
        onProductChange={handleProductChange}
        products={filteredProducts}
        pdfUrl={pdfUrl}
      />

      <UploadModal
        open={isUploadModalOpen}
        onOpenChange={setIsUploadModalOpen}
      />

      <ExportModal
        open={isExportModalOpen}
        onOpenChange={setIsExportModalOpen}
        products={products}
      />
    </div>
  );
}

export default App;
