import { ProductTable } from "@/components/table/ProductTable";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  ChevronLeft,
  ChevronRight,
  Search,
  SlidersHorizontal,
} from "lucide-react";
import type { Product } from "@/types/product";

interface TablePanelProps {
  products: Product[];
  selectedProductId: string | null;
  selectedFieldKey: string | null;
  onRowClick: (product: Product, fieldKey?: string) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
}

export function TablePanel({
  products,
  selectedProductId,
  selectedFieldKey,
  onRowClick,
  searchQuery,
  onSearchChange,
}: TablePanelProps) {
  return (
    <div className="flex flex-col flex-1 bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
      {/* Panel Header */}
      <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center bg-white">
        <div className="flex items-center gap-3">
          <h2 className="text-base font-semibold text-gray-900">
            Extracted Products
          </h2>
          <span className="inline-flex items-center justify-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
            {products.length}
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
              onChange={(e) => onSearchChange(e.target.value)}
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
          data={products}
          onRowClick={onRowClick}
          selectedProductId={selectedProductId}
          selectedFieldKey={selectedFieldKey}
        />
      </div>

      {/* Table Footer */}
      <div className="px-6 py-3 border-t border-gray-200 flex justify-between items-center bg-white">
        <span className="text-sm text-gray-500">
          Showing 1-{products.length} of {products.length} products
        </span>
        <div className="flex gap-1">
          <Button variant="outline" size="icon" disabled className="h-8 w-8">
            <ChevronLeft className="h-4 w-4 text-gray-400" />
          </Button>
          <Button variant="outline" size="sm" className="h-8 min-w-8 px-2">
            1
          </Button>
          <Button variant="outline" size="icon" disabled className="h-8 w-8">
            <ChevronRight className="h-4 w-4 text-gray-400" />
          </Button>
        </div>
      </div>
    </div>
  );
}
