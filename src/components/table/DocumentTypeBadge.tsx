import { DOCUMENT_TYPES, type DocumentType } from "@/types/product";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

interface DocumentTypeBadgeProps {
  type: DocumentType;
  className?: string;
}

export function DocumentTypeBadge({ type, className }: DocumentTypeBadgeProps) {
  const config = DOCUMENT_TYPES[type];

  return (
    <Badge
      className={cn(
        "px-2 py-0.5 text-xs font-semibold tracking-wide rounded",
        config.bgColor,
        config.color,
        className,
      )}
    >
      {config.abbreviation}
    </Badge>
  );
}
