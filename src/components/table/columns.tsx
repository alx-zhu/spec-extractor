import { type ColumnDef } from "@tanstack/react-table";
import type { Product, ProductFieldKey } from "@/types/product";
import { Checkbox } from "@/components/ui/checkbox";
import { DocumentTypeBadge } from "./DocumentTypeBadge";

export const productColumns: ColumnDef<Product>[] = [
  {
    id: "select",
    header: ({ table }) => (
      <div>
        <Checkbox
          checked={
            table.getIsAllPageRowsSelected() ||
            (table.getIsSomePageRowsSelected() && "indeterminate")
          }
          onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
          aria-label="Select all"
        />
      </div>
    ),
    cell: ({ row }) => (
      <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={(value) => row.toggleSelected(!!value)}
        aria-label="Select row"
      />
    ),
    size: 48,
    enableSorting: false,
    enableHiding: false,
  },
  {
    id: "itemName",
    header: "Product",
    accessorKey: "itemName",
    meta: {
      fieldName: "itemName" as ProductFieldKey,
    },
    cell: ({ row }) => {
      if (!row?.original) return <span className="text-gray-400">—</span>;
      const description = row.original.productDescription?.value;
      const hasDescription = description && description !== "N/A";
      return (
        <div className="flex flex-col gap-0.5 min-w-0 w-full">
          <div className="text-sm text-gray-900 overflow-hidden text-ellipsis whitespace-nowrap rounded px-1 -mx-1 transition-colors hover:bg-gray-100">
            {row.original.itemName?.value || "—"}
          </div>
          {hasDescription && (
            <div
              className="text-xs text-gray-500 overflow-hidden text-ellipsis whitespace-nowrap rounded px-1 -mx-1 transition-colors cursor-pointer hover:bg-blue-50 hover:text-blue-700"
              data-field="productDescription"
            >
              {description}
            </div>
          )}
          <div>
            <DocumentTypeBadge type={row.original.documentType} />
          </div>
        </div>
      );
    },
  },
  {
    id: "manufacturer",
    header: "Manufacturer",
    accessorKey: "manufacturer",
    size: 140,
    meta: {
      fieldName: "manufacturer" as ProductFieldKey,
    },
    cell: ({ row }) => {
      if (!row?.original) return <span className="text-gray-400">—</span>;
      return (
        <div className="text-sm text-gray-900">
          {row.original.manufacturer?.value || "—"}
        </div>
      );
    },
  },
  {
    id: "specIdNumber",
    header: "Masterformat",
    accessorKey: "specIdNumber",
    size: 140,
    meta: {
      fieldName: "specIdNumber" as ProductFieldKey,
    },
    cell: ({ row }) => {
      if (!row?.original) return <span className="text-gray-400">—</span>;
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-mono bg-gray-100 text-gray-700">
          {row.original.specIdNumber?.value || "—"}
        </span>
      );
    },
  },
  {
    id: "tag",
    header: "Tag",
    accessorKey: "tag",
    size: 100,
    meta: {
      fieldName: "tag" as ProductFieldKey,
    },
    cell: ({ row }) => {
      if (!row?.original) return <span className="text-gray-400">—</span>;
      return (
        <div className="text-sm text-gray-600">
          {row.original.tag?.value || "—"}
        </div>
      );
    },
  },
  {
    id: "finish",
    header: "Finish",
    accessorKey: "finish",
    size: 280,
    meta: {
      fieldName: "finish" as ProductFieldKey,
    },
    cell: ({ row }) => {
      if (!row?.original) return <span className="text-gray-400">—</span>;
      return (
        <div className="text-sm text-gray-600">
          {row.original.finish?.value || "—"}
        </div>
      );
    },
  },
  {
    id: "size",
    header: "Size",
    accessorKey: "size",
    size: 280,
    meta: {
      fieldName: "size" as ProductFieldKey,
    },
    cell: ({ row }) => {
      if (!row?.original) return <span className="text-gray-400">—</span>;
      return (
        <div className="text-sm text-gray-600">
          {row.original.size?.value || "—"}
        </div>
      );
    },
  },
  {
    id: "price",
    header: "Price",
    accessorKey: "price",
    size: 140,
    meta: {
      fieldName: "price" as ProductFieldKey,
    },
    cell: ({ row }) => {
      if (!row?.original) return <span className="text-gray-400">—</span>;
      return (
        <div className="text-sm text-gray-600">
          {row.original.price?.value || "—"}
        </div>
      );
    },
  },
  {
    id: "details",
    header: "Details",
    accessorKey: "details",
    size: 220,
    meta: {
      fieldName: "details" as ProductFieldKey,
    },
    cell: ({ row }) => {
      if (!row?.original) return <span className="text-gray-400">—</span>;
      return (
        <div className="text-sm text-gray-600 overflow-hidden text-ellipsis whitespace-nowrap">
          {row.original.details?.value || "—"}
        </div>
      );
    },
  },
];
