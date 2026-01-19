import "@tanstack/react-table";
import type { ProductFieldKey } from "./product";

declare module "@tanstack/react-table" {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  interface ColumnMeta<TData, TValue> {
    fieldName?: ProductFieldKey;
  }
}
