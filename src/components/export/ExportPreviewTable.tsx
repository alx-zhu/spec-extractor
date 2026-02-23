import { useMemo } from "react";
import {
  useReactTable,
  getCoreRowModel,
  type ColumnDef,
  type RowSelectionState,
} from "@tanstack/react-table";
import { Checkbox } from "@/components/ui/checkbox";
import { TableHeader } from "@/components/table/shared/TableHeader";
import { TableRow } from "@/components/table/shared/TableRow";
import { columnLayout } from "@/styles/tableLayout";
import type { ProductFieldKey } from "@/types/product";
import type { ResolvedProduct } from "@/types/resolvedProduct";
import type { ExportColumn } from "@/utils/export";

interface ExportPreviewTableProps {
  products: ResolvedProduct[];
  columns: ExportColumn[];
  rowSelection: RowSelectionState;
  onRowSelectionChange: (updated: RowSelectionState) => void;
}

function buildColumns(
  enabledColumns: ExportColumn[],
): ColumnDef<ResolvedProduct>[] {
  const selectColumn: ColumnDef<ResolvedProduct> = {
    id: "select",
    header: ({ table }) => (
      <Checkbox
        checked={
          table.getIsAllPageRowsSelected() ||
          (table.getIsSomePageRowsSelected() && "indeterminate")
        }
        onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
        aria-label="Select all"
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={(value) => row.toggleSelected(!!value)}
        aria-label="Select row"
      />
    ),
    size: columnLayout.checkbox.width,
    enableSorting: false,
    enableHiding: false,
  };

  const dataColumns: ColumnDef<ResolvedProduct>[] = enabledColumns
    .filter((col) => col.enabled)
    .map((col) => ({
      id: col.key,
      header: col.label,
      size:
        columnLayout[col.key as keyof typeof columnLayout]?.width ?? 160,
      meta: { fieldName: col.key as ProductFieldKey },
      cell: ({ row }: { row: { original: ResolvedProduct } }) => {
        const value = row.original.fields[col.key]?.value;
        return (
          <span className="text-sm text-gray-700 truncate block">
            {value || "\u2014"}
          </span>
        );
      },
    }));

  return [selectColumn, ...dataColumns];
}

export function ExportPreviewTable({
  products,
  columns,
  rowSelection,
  onRowSelectionChange,
}: ExportPreviewTableProps) {
  const tableColumns = useMemo(() => buildColumns(columns), [columns]);

  const table = useReactTable({
    data: products,
    columns: tableColumns,
    getCoreRowModel: getCoreRowModel(),
    enableRowSelection: true,
    onRowSelectionChange: (updater) => {
      const next =
        typeof updater === "function" ? updater(rowSelection) : updater;
      onRowSelectionChange(next);
    },
    getRowId: (row) => row.id,
    state: { rowSelection },
  });

  return (
    <div className="h-full overflow-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent hover:scrollbar-thumb-gray-400">
      <div className="min-w-min">
        <TableHeader headerGroups={table.getHeaderGroups()} />

        {table.getRowModel().rows.length === 0 ? (
          <div className="p-8 text-center text-gray-400 text-sm">
            No products to export.
          </div>
        ) : (
          table.getRowModel().rows.map((row) => (
            <TableRow
              key={row.id}
              row={row}
              density="compact"
            />
          ))
        )}
      </div>
    </div>
  );
}
