import { Sheet, SheetContent } from "@/components/ui/sheet";
import { SheetHeaderSection } from "./SheetHeaderSection";
import { SummaryStrip } from "./SummaryStrip";
import { FieldEditor } from "./FieldEditor";
import { SheetPdfViewer } from "./SheetPdfViewer";
import { useUpdateProduct } from "@/hooks/useProducts";
import { useSheetResize } from "@/hooks/useSheetResize";
import type { ExtractedProduct, ProductFieldKey } from "@/types/product";
import { GripVertical } from "lucide-react";
import { VisuallyHidden } from "radix-ui";
import { SheetTitle } from "@/components/ui/sheet";

interface ProductSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  product: ExtractedProduct | null;
  selectedFieldKey: ProductFieldKey;
  onFieldKeyChange: (fieldKey: ProductFieldKey) => void;
  onProductChange: (productId: string) => void;
  products: ExtractedProduct[];
  pdfUrl: string | null;
}

export function ProductSheet({
  open,
  onOpenChange,
  product,
  selectedFieldKey,
  onFieldKeyChange,
  onProductChange,
  products,
  pdfUrl,
}: ProductSheetProps) {
  const updateProduct = useUpdateProduct();
  const { width, isDragging, handleMouseDown } = useSheetResize();

  const productIndex = product
    ? products.findIndex((p) => p.id === product.id)
    : -1;
  const totalProducts = products.length;

  const handlePrev = () => {
    if (productIndex > 0) {
      onProductChange(products[productIndex - 1].id);
    }
  };

  const handleNext = () => {
    if (productIndex < totalProducts - 1) {
      onProductChange(products[productIndex + 1].id);
    }
  };

  const handleClose = () => {
    // Blur active input to trigger save before closing
    if (document.activeElement instanceof HTMLElement) {
      document.activeElement.blur();
    }
    onOpenChange(false);
  };

  const handleFieldSave = (fieldKey: ProductFieldKey, newValue: string) => {
    if (!product) return;
    const fieldData = product[fieldKey];
    updateProduct.mutate({
      productId: product.id,
      updates: {
        [fieldKey]: {
          value: newValue,
          citations: fieldData?.citations || [],
        },
      },
    });
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        showCloseButton={false}
        className="p-0 flex flex-col gap-0"
        style={{
          width: `${width}px`,
          maxWidth: "none",
          transition: isDragging ? "none" : undefined,
        }}
        onOpenAutoFocus={(e) => e.preventDefault()}
        onInteractOutside={() => {
          // Blur active input to trigger save before sheet closes
          if (document.activeElement instanceof HTMLElement) {
            document.activeElement.blur();
          }
        }}
      >
        {/* Drag handle — overlaps the left edge, sitting half outside the sheet */}
        <div
          onMouseDown={handleMouseDown}
          className="absolute -left-2 inset-y-0 w-4 cursor-col-resize z-10 flex items-center justify-center group/handle before:absolute before:inset-y-0 before:left-1/2 before:-translate-x-1/2 before:w-2 before:bg-transparent hover:before:bg-blue-400/40 active:before:bg-blue-500/50 before:transition-colors"
        >
          <div className="z-20 h-10 rounded-full bg-white border border-gray-200 shadow-sm flex items-center justify-center group-hover/handle:bg-blue-50 group-hover/handle:border-blue-300 group-active/handle:bg-blue-100 transition-colors">
            <GripVertical className="size-3.5 text-gray-400 group-hover/handle:text-blue-500 transition-colors" />
          </div>
        </div>

        {/* Accessible title */}
        <VisuallyHidden.Root>
          <SheetTitle>
            {product?.itemName?.value || "Product Details"}
          </SheetTitle>
        </VisuallyHidden.Root>

        {product ? (
          <>
            {/* Header: product name, doc badge, nav, close */}
            <SheetHeaderSection
              product={product}
              productIndex={productIndex}
              totalProducts={totalProducts}
              onPrev={handlePrev}
              onNext={handleNext}
              onClose={handleClose}
            />

            {/* Field editor: dropdown selector + input + citation (single row) */}
            <FieldEditor
              product={product}
              fieldKey={selectedFieldKey}
              onFieldKeyChange={onFieldKeyChange}
              onSave={handleFieldSave}
            />

            {/* Summary strip: mini-table with all field values */}
            <SummaryStrip
              product={product}
              selectedFieldKey={selectedFieldKey}
              onFieldSelect={onFieldKeyChange}
            />

            {/* PDF viewer: toolbar + canvas + citation overlays */}
            {pdfUrl ? (
              <SheetPdfViewer
                pdfUrl={pdfUrl}
                product={product}
                selectedFieldKey={selectedFieldKey}
              />
            ) : (
              <div className="flex-1 flex items-center justify-center bg-gray-50">
                <p className="text-sm text-gray-400">No source document</p>
              </div>
            )}
          </>
        ) : null}
      </SheetContent>
    </Sheet>
  );
}
