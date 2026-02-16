import { useRef, useEffect } from "react";
import { cn } from "@/lib/utils";
import { PRODUCT_FIELDS } from "@/config/fields";
import type { Product, ProductFieldKey } from "@/types/product";

interface SummaryStripProps {
  product: Product;
  selectedFieldKey: ProductFieldKey;
  onFieldSelect: (fieldKey: ProductFieldKey) => void;
}

export function SummaryStrip({
  product,
  selectedFieldKey,
  onFieldSelect,
}: SummaryStripProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll the selected cell into view
  useEffect(() => {
    const container = scrollRef.current;
    if (!container) return;
    const cell = container.querySelector<HTMLElement>(
      `[data-field="${selectedFieldKey}"]`,
    );
    cell?.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "nearest" });
  }, [selectedFieldKey]);

  return (
    <div className="border-b border-gray-200 bg-white shrink-0 relative">
      <div
        ref={scrollRef}
        className="overflow-x-auto scrollbar-thin scrollbar-thumb-gray-200 scrollbar-track-transparent"
      >
        <table className="w-max border-collapse">
          <thead>
            <tr>
              {PRODUCT_FIELDS.map(({ key, label }) => (
                <th
                  key={key}
                  className="px-3 py-1.5 text-[10px] font-semibold text-gray-400 uppercase tracking-wider text-left whitespace-nowrap border-r border-gray-100 last:border-r-0 min-w-[100px]"
                >
                  {label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            <tr>
              {PRODUCT_FIELDS.map(({ key }) => {
                const isSelected = key === selectedFieldKey;
                const value = product[key]?.value;
                const isEmpty = !value || value === "N/A" || value === "";

                return (
                  <td
                    key={key}
                    data-field={key}
                    onClick={() => onFieldSelect(key)}
                    className={cn(
                      "px-3 py-2 text-xs whitespace-nowrap border-r border-gray-100 last:border-r-0 min-w-[100px] max-w-[200px] cursor-pointer transition-colors relative",
                      isSelected
                        ? "bg-blue-50 before:absolute before:left-0 before:top-0 before:bottom-0 before:w-0.5 before:bg-blue-500"
                        : "hover:bg-gray-50",
                      isEmpty ? "text-gray-300" : "text-gray-700",
                    )}
                  >
                    <span className="truncate block">
                      {isEmpty ? "—" : value}
                    </span>
                  </td>
                );
              })}
            </tr>
          </tbody>
        </table>
      </div>

      {/* Right fade gradient — signals horizontal scrollability */}
      <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-white to-transparent pointer-events-none" />
    </div>
  );
}
