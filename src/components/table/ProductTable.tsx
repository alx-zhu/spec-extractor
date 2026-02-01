import {
  useReactTable,
  getCoreRowModel,
  flexRender,
} from "@tanstack/react-table";
import type { Product, ProductFieldKey } from "@/types/product";
import { productColumns } from "./columns";
import { ProductRow } from "./ProductRow";
import { cn } from "@/lib/utils";
import { useUpdateProduct } from "@/hooks/useProducts";

interface ProductTableProps {
  data: Product[];
  onRowClick?: (product: Product, fieldKey?: string) => void;
  selectedProductId?: string;
  selectedFieldKey?: string | null;
}

export function ProductTable({
  data,
  onRowClick,
  selectedProductId,
  selectedFieldKey,
}: ProductTableProps) {
  const updateProduct = useUpdateProduct();

  const table = useReactTable({
    data,
    columns: productColumns,
    getCoreRowModel: getCoreRowModel(),
  });

  const handleCellSave = (
    productId: string,
    fieldKey: ProductFieldKey,
    newValue: string,
  ) => {
    // Find the product to get the existing bbox
    const product = data.find((p) => p.id === productId);
    if (!product) return;

    // Preserve the bbox while updating the value
    const fieldData = product[fieldKey];
    updateProduct.mutate({
      productId,
      updates: {
        [fieldKey]: {
          value: newValue,
          citations: fieldData?.citations || [],
        },
      },
    });
  };

  return (
    <div className="flex flex-col h-full overflow-x-auto">
      <div className="flex-1 flex flex-col min-w-min">
        {/* Table Header */}
        <div className="flex bg-gray-50 border-b border-gray-200 sticky top-0 z-50">
          {table.getHeaderGroups().map((headerGroup) =>
            headerGroup.headers.map((header) => {
              const size = header.column.columnDef.size;
              const isItemName = header.column.id === "itemName";
              const minWidth = isItemName ? 250 : size;

              return (
                <div
                  key={header.id}
                  className={cn(
                    "px-3 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wide flex items-center border-r border-gray-200 last:border-r-0",
                    header.column.id === "select" && "justify-center",
                  )}
                  style={{
                    width: size ? `${size}px` : undefined,
                    minWidth: minWidth ? `${minWidth}px` : undefined,
                    flex: isItemName ? "1" : undefined,
                  }}
                >
                  {flexRender(
                    header.column.columnDef.header,
                    header.getContext(),
                  )}
                </div>
              );
            }),
          )}
        </div>

        {/* Table Body */}
        <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent hover:scrollbar-thumb-gray-400">
          {table.getRowModel().rows.length === 0 ? (
            <div className="p-8 text-center text-gray-400 text-sm">
              No products found.
            </div>
          ) : (
            table
              .getRowModel()
              .rows.map((row) => (
                <ProductRow
                  key={row.id}
                  row={row}
                  onClick={(fieldKey) => onRowClick?.(row.original, fieldKey)}
                  isSelected={selectedProductId === row.original?.id}
                  selectedFieldKey={selectedFieldKey}
                  onCellSave={handleCellSave}
                />
              ))
          )}
        </div>
      </div>
    </div>
  );
}
