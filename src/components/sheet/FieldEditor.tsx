import { useState, useEffect, useRef } from "react";
import { Sparkles } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  getFieldCitations,
  type ExtractedProduct,
  type ProductFieldKey,
} from "@/types/product";
import { isSpecIdGenerated } from "@/utils/productHelpers";
import { PRODUCT_FIELDS, getFieldLabel } from "@/config/fields";
import { cn } from "@/lib/utils";

interface FieldEditorProps {
  product: ExtractedProduct;
  fieldKey: ProductFieldKey;
  onFieldKeyChange: (fieldKey: ProductFieldKey) => void;
  onSave: (fieldKey: ProductFieldKey, newValue: string) => void;
}

export function FieldEditor({
  product,
  fieldKey,
  onFieldKeyChange,
  onSave,
}: FieldEditorProps) {
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
  const isGenerated = fieldKey === "specIdNumber" && isSpecIdGenerated(product);

  return (
    <div className="bg-white px-5 py-2.5 shrink-0">
      <div className="flex items-center gap-3">
        {/* Field selector dropdown */}
        <Select
          value={fieldKey}
          onValueChange={(v) => onFieldKeyChange(v as ProductFieldKey)}
        >
          <SelectTrigger size="sm" className="w-[130px] shrink-0 text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {PRODUCT_FIELDS.map(({ key, label }) => (
              <SelectItem key={key} value={key}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Edit input */}
        <Input
          ref={inputRef}
          type="text"
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          onBlur={handleSave}
          onKeyDown={handleKeyDown}
          placeholder={`Enter ${getFieldLabel(fieldKey).toLowerCase()}...`}
          className="h-8 text-sm flex-1 min-w-0"
        />

        {/* Citation metadata — compact inline */}
        <div className="flex items-center gap-1.5 text-[11px] text-gray-400 shrink-0">
          {isGenerated ? (
            <span className="inline-flex items-center gap-1 text-amber-500">
              <Sparkles className="size-3" />
              AI
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
              <span className="text-gray-300">&middot;</span>
              <span>p.{firstCitation.bbox.page}</span>
              <span className="text-gray-300">&middot;</span>
              <span className="capitalize">{firstCitation.confidence}</span>
            </>
          ) : (
            <span className="text-gray-300">No source</span>
          )}
        </div>
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
