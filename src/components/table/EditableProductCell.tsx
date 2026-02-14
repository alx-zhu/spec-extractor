import { useState, useRef, useEffect } from "react";
import { Pencil } from "lucide-react";
import type { ProductFieldKey } from "@/types/product";

interface EditableProductCellProps {
  itemNameValue: string;
  descriptionValue: string;
  isSelected: boolean;
  isFieldSelected: boolean;
  onSave: (fieldKey: ProductFieldKey, newValue: string) => void;
  children: React.ReactNode;
}

export function EditableProductCell({
  itemNameValue,
  descriptionValue,
  isSelected,
  isFieldSelected,
  onSave,
  children,
}: EditableProductCellProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(itemNameValue);
  const [editDescription, setEditDescription] = useState(descriptionValue);
  const nameInputRef = useRef<HTMLInputElement>(null);
  const descInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setEditName(itemNameValue);
  }, [itemNameValue]);

  useEffect(() => {
    setEditDescription(descriptionValue);
  }, [descriptionValue]);

  useEffect(() => {
    if (isEditing && nameInputRef.current) {
      nameInputRef.current.focus();
      nameInputRef.current.select();
    }
  }, [isEditing]);

  const handleSave = () => {
    if (editName.trim() !== itemNameValue) {
      onSave("itemName", editName.trim());
    }
    if (editDescription.trim() !== descriptionValue) {
      onSave("productDescription", editDescription.trim());
    }
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditName(itemNameValue);
    setEditDescription(descriptionValue);
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      if (e.currentTarget === nameInputRef.current) {
        descInputRef.current?.focus();
        descInputRef.current?.select();
      } else {
        handleSave();
      }
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

  const showEditIcon = isSelected && isFieldSelected && !isEditing;

  const handleBlur = (e: React.FocusEvent) => {
    // Only save if focus is leaving the editing container entirely
    if (!e.currentTarget.contains(e.relatedTarget as Node)) {
      handleSave();
    }
  };

  if (isEditing) {
    return (
      <div className="relative w-full flex flex-col gap-1" onBlur={handleBlur}>
        <input
          ref={nameInputRef}
          type="text"
          value={editName}
          onChange={(e) => setEditName(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Product name"
          className="w-full px-2 py-1 border border-blue-500 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
        />
        <input
          ref={descInputRef}
          type="text"
          value={editDescription}
          onChange={(e) => setEditDescription(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Description"
          className="w-full px-2 py-1 border border-blue-500 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs"
        />
      </div>
    );
  }

  return (
    <div
      className="relative w-full h-full flex items-center"
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
