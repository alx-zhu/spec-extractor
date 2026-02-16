/**
 * Reducto Extraction Prompts
 *
 * Shared schema + base prompt with document-type-specific addendums.
 * Schema descriptions handle field-level guidance (what each field IS).
 * System prompt handles document-level context (extraction scope, invariants).
 */

import type { ProductDocumentType } from "@/types/product";

export interface ExtractionConfig {
  schema: Record<string, unknown>;
  prompt: string;
}

/**
 * Shared JSON schema for all document types.
 * Field descriptions tell the LLM what belongs in each field and what does not.
 */
const PRODUCT_SCHEMA = {
  type: "object",
  properties: {
    products: {
      type: "array",
      items: {
        type: "object",
        properties: {
          itemName: {
            type: "string",
            description:
              "The concise, human-recognizable product name — what an architect would call this in plain language. Use the full descriptive category including qualifiers that distinguish it (e.g. 'Height-Adjustable Desk' not just 'Desk', 'Carpet Tile' not just 'Carpet', 'Acoustic Ceiling Panel' not just 'Panel'). NEVER include manufacturer name, model/line name, or feature lists — those belong in productDescription. 'N/A' if no clear common name can be determined.",
          },
          productDescription: {
            type: "string",
            description:
              "The full manufacturer-specific description verbatim from the document, including product line, model name/number, and configuration details. This is the searchable identifier for procurement. MUST NOT include tag, specIdNumber, finish, size, or price. 'N/A' if nothing beyond the product name exists.",
          },
          manufacturer: {
            type: "string",
            description:
              "The company or brand name that produces the product. Must be an actual manufacturer, not a product descriptor or category. 'N/A' if uncertain.",
          },
          tag: {
            type: "string",
            description:
              "The architect's project-specific reference code. MUST match pattern: one or more uppercase letters, optional dash, then one or more digits (e.g. 'C-01', 'EQ1', 'ACC-01', 'LVT-01'). Cannot be only numbers or only letters. May appear in a TAG column, as 'Tag 1: XX-##' inline, or as a Type/Mark identifier. 'N/A' if not found or doesn't match pattern.",
          },
          specIdNumber: {
            type: "string",
            description:
              "CSI Masterformat section number in DD SS ss format (e.g. '09 51 00', '08 71 00', '10 28 19.16'). Must be a valid CSI division/section. Separators may be spaces, periods, dashes, or none. 'N/A' if not found or doesn't match.",
          },
          project: {
            type: "string",
            description:
              "Project name or identifier from the document header/title block. 'N/A' if not found.",
          },
          finish: {
            type: "string",
            description:
              "ALL finish specifications combined into one value. Include every listed finish entry: color, surface finish, coating, material treatment, fabric grade/code, base finish, frame finish, trim finish, etc. When multiple finish lines are listed (e.g. 'A. Fabric - Grade 5 Bernhardt Plush 3550-033 Forest', 'B. Base - 845'), combine ALL of them separated by commas. Also extract finishes from labeled subsections (e.g. '2.5 FINISHES' in specifications). 'N/A' if not found.",
          },
          size: {
            type: "string",
            description:
              "Product dimensions in any format (e.g. '24\"W x 15.25\"D x 18\"H', '18\" X 36\"'). 'N/A' if not found.",
          },
          price: {
            type: "string",
            description:
              "Unit price (not extended/total) with currency symbol. 'N/A' if not found.",
          },
          details: {
            type: "string",
            description:
              "Critical implementation notes not captured in other fields: installation requirements, 'Provided by' designations, delivery instructions, product alternatives, contact info. 1-3 concise notes. 'N/A' if none.",
          },
        },
        required: [
          "itemName",
          "productDescription",
          "manufacturer",
          "tag",
          "specIdNumber",
          "project",
          "finish",
          "size",
          "price",
          "details",
        ],
      },
      description:
        "List of all products extracted from the document.",
    },
  },
  required: ["products"],
} as const;

/**
 * Base prompt shared by all document types.
 * Contains invariants, field guidance, and validation rules.
 */
const BASE_PROMPT = `Extract ALL products from this document into structured data.

INVARIANTS — these rules are absolute and override all other guidance:

1. TABLE ROW = PRODUCT: When data is in table format, one row = one product. All information for a product MUST come from that row only. Never merge data across rows or split a single row into multiple products.

2. TAG FORMAT: Tags must contain uppercase letters AND digits, with an optional dash separator (e.g. "C-01", "EQ1", "ACC-01"). A value that is only numbers or only letters is NOT a valid tag — use "N/A".

3. ONE PRODUCT PER TAG: Each unique tag appears in exactly one product entry. Never duplicate tags. If a tagged item has multi-line descriptions, consolidate into one entry.

4. CSI MASTERFORMAT: specIdNumber must follow DD SS ss format (e.g. "09 51 00", "08 71 00"). Must be a real CSI Masterformat number. If the value doesn't match, use "N/A".

5. CORE FIELD ACCURACY: productDescription, manufacturer, tag, and specIdNumber MUST be verbatim from the document. Never paraphrase, infer, or fabricate these values.

6. COMPLETE VALUES: Always extract the FULL content for every field. When a field spans multiple lines, sub-items, or list entries, include ALL of them. Never truncate or take only the first line.
   - If a finish column/section lists "A. Fabric - Grade 5 Bernhardt Plush 3550-033 Forest, B. Base - 845", extract the ENTIRE value: "Fabric - Grade 5 Bernhardt Plush 3550-033 Forest, Base - 845".
   - If a description spans multiple bullet points or lines, consolidate ALL lines into the productDescription.
   - If a table cell contains multi-line content, capture every line.

FIELD GUIDANCE:

itemName vs productDescription — these serve different purposes:
- itemName: What the product IS in plain language. A concise category name any architect would recognize.
  CORRECT: "Task Chair", "Monitor Arm", "Carpet Tile", "Lounge Chair", "Acoustic Ceiling Panel", "Mobile Ottoman"
  WRONG: "Zody II - Mesh Back, Fabric Seat, 4D Arm" (this is a description), "Humanscale M/Flex" (this has manufacturer/model)
  Use "N/A" rather than guessing — an incorrect name is worse than no name.

- productDescription: The full manufacturer-specific description exactly as written in the document. Includes product line, model name/number, configuration, and features. This is what someone would search to find and purchase the exact product.
  CORRECT: "Zody II - Mesh Back, Fabric Seat, 4D Arm, Asymmetrical Lumbar, Back Lock, Forward Tilt, Adjustable Seat, Plastic Base, Hard Caster"
  MUST NOT include: tag, specIdNumber, finish, size, or price.

GENERAL RULES:
- Use "N/A" for any field that cannot be confidently identified. Do not guess or infer.
- Skip non-product items (services, freight, tax, delivery, installation).
- Preserve document order in output.
- Extract every product — missing products is a critical error.

OUTPUT: Return valid JSON with a products array. Each object must include all fields (use "N/A" for missing values).

VALIDATION — before returning, verify each product:
- itemName: Is this a concise category name, free of manufacturer/model details?
- productDescription: Is this verbatim from the document, without tag/finish/size/price?
- manufacturer: Is this a real company name, not a product descriptor?
- tag: Does it match the LETTERS+DIGITS pattern? Does each tag appear only once?
- specIdNumber: Does it match DD SS ss Masterformat format?`;

/**
 * Purchase order / budget estimate / sales order addendum.
 */
const PURCHASE_ORDER_ADDENDUM = `DOCUMENT TYPE: Purchase Order / Budget Estimate / Sales Order

EXTRACTION SCOPE: Extract all line items that represent products. These documents typically have tabular layouts with TAG, MANUFACTURER, DESCRIPTION, FINISHES, and PRICE columns — or per-product pages with the same fields.

PRICE: When multiple prices exist (unit, extended, total), extract only the unit price.

TAGS: May appear in a dedicated TAG column, or inline as "Tag 1: XX-##" within the description.

MULTI-COMPONENT PRODUCTS: Some products (e.g. private office systems) list multiple components under a single tag. Consolidate all components into one productDescription entry for that tag.

FINISHES: These documents often list finishes as multiple labeled entries (e.g. "A. Fabric - Grade 5 Bernhardt Plush 3550-033 Forest", "B. Base - 845", "C. Arm - Aluminum with Black Cap"). Extract ALL finish entries combined, separated by commas. Never take only the first entry.`;

/**
 * CSI 3-part specification addendum.
 */
const SPECIFICATION_ADDENDUM = `DOCUMENT TYPE: CSI 3-Part Specification

EXTRACTION SCOPE: Extract ONLY from Part 2 - Products. Ignore Part 1 (General) and Part 3 (Execution).

PRODUCT IDENTIFICATION:
- Extract a product ONLY if it has an explicit manufacturer approval subsection in Part 2 (e.g. "2.X MANUFACTURERS" with company names, "Basis-of-Design: [Company]", or "Acceptable Manufacturers: [Company A], [Company B], or approved equal").
- Do NOT extract if the subsection only references ASTM standards, "manufacturer's standard" without names, or generic material descriptions.

MASTERFORMAT ALIGNMENT: The product must belong to the CSI section being specified. Ask: "Is this product the reason this specification section exists?" If no, skip it. Do not extract supporting materials from other Masterformat sections (underlayment, adhesives, fasteners, vapor retarders, sealants, primers).

MANUFACTURER: List manufacturers from the approval subsection in preference order. Basis-of-Design first, then alternatives, then "or approved equal" if stated.

WHERE TO FIND FIELD VALUES IN PART 2:
- productDescription: Assemble from the MATERIALS, SYSTEM DESCRIPTION, and product model subsections. Include system type, material species/grade, model name, and all configuration details.
- finish: Look for a dedicated FINISHES subsection (e.g. "2.5 FINISHES") AND for inline "Finish:" entries within product component listings. Extract ALL finish info — sealer types, finish coat types, chromium plating specs, etc.
- size: Look for dimensional info in MATERIALS or MODEL subsections. If deferred to drawings ("as indicated on Drawings"), use "N/A".
- details: Include key performance requirements, ratings, certifications, material grades, system types, and hardware specs (e.g. "Species: Oak; Grade: Select; Fixed system", "Locks: Digilock", "Glass: 1/2-inch clear tempered, ASTM C 1048").

PRICE: Always "N/A" — specifications do not contain pricing.
TAG: Usually "N/A" — tags typically appear in schedules and drawings, not spec sections.`;

/**
 * Architectural drawing schedule addendum.
 */
const DRAWING_ADDENDUM = `DOCUMENT TYPE: Architectural Drawing with Schedule Tables

EXTRACTION SCOPE: Extract ONLY from tables explicitly labeled as schedules (Equipment Schedule, Finish Schedule, Door Schedule, Window Schedule, Plumbing Fixture Schedule, Lighting Schedule, Furniture Schedule, Appliance Schedule).

IGNORE all other drawing content: elevations, floor plans, sections, detail drawings, dimensions, annotations, callouts, keynotes, legends, title blocks (except project name), graphical furniture layouts, and device mounting diagrams.

If the drawing contains NO schedule tables, return an empty products array.

COLUMN MAPPING — schedule columns vary by type. Map them to product fields:
- TAG / Type / Mark / ID → tag
- DESCRIPTION / Name → itemName + productDescription
- MFGR / MANUFACTURER / Mfr → manufacturer
- MODEL / MODEL NAME / MODEL NUMBER / Cat. No. → include in productDescription
- FINISH / COLOR / Material → finish
- SIZE / Dimensions → size
- PROVIDED BY / CONTACT / COMMENTS / NOTE / Remarks → details

Unmapped columns with useful product info go into details. Ignore administrative columns.

PRICE: Always "N/A" — drawing schedules do not contain pricing.

COMPLETENESS: Extract ALL rows from ALL schedule tables on the drawing, even rows with incomplete data. Use "N/A" for missing fields but preserve whatever information IS present.

FULL CELL VALUES: Schedule cells often contain multi-line content. Always extract the COMPLETE cell content — every line, every sub-entry. If a FINISH cell lists multiple finishes or a DESCRIPTION cell spans multiple lines, include all of it.`;

/**
 * Extraction configs per document type.
 * Simple string concatenation: BASE_PROMPT + type-specific addendum.
 */
const EXTRACTION_CONFIGS: Record<ProductDocumentType, ExtractionConfig> = {
  purchase_order: {
    schema: PRODUCT_SCHEMA,
    prompt: BASE_PROMPT + "\n\n" + PURCHASE_ORDER_ADDENDUM,
  },
  specification: {
    schema: PRODUCT_SCHEMA,
    prompt: BASE_PROMPT + "\n\n" + SPECIFICATION_ADDENDUM,
  },
  drawing: {
    schema: PRODUCT_SCHEMA,
    prompt: BASE_PROMPT + "\n\n" + DRAWING_ADDENDUM,
  },
  rfi: {
    schema: PRODUCT_SCHEMA,
    prompt: BASE_PROMPT + "\n\n" + PURCHASE_ORDER_ADDENDUM,
  },
  submittal: {
    schema: PRODUCT_SCHEMA,
    prompt: BASE_PROMPT + "\n\n" + PURCHASE_ORDER_ADDENDUM,
  },
};

/**
 * Get the extraction config (prompt + schema) for a given document type.
 */
export function getExtractionConfig(
  documentType: ProductDocumentType,
): ExtractionConfig {
  return EXTRACTION_CONFIGS[documentType];
}
