import { useState } from "react";
import { Download, Merge, Trash2, X } from "lucide-react";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import type { ResolvedProduct } from "@/types/resolvedProduct";
import { useDeleteProducts } from "@/hooks/useProducts";

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

      {/* Merge placeholder */}
      <Dialog open={mergeDialogOpen} onOpenChange={setMergeDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Merge {count} products</DialogTitle>
            <DialogDescription>
              Product merging is not yet available. This feature will allow you
              to combine duplicate products into a single entry.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setMergeDialogOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
