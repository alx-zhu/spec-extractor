import { useState, useMemo, useCallback } from "react";
import type { ExtractedProduct } from "@/types/product";
import { DIVISIONS, SECTIONS } from "@/data/masterformat";
import {
  getDivisionCode,
  getSectionPrefix,
  productMatchesDivision,
  productMatchesSection,
} from "@/utils/masterformatHelpers";

export type SidebarFilter =
  | { type: "division"; code: string }
  | { type: "section"; code: string }
  | null;

export interface SidebarSection {
  code: string;
  name: string;
  count: number;
}

export interface SidebarDivision {
  code: string;
  name: string;
  count: number;
  sections: SidebarSection[];
}

export function useSidebarFilter(products: ExtractedProduct[]) {
  const [isOpen, setIsOpen] = useState(false);
  const [activeFilter, setActiveFilter] = useState<SidebarFilter>(null);

  const toggleSidebar = useCallback(() => setIsOpen((prev) => !prev), []);
  const clearFilter = useCallback(() => setActiveFilter(null), []);

  // Build a single tree of divisions → sections, with counts, filtered to only those with products
  const divisions = useMemo(() => {
    // Count products per division and per section prefix
    const divCounts = new Map<string, number>();
    const secCounts = new Map<string, number>();

    for (const product of products) {
      const specId = product.specIdNumber?.value;
      if (!specId || specId.length < 4) continue;

      const divCode = getDivisionCode(specId);
      const secPrefix = getSectionPrefix(specId);

      divCounts.set(divCode, (divCounts.get(divCode) ?? 0) + 1);
      secCounts.set(secPrefix, (secCounts.get(secPrefix) ?? 0) + 1);
    }

    // Build the tree: only divisions/sections that have products
    const result: SidebarDivision[] = [];
    for (const div of DIVISIONS) {
      const divCount = divCounts.get(div.code) ?? 0;
      if (divCount === 0) continue;

      const sections: SidebarSection[] = [];
      for (const sec of SECTIONS) {
        if (sec.divisionCode !== div.code) continue;
        const secCount = secCounts.get(getSectionPrefix(sec.code)) ?? 0;
        if (secCount === 0) continue;
        sections.push({ code: sec.code, name: sec.name, count: secCount });
      }

      result.push({ code: div.code, name: div.name, count: divCount, sections });
    }
    return result;
  }, [products]);

  // Derived: which division is expanded (based on active filter)
  const expandedDivision = useMemo(() => {
    if (!activeFilter) return null;
    if (activeFilter.type === "division") return activeFilter.code;
    return getDivisionCode(activeFilter.code);
  }, [activeFilter]);

  // Human-readable label for the active filter
  const activeFilterLabel = useMemo(() => {
    if (!activeFilter) return null;
    if (activeFilter.type === "division") {
      const div = DIVISIONS.find((d) => d.code === activeFilter.code);
      return div ? `${div.code} - ${div.name}` : null;
    }
    const sec = SECTIONS.find((s) => s.code === activeFilter.code);
    return sec ? `${sec.code} - ${sec.name}` : null;
  }, [activeFilter]);

  const selectDivision = useCallback((divisionCode: string) => {
    setActiveFilter((prev) => {
      if (prev?.type === "division" && prev.code === divisionCode) return null;
      if (prev?.type === "section" && getDivisionCode(prev.code) === divisionCode) return null;
      return { type: "division", code: divisionCode };
    });
  }, []);

  const selectSection = useCallback((sectionCode: string) => {
    setActiveFilter((prev) => {
      if (prev?.type === "section" && prev.code === sectionCode) return null;
      return { type: "section", code: sectionCode };
    });
  }, []);

  /** Check if a specIdNumber value matches the active filter */
  const matchesFilter = useCallback(
    (specId: string | undefined | null): boolean => {
      if (!activeFilter) return true;
      if (!specId) return false;
      if (activeFilter.type === "division") {
        return productMatchesDivision(specId, activeFilter.code);
      }
      return productMatchesSection(specId, activeFilter.code);
    },
    [activeFilter],
  );

  const filterProducts = useCallback(
    (productsToFilter: ExtractedProduct[]): ExtractedProduct[] => {
      if (!activeFilter) return productsToFilter;
      return productsToFilter.filter((product) =>
        matchesFilter(product.specIdNumber?.value),
      );
    },
    [activeFilter, matchesFilter],
  );

  return {
    isOpen,
    toggleSidebar,
    activeFilter,
    clearFilter,
    activeFilterLabel,
    selectDivision,
    selectSection,
    expandedDivision,
    divisions,
    filterProducts,
    matchesFilter,
  };
}
