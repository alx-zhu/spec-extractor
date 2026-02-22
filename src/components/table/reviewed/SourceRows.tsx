import { useState, useMemo } from "react";
import {
  useReactTable,
  getCoreRowModel,
  type ColumnDef,
} from "@tanstack/react-table";
import type { ExtractedProduct, ProductFieldKey } from "@/types/product";
import type { ResolvedProduct } from "@/types/resolvedProduct";
import { inboxColumns } from "@/components/table/shared/extractedProductColumns";
import { TableRow } from "@/components/table/shared/TableRow";
import { columnLayout } from "@/styles/tableLayout";
import { RadioIndicator } from "./RadioIndicator";
import { FileText, EllipsisVertical, Trash2, Eye, MousePointer } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useDeleteProduct } from "@/hooks/useProducts";
import { cn } from "@/lib/utils";

interface SourceRowsProps {
  resolved: ResolvedProduct;
  onOverrideField?: (
    mergedProductId: string,
    fieldKey: ProductFieldKey,
    selectedProductId: string,
  ) => void;
  /** Opens the PDF viewer for a given EP */
  onViewSource?: (
    extractedProduct: ExtractedProduct,
    resolvedProductId?: string,
  ) => void;
  selectedProductId?: string | null;
  /** Map of document ID → document filename for tooltips */
  documentMap?: Map<string, string>;
}

/** Action cell content — View PDF button + more actions dropdown */
function SourceActionCell({
  ep,
  resolvedId,
  docName,
  onViewSource,
}: {
  ep: ExtractedProduct;
  resolvedId: string;
  docName?: string;
  onViewSource?: (ep: ExtractedProduct, resolvedProductId?: string) => void;
}) {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const deleteProduct = useDeleteProduct();

  return (
    <div className="flex items-center gap-0.5">
      <DropdownMenu open={dropdownOpen} onOpenChange={setDropdownOpen}>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon-sm"
            className="size-6 text-gray-400 hover:text-gray-600 hover:bg-gray-100"
            onClick={(e) => e.stopPropagation()}
            title="More actions"
          >
            <EllipsisVertical className="size-3.5" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" onClick={(e) => e.stopPropagation()}>
          <DropdownMenuItem>
            <MousePointer className="size-4" />
            Select
          </DropdownMenuItem>
          <DropdownMenuItem>
            <Eye className="size-4" />
            View
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            variant="destructive"
            onSelect={() => setDeleteDialogOpen(true)}
          >
            <Trash2 className="size-4" />
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <button
        type="button"
        className="flex items-center justify-center size-6 rounded-md text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
        title={docName ? `View PDF — ${docName}` : "View PDF"}
        onClick={(e) => {
          e.stopPropagation();
          onViewSource?.(ep, resolvedId);
        }}
      >
        <FileText className="size-3.5" />
      </button>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent onClick={(e) => e.stopPropagation()}>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete product</AlertDialogTitle>
            <AlertDialogDescription>
              {ep.itemName?.value
                ? `Are you sure you want to delete "${ep.itemName.value}"? This action cannot be undone.`
                : "Are you sure you want to delete this product? This action cannot be undone."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              onClick={() => deleteProduct.mutate(ep.id)}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

export function SourceRows({
  resolved,
  onOverrideField,
  onViewSource,
  selectedProductId,
  documentMap,
}: SourceRowsProps) {
  const { mergedProduct, extractedProducts } = resolved.source;
  const hasMultipleSources = resolved.sourceCount > 1;

  // Build source columns: action column (expand+checkbox width), then data cols (minus checkbox).
  const sourceColumns = useMemo<ColumnDef<ExtractedProduct>[]>(() => {
    const baseCols = inboxColumns.filter((c) => c.id !== "select");

    /** Action column — spans the expand + checkbox space. View PDF + more actions. */
    const actionColumn: ColumnDef<ExtractedProduct> = {
      id: "sourceAction",
      header: "",
      size: columnLayout.sourceAction.width,
      enableSorting: false,
      enableHiding: false,
      cell: ({ row }) => {
        const ep = row.original;
        const docName = documentMap?.get(ep.productDocumentId);

        return (
          <SourceActionCell
            ep={ep}
            resolvedId={resolved.id}
            docName={docName}
            onViewSource={onViewSource}
          />
        );
      },
    };

    return [actionColumn, ...baseCols];
  }, [documentMap, onViewSource, resolved.id]);

  /** Handle cell click on a source row — triggers field override */
  const handleCellClick = (ep: ExtractedProduct, fieldKey?: string) => {
    if (!fieldKey || !hasMultipleSources) return;

    const key = fieldKey as ProductFieldKey;
    const currentSelection = mergedProduct.fieldSelections[key];

    // Only override if this EP isn't already the selected source for this field
    if (currentSelection?.selectedProductId !== ep.id) {
      onOverrideField?.(mergedProduct.id, key, ep.id);
    }
  };

  /** Build per-cell radio prefix: inline radio indicator before cell content */
  const renderCellPrefix = (ep: ExtractedProduct, fieldKey: string) => {
    // Only show radio indicators for products with multiple sources
    if (!hasMultipleSources) return null;

    const key = fieldKey as ProductFieldKey;
    const isFieldSource =
      mergedProduct.fieldSelections[key]?.selectedProductId === ep.id;

    return <RadioIndicator selected={isFieldSource} />;
  };

  const table = useReactTable({
    data: extractedProducts,
    columns: sourceColumns,
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <div className="border-b border-gray-200">
      {table.getRowModel().rows.map((row) => {
        const ep = row.original;
        const isSelected = selectedProductId === ep.id;

        return (
          <TableRow
            key={row.id}
            row={row}
            density="compact"
            onClick={
              hasMultipleSources
                ? (fieldKey) => handleCellClick(ep, fieldKey)
                : undefined
            }
            isSelected={isSelected}
            className={cn(
              "bg-gray-50/80 border-b-gray-100",
              hasMultipleSources && "cursor-pointer",
            )}
            cellPrefix={(fieldKey) => renderCellPrefix(ep, fieldKey)}
          />
        );
      })}
    </div>
  );
}
