import { useState, useMemo, useCallback } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import type { ResolvedProduct } from "@/types/resolvedProduct";
import type { SidebarFilter } from "@/hooks/useSidebarFilter";
import { useSidebarFilter } from "@/hooks/useSidebarFilter";
import {
  DEFAULT_EXPORT_COLUMNS,
  exportProductsToCSV,
  downloadCSV,
  type ExportColumn,
} from "@/utils/export";
import { ExportFilterSidebar } from "./ExportFilterSidebar";
import { ExportColumnBar } from "./ExportColumnBar";
import { ExportPreviewTable } from "./ExportPreviewTable";

interface ExportModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  allProducts: ResolvedProduct[];
  initialFilter: SidebarFilter;
}

/**
 * Thin wrapper — only mounts the content when open so all state
 * (sidebar filter, row selection) initialises fresh each time.
 */
export function ExportModal({
  open,
  onOpenChange,
  allProducts,
  initialFilter,
}: ExportModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[90vw] max-h-[85vh] w-full p-0 gap-0 flex flex-col overflow-hidden">
        {open && (
          <ExportModalContent
            allProducts={allProducts}
            initialFilter={initialFilter}
            onClose={() => onOpenChange(false)}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}

// ── Inner content — remounts on each open ────────────────────────

interface ExportModalContentProps {
  allProducts: ResolvedProduct[];
  initialFilter: SidebarFilter;
  onClose: () => void;
}

function ExportModalContent({
  allProducts,
  initialFilter,
  onClose,
}: ExportModalContentProps) {
  const [columns, setColumns] = useState<ExportColumn[]>(
    DEFAULT_EXPORT_COLUMNS,
  );
  const [selectedProductIds, setSelectedProductIds] = useState<Set<string>>(
    new Set(),
  );

  // Fresh instance each mount — initialFilter seeds useState directly, no sync needed
  const sidebar = useSidebarFilter(allProducts, initialFilter);

  const filteredProducts = useMemo(
    () => sidebar.filterProducts(allProducts),
    [sidebar, allProducts],
  );

  const handleToggleColumn = useCallback((key: string) => {
    setColumns((prev) =>
      prev.map((col) =>
        col.key === key ? { ...col, enabled: !col.enabled } : col,
      ),
    );
  }, []);

  const handleToggleAllColumns = useCallback(() => {
    setColumns((prev) => {
      const allEnabled = prev.every((col) => col.enabled);
      return prev.map((col) => ({ ...col, enabled: !allEnabled }));
    });
  }, []);

  const handleSelectionChange = useCallback((ids: Set<string>) => {
    setSelectedProductIds(ids);
  }, []);

  const handleExport = () => {
    const productsToExport = filteredProducts.filter((p) =>
      selectedProductIds.has(p.id),
    );
    const csvContent = exportProductsToCSV(productsToExport, columns);
    const timestamp = new Date().toISOString().split("T")[0];
    downloadCSV(csvContent, `sabana-products-${timestamp}`);
    onClose();
  };

  const enabledColumnCount = columns.filter((col) => col.enabled).length;
  const selectedCount = selectedProductIds.size;

  return (
    <>
      {/* Header */}
      <DialogHeader className="px-6 pt-5 pb-4 border-b border-gray-200 shrink-0">
        <DialogTitle className="text-lg font-semibold">
          Export to CSV
        </DialogTitle>
        <DialogDescription className="text-sm text-gray-500">
          Select products and columns to include in the export
        </DialogDescription>
      </DialogHeader>

      {/* Body: sidebar + preview */}
      <div className="flex flex-1 overflow-hidden min-h-0">
        {/* Division filter sidebar */}
        <ExportFilterSidebar
          divisions={sidebar.divisions}
          activeFilter={sidebar.activeFilter}
          expandedDivision={sidebar.expandedDivision}
          noSpecIdCount={sidebar.noSpecIdCount}
          totalCount={allProducts.length}
          onDivisionClick={sidebar.selectDivision}
          onSectionClick={sidebar.selectSection}
          onNoSpecIdClick={sidebar.selectNoSpecId}
          onClearFilter={sidebar.clearFilter}
        />

        {/* Right: column bar + table preview */}
        <div className="flex-1 flex flex-col overflow-hidden min-w-0">
          {/* Column toggle bar */}
          <div className="px-4 py-3 border-b border-gray-200 bg-white shrink-0">
            <ExportColumnBar
              columns={columns}
              onToggleColumn={handleToggleColumn}
              onToggleAll={handleToggleAllColumns}
            />
          </div>

          {/* Preview table */}
          <div className="flex-1 overflow-hidden">
            <ExportPreviewTable
              products={filteredProducts}
              columns={columns}
              onSelectionChange={handleSelectionChange}
            />
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="px-6 py-4 border-t border-gray-200 shrink-0 flex items-center justify-between bg-white">
        <p className="text-sm text-gray-500">
          <span className="font-medium text-gray-900">{selectedCount}</span>{" "}
          of{" "}
          <span className="font-medium text-gray-900">
            {filteredProducts.length}
          </span>{" "}
          product{filteredProducts.length !== 1 ? "s" : ""} selected
          {enabledColumnCount > 0 && (
            <>
              {" \u00B7 "}
              <span className="font-medium text-gray-900">
                {enabledColumnCount}
              </span>{" "}
              column{enabledColumnCount !== 1 ? "s" : ""}
            </>
          )}
        </p>
        <div className="flex items-center gap-3">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            onClick={handleExport}
            disabled={enabledColumnCount === 0 || selectedCount === 0}
            className="gap-2"
          >
            <Download className="h-4 w-4" />
            Export CSV
          </Button>
        </div>
      </div>
    </>
  );
}
