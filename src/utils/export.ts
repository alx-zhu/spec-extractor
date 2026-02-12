/**
 * CSV Export Utilities
 *
 * Handles exporting product data to CSV format.
 */

import type { Product, ProductFieldKey } from "@/types/product";

export interface ExportColumn {
  key: ProductFieldKey;
  label: string;
  enabled: boolean;
}

/**
 * Default export columns configuration
 */
export const DEFAULT_EXPORT_COLUMNS: ExportColumn[] = [
  { key: "itemName", label: "Product Name", enabled: true },
  { key: "productDescription", label: "Product Description", enabled: true },
  { key: "manufacturer", label: "Manufacturer", enabled: true },
  { key: "tag", label: "Tag", enabled: true },
  { key: "specIdNumber", label: "Masterformat Code", enabled: true },
  { key: "project", label: "Project", enabled: false },
  { key: "finish", label: "Finish", enabled: true },
  { key: "size", label: "Size", enabled: true },
  { key: "price", label: "Price", enabled: true },
  { key: "details", label: "Details", enabled: false },
];

/**
 * Escape CSV field value
 */
function escapeCSVField(value: string): string {
  // If value contains comma, newline, or quotes, wrap in quotes and escape quotes
  if (value.includes(",") || value.includes("\n") || value.includes('"')) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

/**
 * Export products to CSV
 *
 * @param products - Array of products to export
 * @param columns - Selected columns to include in export
 * @returns CSV string
 */
export function exportProductsToCSV(
  products: Product[],
  columns: ExportColumn[],
): string {
  const enabledColumns = columns.filter((col) => col.enabled);

  // Create header row
  const headers = enabledColumns.map((col) => escapeCSVField(col.label));
  const rows: string[] = [headers.join(",")];

  // Create data rows
  products.forEach((product) => {
    const row = enabledColumns.map((col) => {
      const fieldValue = product[col.key]?.value || "";
      return escapeCSVField(fieldValue);
    });
    rows.push(row.join(","));
  });

  return rows.join("\n");
}

/**
 * Download CSV string as file
 *
 * @param csvContent - CSV string content
 * @param filename - Filename for download (without extension)
 */
export function downloadCSV(
  csvContent: string,
  filename: string = "export",
): void {
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");

  const url = URL.createObjectURL(blob);
  link.setAttribute("href", url);
  link.setAttribute("download", `${filename}.csv`);
  link.style.visibility = "hidden";

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  URL.revokeObjectURL(url);
}
