import { useMemo } from "react";
import { useResolvedProducts } from "./useResolvedProducts";
import { useDocuments } from "./useDocuments";
import { useProducts } from "./useProducts";
import { DIVISIONS } from "@/data/masterformat";
import { getDivisionCode } from "@/utils/masterformatHelpers";
import {
  DOCUMENT_TYPES,
  type ProductDocumentType,
  type ProductFieldKey,
} from "@/types/product";

export interface ManufacturerStat {
  name: string;
  count: number;
}

export interface ProductStat {
  name: string;
  count: number;
}

export interface DocumentTypeStat {
  type: ProductDocumentType;
  label: string;
  abbreviation: string;
  docCount: number;
  productCount: number;
}

export interface DivisionStat {
  code: string;
  name: string;
  count: number;
}

export interface TimelineStat {
  month: string;
  monthKey: string;
  count: number;
}

export interface FieldAccuracyStat {
  field: ProductFieldKey;
  label: string;
  filledCount: number;
  naCount: number;
  emptyCount: number;
  total: number;
  fillRate: number;   // 0–100
  naRate: number;     // 0–100
  emptyRate: number;  // 0–100
}

export interface DocumentYieldStat {
  docId: string;
  filename: string;
  type: ProductDocumentType;
  productCount: number;
}

export interface DashboardAnalytics {
  totalProducts: number;
  uniqueManufacturers: number;
  totalDocuments: number;
  unclassifiedCount: number;
  topManufacturers: ManufacturerStat[];
  topProducts: ProductStat[];
  documentTypeStats: DocumentTypeStat[];
  divisionStats: DivisionStat[];
  timelineStats: TimelineStat[];
  fieldAccuracyStats: FieldAccuracyStat[];
  documentYieldStats: DocumentYieldStat[];
  isLoading: boolean;
}

// Fields the architect actually relies on — project/size/price/details excluded
// (those are often intentionally blank or project-specific)
const TRACKED_FIELDS: { key: ProductFieldKey; label: string }[] = [
  { key: "tag",                label: "Tag" },
  { key: "itemName",           label: "Item Name" },
  { key: "manufacturer",       label: "Manufacturer" },
  { key: "specIdNumber",       label: "Spec Section" },
  { key: "productDescription", label: "Description" },
  { key: "modelNumber",        label: "Model Number" },
  { key: "finish",             label: "Finish" },
];

// Values the LLM explicitly returns to signal "not found" or "not applicable"
const NA_VALUES = new Set([
  "n/a", "na", "none", "not applicable", "not specified",
  "unknown", "-", "tbd", "n.a.", "n.a",
]);

function classifyValue(value: string | null | undefined): "filled" | "na" | "empty" {
  if (value == null || value.trim() === "") return "empty";
  if (NA_VALUES.has(value.trim().toLowerCase())) return "na";
  return "filled";
}

/**
 * Strips the Supabase path prefix and the -<timestamp>-<hash> suffix that
 * generateUniqueFilename appends, leaving a human-readable display name.
 * e.g. "public/my-spec-1737584920000-abc1234.pdf" → "my-spec.pdf"
 */
function friendlyFilename(storagePath: string): string {
  const basename = storagePath.split("/").pop() ?? storagePath;
  return basename.replace(/-\d{13}-[a-z0-9]{7}(\.[^.]+)$/, "$1");
}

function toMonthKey(date: Date | string): string {
  const d = new Date(date);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function formatMonthLabel(key: string): string {
  const [year, month] = key.split("-");
  const d = new Date(parseInt(year), parseInt(month) - 1, 1);
  return d.toLocaleDateString("en-US", { month: "short", year: "numeric" });
}

export function useDashboardAnalytics(): DashboardAnalytics {
  const { data: resolvedProducts = [], isLoading: resolvedLoading } =
    useResolvedProducts();
  const { data: extractedProducts = [], isLoading: epLoading } = useProducts();
  const { data: documents = [], isLoading: docsLoading } = useDocuments();

  const analytics = useMemo(() => {
    const totalProducts = resolvedProducts.length;

    // ── Manufacturer stats ───────────────────────────────────────────────────
    const manufacturerCounts = new Map<string, number>();
    for (const rp of resolvedProducts) {
      const mfr = rp.fields.manufacturer?.value?.trim();
      if (mfr && classifyValue(mfr) === "filled") {
        manufacturerCounts.set(mfr, (manufacturerCounts.get(mfr) ?? 0) + 1);
      }
    }
    const uniqueManufacturers = manufacturerCounts.size;
    const topManufacturers: ManufacturerStat[] = Array.from(
      manufacturerCounts.entries(),
    )
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8)
      .map(([name, count]) => ({ name, count }));

    // ── Product (item name) stats ────────────────────────────────────────────
    const productCounts = new Map<string, number>();
    for (const rp of resolvedProducts) {
      const itemName = rp.fields.itemName?.value?.trim();
      if (itemName && classifyValue(itemName) === "filled") {
        productCounts.set(itemName, (productCounts.get(itemName) ?? 0) + 1);
      }
    }
    const topProducts: ProductStat[] = Array.from(productCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8)
      .map(([name, count]) => ({ name, count }));

    // ── Unclassified products ────────────────────────────────────────────────
    // A product is unclassified if its specIdNumber is absent, too short, or N/A
    const unclassifiedCount = resolvedProducts.filter((rp) => {
      const specId = rp.fields.specIdNumber?.value?.trim();
      return !specId || specId.length < 4 || classifyValue(specId) !== "filled";
    }).length;

    // ── Document type breakdown ──────────────────────────────────────────────
    const docsByType = new Map<ProductDocumentType, number>();
    for (const doc of documents) {
      docsByType.set(doc.type, (docsByType.get(doc.type) ?? 0) + 1);
    }

    const productsByDocType = new Map<ProductDocumentType, number>();
    for (const ep of extractedProducts) {
      const t = ep.documentType;
      productsByDocType.set(t, (productsByDocType.get(t) ?? 0) + 1);
    }

    const allTypes = Object.keys(DOCUMENT_TYPES) as ProductDocumentType[];
    const documentTypeStats: DocumentTypeStat[] = allTypes
      .map((type) => ({
        type,
        label: DOCUMENT_TYPES[type].label,
        abbreviation: DOCUMENT_TYPES[type].abbreviation,
        docCount: docsByType.get(type) ?? 0,
        productCount: productsByDocType.get(type) ?? 0,
      }))
      .filter((s) => s.docCount > 0 || s.productCount > 0);

    // ── Products per CSI division ────────────────────────────────────────────
    const divisionCounts = new Map<string, number>();
    for (const rp of resolvedProducts) {
      const specId = rp.fields.specIdNumber?.value?.trim();
      if (!specId || specId.length < 2 || classifyValue(specId) !== "filled") continue;
      const divCode = getDivisionCode(specId);
      divisionCounts.set(divCode, (divisionCounts.get(divCode) ?? 0) + 1);
    }

    const divisionStats: DivisionStat[] = DIVISIONS.filter(
      (div) => (divisionCounts.get(div.code) ?? 0) > 0,
    )
      .map((div) => ({
        code: div.code,
        name: div.name,
        count: divisionCounts.get(div.code) ?? 0,
      }))
      .sort((a, b) => b.count - a.count);

    // ── Products over time ───────────────────────────────────────────────────
    const monthCounts = new Map<string, number>();
    for (const ep of extractedProducts) {
      if (!ep.createdAt) continue;
      const key = toMonthKey(ep.createdAt);
      monthCounts.set(key, (monthCounts.get(key) ?? 0) + 1);
    }

    const timelineStats: TimelineStat[] = Array.from(monthCounts.entries())
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([key, count]) => ({
        monthKey: key,
        month: formatMonthLabel(key),
        count,
      }));

    // ── Field accuracy / completeness ────────────────────────────────────────
    const fieldAccuracyStats: FieldAccuracyStat[] = TRACKED_FIELDS.map(
      ({ key, label }) => {
        let filledCount = 0;
        let naCount = 0;
        let emptyCount = 0;

        for (const rp of resolvedProducts) {
          const val = rp.fields[key]?.value;
          const cls = classifyValue(val);
          if (cls === "filled") filledCount++;
          else if (cls === "na") naCount++;
          else emptyCount++;
        }

        const total = resolvedProducts.length;
        return {
          field: key,
          label,
          filledCount,
          naCount,
          emptyCount,
          total,
          fillRate:  total > 0 ? Math.round((filledCount / total) * 100) : 0,
          naRate:    total > 0 ? Math.round((naCount    / total) * 100) : 0,
          emptyRate: total > 0 ? Math.round((emptyCount / total) * 100) : 0,
        };
      },
    ).sort((a, b) => a.fillRate - b.fillRate); // worst fields at top

    // ── Products per document (yield) ────────────────────────────────────────
    const productCountsByDoc = new Map<string, number>();
    for (const ep of extractedProducts) {
      productCountsByDoc.set(
        ep.productDocumentId,
        (productCountsByDoc.get(ep.productDocumentId) ?? 0) + 1,
      );
    }

    const documentYieldStats: DocumentYieldStat[] = documents
      .map((doc) => ({
        docId: doc.id,
        filename: friendlyFilename(doc.filename),
        type: doc.type,
        productCount: productCountsByDoc.get(doc.id) ?? 0,
      }))
      .sort((a, b) => b.productCount - a.productCount);

    return {
      totalProducts,
      uniqueManufacturers,
      totalDocuments: documents.length,
      unclassifiedCount,
      topManufacturers,
      topProducts,
      documentTypeStats,
      divisionStats,
      timelineStats,
      fieldAccuracyStats,
      documentYieldStats,
    };
  }, [resolvedProducts, extractedProducts, documents]);

  return {
    ...analytics,
    isLoading: resolvedLoading || epLoading || docsLoading,
  };
}
