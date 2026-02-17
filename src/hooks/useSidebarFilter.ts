import { useState, useMemo, useCallback } from "react";
import type { Product } from "@/types/product";
import { DIVISIONS, SECTIONS } from "@/data/masterformat";
import type { MasterFormatSection } from "@/data/masterformat";
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

export function useSidebarFilter(products: Product[]) {
  const [isOpen, setIsOpen] = useState(false);
  const [activeFilter, setActiveFilter] = useState<SidebarFilter>(null);

  const toggleSidebar = useCallback(() => setIsOpen((prev) => !prev), []);

  const clearFilter = useCallback(() => setActiveFilter(null), []);

  // Count products per division and per section prefix
  const { divisionCounts, sectionCounts } = useMemo(() => {
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

    return { divisionCounts: divCounts, sectionCounts: secCounts };
  }, [products]);

  // Only divisions that have at least one product
  const activeDivisions = useMemo(
    () => DIVISIONS.filter((d) => (divisionCounts.get(d.code) ?? 0) > 0),
    [divisionCounts],
  );

  // Sections grouped by division, only those with products
  const activeSectionsByDivision = useMemo(() => {
    const map = new Map<string, MasterFormatSection[]>();
    for (const section of SECTIONS) {
      const prefix = getSectionPrefix(section.code);
      if ((sectionCounts.get(prefix) ?? 0) > 0) {
        const arr = map.get(section.divisionCode) ?? [];
        arr.push(section);
        map.set(section.divisionCode, arr);
      }
    }
    return map;
  }, [sectionCounts]);

  // Derived: a division is expanded iff it (or one of its sections) is the active filter
  const expandedDivision = useMemo(() => {
    if (!activeFilter) return null;
    if (activeFilter.type === "division") return activeFilter.code;
    // Section code "09 30 00" → division code "09"
    return getDivisionCode(activeFilter.code);
  }, [activeFilter]);

  const selectDivision = useCallback((divisionCode: string) => {
    setActiveFilter((prev) => {
      // Already filtering this division → clear
      if (prev?.type === "division" && prev.code === divisionCode) {
        return null;
      }
      // A child section of this division is active → clear (close the folder)
      if (
        prev?.type === "section" &&
        getDivisionCode(prev.code) === divisionCode
      ) {
        return null;
      }
      return { type: "division", code: divisionCode };
    });
  }, []);

  const selectSection = useCallback((sectionCode: string) => {
    setActiveFilter((prev) => {
      if (prev?.type === "section" && prev.code === sectionCode) {
        return null;
      }
      return { type: "section", code: sectionCode };
    });
  }, []);

  // Apply sidebar filter to a product array
  const filterProducts = useCallback(
    (productsToFilter: Product[]): Product[] => {
      if (!activeFilter) return productsToFilter;

      return productsToFilter.filter((product) => {
        const specId = product.specIdNumber?.value;
        if (!specId) return false;

        if (activeFilter.type === "division") {
          return productMatchesDivision(specId, activeFilter.code);
        }
        return productMatchesSection(specId, activeFilter.code);
      });
    },
    [activeFilter],
  );

  // Compute a human-readable label for the active filter
  const activeFilterLabel = useMemo(() => {
    if (!activeFilter) return null;
    if (activeFilter.type === "division") {
      const div = DIVISIONS.find((d) => d.code === activeFilter.code);
      return div ? `${div.code} - ${div.name}` : null;
    }
    const sec = SECTIONS.find((s) => s.code === activeFilter.code);
    return sec ? `${sec.code} - ${sec.name}` : null;
  }, [activeFilter]);

  return {
    isOpen,
    toggleSidebar,
    activeFilter,
    clearFilter,
    activeFilterLabel,
    selectDivision,
    selectSection,
    expandedDivision,
    activeDivisions,
    activeSectionsByDivision,
    divisionCounts,
    sectionCounts,
    filterProducts,
  };
}
