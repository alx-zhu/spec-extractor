import { useState } from "react";
import { Check, Undo2, MoreHorizontal, MousePointer, Eye, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

interface RowActionsProps {
  productId: string;
  isReviewed: boolean;
  onReview?: (productId: string) => void;
  onUnreview?: (productId: string) => void;
}

export function RowActions({
  productId,
  isReviewed,
  onReview,
  onUnreview,
}: RowActionsProps) {
  const [dropdownOpen, setDropdownOpen] = useState(false);

  return (
    <div className="sticky right-0 w-0 overflow-visible z-20 self-stretch">
      <div
        className={cn(
          "absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-0.5 px-1",
          "bg-white border border-gray-200 rounded-lg shadow-sm",
          "transition-opacity duration-150",
          dropdownOpen
            ? "opacity-100 pointer-events-auto"
            : "opacity-0 group-hover:opacity-100 pointer-events-none group-hover:pointer-events-auto",
        )}
      >
        {/* Left: Review / Unreview toggle */}
        {isReviewed ? (
          <Button
            variant="ghost"
            size="icon-sm"
            className="size-7 text-gray-400 hover:text-amber-600 hover:bg-amber-50"
            onClick={(e) => {
              e.stopPropagation();
              onUnreview?.(productId);
            }}
            title="Unmark as reviewed"
          >
            <Undo2 className="size-3.5" />
          </Button>
        ) : (
          <Button
            variant="ghost"
            size="icon-sm"
            className="size-7 text-gray-400 hover:text-green-600 hover:bg-green-50"
            onClick={(e) => {
              e.stopPropagation();
              onReview?.(productId);
            }}
            title="Mark as reviewed"
          >
            <Check className="size-3.5" />
          </Button>
        )}

        {/* Right: More actions dropdown */}
        <DropdownMenu open={dropdownOpen} onOpenChange={setDropdownOpen}>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon-sm"
              className="size-7 text-gray-400 hover:text-gray-600 hover:bg-gray-100"
              onClick={(e) => e.stopPropagation()}
              title="More actions"
            >
              <MoreHorizontal className="size-3.5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
            <DropdownMenuItem>
              <MousePointer className="size-4" />
              Select
            </DropdownMenuItem>
            <DropdownMenuItem>
              <Eye className="size-4" />
              View
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem variant="destructive">
              <Trash2 className="size-4" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}
