import {
  useReactTable,
  getCoreRowModel,
} from "@tanstack/react-table";
import type { ExtractedProduct } from "@/types/product";
import { inboxColumns } from "./inboxColumns";
import { TableRow } from "@/components/table/shared/TableRow";
import { TableHeader } from "@/components/table/shared/TableHeader";
import { RowActions } from "@/components/table/shared/RowActions";

interface InboxTableProps {
  data: ExtractedProduct[];
  onRowClick?: (product: ExtractedProduct, fieldKey?: string) => void;
  onReview?: (productId: string) => void;
  onUnreview?: (productId: string) => void;
  selectedProductId?: string | null;
  selectedFieldKey?: string | null;
}

export function InboxTable({
  data,
  onRowClick,
  onReview,
  onUnreview,
  selectedProductId,
  selectedFieldKey,
}: InboxTableProps) {
  const table = useReactTable({
    data,
    columns: inboxColumns,
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <div className="h-full overflow-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent hover:scrollbar-thumb-gray-400">
      <div className="min-w-min">
        <TableHeader headerGroups={table.getHeaderGroups()} />

        {table.getRowModel().rows.length === 0 ? (
          <div className="p-8 text-center text-gray-400 text-sm">
            No products found.
          </div>
        ) : (
          table
            .getRowModel()
            .rows.map((row) => (
              <TableRow
                key={row.id}
                row={row}
                onClick={(fieldKey) => onRowClick?.(row.original, fieldKey)}
                isSelected={selectedProductId === row.original?.id}
                selectedFieldKey={selectedFieldKey}
                actions={
                  <RowActions
                    productId={row.original.id}
                    itemName={row.original.itemName?.value}
                    isReviewed={row.original.reviewed}
                    onReview={onReview}
                    onUnreview={onUnreview}
                  />
                }
              />
            ))
        )}
      </div>
    </div>
  );
}
