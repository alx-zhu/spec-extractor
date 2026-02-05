import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Download } from "lucide-react";
import type { Product } from "@/types/product";
import {
  DEFAULT_EXPORT_COLUMNS,
  exportProductsToCSV,
  downloadCSV,
  type ExportColumn,
} from "@/utils/export";

interface ExportModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  products: Product[];
}

export function ExportModal({
  open,
  onOpenChange,
  products,
}: ExportModalProps) {
  const [columns, setColumns] = useState<ExportColumn[]>(
    DEFAULT_EXPORT_COLUMNS,
  );

  const handleToggleColumn = (key: string) => {
    setColumns((prev) =>
      prev.map((col) =>
        col.key === key ? { ...col, enabled: !col.enabled } : col,
      ),
    );
  };

  const handleSelectAll = () => {
    const allSelected = columns.every((col) => col.enabled);
    setColumns((prev) =>
      prev.map((col) => ({ ...col, enabled: !allSelected })),
    );
  };

  const handleExport = () => {
    const csvContent = exportProductsToCSV(products, columns);
    const timestamp = new Date().toISOString().split("T")[0];
    downloadCSV(csvContent, `sabana-products-${timestamp}`);
    onOpenChange(false);
  };

  const selectedCount = columns.filter((col) => col.enabled).length;
  const allSelected = columns.every((col) => col.enabled);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] p-0 gap-0">
        <DialogHeader className="px-6 pt-6 pb-4">
          <DialogTitle className="text-xl font-semibold">
            Export to CSV
          </DialogTitle>
          <DialogDescription className="text-sm text-gray-500">
            Select the columns you want to include in the export
          </DialogDescription>
        </DialogHeader>

        <div className="px-6 pb-6">
          {/* Select All */}
          <div className="mb-4 pb-4 border-b border-gray-200">
            <div className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors">
              <Checkbox
                checked={allSelected}
                onCheckedChange={handleSelectAll}
                id="select-all"
              />
              <label
                htmlFor="select-all"
                className="flex-1 text-sm font-medium text-gray-900 cursor-pointer flex items-center gap-2"
              >
                Select All Columns
              </label>
              <span className="text-xs text-gray-500 font-medium">
                {selectedCount}/{columns.length}
              </span>
            </div>
          </div>

          {/* Column List */}
          <div className="space-y-1 max-h-[400px] overflow-y-auto">
            {columns.map((column) => (
              <div
                key={column.key}
                className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                onClick={() => handleToggleColumn(column.key)}
              >
                <Checkbox
                  checked={column.enabled}
                  onCheckedChange={() => handleToggleColumn(column.key)}
                  id={column.key}
                  onClick={(e) => e.stopPropagation()}
                />
                <label
                  htmlFor={column.key}
                  className="flex-1 text-sm text-gray-700 cursor-pointer"
                >
                  {column.label}
                </label>
              </div>
            ))}
          </div>

          {/* Product Count Info */}
          <div className="mt-4 pt-4 border-t border-gray-200">
            <p className="text-sm text-gray-500">
              Exporting{" "}
              <span className="font-medium text-gray-900">
                {products.length}
              </span>{" "}
              product
              {products.length !== 1 ? "s" : ""} with{" "}
              <span className="font-medium text-gray-900">{selectedCount}</span>{" "}
              column
              {selectedCount !== 1 ? "s" : ""}
            </p>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 mt-6">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleExport}
              disabled={selectedCount === 0 || products.length === 0}
              className="gap-2"
            >
              <Download className="h-4 w-4" />
              Export CSV
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
