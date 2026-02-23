import { type ColumnDef } from "@tanstack/react-table";
import type { ExtractedProduct, ProductFieldKey } from "@/types/product";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Sparkles } from "lucide-react";
import { DocumentTypeBadge } from "@/components/table/shared/DocumentTypeBadge";
import { isSpecIdGenerated, isManualProduct } from "@/utils/productHelpers";
import { columnLayout } from "@/styles/tableLayout";
import { getFieldLabel } from "@/config/fields";

export const inboxColumns: ColumnDef<ExtractedProduct>[] = [
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
    size: columnLayout.checkbox.width,
    enableSorting: false,
    enableHiding: false,
  },
  {
    id: "tag",
    header: getFieldLabel("tag"),
    accessorKey: "tag",
    size: columnLayout.tag.width,
    meta: {
      fieldName: "tag" as ProductFieldKey,
    },
    cell: ({ row }) => {
      if (!row?.original) return <span className="text-gray-400">—</span>;
      return (
        <div className="flex items-center gap-1.5 min-w-0 w-full">
          <Badge
            variant="secondary"
            className="rounded font-mono text-xs font-medium text-gray-700 bg-gray-200 shrink-0"
          >
            {row.original.tag?.value || "—"}
          </Badge>
          {isManualProduct(row.original) ? (
            <Badge className="px-1.5 py-0 text-[10px] font-semibold tracking-wide rounded bg-teal-50 text-teal-700 border-teal-200 shrink-0">
              MAN
            </Badge>
          ) : (
            <DocumentTypeBadge
              type={row.original.documentType}
              className="shrink-0"
            />
          )}
        </div>
      );
    },
  },
  {
    id: "itemName",
    header: getFieldLabel("itemName"),
    accessorKey: "itemName",
    size: columnLayout.itemName.width,
    meta: {
      fieldName: "itemName" as ProductFieldKey,
    },
    cell: ({ row }) => {
      if (!row?.original) return <span className="text-gray-400">—</span>;
      return (
        <div className="text-sm text-gray-600">
          {row.original.itemName?.value || "—"}
        </div>
      );
    },
  },
  {
    id: "productDescription",
    header: getFieldLabel("productDescription"),
    accessorKey: "productDescription",
    size: columnLayout.productDescription.width,
    meta: {
      fieldName: "productDescription" as ProductFieldKey,
    },
    cell: ({ row }) => {
      if (!row?.original) return <span className="text-gray-400">—</span>;
      return (
        <div className="text-sm text-gray-600">
          {row.original.productDescription?.value || "—"}
        </div>
      );
    },
  },
  {
    id: "manufacturer",
    header: getFieldLabel("manufacturer"),
    accessorKey: "manufacturer",
    size: columnLayout.manufacturer.width,
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
    header: getFieldLabel("specIdNumber"),
    accessorKey: "specIdNumber",
    size: columnLayout.specIdNumber.width,
    meta: {
      fieldName: "specIdNumber" as ProductFieldKey,
    },
    cell: ({ row }) => {
      if (!row?.original) return <span className="text-gray-400">—</span>;
      const isGenerated = isSpecIdGenerated(row.original);
      return (
        <div className="inline-flex items-center gap-2">
          <Badge
            variant="secondary"
            className="rounded font-mono text-xs font-medium text-gray-700 bg-gray-200"
          >
            {row.original.specIdNumber?.value || "—"}
          </Badge>
          {isGenerated && (
            <Sparkles className="size-3 text-amber-400 shrink-0" />
          )}
        </div>
      );
    },
  },
  {
    id: "finish",
    header: getFieldLabel("finish"),
    accessorKey: "finish",
    size: columnLayout.finish.width,
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
    header: getFieldLabel("size"),
    accessorKey: "size",
    size: columnLayout.size.width,
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
    header: getFieldLabel("price"),
    accessorKey: "price",
    size: columnLayout.price.width,
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
    header: getFieldLabel("details"),
    accessorKey: "details",
    size: columnLayout.details.width,
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
