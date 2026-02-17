/**
 * Extract the division code (first 2 chars) from a specIdNumber.
 * e.g., "09 51 00" → "09"
 */
export function getDivisionCode(specId: string): string {
  return specId.substring(0, 2);
}

/**
 * Extract the section prefix (first 4 chars) from a specIdNumber.
 * This captures "DD S" which maps a Level 3 code to its parent Level 2 section.
 * e.g., "09 51 00" → "09 5" (matches section "09 50 00")
 */
export function getSectionPrefix(specId: string): string {
  return specId.substring(0, 4);
}

/**
 * Check if a product's specIdNumber belongs to a given division.
 * Matches by first 2 characters.
 */
export function productMatchesDivision(
  productSpecId: string,
  divisionCode: string,
): boolean {
  return getDivisionCode(productSpecId) === divisionCode;
}

/**
 * Check if a product's specIdNumber matches a given section.
 * Matches by first 4 characters ("DD S" prefix).
 * e.g., product "09 51 00" matches section "09 50 00" (both "09 5")
 */
export function productMatchesSection(
  productSpecId: string,
  sectionCode: string,
): boolean {
  return getSectionPrefix(productSpecId) === getSectionPrefix(sectionCode);
}
