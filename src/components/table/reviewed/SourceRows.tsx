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
import {
  FileText,
  EllipsisVertical,
  Trash2,
  Eye,
  MousePointer,
  Pencil,
  Plus,
  FileX,
} from "lucide-react";
import { isManualProduct } from "@/utils/productHelpers";
import { ManualSourceRow } from "./ManualSourceRow";
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
import { useUpdateProduct } from "@/hooks/useProducts";
import { useDeleteSourceFromMergedProduct } from "@/hooks/useMergedProducts";
import { PRODUCT_FIELDS } from "@/config/fields";
import type { ReductoFieldValue } from "@/types/reducto";
import { cn } from "@/lib/utils";
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from "@/components/ui/tooltip";

interface SourceRowsProps {
  resolved: ResolvedProduct;
  onOverrideField?: (
    mergedProductId: string,
    fieldKey: ProductFieldKey,
    selectedProductId: string,
  ) => void;
  /** Opens the PDF viewer for a given EP, optionally focused on a specific field */
  onViewSource?: (
    extractedProduct: ExtractedProduct,
    resolvedProductId?: string,
    fieldKey?: ProductFieldKey,
  ) => void;
  selectedProductId?: string | null;
  /** Map of document ID → document filename for tooltips */
  documentMap?: Map<string, string>;
  /** Called to add a manual source EP to this merged product */
  onAddManualSource?: (
    mergedProductId: string,
    fields: Partial<Record<ProductFieldKey, string>>,
  ) => void;
}

/** Action cell content — View PDF button + more actions dropdown */
function SourceActionCell({
  ep,
  resolvedId,
  mergedProductId,
  docName,
  onViewSource,
}: {
  ep: ExtractedProduct;
  resolvedId: string;
  mergedProductId: string;
  docName?: string;
  onViewSource?: (
    ep: ExtractedProduct,
    resolvedProductId?: string,
    fieldKey?: ProductFieldKey,
  ) => void;
}) {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const deleteSource = useDeleteSourceFromMergedProduct();
  const isManualEntry = isManualProduct(ep);
  const tooltipContent = isManualEntry
    ? "No source (manual entry)"
    : docName
      ? `View source: ${docName}`
      : "View source";

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

      <Tooltip>
        <TooltipTrigger asChild>
          <button
            type="button"
            className={cn(
              "flex items-center justify-center size-6 rounded-md cursor-pointer text-gray-400",
              isManualEntry && "opacity-50 cursor-not-allowed",
              !isManualEntry &&
                "hover:text-blue-600 hover:bg-blue-50 transition-all",
            )}
            onClick={(e) => {
              e.stopPropagation();
              onViewSource?.(ep, resolvedId);
            }}
            disabled={isManualEntry}
          >
            {isManualEntry ? (
              <FileX className="size-3.5 text-gray-300" />
            ) : (
              <FileText className="size-3.5" />
            )}
          </button>
        </TooltipTrigger>
        <TooltipContent side="bottom">{tooltipContent}</TooltipContent>
      </Tooltip>

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
              onClick={() => deleteSource.mutate({ mergedProductId, extractedProductId: ep.id })}
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
  onAddManualSource,
}: SourceRowsProps) {
  const { mergedProduct, extractedProducts } = resolved.source;
  const hasMultipleSources = resolved.sourceCount > 1;
  const [isAdding, setIsAdding] = useState(false);
  const [editingEpId, setEditingEpId] = useState<string | null>(null);
  const updateProduct = useUpdateProduct();

  /** Extract string values from an EP's fields for the edit form */
  const getEpFieldValues = (
    ep: ExtractedProduct,
  ): Partial<Record<ProductFieldKey, string>> => {
    const values: Partial<Record<ProductFieldKey, string>> = {};
    for (const field of PRODUCT_FIELDS) {
      const v = ep[field.key]?.value;
      if (v) values[field.key] = v;
    }
    return values;
  };

  /** Save edits to an existing manual source EP */
  const handleEditSave = (
    epId: string,
    fields: Partial<Record<ProductFieldKey, string>>,
  ) => {
    const updates: Partial<ExtractedProduct> = {};
    for (const field of PRODUCT_FIELDS) {
      const value = fields[field.key]?.trim() ?? "";
      const fieldValue: ReductoFieldValue<string> = { value, citations: [] };
      (updates as Record<string, unknown>)[field.key] = fieldValue;
    }
    updateProduct.mutate({ productId: epId, updates });
    setEditingEpId(null);
  };

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
            mergedProductId={resolved.source.mergedProduct.id}
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

  /** Build per-cell overlay: edit button that appears on hover of the individual cell */
  const renderCellOverlay = (ep: ExtractedProduct, fieldKey: string) => {
    if (isManualProduct(ep)) {
      // For manual products, pencil enters inline edit mode
      return (
        <button
          type="button"
          className="absolute right-2 top-1/2 -translate-y-1/2 z-10 flex items-center justify-center size-6 rounded-md cursor-pointer text-gray-400 opacity-0 group-hover/cell:opacity-100 hover:text-blue-600 hover:bg-blue-50 transition-all"
          onClick={(e) => {
            e.stopPropagation();
            setEditingEpId(ep.id);
          }}
        >
          <Pencil className="size-3.5" />
        </button>
      );
    }

    return (
      <button
        type="button"
        className="absolute right-2 top-1/2 -translate-y-1/2 z-10 flex items-center justify-center size-6 rounded-md cursor-pointer text-gray-400 opacity-0 group-hover/cell:opacity-100 hover:text-blue-600 hover:bg-blue-50 transition-all"
        onClick={(e) => {
          e.stopPropagation();
          onViewSource?.(ep, resolved.id, fieldKey as ProductFieldKey);
        }}
      >
        <Pencil className="size-3.5" />
      </button>
    );
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

        // Render inline edit form for manual products in edit mode
        if (editingEpId === ep.id && isManualProduct(ep)) {
          return (
            <ManualSourceRow
              key={row.id}
              initialValues={getEpFieldValues(ep)}
              onSave={(fields) => handleEditSave(ep.id, fields)}
              onCancel={() => setEditingEpId(null)}
            />
          );
        }

        return (
          <TableRow
            key={row.id}
            row={row}
            density="compact"
            onClick={
              isManualProduct(ep)
                ? () => setEditingEpId(ep.id)
                : hasMultipleSources
                  ? (fieldKey) => handleCellClick(ep, fieldKey)
                  : undefined
            }
            isSelected={isSelected}
            className={cn(
              "bg-gray-50/80 border-b-gray-100",
              (hasMultipleSources || isManualProduct(ep)) && "cursor-pointer",
            )}
            cellOverlay={(fieldKey) => renderCellOverlay(ep, fieldKey)}
            cellPrefix={(fieldKey) => renderCellPrefix(ep, fieldKey)}
          />
        );
      })}

      {/* Manual source: inline draft row or add button */}
      {isAdding ? (
        <ManualSourceRow
          onSave={(fields) => {
            onAddManualSource?.(mergedProduct.id, fields);
            setIsAdding(false);
          }}
          onCancel={() => setIsAdding(false)}
        />
      ) : (
        onAddManualSource && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setIsAdding(true);
            }}
            className="w-full flex items-center gap-2 px-4 py-2 text-xs text-gray-400 hover:text-gray-600 hover:bg-gray-50 transition-colors border-t border-dashed border-gray-200 cursor-pointer"
          >
            <Plus className="size-3.5" />
            Add source
          </button>
        )
      )}
    </div>
  );
}
