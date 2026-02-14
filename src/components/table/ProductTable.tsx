import {
  useReactTable,
  getCoreRowModel,
  flexRender,
} from "@tanstack/react-table";
import type { Product } from "@/types/product";
import { productColumns } from "./columns";
import { ProductRow } from "./ProductRow";
import { getColumnType, getColumnWidth } from "@/styles/tableLayout";
import { headerCellVariants } from "./tableVariants";

interface ProductTableProps {
  data: Product[];
  onRowClick?: (product: Product, fieldKey?: string) => void;
  selectedProductId?: string | null;
  selectedFieldKey?: string | null;
}

export function ProductTable({
  data,
  onRowClick,
  selectedProductId,
  selectedFieldKey,
}: ProductTableProps) {
  const table = useReactTable({
    data,
    columns: productColumns,
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <div className="h-full overflow-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent hover:scrollbar-thumb-gray-400">
      <div className="min-w-min">
        {/* Table Header */}
        <div className="flex bg-gray-50 border-b border-gray-200 sticky top-0 z-50">
          {table.getHeaderGroups().map((headerGroup) =>
            headerGroup.headers.map((header) => {
              const columnType = getColumnType(header.column.id);
              const width =
                getColumnWidth(header.column.id) ??
                header.column.columnDef.size;

              return (
                <div
                  key={header.id}
                  className={headerCellVariants({ column: columnType })}
                  style={{
                    width: width ? `${width}px` : undefined,
                    minWidth: width ? `${width}px` : undefined,
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
              />
            ))
        )}
      </div>
    </div>
  );
}
