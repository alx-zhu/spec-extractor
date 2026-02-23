import { useState } from "react";
import { Download, Loader2, Merge, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
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
import { cn } from "@/lib/utils";
import type { ResolvedProduct } from "@/types/resolvedProduct";
import { useDeleteProducts } from "@/hooks/useProducts";
import { useMergeTwoProducts } from "@/hooks/useMergedProducts";

interface BulkActionBarProps {
  selectedProducts: ResolvedProduct[];
  onClearSelection: () => void;
  onExport: (products: ResolvedProduct[]) => void;
}

/** Extract all underlying ExtractedProduct IDs from a set of ResolvedProducts */
function getExtractedProductIds(products: ResolvedProduct[]): string[] {
  return products.flatMap((rp) =>
    rp.source.extractedProducts.map((ep) => ep.id),
  );
}

export function BulkActionBar({
  selectedProducts,
  onClearSelection,
  onExport,
}: BulkActionBarProps) {
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [mergeDialogOpen, setMergeDialogOpen] = useState(false);
  const deleteProducts = useDeleteProducts();
  const mergeTwoProducts = useMergeTwoProducts();

  const count = selectedProducts.length;
  const isVisible = count > 0;

  const handleDelete = () => {
    const ids = getExtractedProductIds(selectedProducts);
    deleteProducts.mutate(ids, {
      onSuccess: () => {
        onClearSelection();
        setDeleteDialogOpen(false);
      },
    });
  };

  /**
   * Merge N products by chaining pairwise merges.
   * First selected product is the target; each subsequent product is merged into it.
   * useMergeTwoProducts re-fetches from storage each call, so chaining is safe.
   *
   * We call e.preventDefault() to stop Radix's AlertDialogAction from
   * auto-closing the dialog before the async work completes.
   */
  const handleMerge = async (e: React.MouseEvent) => {
    e.preventDefault();
    if (count < 2) return;

    const mergedProductIds = selectedProducts.map(
      (rp) => rp.source.mergedProduct.id,
    );
    const targetId = mergedProductIds[0];

    // Sequentially merge each source into the target
    for (let i = 1; i < mergedProductIds.length; i++) {
      await mergeTwoProducts.mutateAsync({
        targetId,
        sourceId: mergedProductIds[i],
      });
    }

    onClearSelection();
    setMergeDialogOpen(false);
  };

  // Readable product names for the merge confirmation dialog
  const productNames = selectedProducts.map(
    (rp) =>
      rp.fields.itemName?.value ||
      rp.fields.tag?.value ||
      "Unnamed product",
  );

  return (
    <>
      {/* Floating bar — anchored to bottom of parent */}
      <div
        className={cn(
          "absolute bottom-4 left-1/2 -translate-x-1/2 z-30",
          "transition-all duration-200 ease-out",
          isVisible
            ? "translate-y-0 opacity-100"
            : "translate-y-4 opacity-0 pointer-events-none",
        )}
      >
        <div className="flex items-center gap-3 bg-gray-900 text-white rounded-xl px-4 py-2.5 shadow-lg">
          {/* Selection count */}
          <span className="text-sm font-medium whitespace-nowrap">
            {count} selected
          </span>

          {/* Divider */}
          <div className="w-px h-5 bg-white/20" />

          {/* Actions */}
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              className="text-white hover:bg-white/10 hover:text-white gap-1.5 h-8"
              onClick={() => onExport(selectedProducts)}
            >
              <Download className="size-3.5" />
              Export
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="text-white hover:bg-white/10 hover:text-white gap-1.5 h-8"
              onClick={() => setMergeDialogOpen(true)}
              disabled={count < 2}
            >
              <Merge className="size-3.5" />
              Merge
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="text-red-300 hover:bg-red-500/20 hover:text-red-200 gap-1.5 h-8"
              onClick={() => setDeleteDialogOpen(true)}
            >
              <Trash2 className="size-3.5" />
              Delete
            </Button>
          </div>

          {/* Divider */}
          <div className="w-px h-5 bg-white/20" />

          {/* Dismiss */}
          <button
            onClick={onClearSelection}
            className="p-1 rounded-md hover:bg-white/10 transition-colors"
            aria-label="Clear selection"
          >
            <X className="size-4 text-white/60" />
          </button>
        </div>
      </div>

      {/* Delete confirmation */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Delete {count} {count === 1 ? "product" : "products"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {count === 1
                ? "Are you sure you want to delete this product? This action cannot be undone."
                : `Are you sure you want to delete these ${count} products? This action cannot be undone.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction variant="destructive" onClick={handleDelete}>
              Delete {count === 1 ? "product" : `${count} products`}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Merge confirmation */}
      <AlertDialog
        open={mergeDialogOpen}
        onOpenChange={(open) => {
          // Don't allow closing while merge is in progress
          if (!mergeTwoProducts.isPending) setMergeDialogOpen(open);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Merge {count} products into one
            </AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-3">
                <p>
                  The following products will be combined into a single entry.
                  All source data will be preserved and you can switch between
                  sources for each field afterwards.
                </p>
                <ul className="list-disc pl-5 space-y-1 text-sm text-gray-600">
                  {productNames.map((name, i) => (
                    <li key={selectedProducts[i].id} className="truncate">
                      {name}
                    </li>
                  ))}
                </ul>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={mergeTwoProducts.isPending}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleMerge}
              disabled={mergeTwoProducts.isPending}
            >
              {mergeTwoProducts.isPending ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  Merging…
                </>
              ) : (
                <>
                  <Merge className="size-4" />
                  Merge {count} products
                </>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
