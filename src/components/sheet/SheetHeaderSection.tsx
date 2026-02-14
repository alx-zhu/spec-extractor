import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DocumentTypeBadge } from "@/components/table/DocumentTypeBadge";
import type { Product } from "@/types/product";

interface SheetHeaderSectionProps {
  product: Product;
  productIndex: number;
  totalProducts: number;
  onPrev: () => void;
  onNext: () => void;
  onClose: () => void;
}

export function SheetHeaderSection({
  product,
  productIndex,
  totalProducts,
  onPrev,
  onNext,
  onClose,
}: SheetHeaderSectionProps) {
  const hasPrev = productIndex > 0;
  const hasNext = productIndex < totalProducts - 1;

  return (
    <div className="flex items-start justify-between px-5 py-4 border-b border-gray-200 bg-white shrink-0">
      {/* Left: Product info */}
      <div className="flex flex-col gap-1 min-w-0 mr-3">
        <h2 className="text-sm font-semibold text-gray-900 truncate">
          {product.itemName?.value || "Untitled Product"}
        </h2>
        <div className="flex items-center gap-2">
          <DocumentTypeBadge type={product.documentType} />
          {product.specIdNumber?.value &&
            product.specIdNumber.value !== "N/A" && (
              <span className="text-xs text-gray-500 font-mono">
                {product.specIdNumber.value}
              </span>
            )}
        </div>
      </div>

      {/* Right: Navigation + Close */}
      <div className="flex items-center gap-2 shrink-0">
        {/* Product navigator */}
        <div className="flex items-center gap-1">
          <Button
            variant="outline"
            size="icon"
            onClick={onPrev}
            disabled={!hasPrev}
            className="h-7 w-7"
          >
            <ChevronLeft className="h-3.5 w-3.5" />
          </Button>
          <span className="text-xs text-gray-500 tabular-nums min-w-[48px] text-center">
            {productIndex + 1} / {totalProducts}
          </span>
          <Button
            variant="outline"
            size="icon"
            onClick={onNext}
            disabled={!hasNext}
            className="h-7 w-7"
          >
            <ChevronRight className="h-3.5 w-3.5" />
          </Button>
        </div>

        {/* Divider */}
        <div className="w-px h-5 bg-gray-200" />

        {/* Close */}
        <Button
          variant="ghost"
          size="icon"
          onClick={onClose}
          className="h-7 w-7"
        >
          <X className="h-3.5 w-3.5" />
        </Button>
      </div>
    </div>
  );
}
