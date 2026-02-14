import { Sheet, SheetContent } from "@/components/ui/sheet";
import { SheetHeaderSection } from "./SheetHeaderSection";
import { FieldStrip } from "./FieldStrip";
import { FieldEditor } from "./FieldEditor";
import { SheetPdfViewer } from "./SheetPdfViewer";
import { useUpdateProduct } from "@/hooks/useProducts";
import type { Product, ProductFieldKey } from "@/types/product";
import { VisuallyHidden } from "radix-ui";
import { SheetTitle } from "@/components/ui/sheet";

interface ProductSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  product: Product | null;
  selectedFieldKey: ProductFieldKey;
  onFieldKeyChange: (fieldKey: ProductFieldKey) => void;
  onProductChange: (productId: string) => void;
  products: Product[];
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

  if (!product) return null;

  const productIndex = products.findIndex((p) => p.id === product.id);
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
    onOpenChange(false);
  };

  const handleFieldSave = (fieldKey: ProductFieldKey, newValue: string) => {
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
        style={{ width: "50vw", maxWidth: "none" }}
        onOpenAutoFocus={(e) => e.preventDefault()}
      >
        {/* Accessible title (visually hidden — our custom header shows the product name) */}
        <VisuallyHidden.Root>
          <SheetTitle>
            {product.itemName?.value || "Product Details"}
          </SheetTitle>
        </VisuallyHidden.Root>

        {/* Header: product name, doc badge, nav, close */}
        <SheetHeaderSection
          product={product}
          productIndex={productIndex}
          totalProducts={totalProducts}
          onPrev={handlePrev}
          onNext={handleNext}
          onClose={handleClose}
        />

        {/* Field strip: horizontal pill navigator */}
        <FieldStrip
          product={product}
          selectedFieldKey={selectedFieldKey}
          onFieldSelect={onFieldKeyChange}
        />

        {/* Field editor: always-visible input + citation metadata */}
        <FieldEditor
          product={product}
          fieldKey={selectedFieldKey}
          onSave={handleFieldSave}
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
      </SheetContent>
    </Sheet>
  );
}
