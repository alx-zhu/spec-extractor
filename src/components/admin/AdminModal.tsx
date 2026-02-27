import { useState, useEffect, useCallback } from "react";
import { Loader2, Sparkles, ShieldCheck, Clipboard, ClipboardPaste, Check, AlertCircle } from "lucide-react";
import type { ResolvedProduct } from "@/types/resolvedProduct";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useQueryClient } from "@tanstack/react-query";
import { useProducts, useUpdateProduct, productKeys } from "@/hooks/useProducts";
import { documentKeys } from "@/hooks/useDocuments";
import { mergedProductKeys } from "@/hooks/useMergedProducts";
import { classifySpecId } from "@/api/openai.client";

const STORAGE_KEYS = [
  "sabana:products",
  "sabana:documents",
  "sabana:merged-products",
] as const;

type ActionState = "idle" | "running" | "success" | "error";

interface AdminModalProps {
  selectedProducts?: ResolvedProduct[];
}

export function AdminModal({ selectedProducts = [] }: AdminModalProps) {
  const [open, setOpen] = useState(false);
  const [regenProgress, setRegenProgress] = useState<{
    completed: number;
    total: number;
  } | null>(null);
  const [copyState, setCopyState] = useState<ActionState>("idle");
  const [pasteState, setPasteState] = useState<ActionState>("idle");

  const { data: products = [] } = useProducts();
  const updateProduct = useUpdateProduct();
  const queryClient = useQueryClient();

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

  const isRunning = regenProgress !== null;
  const selectedEps = selectedProducts.flatMap(
    (rp) => rp.source.extractedProducts,
  );

  // Reset a feedback state back to idle after a delay
  const resetAfter = (setter: (s: ActionState) => void, ms = 2000) => {
    setTimeout(() => setter("idle"), ms);
  };

  const handleRegenerate = useCallback(
    async (targets: typeof products) => {
      setRegenProgress({ completed: 0, total: targets.length });
      try {
        for (const product of targets) {
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
          setRegenProgress((prev) =>
            prev ? { ...prev, completed: prev.completed + 1 } : null,
          );
        }
      } catch (error) {
        console.error("[AdminModal] Spec ID regeneration failed:", error);
      } finally {
        setRegenProgress(null);
      }
    },
    [updateProduct],
  );

  const handleCopy = useCallback(async () => {
    try {
      const snapshot: Record<string, unknown> = {};
      for (const key of STORAGE_KEYS) {
        const raw = localStorage.getItem(key);
        snapshot[key] = raw ? JSON.parse(raw) : null;
      }
      await navigator.clipboard.writeText(JSON.stringify(snapshot, null, 2));
      setCopyState("success");
      resetAfter(setCopyState);
    } catch (error) {
      console.error("[AdminModal] Copy failed:", error);
      setCopyState("error");
      resetAfter(setCopyState);
    }
  }, []);

  const handlePaste = useCallback(async () => {
    setPasteState("running");
    try {
      const raw = await navigator.clipboard.readText();
      const match = raw.match(/\{[\s\S]*\}/);
      if (!match) throw new Error("No JSON object found in clipboard.");
      const snapshot = JSON.parse(match[0]) as Record<string, unknown>;

      // Validate that the pasted data looks like a sabana snapshot
      const hasAnyKey = STORAGE_KEYS.some((k) => k in snapshot);
      if (!hasAnyKey) throw new Error("Clipboard data does not contain any recognised storage keys.");

      for (const key of STORAGE_KEYS) {
        if (snapshot[key] !== undefined && snapshot[key] !== null) {
          localStorage.setItem(key, JSON.stringify(snapshot[key]));
        }
      }

      // Refresh all caches
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: productKeys.all }),
        queryClient.invalidateQueries({ queryKey: documentKeys.all }),
        queryClient.invalidateQueries({ queryKey: mergedProductKeys.all }),
      ]);

      setPasteState("success");
      resetAfter(setPasteState);
    } catch (error) {
      console.error("[AdminModal] Paste failed:", error);
      setPasteState("error");
      resetAfter(setPasteState);
    }
  }, [queryClient]);

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

        <div className="flex flex-col gap-2">
          <div className="rounded-lg border border-gray-100 bg-gray-50 p-4 flex flex-col gap-3">
            <div>
              <p className="text-sm font-medium text-gray-900">Regenerate spec IDs</p>
              <p className="text-xs text-gray-500 mt-0.5">
                Re-classifies products using AI. Overwrites existing values.
              </p>
            </div>
            <div className="flex items-center gap-1.5">
              {selectedEps.length > 0 && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleRegenerate(selectedEps)}
                  disabled={isRunning}
                  className="min-w-[80px]"
                >
                  {isRunning ? (
                    <>
                      <Loader2 className="size-3.5 animate-spin" />
                      {regenProgress.completed}/{regenProgress.total}
                    </>
                  ) : (
                    <>
                      <Sparkles className="size-3.5" />
                      {selectedEps.length} selected
                    </>
                  )}
                </Button>
              )}
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleRegenerate(products)}
                disabled={isRunning || products.length === 0}
                className="min-w-[80px]"
              >
                {isRunning && selectedEps.length === 0 ? (
                  <>
                    <Loader2 className="size-3.5 animate-spin" />
                    {regenProgress.completed}/{regenProgress.total}
                  </>
                ) : (
                  <>
                    <Sparkles className="size-3.5" />
                    All
                  </>
                )}
              </Button>
            </div>
          </div>

          <ActionRow
            label="Copy data"
            description="Copies all stored products, documents, and settings to the clipboard as JSON."
          >
            <Button
              size="sm"
              variant="outline"
              onClick={handleCopy}
              disabled={isRunning}
              className="shrink-0 min-w-[72px]"
            >
              {copyState === "success" ? (
                <><Check className="size-3.5" />Copied</>
              ) : copyState === "error" ? (
                <><AlertCircle className="size-3.5" />Error</>
              ) : (
                <><Clipboard className="size-3.5" />Copy</>
              )}
            </Button>
          </ActionRow>

          <ActionRow
            label="Paste data"
            description="Restores all stored data from a previously copied snapshot. This overwrites current data."
          >
            <Button
              size="sm"
              variant="outline"
              onClick={handlePaste}
              disabled={isRunning || pasteState === "running"}
              className="shrink-0 min-w-[72px]"
            >
              {pasteState === "running" ? (
                <><Loader2 className="size-3.5 animate-spin" />Pasting</>
              ) : pasteState === "success" ? (
                <><Check className="size-3.5" />Pasted</>
              ) : pasteState === "error" ? (
                <><AlertCircle className="size-3.5" />Error</>
              ) : (
                <><ClipboardPaste className="size-3.5" />Paste</>
              )}
            </Button>
          </ActionRow>
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

function ActionRow({
  label,
  description,
  children,
}: {
  label: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-lg border border-gray-100 bg-gray-50 p-4 flex items-center justify-between gap-4">
      <div className="min-w-0">
        <p className="text-sm font-medium text-gray-900">{label}</p>
        <p className="text-xs text-gray-500 mt-0.5">{description}</p>
      </div>
      {children}
    </div>
  );
}
