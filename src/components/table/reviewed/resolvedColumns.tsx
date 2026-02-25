import { type ColumnDef } from "@tanstack/react-table";
import type { ProductFieldKey } from "@/types/product";
import type { ResolvedProduct } from "@/types/resolvedProduct";
import { Badge } from "@/components/ui/badge";
import { columnLayout } from "@/styles/tableLayout";
import { getFieldLabel } from "@/config/fields";
import { ResolvedFieldCell } from "./ResolvedFieldCell";
import { Checkbox } from "@/components/ui/checkbox";
import { ChevronRight, ChevronDown } from "lucide-react";

export const resolvedColumns: ColumnDef<ResolvedProduct>[] = [
  // Expand/collapse chevron column — first column, before checkbox
  {
    id: "expand",
    header: "",
    size: columnLayout.expand.width,
    enableSorting: false,
    enableHiding: false,
    cell: ({ row, table }) => {
      const resolved = row.original;
      const expandedIds = (table.options.meta as { expandedIds?: Set<string> })
        ?.expandedIds;
      const isExpanded = expandedIds?.has(resolved.id) ?? false;

      return (
        <div className="text-gray-400">
          {isExpanded ? (
            <ChevronDown className="size-3.5" />
          ) : (
            <ChevronRight className="size-3.5" />
          )}
        </div>
      );
    },
  },
  // Selection checkbox column
  {
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
  },
  {
    id: "tag",
    header: getFieldLabel("tag"),
    size: columnLayout.tag.width,
    meta: { fieldName: "tag" as ProductFieldKey },
    cell: ({ row }) => {
      const resolved = row.original;
      return (
        <div className="flex flex-col gap-1 min-w-0 w-full">
          <Badge
            variant="secondary"
            className="rounded font-mono text-xs font-medium text-gray-700 bg-gray-200 w-fit"
          >
            {resolved.fields.tag?.value || "\u2014"}
          </Badge>
          <span className="text-xs text-gray-400">
            {resolved.sourceCount} {resolved.sourceCount === 1 ? "source" : "sources"}
          </span>
        </div>
      );
    },
  },
  {
    id: "itemName",
    header: getFieldLabel("itemName"),
    size: columnLayout.itemName.width,
    meta: { fieldName: "itemName" as ProductFieldKey },
    cell: ({ row }) => (
      <ResolvedFieldCell
        value={row.original.fields.itemName?.value}
      />
    ),
  },
  // Product description — standalone data column
  {
    id: "productDescription",
    header: getFieldLabel("productDescription"),
    size: columnLayout.productDescription.width,
    meta: { fieldName: "productDescription" as ProductFieldKey },
    cell: ({ row }) => (
      <ResolvedFieldCell
        value={row.original.fields.productDescription?.value}
      />
    ),
  },
  {
    id: "modelNumber",
    header: getFieldLabel("modelNumber"),
    size: columnLayout.modelNumber.width,
    meta: { fieldName: "modelNumber" as ProductFieldKey },
    cell: ({ row }) => (
      <ResolvedFieldCell
        value={row.original.fields.modelNumber?.value}
        className="font-mono"
      />
    ),
  },
  {
    id: "manufacturer",
    header: getFieldLabel("manufacturer"),
    size: columnLayout.manufacturer.width,
    meta: { fieldName: "manufacturer" as ProductFieldKey },
    cell: ({ row }) => (
      <ResolvedFieldCell
        value={row.original.fields.manufacturer?.value}
      />
    ),
  },
  {
    id: "specIdNumber",
    header: getFieldLabel("specIdNumber"),
    size: columnLayout.specIdNumber.width,
    meta: { fieldName: "specIdNumber" as ProductFieldKey },
    cell: ({ row }) => {
      const value = row.original.fields.specIdNumber?.value;
      return (
        <div className="inline-flex items-center gap-2">
          <Badge
            variant="secondary"
            className="rounded font-mono text-xs font-medium text-gray-700 bg-gray-200"
          >
            {value || "\u2014"}
          </Badge>
        </div>
      );
    },
  },
  {
    id: "finish",
    header: getFieldLabel("finish"),
    size: columnLayout.finish.width,
    meta: { fieldName: "finish" as ProductFieldKey },
    cell: ({ row }) => (
      <ResolvedFieldCell
        value={row.original.fields.finish?.value}
      />
    ),
  },
  {
    id: "size",
    header: getFieldLabel("size"),
    size: columnLayout.size.width,
    meta: { fieldName: "size" as ProductFieldKey },
    cell: ({ row }) => (
      <ResolvedFieldCell
        value={row.original.fields.size?.value}
      />
    ),
  },
  {
    id: "price",
    header: getFieldLabel("price"),
    size: columnLayout.price.width,
    meta: { fieldName: "price" as ProductFieldKey },
    cell: ({ row }) => (
      <ResolvedFieldCell
        value={row.original.fields.price?.value}
      />
    ),
  },
  {
    id: "details",
    header: getFieldLabel("details"),
    size: columnLayout.details.width,
    meta: { fieldName: "details" as ProductFieldKey },
    cell: ({ row }) => (
      <ResolvedFieldCell
        value={row.original.fields.details?.value}
      />
    ),
  },
];
