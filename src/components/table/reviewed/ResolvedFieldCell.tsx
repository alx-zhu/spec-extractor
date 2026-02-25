/** Simple cell wrapper for resolved field values */
export function ResolvedFieldCell({
  value,
  className,
}: {
  value: string | undefined;
  className?: string;
}) {
  return (
    <div className={`text-sm text-gray-600 w-full ${className ?? ""}`}>
      {value || "—"}
    </div>
  );
}
