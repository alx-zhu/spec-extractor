import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import type { RowSelectionState } from "@tanstack/react-table";
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
  /** Pre-select only these product IDs. When omitted, all products are selected. */
  initialSelection?: string[];
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
  initialSelection,
}: ExportModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[90vw] max-h-[85vh] w-full p-0 gap-0 flex flex-col overflow-hidden">
        {open && (
          <ExportModalContent
            allProducts={allProducts}
            initialFilter={initialFilter}
            initialSelection={initialSelection}
            onClose={() => onOpenChange(false)}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}

// ── Helpers ──────────────────────────────────────────────────────

/** Build a RowSelectionState from a product list or a subset of IDs */
function buildSelection(
  products: ResolvedProduct[],
  selectedIds?: string[],
): RowSelectionState {
  const state: RowSelectionState = {};
  if (selectedIds) {
    const idSet = new Set(selectedIds);
    for (const p of products) state[p.id] = idSet.has(p.id);
  } else {
    for (const p of products) state[p.id] = true;
  }
  return state;
}

// ── Inner content — remounts on each open ────────────────────────

interface ExportModalContentProps {
  allProducts: ResolvedProduct[];
  initialFilter: SidebarFilter;
  initialSelection?: string[];
  onClose: () => void;
}

function ExportModalContent({
  allProducts,
  initialFilter,
  initialSelection,
  onClose,
}: ExportModalContentProps) {
  const [columns, setColumns] = useState<ExportColumn[]>(
    DEFAULT_EXPORT_COLUMNS,
  );
  const [rowSelection, setRowSelection] = useState<RowSelectionState>(() =>
    buildSelection(allProducts, initialSelection),
  );

  // Fresh instance each mount — initialFilter seeds useState directly, no sync needed
  const sidebar = useSidebarFilter(allProducts, initialFilter);

  // Plain derived value — no useMemo needed since this component remounts on each open
  const filteredProducts = sidebar.filterProducts(allProducts);

  const handleToggleColumn = (key: string) => {
    setColumns((prev) =>
      prev.map((col) =>
        col.key === key ? { ...col, enabled: !col.enabled } : col,
      ),
    );
  };

  const handleToggleAllColumns = () => {
    setColumns((prev) => {
      const allEnabled = prev.every((col) => col.enabled);
      return prev.map((col) => ({ ...col, enabled: !allEnabled }));
    });
  };

  // Wrap sidebar actions to also reset selection when filter changes
  const handleDivisionClick = (code: string) => {
    sidebar.selectDivision(code);
    setRowSelection(buildSelection(allProducts));
  };

  const handleSectionClick = (code: string) => {
    sidebar.selectSection(code);
    setRowSelection(buildSelection(allProducts));
  };

  const handleNoSpecIdClick = () => {
    sidebar.selectNoSpecId();
    setRowSelection(buildSelection(allProducts));
  };

  const handleClearFilter = () => {
    sidebar.clearFilter();
    setRowSelection(buildSelection(allProducts));
  };

  const handleExport = () => {
    const productsToExport = filteredProducts.filter(
      (p) => rowSelection[p.id],
    );
    const csvContent = exportProductsToCSV(productsToExport, columns);
    const timestamp = new Date().toISOString().split("T")[0];
    downloadCSV(csvContent, `sabana-products-${timestamp}`);
    onClose();
  };

  const enabledColumnCount = columns.filter((col) => col.enabled).length;
  const selectedCount = filteredProducts.filter(
    (p) => rowSelection[p.id],
  ).length;

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
          onDivisionClick={handleDivisionClick}
          onSectionClick={handleSectionClick}
          onNoSpecIdClick={handleNoSpecIdClick}
          onClearFilter={handleClearFilter}
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
              rowSelection={rowSelection}
              onRowSelectionChange={setRowSelection}
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
