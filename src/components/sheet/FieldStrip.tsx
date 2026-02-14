import type { Product, ProductFieldKey } from "@/types/product";
import { cn } from "@/lib/utils";
import { FIELD_STRIP_CONFIG } from "./fieldConfig";

interface FieldStripProps {
  product: Product;
  selectedFieldKey: ProductFieldKey;
  onFieldSelect: (fieldKey: ProductFieldKey) => void;
}

export function FieldStrip({
  product,
  selectedFieldKey,
  onFieldSelect,
}: FieldStripProps) {
  return (
    <div className="border-b border-gray-200 bg-white">
      <div className="flex gap-1.5 px-5 py-3 overflow-x-auto scrollbar-thin scrollbar-thumb-gray-200 scrollbar-track-transparent">
        {FIELD_STRIP_CONFIG.map(({ key, label }) => {
          const isActive = key === selectedFieldKey;
          const fieldValue = product[key]?.value;
          const isEmpty = !fieldValue || fieldValue === "N/A" || fieldValue === "";

          return (
            <button
              key={key}
              onClick={() => onFieldSelect(key)}
              className={cn(
                "shrink-0 px-3 py-1.5 rounded-md text-xs font-medium border transition-colors cursor-pointer",
                isActive
                  ? "bg-blue-50 text-blue-700 border-blue-200"
                  : isEmpty
                    ? "bg-white text-gray-400 border-gray-150 hover:bg-gray-50 hover:text-gray-500"
                    : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50",
              )}
            >
              {label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
