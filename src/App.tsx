import { useState } from "react";
import { Header } from "@/components/Header";
import { ProductTable } from "@/components/table/ProductTable";
import { UploadModal } from "@/components/upload/UploadModal";
import { mockProducts } from "@/data/mockData";
import type { Product } from "@/types/product";
import { Search, SlidersHorizontal } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

function App() {
  const [products, setProducts] = useState<Product[]>(mockProducts);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);

  // Filter products based on search query
  const filteredProducts = products.filter((product) => {
    const query = searchQuery.toLowerCase();
    return (
      product.itemName.toLowerCase().includes(query) ||
      product.manufacturer.toLowerCase().includes(query) ||
      product.specIdNumber.toLowerCase().includes(query) ||
      product.project.toLowerCase().includes(query)
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
    // TODO: Open PDF viewer with highlighted section
    console.log("Selected product:", product);
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

        return {
          id,
          itemName: `Product ${productIndex + 1} from ${file.name}`,
          manufacturer:
            manufacturers[Math.floor(Math.random() * manufacturers.length)],
          specIdNumber: "00 00 00",
          color: colors[Math.floor(Math.random() * colors.length)],
          size: sizes[Math.floor(Math.random() * sizes.length)],
          price: "—",
          project: "Pending Classification",
          linkToProduct: "—",
          specDocumentId: id,
          pageNumber: Math.floor(Math.random() * 50) + 1,
          bbox: {
            x: 100,
            y: 200 + productIndex * 100,
            width: 400,
            height: 60,
          },
          extractedText: `Placeholder text from ${file.name}`,
          createdAt: new Date(),
        };
      });
    });

    setProducts((prev) => [...newProducts, ...prev]);
    console.log(
      `Added ${newProducts.length} placeholder products from ${files.length} files`
    );
  };

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      <Header
        onUploadClick={handleUploadClick}
        onExportClick={handleExportClick}
      />

      <main className="flex-1 flex flex-col overflow-hidden p-8">
        {/* Table Panel */}
        <div className="flex-1 flex flex-col bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
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
                <svg
                  width="12"
                  height="12"
                  viewBox="0 0 12 12"
                  fill="none"
                  className="text-gray-400"
                >
                  <path
                    d="M8 2L4 6L8 10"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
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
                <svg
                  width="12"
                  height="12"
                  viewBox="0 0 12 12"
                  fill="none"
                  className="text-gray-400"
                >
                  <path
                    d="M4 2L8 6L4 10"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </Button>
            </div>
          </div>
        </div>
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
