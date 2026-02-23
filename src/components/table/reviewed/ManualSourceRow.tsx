import { useState, useRef, useEffect } from "react";
import { Check, X } from "lucide-react";
import { PRODUCT_FIELDS, type FieldConfig } from "@/config/fields";
import type { ProductFieldKey } from "@/types/product";
import { columnLayout, getColumnWidth } from "@/styles/tableLayout";

/** Fields shown in source rows — excludes "project" which has no table column */
const MANUAL_ENTRY_FIELDS: FieldConfig[] = PRODUCT_FIELDS.filter(
  (f) => f.key !== "project",
);

interface ManualSourceRowProps {
  onSave: (fields: Partial<Record<ProductFieldKey, string>>) => void;
  onCancel: () => void;
  /** Pre-populated values for editing an existing manual source */
  initialValues?: Partial<Record<ProductFieldKey, string>>;
  isSaving?: boolean;
}

export function ManualSourceRow({
  onSave,
  onCancel,
  initialValues,
  isSaving,
}: ManualSourceRowProps) {
  const [values, setValues] = useState<Partial<Record<ProductFieldKey, string>>>(
    initialValues ?? {},
  );
  const firstInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    firstInputRef.current?.focus();
  }, []);

  const hasValue = Object.values(values).some((v) => v && v.trim());

  const handleSave = () => {
    if (!hasValue || isSaving) return;
    onSave(values);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleSave();
    } else if (e.key === "Escape") {
      e.preventDefault();
      onCancel();
    }
  };

  return (
    <div
      className="flex border-b border-blue-100 bg-blue-50/40"
      onKeyDown={handleKeyDown}
    >
      {/* Action cell — save/cancel buttons */}
      <div
        className="flex items-center justify-center gap-0.5 shrink-0"
        style={{
          width: `${columnLayout.sourceAction.width}px`,
          minWidth: `${columnLayout.sourceAction.width}px`,
        }}
      >
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            handleSave();
          }}
          disabled={!hasValue || isSaving}
          className="flex items-center justify-center size-6 rounded-md transition-colors disabled:opacity-30 text-green-600 hover:bg-green-50 cursor-pointer disabled:cursor-default"
          title="Save"
        >
          <Check className="size-3.5" />
        </button>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onCancel();
          }}
          className="flex items-center justify-center size-6 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors cursor-pointer"
          title="Cancel"
        >
          <X className="size-3.5" />
        </button>
      </div>

      {/* Data cells — one input per field, matching source row columns */}
      {MANUAL_ENTRY_FIELDS.map((field, i) => {
        const width = getColumnWidth(field.key) ?? 160;
        return (
          <div
            key={field.key}
            className="px-3 py-1.5 flex items-center border-r border-blue-100/50 last:border-r-0 shrink-0"
            style={{ width: `${width}px`, minWidth: `${width}px` }}
          >
            <input
              ref={i === 0 ? firstInputRef : undefined}
              type="text"
              value={values[field.key] ?? ""}
              onChange={(e) =>
                setValues((prev) => ({
                  ...prev,
                  [field.key]: e.target.value,
                }))
              }
              placeholder={field.label}
              className="w-full text-xs bg-transparent outline-none placeholder:text-gray-300 text-gray-700"
              disabled={isSaving}
            />
          </div>
        );
      })}
    </div>
  );
}
