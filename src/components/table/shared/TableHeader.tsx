import { flexRender, type HeaderGroup } from "@tanstack/react-table";
import { getColumnType, getColumnWidth } from "@/styles/tableLayout";
import { headerCellVariants } from "./tableVariants";

interface TableHeaderProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  headerGroups: HeaderGroup<any>[];
}

export function TableHeader({ headerGroups }: TableHeaderProps) {
  return (
    <div className="flex bg-gray-50 border-b border-gray-200 sticky top-0 z-50">
      {headerGroups.map((headerGroup) =>
        headerGroup.headers.map((header) => {
          const columnType = getColumnType(header.column.id);
          const width =
            getColumnWidth(header.column.id) ??
            header.column.columnDef.size;

          return (
            <div
              key={header.id}
              className={headerCellVariants({ column: columnType })}
              style={{
                width: width ? `${width}px` : undefined,
                minWidth: width ? `${width}px` : undefined,
              }}
            >
              {flexRender(
                header.column.columnDef.header,
                header.getContext(),
              )}
            </div>
          );
        }),
      )}
    </div>
  );
}
