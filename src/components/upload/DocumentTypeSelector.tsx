import { DOCUMENT_TYPES, type ProductDocumentType } from "@/types/product";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { ChevronDown } from "lucide-react";

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
  const enabledTypes = Object.values(DOCUMENT_TYPES).filter(
    (config) => !config.disabled,
  );
  const selectedConfig = DOCUMENT_TYPES[value];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        disabled={disabled}
        className={cn(
          "inline-flex items-center gap-0.5 rounded px-1.5 py-0.5 text-[10px] font-semibold tracking-wide transition-colors outline-none cursor-pointer",
          selectedConfig.bgColor,
          selectedConfig.color,
          "hover:opacity-80",
          disabled && "pointer-events-none opacity-50",
        )}
      >
        {selectedConfig.abbreviation}
        <ChevronDown className="h-2.5 w-2.5 opacity-60" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="min-w-0 p-1">
        {enabledTypes.map((config) => (
          <DropdownMenuItem
            key={config.value}
            onClick={() => onChange(config.value)}
            className="flex items-center gap-2 px-2 py-1.5 cursor-pointer"
          >
            <Badge
              className={cn(
                "px-1.5 py-0 text-[10px] font-semibold tracking-wide rounded",
                config.bgColor,
                config.color,
              )}
            >
              {config.abbreviation}
            </Badge>
            <span className="text-xs text-gray-700">{config.label}</span>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
