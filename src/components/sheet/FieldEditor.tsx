import { useState, useEffect, useRef } from "react";
import { Sparkles } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  getFieldCitations,
  type Product,
  type ProductFieldKey,
} from "@/types/product";
import { isSpecIdGenerated } from "@/utils/productHelpers";
import { getFieldLabel } from "./fieldConfig";
import { cn } from "@/lib/utils";

interface FieldEditorProps {
  product: Product;
  fieldKey: ProductFieldKey;
  onSave: (fieldKey: ProductFieldKey, newValue: string) => void;
}

export function FieldEditor({ product, fieldKey, onSave }: FieldEditorProps) {
  const fieldValue = product[fieldKey]?.value ?? "";
  const [editValue, setEditValue] = useState(fieldValue);
  const inputRef = useRef<HTMLInputElement>(null);

  // Reset input when product or field changes, or after save (fresh data from React Query)
  useEffect(() => {
    setEditValue(fieldValue);
  }, [product.id, fieldKey, fieldValue]);

  const handleSave = () => {
    const trimmed = editValue.trim();
    if (trimmed !== fieldValue) {
      onSave(fieldKey, trimmed);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleSave();
      inputRef.current?.blur();
    } else if (e.key === "Escape") {
      // Prevent sheet from closing — revert edit instead
      e.stopPropagation();
      setEditValue(fieldValue);
      inputRef.current?.blur();
    }
  };

  const citations = getFieldCitations(product[fieldKey]);
  const firstCitation = citations.length > 0 ? citations[0] : null;
  const isGenerated =
    fieldKey === "specIdNumber" && isSpecIdGenerated(product);

  return (
    <div className="border-b border-gray-200 bg-white px-5 py-4">
      {/* Field label */}
      <label className="block text-xs font-medium text-gray-500 mb-1.5">
        {getFieldLabel(fieldKey)}
      </label>

      {/* Always-visible input */}
      <Input
        ref={inputRef}
        type="text"
        value={editValue}
        onChange={(e) => setEditValue(e.target.value)}
        onBlur={handleSave}
        onKeyDown={handleKeyDown}
        placeholder={`Enter ${getFieldLabel(fieldKey).toLowerCase()}...`}
        className="h-9 text-sm"
      />

      {/* Citation metadata */}
      <div className="mt-2 flex items-center gap-2 text-xs text-gray-400">
        {isGenerated ? (
          <span className="inline-flex items-center gap-1 text-amber-500">
            <Sparkles className="size-3" />
            AI generated
          </span>
        ) : firstCitation ? (
          <>
            <Badge
              variant="secondary"
              className={cn(
                "rounded text-[10px] font-medium px-1.5 py-0",
                confidenceColor(firstCitation.confidence),
              )}
            >
              {firstCitation.type}
            </Badge>
            <span className="text-gray-300">·</span>
            <span>Page {firstCitation.bbox.page}</span>
            <span className="text-gray-300">·</span>
            <span className="capitalize">{firstCitation.confidence} conf.</span>
          </>
        ) : (
          <span>No source citation</span>
        )}
      </div>
    </div>
  );
}

function confidenceColor(confidence: "high" | "medium" | "low"): string {
  switch (confidence) {
    case "high":
      return "bg-green-50 text-green-700";
    case "medium":
      return "bg-yellow-50 text-yellow-700";
    case "low":
      return "bg-red-50 text-red-700";
  }
}
