import { useState, useMemo } from "react";
import { Header } from "@/components/Header";
import { TablePanel } from "@/components/panels/TablePanel";
import { ProductSheet } from "@/components/sheet/ProductSheet";
import { FilterSidebar } from "@/components/sidebar/FilterSidebar";
import { UploadModal } from "@/components/upload/UploadModal";
import { ExportModal } from "@/components/export/ExportModal";
import { useProducts } from "@/hooks/useProducts";
import { useResolvedProducts } from "@/hooks/useResolvedProducts";
import {
  useOverrideMergedField,
  useAddManualSource,
  useCreateManualProduct,
} from "@/hooks/useMergedProducts";
import { useSidebarFilter } from "@/hooks/useSidebarFilter";
import type { ExtractedProduct, ProductFieldKey } from "@/types/product";
import type { ResolvedProduct } from "@/types/resolvedProduct";
import { useDocuments } from "./hooks/useDocuments";
import { getPdfUrl } from "./utils/storage";
import { TooltipProvider } from "@/components/ui/tooltip";

function App() {
  // Fetch products from React Query
  const { data: products = [], isLoading } = useProducts();
  const { data: documents = [] } = useDocuments();
  const { data: resolvedProducts = [] } = useResolvedProducts();
  const overrideMergedField = useOverrideMergedField();
  const addManualSource = useAddManualSource();
  const createManualProduct = useCreateManualProduct();

  // Sidebar filter state — applies to all resolved products
  const sidebar = useSidebarFilter(resolvedProducts);

  // Selection state — store ID, derive the product from the array
  const [selectedProductId, setSelectedProductId] = useState<string | null>(
    null,
  );
  const [selectedFieldKey, setSelectedFieldKey] =
    useState<ProductFieldKey>("itemName");
  const [searchQuery, setSearchQuery] = useState("");
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [exportSelection, setExportSelection] = useState<string[] | undefined>(
    undefined,
  );

  // Track which merged group is active for scoped PDF navigation
  const [activeMergedGroupId, setActiveMergedGroupId] = useState<string | null>(
    null,
  );

  // Filter resolved products: text search then sidebar filter
  const filteredProducts = useMemo(() => {
    let result = resolvedProducts;

    // Apply text search
    const query = searchQuery.toLowerCase();
    if (query) {
      result = result.filter(
        (rp) =>
          rp.fields.itemName?.value?.toLowerCase().includes(query) ||
          rp.fields.manufacturer?.value?.toLowerCase().includes(query) ||
          rp.fields.specIdNumber?.value?.toLowerCase().includes(query) ||
          rp.fields.tag?.value?.toLowerCase().includes(query),
      );
    }

    // Apply sidebar filter
    return sidebar.filterProducts(result);
  }, [resolvedProducts, searchQuery, sidebar]);

  // Build a map of document ID → filename for source document display in table
  const documentMap = useMemo(() => {
    const map = new Map<string, string>();
    for (const doc of documents) {
      map.set(doc.id, doc.filename);
    }
    return map;
  }, [documents]);

  // Derive selected product from fresh products array (never stale)
  const selectedProduct = useMemo(() => {
    if (!selectedProductId) return null;
    // Look up the EP directly from products array
    // (source row clicks set selectedProductId to an EP id)
    return products.find((p) => p.id === selectedProductId) ?? null;
  }, [selectedProductId, products]);

  // Derive PDF URL from the selected product's document
  const pdfUrl = useMemo(() => {
    if (!selectedProduct) return null;
    const document = documents.find(
      (d) => d.id === selectedProduct.productDocumentId,
    );
    if (document?.filename) {
      return getPdfUrl(document.filename);
    }
    // No PDF source for manual products
    if (selectedProduct.sourceType === "manual") {
      return null;
    }
    return "sample_spec.pdf";
  }, [selectedProduct, documents]);

  // Products list for sheet navigation — scoped to active merged group's sources
  const sheetProducts = useMemo(() => {
    if (!activeMergedGroupId) return [];
    const resolved = resolvedProducts.find(
      (rp) => rp.id === activeMergedGroupId,
    );
    if (!resolved) return [];
    return resolved.source.extractedProducts;
  }, [activeMergedGroupId, resolvedProducts]);

  const handleExportSelection = (products: ResolvedProduct[]) => {
    setExportSelection(products.map((p) => p.id));
    setIsExportModalOpen(true);
  };

  const handleExportModalChange = (open: boolean) => {
    setIsExportModalOpen(open);
    if (!open) setExportSelection(undefined);
  };

  const handleViewSource = (
    ep: ExtractedProduct,
    resolvedProductId?: string,
    fieldKey?: ProductFieldKey,
  ) => {
    setSelectedProductId(ep.id);
    setSelectedFieldKey(fieldKey ?? "itemName");
    if (resolvedProductId) {
      setActiveMergedGroupId(resolvedProductId);
    }
  };

  const handleOverrideField = (
    mergedProductId: string,
    fieldKey: ProductFieldKey,
    selectedProductIdForField: string,
  ) => {
    overrideMergedField.mutate({
      mergedProductId,
      fieldKey,
      selectedProductId: selectedProductIdForField,
    });
  };

  const handleAddManualSource = (
    mergedProductId: string,
    fields: Partial<Record<ProductFieldKey, string>>,
  ) => {
    addManualSource.mutate({ mergedProductId, fields });
  };

  const handleCreateManualProduct = (
    fields: Partial<Record<ProductFieldKey, string>>,
  ) => {
    createManualProduct.mutate({ fields });
  };

  const handleSheetOpenChange = (open: boolean) => {
    if (!open) {
      setSelectedProductId(null);
      setActiveMergedGroupId(null);
    }
  };

  const handleProductChange = (productId: string) => {
    setSelectedProductId(productId);
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
    <TooltipProvider>
      <div className="h-screen flex flex-col bg-gray-50">
        <Header
          onUploadClick={() => setIsUploadModalOpen(true)}
          onExportClick={() => {
            setExportSelection(undefined);
            setIsExportModalOpen(true);
          }}
          onSidebarToggle={sidebar.toggleSidebar}
          isSidebarOpen={sidebar.isOpen}
        />

        <div className="flex-1 flex overflow-hidden">
          {/* Filter sidebar — pushes table right */}
          <FilterSidebar
            isOpen={sidebar.isOpen}
            divisions={sidebar.divisions}
            activeFilter={sidebar.activeFilter}
            expandedDivision={sidebar.expandedDivision}
            noSpecIdCount={sidebar.noSpecIdCount}
            totalCount={resolvedProducts.length}
            onDivisionClick={sidebar.selectDivision}
            onSectionClick={sidebar.selectSection}
            onNoSpecIdClick={sidebar.selectNoSpecId}
            onClearFilter={sidebar.clearFilter}
          />

          <main className="flex-1 flex overflow-hidden p-8">
            {/* Table Panel */}
            <TablePanel
              resolvedProducts={filteredProducts}
              selectedProductId={selectedProductId}
              selectedFieldKey={selectedFieldKey}
              onViewSource={handleViewSource}
              onOverrideField={handleOverrideField}
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              onFilterToggle={sidebar.toggleSidebar}
              activeFilterLabel={sidebar.activeFilterLabel}
              onClearFilter={sidebar.clearFilter}
              documentMap={documentMap}
              onExportSelection={handleExportSelection}
              onAddManualSource={handleAddManualSource}
              onCreateManualProduct={handleCreateManualProduct}
              onUploadClick={() => setIsUploadModalOpen(true)}
            />
          </main>
        </div>

        {/* Product detail sheet — overlays the table */}
        <ProductSheet
          open={!!selectedProductId}
          onOpenChange={handleSheetOpenChange}
          product={selectedProduct}
          selectedFieldKey={selectedFieldKey}
          onFieldKeyChange={setSelectedFieldKey}
          onProductChange={handleProductChange}
          products={sheetProducts}
          pdfUrl={pdfUrl}
        />

        <UploadModal
          open={isUploadModalOpen}
          onOpenChange={setIsUploadModalOpen}
        />

        <ExportModal
          open={isExportModalOpen}
          onOpenChange={handleExportModalChange}
          allProducts={resolvedProducts}
          initialFilter={sidebar.activeFilter}
          initialSelection={exportSelection}
        />
      </div>
    </TooltipProvider>
  );
}

export default App;
