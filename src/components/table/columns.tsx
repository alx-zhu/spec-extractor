import { type ColumnDef } from "@tanstack/react-table";
import type { Product } from "@/types/product";
import { Checkbox } from "@/components/ui/checkbox";

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
    header: "Item Name",
    accessorKey: "itemName",
    cell: ({ row }) => (
      <div className="flex flex-col gap-0.5 min-w-0 w-full">
        <div className="text-sm font-medium text-gray-900 overflow-hidden text-ellipsis whitespace-nowrap">
          {row.original.itemName}
        </div>
        <div className="text-xs text-gray-400 overflow-hidden text-ellipsis whitespace-nowrap">
          {row.original.manufacturer} {row.original.specIdNumber}
        </div>
      </div>
    ),
  },
  {
    id: "manufacturer",
    header: "Manufacturer",
    accessorKey: "manufacturer",
    size: 140,
    cell: ({ row }) => (
      <div className="text-sm text-gray-900">{row.original.manufacturer}</div>
    ),
  },
  {
    id: "specId",
    header: "Spec ID",
    accessorKey: "specIdNumber",
    size: 140,
    cell: ({ row }) => (
      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium font-mono bg-gray-100 text-gray-700">
        {row.original.specIdNumber}
      </span>
    ),
  },
  {
    id: "color",
    header: "Color",
    accessorKey: "color",
    size: 140,
    cell: ({ row }) => (
      <div className="text-sm text-gray-600">{row.original.color}</div>
    ),
  },
  {
    id: "size",
    header: "Size",
    accessorKey: "size",
    size: 140,
    cell: ({ row }) => (
      <div className="text-sm text-gray-600">{row.original.size}</div>
    ),
  },
  {
    id: "price",
    header: "Price",
    accessorKey: "price",
    size: 140,
    cell: ({ row }) => (
      <div className="text-sm text-gray-600">{row.original.price}</div>
    ),
  },
  {
    id: "project",
    header: "Project",
    accessorKey: "project",
    size: 140,
    cell: ({ row }) => (
      <div className="text-sm text-gray-600">{row.original.project}</div>
    ),
  },
];
