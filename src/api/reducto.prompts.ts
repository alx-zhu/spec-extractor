/**
 * Reducto Extraction Prompts
 *
 * System prompts and schemas for extracting structured data from documents.
 * Each document type has its own extraction config (prompt + schema).
 */

import type { ProductDocumentType } from "@/types/product";

export interface ExtractionConfig {
  schema: Record<string, unknown>;
  prompt: string;
}

/**
 * JSON Schema for purchase order product extraction
 */
const PURCHASE_ORDER_SCHEMA = {
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
              "The CONCISE, HUMAN-RECOGNIZABLE product name that immediately tells an architect what the product IS in common industry terms. This must be a real product name — not a bare category, and not a long manufacturer description. Use the FULL descriptive product name when available, including adjectives and qualifiers that distinguish this product from similar ones. CORRECT: 'Mobile Ottoman' (NOT just 'Ottoman'), 'Height-Adjustable Desk' (NOT just 'Desk'), 'Dual Monitor Arm' (NOT just 'Monitor Arm'), 'Mesh-Back Task Chair' (NOT just 'Chair'), 'Acoustic Ceiling Panel', 'LED Panel Light', 'Lateral File Cabinet'. WRONG (manufacturer-specific descriptions, NOT names): 'M/Flex with M2.1 Dual Monitor Arms' → should be 'Dual Monitor Arm', 'Zody II - Mesh Back, Fabric Seat, 4D Arm' → should be 'Mesh-Back Task Chair'. If the document does NOT clearly indicate a recognizable product name, output 'N/A' — do NOT guess. NEVER include: manufacturer name, model/line name, detailed feature lists, tag, spec ID, finish, size, price, or dimensions.",
          },
          productDescription: {
            type: "string",
            description:
              "The FULL product description as written in the document, including the manufacturer's product line name, model name, and all distinguishing characteristics, features, and options. This is the detailed, manufacturer-specific description that identifies the exact product being specified. Examples: 'M/Flex with M2.1 Dual Monitor Arms and Slider, Dual Arm Bracket, Two-Piece Clamp Mount', 'Zody II - Mesh Back, Fabric Seat, 4D Arm, Asymmetrical Lumbar, Back Lock, Forward Tilt, Adjustable Seat, Plastic Base, Hard Caster', 'Ravel Lounge with Solid Ash Frame', 'Ultima Acoustic Ceiling Panel, Fine Fissured, Square Lay-In'. MUST NOT include: tag, spec ID number, finish/color, size/dimensions, price, or ANY information already captured in other columns. N/A if no description is available beyond the product name.",
          },
          manufacturer: {
            type: "string",
            description:
              "The company or brand name that produces the product. Verify this is an actual manufacturer, not a product descriptor or category. If uncertain whether a term is a manufacturer or product descriptor, use 'N/A'.",
          },
          tag: {
            type: "string",
            description:
              "The architect's project-specific reference code used in drawings and project documentation. This is distinct from the manufacturer's product identifier. Format varies (e.g., 'C-01', 'T-04', 'ACC-01', 'B-01'). Each unique tag should appear in ONLY ONE product entry. N/A if not found.",
          },
          specIdNumber: {
            type: "string",
            description:
              "The CSI Masterformat code (also known as CSI Section Number) that classifies this product's specification section. Follows the structure 'DD SS ss' where DD=division (2 digits), SS=section (2 digits), ss=subsection (2 digits). Common examples: '09 51 00' (Acoustical Ceilings), '08 71 00' (Door Hardware), '26 51 00' (Interior Lighting). Separators may be spaces, periods, dashes, or none. Only extract if the value matches this numeric Masterformat pattern. N/A if not found.",
          },
          project: {
            type: "string",
            description:
              "The project name or identifier from the document. N/A if not found.",
          },
          finish: {
            type: "string",
            description:
              "The finish designation for the architectural product, including color, surface finish, coating, material treatment, fabric grade, or any combination (e.g., 'Brushed Nickel', 'White', 'Powder Coated', 'Fabric - Grade 5 Bernhardt Plush 3550-033 Forest', 'Anthracite', 'Wood Veneer', 'Matte Black'). Include finish codes, color codes, fabric specifications, and material grades if present. N/A if not found.",
          },
          size: {
            type: "string",
            description:
              "Product dimensions in any format provided (e.g., WxDxH, LxWxH, diameter measurements, or other dimensional specifications). N/A if not found.",
          },
          price: {
            type: "string",
            description:
              "Unit price including currency symbol if present. N/A if not found.",
          },
          details: {
            type: "string",
            description:
              'Critical implementation notes, special requirements, or important exceptions that affect product specification, procurement, installation, or usage. Include only information that is essential for proper product implementation and does not fit into other defined fields. Examples: installation requirements (e.g., "Requires blocking in the wall"), special delivery instructions, product alternatives or substitutions, compatibility requirements, or critical usage limitations. EXCLUDE: any component of the item name, product description, finish (use Finish), dimensions (use Size), manufacturer (use Manufacturer), pricing, material grades or quality levels, standard product features, and all information already captured in other fields. Default to "N/A" unless the information represents a critical implementation consideration. Limit to 1-3 concise notes.',
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
        "List of all products extracted from the document. Each tag must appear in only one product entry.",
    },
  },
  required: ["products"],
} as const;

/**
 * System prompt for purchase order product extraction
 */
const PURCHASE_ORDER_PROMPT = `EXTRACTION TASK: Extract ALL products from furniture purchase orders into precise, structured data for catalog reference.

CRITICAL RULE - ONE PRODUCT PER TAG:
When a TAG is present (e.g., "CH-01", "T-04"), extract ONLY ONE product entry for that tag. If a description appears to have multiple components or features, consolidate them into a SINGLE entry. Do NOT create separate product rows for what is clearly one tagged item with multiple descriptive parts.

═══════════════════════════════════════════════════════════════════
MOST IMPORTANT DISTINCTION — Product Name vs. Product Description:
═══════════════════════════════════════════════════════════════════

These two fields are SEPARATE and serve very different purposes:

** Product Name (itemName) ** — The CONCISE, HUMAN-RECOGNIZABLE product name.
   This is what an architect would call this product in plain language.
   It must be a real, descriptive product name that ANYONE would understand.

   IMPORTANT: Use the FULL descriptive name, not just the shortest category.
   Include adjectives and qualifiers that distinguish the product.

   CORRECT examples (note: descriptive, but still concise):
     "Mobile Ottoman" — NOT just "Ottoman"
     "Height-Adjustable Desk" — NOT just "Desk"
     "Dual Monitor Arm" — NOT just "Monitor Arm"
     "Mesh-Back Task Chair" — NOT just "Chair"
     "Stacking Guest Chair" — NOT just "Chair"
     "Acoustic Ceiling Panel" — NOT just "Ceiling Panel"
     "LED Panel Light" — NOT just "Light"
     "Lateral File Cabinet" — NOT just "File Cabinet"
     "Vertical Cable Manager" — NOT just "Cable Manager"
     "Standing-Height Table" — NOT just "Table"
     "Frameless Shower Door" — NOT just "Shower Door"
     "Pendant Light"
     "Wire Manager"
     "Keyboard Tray"
     "Privacy Screen"
     "Conference Table"

   WRONG examples (these are descriptions, NOT names):
     "M/Flex with M2.1 Dual Monitor Arms and Slider" → should be "Dual Monitor Arm"
     "Zody II - Mesh Back, Fabric Seat, 4D Arm" → should be "Mesh-Back Task Chair"
     "Ravel Lounge with Solid Ash Frame" → should be "Lounge Chair"
     "Ultima Fine Fissured Square Lay-In" → should be "Acoustic Ceiling Panel"
     "LP-24-LED-4000K Lithonia Panel" → should be "LED Panel Light"

   NEVER include in the product name:
     - Manufacturer name (e.g., "Humanscale", "Haworth")
     - Model number or line name (e.g., "Zody II", "M/Flex", "Ravel")
     - Detailed feature lists (e.g., "Mesh Back, 4D Arm, Asymmetrical Lumbar")
     - Tag, spec ID, finish, size, or price

   If you CANNOT determine a clear, common product name, use "N/A".
   STRONGLY prefer "N/A" over guessing — an incorrect name is worse than no name.

** Product Description (productDescription) ** — The FULL manufacturer-specific description.
   This is the detailed product line, model name, configuration, and features
   exactly as written in the document.

   CORRECT examples:
     "M/Flex with M2.1 Dual Monitor Arms and Slider, Dual Arm Bracket, Two-Piece Clamp Mount"
     "Zody II - Mesh Back, Fabric Seat, 4D Arm, Asymmetrical Lumbar, Back Lock, Forward Tilt, Adjustable Seat, Plastic Base, Hard Caster"
     "Ravel Lounge with Solid Ash Frame"
     "Ultima Acoustic Ceiling Panel, Fine Fissured, Square Lay-In"

   MUST NOT include: tag, spec ID number, finish/color, size/dimensions, price,
   or ANY information already captured in other columns.
   N/A if no description beyond the product name is available.

═══════════════════════════════════════════════════════════════════

CORE FIELDS (populate with "N/A" if information is genuinely absent):

- Item Name (Product Name): See above — the CONCISE, DESCRIPTIVE product name. Use the full descriptive name when the document provides it (e.g., "Mobile Ottoman" not just "Ottoman").

- Product Description: See above — the FULL manufacturer-specific description.

- Manufacturer: The company or brand name that produces the product. Verify this is an actual manufacturer, not a product descriptor or category. If uncertain whether a term is a manufacturer or product descriptor, use "N/A".

- Tag: The architect's project-specific reference code used in drawings and project documentation (e.g., "C-01", "T-04", "ACC-01", "B-01"). This is typically found in a dedicated "TAG" column. Each unique tag should appear in ONLY ONE product entry.

- Spec ID Number: The CSI Masterformat code (also known as CSI Section Number) that classifies this product's specification section. Follows the structure "DD SS ss" where DD=division (2 digits), SS=section (2 digits), ss=subsection (2 digits). Common examples: "09 51 00" (Acoustical Ceilings), "08 71 00" (Door Hardware), "26 51 00" (Interior Lighting). Separators may be spaces, periods, dashes, or none. Only extract if the value matches this numeric Masterformat pattern. N/A if not found.

- Project: The project name or identifier from the document. N/A if not found.

SECONDARY FIELDS (populate with "N/A" if absent):

- Finish: The finish designation for the architectural product, including color, surface finish, coating, material treatment, fabric grade, or any combination (e.g., "Fabric - Grade 5 Bernhardt Plush 3550-033 Forest, Base - 845", "Brushed Nickel", "Powder Coated", "Matte Black"). Include finish codes, color codes, fabric specifications, and material grades if present.

- Size: Product dimensions in any format provided (e.g., "24\\"W x 15.25\\"D x 18\\"H", "WxDxH", "LxWxH", diameter measurements, or other dimensional specifications).

- Price: Unit price including currency symbol if present. If there are multiple prices (unit price, extended price, total price), you MUST extract the unit price only.

- Details: Critical implementation notes, special requirements, or important exceptions that affect product specification, procurement, installation, or usage. Include only information that is essential for proper product implementation and does not fit into other defined fields. Examples: installation requirements (e.g., "Requires blocking in the wall"), special delivery instructions, product alternatives or substitutions (e.g., "Alternate for Pip in All Black"), compatibility requirements, or critical usage limitations. EXCLUDE: any component already captured in Item Name, Product Description, Finish, Size, Manufacturer, or pricing. Default to "N/A" unless the information represents a critical implementation consideration. Limit to 1-3 concise notes.

EXTRACTION GUIDELINES:

- Extract every line item that is a product - missing products is a critical error.
- ONE PRODUCT PER TAG: Each tag must correspond to exactly ONE product entry. Never create multiple rows with the same tag.
- Do not include non-product line items, like services (freight, tax, install).
- One product entry per line item.
- Consolidate multi-line descriptions into a single entry per product.
- Use "N/A" when information cannot be confidently identified - do not guess or infer.
- For Product Name: if you are not confident in a common, generic name, use "N/A". Do NOT put the full description here.
- Preserve document order in output.
- Only extract explicitly stated information.

OUTPUT: Return valid JSON array of product objects. Each object must include all defined fields (use "N/A" for missing values).

VALIDATION CHECKLIST:

- Item Name (Product Name): Is this a CONCISE, DESCRIPTIVE product name like "Dual Monitor Arm" or "Mesh-Back Task Chair"? If it contains a model name, brand, or detailed feature lists, it is WRONG — move that to Product Description. If it is too vague (e.g., just "Chair" or "Light"), add the distinguishing qualifier.
- Product Description: Does this contain the full manufacturer-specific description WITHOUT duplicating tag, spec ID, finish, size, or price?
- Manufacturer: Is this verifiably a company/brand name, not a product descriptor?
- Tag: Is this the architect's identifier from the TAG column? Does each tag appear only ONCE in the output?
- Spec ID Number: Does this match a CSI Section Number / Masterformat structure exactly?
- Finish: Have I captured all finish, color, fabric, and material specifications?
- Details: Are these critical implementation notes, not information already in other fields?
- Tag uniqueness: Have I verified that no tag appears in multiple product entries?
`;

const SPECIFICATION_SCHEMA = {
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
              "The CONCISE, HUMAN-RECOGNIZABLE product category name as it would be referenced in common architectural language. Use the FULL descriptive name, not just the shortest category. CORRECT: 'Wood Athletic Flooring' (NOT just 'Flooring'), 'Acoustic Ceiling Panel' (NOT just 'Ceiling Panel'), 'Plastic Laminate Locker' (NOT just 'Locker'), 'Door Hardware', 'Carpet Tile'. WRONG: 'Wood athletic flooring, fixed system, random length plank flooring, oak, select grade' — this is a description, not a name. WRONG: 'Junckers SylvaSquash' — this is a manufacturer product line. If you cannot determine a clear common product name, use 'N/A'. NEVER include manufacturer names, model numbers, or detailed features here.",
          },
          productDescription: {
            type: "string",
            description:
              "The FULL product description including manufacturer product line, model name, system type, and all distinguishing characteristics from the specification. Include the basis-of-design product line name if specified (e.g., 'Junckers SylvaSquash, fixed system, random length plank flooring, oak, select grade', 'Armstrong Ultima, Fine Fissured, Square Lay-In'). MUST NOT include: tag, spec ID number, finish/color, size/dimensions, price, or information already in other columns. N/A if no description beyond the product name is available.",
          },
          manufacturer: {
            type: "string",
            description:
              "List manufacturers from the manufacturer approval subsection in order of preference. Basis-of-Design manufacturer FIRST if specified, then other approved manufacturers, then 'or approved equal' if stated. Format as comma-separated string. ONLY extract from explicit manufacturer approval subsections - do not infer manufacturers from generic text.",
          },
          tag: {
            type: "string",
            description:
              "The architect's project-specific reference code if present. Usually N/A in specifications (tags typically appear in schedules and drawings). If tags ARE present, each unique tag should appear in ONLY ONE product entry.",
          },
          specIdNumber: {
            type: "string",
            description:
              "The CSI section number from the specification header. Format as shown in the document (may use spaces, periods, or dashes as separators).",
          },
          project: {
            type: "string",
            description:
              "Extract from specification header/cover page if present, otherwise N/A.",
          },
          finish: {
            type: "string",
            description:
              "Color designation, surface finish, coating, or material treatment specified for the product. N/A if not specified or deferred to drawings.",
          },
          size: {
            type: "string",
            description:
              "Dimensional requirements for the product. N/A if not specified or deferred to drawings.",
          },
          price: {
            type: "string",
            description: "N/A (specifications do not contain pricing).",
          },
          details: {
            type: "string",
            description:
              "Performance requirements, ratings, certifications, or standards that define product acceptance criteria. Extract 2-4 critical specifications. EXCLUDE: installation methods, supporting material specifications, information already in other fields. N/A if no specific criteria stated.",
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
        "List of primary products extracted from the specification. Each product should have a short generic name (itemName) and a full manufacturer-specific description (productDescription).",
    },
  },
  required: ["products"],
} as const;

const SPECIFICATION_PROMPT = `EXTRACTION TASK: Extract PRIMARY products from CSI 3-part specifications. Extract only products with explicit manufacturer approval sections that belong to the specification's CSI Masterformat section.

DOCUMENT CONTEXT:
You are processing a specification section with a CSI Masterformat code that defines what product category this section specifies (e.g., "09 64 66" = Wood Athletic Flooring, "08 71 00" = Door Hardware, "12 50 00" = Furniture).

NAVIGATION:
1. Locate the specification section with the target CSI Masterformat code
2. Navigate directly to "Part 2 - Products"
3. Ignore Part 1 (General) and Part 3 (Execution)

CRITICAL PRODUCT IDENTIFICATION RULES:

1. MANUFACTURER APPROVAL REQUIREMENT:
   Extract a product ONLY if it has an EXPLICIT MANUFACTURER APPROVAL subsection in Part 2:
   - "2.X MANUFACTURERS" followed by a list of company names
   - "Basis-of-Design: [Company Name] [Product]"
   - "Acceptable Manufacturers: [Company A], [Company B], or approved equal"

   DO NOT extract if subsection only has:
   - ASTM/industry standards without manufacturer names
   - "Manufacturer's standard" without specific company names
   - Generic material descriptions

2. MASTERFORMAT ALIGNMENT REQUIREMENT:
   The product MUST belong to the CSI Masterformat section being specified.

   Example: In section "09 64 66 - Wood Athletic Flooring":
   ✓ EXTRACT: Wood athletic flooring (this IS 09 64 66)
   ✗ SKIP: Plywood underlayment (this is 06 16 00, not the subject of this spec)
   ✗ SKIP: Adhesives (this is 09 60 00, supporting material)
   ✗ SKIP: Vapor retarders (this is 07 26 00, supporting material)

   Example: In section "08 71 00 - Door Hardware":
   ✓ EXTRACT: Locksets, hinges, closers (these ARE 08 71 00)
   ✗ SKIP: Fasteners, anchors (supporting materials from different sections)

   If uncertain whether a product belongs to the spec's Masterformat section, ask: "Is this product the reason this specification section exists?" If no, skip it.

ANCHOR FIELDS - Look for manufacturer approval subsections in Part 2 that specify the section's primary product category.

CRITICAL RULE - ONE PRODUCT PER TAG (if tags present):
If architect's tags appear in the specification, extract ONLY ONE product entry per tag. Consolidate all components and features for a single tag into ONE entry.

═══════════════════════════════════════════════════════════════════
MOST IMPORTANT DISTINCTION — Product Name vs. Product Description:
═══════════════════════════════════════════════════════════════════

These two fields are SEPARATE and serve very different purposes:

** Product Name (itemName) ** — The CONCISE, HUMAN-RECOGNIZABLE product category.
   This is the CSI Masterformat product type name in plain language.

   IMPORTANT: Use the FULL descriptive name, not just the shortest category.

   CORRECT examples (note: descriptive, but still concise):
     "Wood Athletic Flooring" — NOT just "Flooring"
     "Acoustic Ceiling Panel" — NOT just "Ceiling Panel"
     "Plastic Laminate Locker" — NOT just "Locker"
     "Door Hardware"
     "Carpet Tile"
     "Interior Paint"
     "Resilient Base"
     "Ceramic Wall Tile"
     "Frameless Shower Door"

   WRONG examples (too specific/contain manufacturer info):
     "Wood athletic flooring, fixed system, random length plank flooring, oak, select grade" → should be "Wood Athletic Flooring"
     "Junckers SylvaSquash" → should be "Wood Athletic Flooring"
     "Armstrong Ultima Fine Fissured" → should be "Acoustic Ceiling Panel"
     "Wood Athletic Flooring - Junckers SylvaSquash" → should be "Wood Athletic Flooring"

   NEVER include in the product name:
     - Manufacturer name, model number, or product line name
     - Material grades, species, system types
     - Tag, spec ID, finish, size, or price

   If you CANNOT determine a clear, common product name, use "N/A".
   STRONGLY prefer "N/A" over guessing.

** Product Description (productDescription) ** — The FULL specification description.
   This includes the manufacturer's product line, system type, material details,
   and all distinguishing characteristics from the spec.

   CORRECT examples:
     "Junckers SylvaSquash, fixed system, random length plank flooring, oak, select grade"
     "Armstrong Ultima, Fine Fissured, Square Lay-In"
     "Schlage ND-series, cylindrical lockset"

   MUST NOT include: tag, spec ID number, finish/color, size/dimensions, price,
   or information already in other columns.
   N/A if no description beyond the product name is available.

═══════════════════════════════════════════════════════════════════

CORE FIELDS:

- Item Name (Product Name): See above — the CONCISE, DESCRIPTIVE product category name. Use the full descriptive name when the document provides it (e.g., "Wood Athletic Flooring" not just "Flooring").

- Product Description: See above — the FULL manufacturer-specific description from the specification.

- Manufacturer: List manufacturers from the manufacturer approval subsection in order of preference. Basis-of-Design manufacturer FIRST if specified, then other approved manufacturers, then "or approved equal" if stated. Format as comma-separated string. ONLY extract from explicit manufacturer approval subsections.

- Tag: The architect's project-specific reference code if present in the specification. Format varies (e.g., "C-01", "T-04", "ACC-01", "B-01"). Usually N/A in specifications (tags typically appear in door/window schedules and drawings, not in spec sections). If tags ARE present, each unique tag should appear in ONLY ONE product entry.

- Spec ID Number (Masterformat Code): The CSI section number from the specification header. Format as shown in the document (may use spaces, periods, or dashes as separators).

- Project: Extract from specification header/cover page if present, otherwise N/A.

SECONDARY FIELDS:

- Finish: Color designation, surface finish, coating, or material treatment specified for the product. N/A if not specified or deferred to drawings.

- Size: Dimensional requirements for the product. N/A if not specified or deferred to drawings.

- Price: N/A (specifications do not contain pricing).

- Details: Key product characteristics and performance requirements that define the specification. Include: material type, grade, system type, critical performance criteria, ratings, certifications, or standards (e.g., "Species: Oak; Grade: Select; Fixed system", "Grade 1; Fire Rating: 3-hour", "NRC 0.70 minimum; CAC 35 minimum"). Extract 2-4 critical specifications. EXCLUDE: installation methods, supporting material specifications, information already in Item Name, Product Description, or Finish. N/A if no specific criteria stated.

EXTRACTION RULES:

- Extract ONLY products with explicit manufacturer approval subsections
- Extract ONLY products that belong to this specification's Masterformat section
- Do NOT extract materials from other Masterformat sections (underlayment, adhesives, fasteners, vapor retarders, sealants, primers, backing materials)
- Do NOT extract supporting materials, components, or accessories that serve the primary product but are not the subject of the specification
- If Part 2 has multiple subsections with manufacturer approvals, verify each belongs to the spec's Masterformat section before extracting
- ONE PRODUCT PER TAG: If tags are present, each tag corresponds to exactly ONE product entry
- Maintain manufacturer preference order when specified
- Preserve "or approved equal" language when present
- Only extract from Part 2 - ignore Parts 1 and 3
- For Product Name: if you cannot determine a clear common product category, use "N/A". Do NOT put the full description here.

OUTPUT: Return valid JSON array of product objects. Each object must include all defined fields (use "N/A" for missing values).

VALIDATION CHECKLIST:

- Manufacturer Approval: Does this product have a dedicated manufacturer approval subsection with specific company names?
- Masterformat Alignment: Does this product belong to the CSI Masterformat section being specified? Is this product the reason this spec section exists?
- Item Name (Product Name): Is this a CONCISE, DESCRIPTIVE product category like "Wood Athletic Flooring" or "Door Hardware"? If it contains a model name, brand, or detailed features, it is WRONG — move that to Product Description. If it is too vague (e.g., just "Flooring" or "Panel"), add the distinguishing qualifier.
- Product Description: Does this contain the full manufacturer-specific description WITHOUT duplicating tag, spec ID, finish, size, or price?
- Tag Format: If present, does the tag match patterns like "C-01", "T-04", "ACC-01" (not generic text)?
- Tag Uniqueness: If tags exist, does each appear only once?
- Spec ID Number: Does this match the section number from the header?
- Supporting Materials: Have I avoided extracting materials from other Masterformat sections that support but are not the subject of this specification?`;

/**
 * Extraction configs per document type.
 *
 * Each document type maps to its own prompt and schema. For now, all types
 * share the purchase order config as a placeholder until dedicated prompts
 * are developed.
 */
const EXTRACTION_CONFIGS: Record<ProductDocumentType, ExtractionConfig> = {
  purchase_order: {
    schema: PURCHASE_ORDER_SCHEMA,
    prompt: PURCHASE_ORDER_PROMPT,
  },
  specification: {
    schema: SPECIFICATION_SCHEMA,
    prompt: SPECIFICATION_PROMPT,
  },
  drawing: {
    schema: PURCHASE_ORDER_SCHEMA,
    prompt: PURCHASE_ORDER_PROMPT,
  },
  rfi: {
    schema: PURCHASE_ORDER_SCHEMA,
    prompt: PURCHASE_ORDER_PROMPT,
  },
  submittal: {
    schema: PURCHASE_ORDER_SCHEMA,
    prompt: PURCHASE_ORDER_PROMPT,
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
