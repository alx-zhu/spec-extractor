import { useState, useRef, useEffect } from "react";
import { Pencil } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ProductFieldKey } from "@/types/product";

interface EditableCellProps {
  value: string;
  fieldKey: ProductFieldKey;
  isSelected: boolean;
  isFieldSelected: boolean;
  onSave: (fieldKey: ProductFieldKey, newValue: string) => void;
  className?: string;
  children: React.ReactNode;
}

export function EditableCell({
  value,
  fieldKey,
  isSelected,
  isFieldSelected,
  onSave,
  className,
  children,
}: EditableCellProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(value);
  const inputRef = useRef<HTMLInputElement>(null);

  // Reset edit value when cell value changes from outside
  useEffect(() => {
    setEditValue(value);
  }, [value]);

  // Focus input when entering edit mode
  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  const handleSave = () => {
    if (editValue.trim() !== value) {
      onSave(fieldKey, editValue.trim());
    }
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditValue(value);
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleSave();
    } else if (e.key === "Escape") {
      e.preventDefault();
      handleCancel();
    }
  };

  const handleDoubleClick = () => {
    if (isSelected) {
      setIsEditing(true);
    }
  };

  const handleEditIconClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsEditing(true);
  };

  // Show edit icon only when:
  // - Cell is selected (row is selected)
  // - This specific field is selected (isFieldSelected)
  // - Cell is hovered (using Tailwind group-hover)
  // - Not currently editing
  const showEditIcon = isSelected && isFieldSelected && !isEditing;

  if (isEditing) {
    return (
      <div className={cn("relative w-full", className)}>
        <input
          ref={inputRef}
          type="text"
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          onBlur={handleSave}
          onKeyDown={handleKeyDown}
          className="w-full px-2 py-1 border border-blue-500 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
        />
      </div>
    );
  }

  return (
    <div
      className={cn("relative w-full h-full flex items-center", className)}
      onDoubleClick={handleDoubleClick}
    >
      <div className="flex-1 min-w-0">{children}</div>
      {showEditIcon && (
        <button
          onClick={handleEditIconClick}
          className="absolute top-1/2 -translate-y-1/2 right-0 p-1 bg-white/90 hover:bg-blue-50 rounded shadow-sm border border-gray-200 transition-all z-10 opacity-0 group-hover:opacity-100 cursor-pointer"
          aria-label="Edit cell"
        >
          <Pencil className="w-4 h-4 text-gray-600" />
        </button>
      )}
    </div>
  );
}
