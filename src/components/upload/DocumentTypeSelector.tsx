// src/components/upload/DocumentTypeSelector.tsx
import { DOCUMENT_TYPES, type ProductDocumentType } from "@/types/product";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface DocumentTypeSelectorProps {
  value: ProductDocumentType;
  onChange: (type: ProductDocumentType) => void;
  disabled?: boolean;
}

export function DocumentTypeSelector({
  value,
  onChange,
  disabled = false,
}: DocumentTypeSelectorProps) {
  const selectedConfig = DOCUMENT_TYPES[value];

  return (
    <Select value={value} onValueChange={onChange} disabled={disabled}>
      <SelectTrigger className="h-7 text-xs w-[130px]">
        <SelectValue>
          <span className="flex items-center gap-1.5">
            <span
              className={`inline-flex items-center justify-center px-1.5 py-0.5 rounded text-[10px] font-semibold tracking-wide ${selectedConfig.bgColor} ${selectedConfig.color}`}
            >
              {selectedConfig.abbreviation}
            </span>
            <span className="text-gray-600">{selectedConfig.label}</span>
          </span>
        </SelectValue>
      </SelectTrigger>
      <SelectContent>
        {Object.values(DOCUMENT_TYPES).map((type) => (
          <SelectItem key={type.value} value={type.value}>
            <span className="flex items-center gap-2">
              <span
                className={`inline-flex items-center justify-center px-1.5 py-0.5 rounded text-[10px] font-semibold tracking-wide ${type.bgColor} ${type.color}`}
              >
                {type.abbreviation}
              </span>
              <span className="text-sm">{type.label}</span>
            </span>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
