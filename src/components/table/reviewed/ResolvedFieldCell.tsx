/** Simple cell wrapper for resolved field values */
export function ResolvedFieldCell({
  value,
}: {
  value: string | undefined;
}) {
  return (
    <div className="text-sm text-gray-600 w-full">
      {value || "—"}
    </div>
  );
}
