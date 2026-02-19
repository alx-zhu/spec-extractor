import type { ProductFieldKey } from "@/types/product";
import type { ResolvedProduct } from "@/types/resolvedProduct";
import { hasFieldConflict } from "@/utils/resolveProducts";

/** Blue dot shown when sources disagree on a field value */
export function ConflictDot() {
  return (
    <span className="absolute top-1.5 right-1.5 size-1.5 rounded-full bg-blue-500" />
  );
}

/** Cell wrapper that shows value + optional blue conflict dot */
export function ResolvedFieldCell({
  value,
  resolved,
  fieldKey,
}: {
  value: string | undefined;
  resolved: ResolvedProduct;
  fieldKey: ProductFieldKey;
}) {
  // const hasConflict = hasFieldConflict(resolved, fieldKey);
  return (
    <div className="relative text-sm text-gray-600 w-full">
      {value || "—"}
      {/* {hasConflict && <ConflictDot />} */}
    </div>
  );
}
