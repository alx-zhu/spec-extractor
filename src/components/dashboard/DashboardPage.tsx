import {
  Package,
  Building2,
  FileText,
  AlertCircle,
} from "lucide-react";
import { KpiCard } from "./KpiCard";
import { ManufacturerChart } from "./ManufacturerChart";
import { ProductChart } from "./ProductChart";
import { DocumentTypeBreakdown } from "./DocumentTypeBreakdown";
import { DivisionChart } from "./DivisionChart";
import { TimelineChart } from "./TimelineChart";
import { FieldAccuracyTable } from "./FieldAccuracyTable";
import { DocumentYieldChart } from "./DocumentYieldChart";
import { ChatInterface } from "./ChatInterface";
import { useDashboardAnalytics } from "@/hooks/useDashboardAnalytics";

function ChartCard({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-xs p-6">
      <div className="mb-5">
        <h2 className="text-sm font-semibold text-gray-900">{title}</h2>
        {subtitle && (
          <p className="text-xs text-gray-500 mt-0.5">{subtitle}</p>
        )}
      </div>
      {children}
    </div>
  );
}

export function DashboardPage() {
  const analytics = useDashboardAnalytics();

  return (
    <div className="flex-1 overflow-y-auto bg-gray-50">
      <div className="max-w-6xl mx-auto px-8 py-8 space-y-6">

        {/* ── KPI Cards ──────────────────────────────────────────────────── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <KpiCard
            label="Total Products"
            value={analytics.totalProducts}
            subtext="across all documents"
            icon={<Package className="h-5 w-5" />}
          />
          <KpiCard
            label="Manufacturers"
            value={analytics.uniqueManufacturers}
            subtext="unique vendors"
            icon={<Building2 className="h-5 w-5" />}
          />
          <KpiCard
            label="Documents"
            value={analytics.totalDocuments}
            subtext="uploaded files"
            icon={<FileText className="h-5 w-5" />}
          />
          <KpiCard
            label="Unclassified"
            value={analytics.unclassifiedCount}
            subtext="missing spec section"
            icon={<AlertCircle className="h-5 w-5" />}
            className={
              analytics.unclassifiedCount > 0
                ? "border-amber-200 bg-amber-50/40"
                : undefined
            }
          />
        </div>

        {/* ── Top Manufacturers + Most Used Products ──────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <ChartCard
            title="Top Manufacturers"
            subtitle="By number of products specified"
          >
            <ManufacturerChart data={analytics.topManufacturers} />
          </ChartCard>

          <ChartCard
            title="Most Used Products"
            subtitle="By number of occurrences across documents"
          >
            <ProductChart data={analytics.topProducts} />
          </ChartCard>
        </div>

        {/* ── Extraction Quality (full width) ────────────────────────────── */}
        <ChartCard
          title="Extraction Quality"
          subtitle="Fill rate per field across all products — sorted by lowest first"
        >
          <FieldAccuracyTable
            data={analytics.fieldAccuracyStats}
            totalProducts={analytics.totalProducts}
          />
        </ChartCard>

        {/* ── Products per Document + Products per Division ───────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <ChartCard
            title="Products per Document"
            subtitle="Which files produced the most extracted products"
          >
            <DocumentYieldChart data={analytics.documentYieldStats} />
          </ChartCard>

          <ChartCard
            title="Products per CSI Division"
            subtitle="Based on spec section number (MasterFormat)"
          >
            <DivisionChart data={analytics.divisionStats} />
          </ChartCard>
        </div>

        {/* ── Document Type Breakdown + Products Over Time ────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <ChartCard
            title="Breakdown by Document Type"
            subtitle="Documents uploaded and products scraped per type"
          >
            <DocumentTypeBreakdown data={analytics.documentTypeStats} />
          </ChartCard>

          <ChartCard
            title="Products Extracted Over Time"
            subtitle="Total products extracted per month"
          >
            <TimelineChart data={analytics.timelineStats} />
          </ChartCard>
        </div>

        {/* ── Chat ───────────────────────────────────────────────────────── */}
        <ChatInterface analytics={analytics} />

        <div className="h-4" />
      </div>
    </div>
  );
}
