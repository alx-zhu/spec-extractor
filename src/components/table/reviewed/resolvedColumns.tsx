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
    cell: ({ row }) => (
      <ResolvedFieldCell
        value={row.original.fields.tag?.value}
      />
    ),
  },
  // Item name + description + source count
  {
    id: "itemName",
    header: getFieldLabel("itemName"),
    meta: { fieldName: "itemName" as ProductFieldKey },
    cell: ({ row }) => {
      const resolved = row.original;
      const description = resolved.fields.productDescription?.value;
      const hasDescription = description && description !== "N/A";

      return (
        <div className="flex flex-col gap-0.5 min-w-0 w-full">
          <div className="flex items-center gap-2 min-w-0">
            <span className="text-sm font-medium text-gray-900 overflow-hidden text-ellipsis whitespace-nowrap">
              {resolved.fields.itemName?.value || "\u2014"}
            </span>
            <span className="shrink-0 text-xs text-gray-400">
              {resolved.sourceCount} {resolved.sourceCount === 1 ? "source" : "sources"}
            </span>
          </div>
          {hasDescription && (
            <div
              className="text-xs text-gray-500 overflow-hidden text-ellipsis whitespace-nowrap rounded px-0.5 -mx-0.5 transition-colors cursor-pointer hover:bg-black/4"
              data-field="productDescription"
            >
              {description}
            </div>
          )}
        </div>
      );
    },
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
