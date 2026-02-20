import { useState, useMemo } from "react";
import { Header } from "@/components/Header";
import { TablePanel } from "@/components/panels/TablePanel";
import { ProductSheet } from "@/components/sheet/ProductSheet";
import { FilterSidebar } from "@/components/sidebar/FilterSidebar";
import { UploadModal } from "@/components/upload/UploadModal";
import { ExportModal } from "@/components/export/ExportModal";
import { useProducts, useReviewProduct, useUpdateProduct } from "@/hooks/useProducts";
import { useResolvedProducts } from "@/hooks/useResolvedProducts";
import {
  useOverrideMergedField,
  useUnmergeProduct,
  useRebuildMergedProducts,
} from "@/hooks/useMergedProducts";
import { useSidebarFilter } from "@/hooks/useSidebarFilter";
import type { ExtractedProduct, ProductFieldKey } from "@/types/product";
import { useDocuments } from "./hooks/useDocuments";
import { getPdfUrl } from "./utils/storage";

type TabKey = "inbox" | "reviewed";

function App() {
  // Fetch products from React Query
  const { data: products = [], isLoading } = useProducts();
  const { data: documents = [] } = useDocuments();
  const { data: resolvedProducts = [] } = useResolvedProducts();
  const reviewProduct = useReviewProduct();
  const updateProduct = useUpdateProduct();
  const overrideMergedField = useOverrideMergedField();
  const unmergeProduct = useUnmergeProduct();
  const rebuildMergedProducts = useRebuildMergedProducts();

  // Tab state
  const [activeTab, setActiveTab] = useState<TabKey>("inbox");

  // Strict separation: inbox = unreviewed, reviewed = reviewed
  const inboxProducts = useMemo(
    () => products.filter((p) => !p.reviewed),
    [products],
  );
  const reviewedResolved = useMemo(
    () => resolvedProducts.filter((rp) => rp.reviewed),
    [resolvedProducts],
  );

  // Sidebar filter state — applies to inbox only
  const sidebar = useSidebarFilter(inboxProducts);

  // Selection state — store ID, derive the product from the array
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null);
  const [selectedFieldKey, setSelectedFieldKey] = useState<ProductFieldKey>("itemName");
  const [searchQuery, setSearchQuery] = useState("");
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);

  // Derive filtered inbox products: text search then sidebar filter
  const textFilteredInbox = useMemo(() => {
    const query = searchQuery.toLowerCase();
    if (!query) return inboxProducts;
    return inboxProducts.filter((product) =>
      product?.itemName?.value?.toLowerCase().includes(query) ||
      product?.manufacturer?.value?.toLowerCase().includes(query) ||
      product?.specIdNumber?.value?.toLowerCase().includes(query) ||
      product?.project?.value?.toLowerCase().includes(query),
    );
  }, [inboxProducts, searchQuery]);
  const filteredInbox = sidebar.filterProducts(textFilteredInbox);

  // Derive filtered reviewed products: text search + sidebar filter
  const filteredReviewed = useMemo(() => {
    let result = reviewedResolved;

    // Apply text search
    const query = searchQuery.toLowerCase();
    if (query) {
      result = result.filter((rp) =>
        rp.fields.itemName?.value?.toLowerCase().includes(query) ||
        rp.fields.manufacturer?.value?.toLowerCase().includes(query) ||
        rp.fields.specIdNumber?.value?.toLowerCase().includes(query),
      );
    }

    // Apply sidebar filter
    if (sidebar.activeFilter) {
      result = result.filter((rp) =>
        sidebar.matchesFilter(rp.fields.specIdNumber?.value),
      );
    }

    return result;
  }, [reviewedResolved, searchQuery, sidebar.activeFilter, sidebar.matchesFilter]);

  // Derive selected product from fresh products array (never stale)
  const selectedProduct = useMemo(() => {
    if (!selectedProductId) return null;
    if (activeTab === "inbox") {
      return filteredInbox.find((p) => p.id === selectedProductId) ?? null;
    }
    // Reviewed tab: look up the EP directly from products array
    // (source row clicks set selectedProductId to an EP id)
    const directEp = products.find((p) => p.id === selectedProductId);
    if (directEp) return directEp;
    return null;
  }, [selectedProductId, activeTab, filteredInbox, products]);

  // Derive PDF URL from the selected product's document
  const pdfUrl = useMemo(() => {
    if (!selectedProduct) return null;
    const document = documents.find(
      (d) => d.id === selectedProduct.productDocumentId,
    );
    if (document?.filename) {
      return getPdfUrl(document.filename);
    }
    return "sample_spec.pdf";
  }, [selectedProduct, documents]);

  // Products list for sheet navigation (inbox only — reviewed uses different flow)
  const sheetProducts = activeTab === "inbox" ? filteredInbox : [];

  const handleTabChange = (tab: TabKey) => {
    setActiveTab(tab);
    setSelectedProductId(null);
    setSelectedFieldKey("itemName");
  };

  const handleReview = (productId: string) => {
    reviewProduct.mutate(productId, {
      onSuccess: () => {
        rebuildMergedProducts.mutate();
      },
    });
  };

  const handleUnreview = (productId: string) => {
    updateProduct.mutate(
      { productId, updates: { reviewed: false } },
      {
        onSuccess: () => {
          rebuildMergedProducts.mutate();
        },
      },
    );
  };

  const handleRowClick = (product: ExtractedProduct, fieldKey?: string) => {
    setSelectedProductId(product.id);
    setSelectedFieldKey((fieldKey as ProductFieldKey) || "itemName");
  };

  const handleSourceClick = (ep: ExtractedProduct, fieldKey?: string) => {
    setSelectedProductId(ep.id);
    setSelectedFieldKey((fieldKey as ProductFieldKey) || "itemName");
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

  const handleUnmerge = (
    mergedProductId: string,
    extractedProductId: string,
  ) => {
    unmergeProduct.mutate({ mergedProductId, extractedProductId });
  };

  const handleSheetOpenChange = (open: boolean) => {
    if (!open) {
      setSelectedProductId(null);
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
    <div className="h-screen flex flex-col bg-gray-50">
      <Header
        onUploadClick={() => setIsUploadModalOpen(true)}
        onExportClick={() => setIsExportModalOpen(true)}
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
          onDivisionClick={sidebar.selectDivision}
          onSectionClick={sidebar.selectSection}
        />

        <main className="flex-1 flex overflow-hidden p-8">
          {/* Table Panel */}
          <TablePanel
            activeTab={activeTab}
            onTabChange={handleTabChange}
            products={filteredInbox}
            selectedProductId={selectedProductId}
            selectedFieldKey={selectedFieldKey}
            onRowClick={handleRowClick}
            onReview={handleReview}
            onUnreview={handleUnreview}
            resolvedProducts={filteredReviewed}
            onSourceClick={handleSourceClick}
            onOverrideField={handleOverrideField}
            onUnmerge={handleUnmerge}
            onUnreviewResolved={handleUnreview}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            onFilterToggle={sidebar.toggleSidebar}
            activeFilterLabel={sidebar.activeFilterLabel}
            onClearFilter={sidebar.clearFilter}
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
        onOpenChange={setIsExportModalOpen}
        products={products}
      />
    </div>
  );
}

export default App;
