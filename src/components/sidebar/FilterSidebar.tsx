import { cn } from "@/lib/utils";
import { getDivisionCode } from "@/utils/masterformatHelpers";
import { DivisionRow } from "@/components/sidebar/DivisionRow";
import type {
  SidebarFilter,
  SidebarDivision,
  SidebarSection,
} from "@/hooks/useSidebarFilter";

// ── Section row (leaf node in the tree) ──────────────────────────

function SectionItem({
  section,
  isActive,
  onClick,
}: {
  section: SidebarSection;
  isActive: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "w-full flex items-center justify-between pl-4 pr-4 py-2 text-left text-[13px] transition-colors rounded-r-md cursor-pointer",
        isActive
          ? "bg-blue-50 text-blue-700 font-medium"
          : "text-gray-500 hover:bg-gray-50 hover:text-gray-700",
      )}
    >
      <span className="truncate">{section.name}</span>
      <span className="ml-3 inline-flex items-center justify-center px-1.5 py-0.5 rounded-full text-[10px] font-medium tabular-nums shrink-0 bg-gray-100 text-gray-500">
        {section.count}
      </span>
    </button>
  );
}

// ── Division row with collapsible section children ───────────────

function DivisionItem({
  division,
  isActive,
  isExpanded,
  activeFilter,
  onDivisionClick,
  onSectionClick,
}: {
  division: SidebarDivision;
  isActive: boolean;
  isExpanded: boolean;
  activeFilter: SidebarFilter;
  onDivisionClick: () => void;
  onSectionClick: (sectionCode: string) => void;
}) {
  const hasActiveChild =
    activeFilter?.type === "section" &&
    getDivisionCode(activeFilter.code) === division.code;

  return (
    <div>
      <DivisionRow
        code={division.code}
        name={division.name}
        count={division.count}
        isActive={isActive}
        onClick={onDivisionClick}
        expandable
        isExpanded={isExpanded}
        hasActiveChild={hasActiveChild}
      />

      {/* Collapsible children */}
      {isExpanded && division.sections.length > 0 && (
        <div className="relative pb-1 ml-[23px] border-l border-gray-200">
          {division.sections.map((section) => {
            const isSectionActive =
              activeFilter?.type === "section" &&
              activeFilter.code === section.code;

            return (
              <SectionItem
                key={section.code}
                section={section}
                isActive={isSectionActive}
                onClick={() => onSectionClick(section.code)}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}

// ── Sidebar container ────────────────────────────────────────────

interface FilterSidebarProps {
  isOpen: boolean;
  divisions: SidebarDivision[];
  activeFilter: SidebarFilter;
  expandedDivision: string | null;
  noSpecIdCount: number;
  totalCount: number;
  onDivisionClick: (code: string) => void;
  onSectionClick: (code: string) => void;
  onNoSpecIdClick: () => void;
  onClearFilter: () => void;
}

export function FilterSidebar({
  isOpen,
  divisions,
  activeFilter,
  expandedDivision,
  noSpecIdCount,
  totalCount,
  onDivisionClick,
  onSectionClick,
  onNoSpecIdClick,
  onClearFilter,
}: FilterSidebarProps) {
  const isAllActive = activeFilter === null;

  return (
    <aside
      className={cn(
        "bg-white border-r border-gray-200 flex flex-col overflow-hidden transition-[width] duration-300 ease-in-out shrink-0",
        isOpen ? "w-64" : "w-0",
      )}
      role="navigation"
      aria-label="MasterFormat filter"
    >
      <div className="w-64 min-w-64 flex flex-col h-full">
        {/* Header */}
        <div className="px-5 py-4">
          <h3 className="text-[11px] font-semibold text-gray-400 uppercase tracking-widest">
            Divisions
          </h3>
        </div>

        {/* Tree list */}
        <nav className="flex-1 overflow-y-auto px-2 pb-4">
          {/* All Products option */}
          <button
            onClick={onClearFilter}
            className={cn(
              "w-full flex items-center justify-between px-4 py-2.5 text-left text-[13px] transition-colors rounded-r-md cursor-pointer mb-1",
              isAllActive
                ? "bg-blue-50 text-blue-700 font-medium"
                : "text-gray-700 hover:bg-gray-50",
            )}
          >
            <span>All Products</span>
            <span className="ml-3 inline-flex items-center justify-center px-1.5 py-0.5 rounded-full text-[10px] font-medium tabular-nums shrink-0 bg-gray-100 text-gray-500">
              {totalCount}
            </span>
          </button>

          <div className="mx-4 my-1.5 border-t border-gray-200" />

          {divisions.length > 0 || noSpecIdCount > 0 ? (
            <div className="space-y-0.5">
              {divisions.map((division) => {
                const isDivisionActive =
                  activeFilter?.type === "division" &&
                  activeFilter.code === division.code;
                const isExpanded = expandedDivision === division.code;

                return (
                  <DivisionItem
                    key={division.code}
                    division={division}
                    isActive={isDivisionActive}
                    isExpanded={isExpanded}
                    activeFilter={activeFilter}
                    onDivisionClick={() => onDivisionClick(division.code)}
                    onSectionClick={onSectionClick}
                  />
                );
              })}

              {/* Unclassified – products with no valid Spec ID */}
              {noSpecIdCount > 0 && (
                <DivisionRow
                  code="??"
                  name="Unclassified"
                  count={noSpecIdCount}
                  isActive={activeFilter?.type === "no-spec-id"}
                  onClick={onNoSpecIdClick}
                />
              )}
            </div>
          ) : (
            <p className="px-4 py-8 text-sm text-gray-400 text-center">
              No divisions found
            </p>
          )}
        </nav>
      </div>
    </aside>
  );
}
