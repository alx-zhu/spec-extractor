import { useState, useEffect } from "react";
import { Loader2, Sparkles, ShieldCheck } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useProducts, useUpdateProduct } from "@/hooks/useProducts";
import { classifySpecId } from "@/api/openai.client";

export function AdminModal() {
  const [open, setOpen] = useState(false);
  const [progress, setProgress] = useState<{
    completed: number;
    total: number;
  } | null>(null);

  const { data: products = [] } = useProducts();
  const updateProduct = useUpdateProduct();

  // Cmd+Shift+1 toggles the modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      console.log("Keydown event:", {
        key: e.key,
        metaKey: e.metaKey,
        shiftKey: e.shiftKey,
      });
      if (e.metaKey && e.shiftKey && e.key.toLowerCase() === "1") {
        console.log("Toggling AdminModal");
        e.preventDefault();
        setOpen((prev) => !prev);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const isRunning = progress !== null;

  const handleRegenerateAll = async () => {
    setProgress({ completed: 0, total: products.length });
    try {
      for (const product of products) {
        const specId = await classifySpecId(
          product.itemName?.value ?? "",
          product.productDescription?.value ?? "",
          product.manufacturer?.value ?? "",
        );
        if (specId !== "N/A") {
          await updateProduct.mutateAsync({
            productId: product.id,
            updates: { specIdNumber: { value: specId, citations: [] } },
          });
        }
        setProgress((prev) =>
          prev ? { ...prev, completed: prev.completed + 1 } : null,
        );
      }
    } catch (error) {
      console.error("[AdminModal] Spec ID regeneration failed:", error);
    } finally {
      setProgress(null);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !isRunning && setOpen(o)}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base">
            <ShieldCheck className="size-4 text-gray-400" />
            Admin tools
          </DialogTitle>
          <DialogDescription>
            Internal tools for data management.
          </DialogDescription>
        </DialogHeader>

        <div className="rounded-lg border border-gray-100 bg-gray-50 p-4 flex items-center justify-between gap-4">
          <div className="min-w-0">
            <p className="text-sm font-medium text-gray-900">
              Regenerate all spec IDs
            </p>
            <p className="text-xs text-gray-500 mt-0.5">
              Re-classifies every product using AI. Overwrites existing values.
            </p>
          </div>
          <Button
            size="sm"
            variant="outline"
            onClick={handleRegenerateAll}
            disabled={isRunning || products.length === 0}
            className="shrink-0 min-w-[72px]"
          >
            {isRunning ? (
              <>
                <Loader2 className="size-3.5 animate-spin" />
                {progress.completed}/{progress.total}
              </>
            ) : (
              <>
                <Sparkles className="size-3.5" />
                Run
              </>
            )}
          </Button>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setOpen(false)}
            disabled={isRunning}
          >
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
