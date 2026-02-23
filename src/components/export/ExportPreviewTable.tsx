import { useMemo, useEffect, useRef, useState } from "react";
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
  onSelectionChange: (selectedIds: Set<string>) => void;
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

/** Build an all-selected RowSelectionState from a product list */
function selectAll(products: ResolvedProduct[]): RowSelectionState {
  const state: RowSelectionState = {};
  for (const p of products) state[p.id] = true;
  return state;
}

export function ExportPreviewTable({
  products,
  columns,
  onSelectionChange,
}: ExportPreviewTableProps) {
  // All rows selected by default
  const [rowSelection, setRowSelection] = useState<RowSelectionState>(() =>
    selectAll(products),
  );

  // When the product list changes (e.g. sidebar filter), re-select all
  const prevProductIdsRef = useRef(products.map((p) => p.id).join(","));
  useEffect(() => {
    const key = products.map((p) => p.id).join(",");
    if (key !== prevProductIdsRef.current) {
      prevProductIdsRef.current = key;
      setRowSelection(selectAll(products));
    }
  }, [products]);

  // Report selection to parent via ref so the callback identity doesn't matter
  const onSelectionChangeRef = useRef(onSelectionChange);
  onSelectionChangeRef.current = onSelectionChange;

  useEffect(() => {
    const ids = new Set(
      Object.keys(rowSelection).filter((id) => rowSelection[id]),
    );
    onSelectionChangeRef.current(ids);
  }, [rowSelection]);

  const tableColumns = useMemo(() => buildColumns(columns), [columns]);

  const table = useReactTable({
    data: products,
    columns: tableColumns,
    getCoreRowModel: getCoreRowModel(),
    enableRowSelection: true,
    onRowSelectionChange: setRowSelection,
    getRowId: (row) => row.id,
    state: {
      rowSelection,
    },
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
