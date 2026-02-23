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
              "The architect's project-specific reference code. STRICT FORMAT: Must be CAPITAL LETTERS followed by DIGITS, with optional dash (e.g., 'C-01', 'T-04', 'ACC-01', 'EQ1'). REJECT and use 'N/A' for: pure numbers ('01', '123'), pure letters ('ACC', 'EQ'), lowercase ('c-01'), descriptions ('Chair'), model numbers ('K-28669-9-2MB', '5T524'). Each tag must appear in exactly ONE product entry.",
          },
          specIdNumber: {
            type: "string",
            description:
              "The CSI Masterformat code (CSI Section Number). Structure: 'DD SS ss' (2-digit division, 2-digit section, 2-digit subsection). Examples: '09 51 00', '08 71 00', '26 51 00'. Separators may be spaces, periods, dashes, or none. Only extract if value matches this numeric pattern. N/A if not found.",
          },
          project: {
            type: "string",
            description:
              "The project name or identifier from the document. N/A if not found.",
          },
          finish: {
            type: "string",
            description:
              "The finish designation, including color, surface finish, coating, material treatment, fabric grade, or combination (e.g., 'Brushed Nickel', 'Fabric - Grade 5 Bernhardt Plush 3550-033 Forest', 'Matte Black'). Include finish codes, color codes, fabric specs, material grades if present. MUST come from THIS product's row only. N/A if not found.",
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

═══════════════════════════════════════════════════════════════════
CRITICAL RULE #1 — STRICT ROW ISOLATION:
═══════════════════════════════════════════════════════════════════

Each product entry MUST contain ONLY information from its own table row. NEVER pull data from adjacent rows.

- If a field is empty in a row, output "N/A" — do NOT fill it with data from the row above or below.
- If a description spans multiple lines WITHIN the same cell, consolidate it. But NEVER merge data across rows.
- Double-check: for every field you extract, verify it belongs to the SAME row as the tag/identifier for that product.

VIOLATION EXAMPLES (these are WRONG):
  - Copying the manufacturer from the row above because the current row's manufacturer cell is empty
  - Using a finish value from a different product's row
  - Combining descriptions from two separate row entries into one product

═══════════════════════════════════════════════════════════════════
CRITICAL RULE #2 — EXTRACT EVERY SINGLE ROW:
═══════════════════════════════════════════════════════════════════

You MUST extract EVERY product line item in the document. Missing even one product is a critical error.

- Count the number of product rows in the table. Your output MUST have the same number of product entries.
- If a row has sparse data (only a tag and description, no manufacturer), still extract it with "N/A" for missing fields.
- If a row has only a tag and no other data, still extract it.
- After extraction, verify: "Did I extract every row? Is my product count equal to the row count?"

═══════════════════════════════════════════════════════════════════
CRITICAL RULE #3 — TAG FORMAT ENFORCEMENT:
═══════════════════════════════════════════════════════════════════

Tags MUST match this pattern: one or more CAPITAL LETTERS, optionally followed by a dash, then one or more DIGITS.
Valid examples: C-01, T-04, ACC-01, B-01, EQ1, EQ-01, CH-03, WB-1
Invalid examples that MUST be rejected (use "N/A" instead):
  - Pure numbers: "01", "123", "4"
  - Pure letters: "ACC", "EQ", "CHAIR"
  - Lowercase: "c-01", "eq1"
  - Descriptions: "Chair", "Table", "Equipment"
  - Model numbers: "K-28669-9-2MB", "5T524"
  - Row numbers or line numbers that are just digits

If a value does not match LETTERS+NUMBERS, it is NOT a tag — always output "N/A".
Each valid tag MUST appear in exactly ONE product entry. If you see the same tag on multiple rows, consolidate into one entry.

═══════════════════════════════════════════════════════════════════

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

- Tag: The architect's project-specific reference code used in drawings and project documentation. Tags MUST follow the format of capital letters followed by numbers, with an optional dash separator (e.g., "C-01", "T-04", "ACC-01", "B-01", "EQ1", "EQ-01"). If a value does not match this LETTERS-NUMBERS pattern, it is NOT a valid tag — use "N/A". This is typically found in a dedicated "TAG" column. Each unique tag should appear in ONLY ONE product entry.

- Spec ID Number: The CSI Masterformat code (also known as CSI Section Number) that classifies this product's specification section. Follows the structure "DD SS ss" where DD=division (2 digits), SS=section (2 digits), ss=subsection (2 digits). Common examples: "09 51 00" (Acoustical Ceilings), "08 71 00" (Door Hardware), "26 51 00" (Interior Lighting). Separators may be spaces, periods, dashes, or none. Only extract if the value matches this numeric Masterformat pattern. N/A if not found.

- Project: The project name or identifier from the document. N/A if not found.

SECONDARY FIELDS (populate with "N/A" if absent):

- Finish: The finish designation for the architectural product, including color, surface finish, coating, material treatment, fabric grade, or any combination (e.g., "Fabric - Grade 5 Bernhardt Plush 3550-033 Forest, Base - 845", "Brushed Nickel", "Powder Coated", "Matte Black"). Include finish codes, color codes, fabric specifications, and material grades if present.

- Size: Product dimensions in any format provided (e.g., "24\\"W x 15.25\\"D x 18\\"H", "WxDxH", "LxWxH", diameter measurements, or other dimensional specifications).

- Price: Unit price including currency symbol if present. If there are multiple prices (unit price, extended price, total price), you MUST extract the unit price only.

- Details: Critical implementation notes, special requirements, or important exceptions that affect product specification, procurement, installation, or usage. Include only information that is essential for proper product implementation and does not fit into other defined fields. Examples: installation requirements (e.g., "Requires blocking in the wall"), special delivery instructions, product alternatives or substitutions (e.g., "Alternate for Pip in All Black"), compatibility requirements, or critical usage limitations. EXCLUDE: any component already captured in Item Name, Product Description, Finish, Size, Manufacturer, or pricing. Default to "N/A" unless the information represents a critical implementation consideration. Limit to 1-3 concise notes.

EXTRACTION GUIDELINES:

- Extract EVERY line item that is a product — missing even one product is a critical error.
- Count the product rows in the table and verify your output count matches.
- ONE PRODUCT PER TAG: Each tag must correspond to exactly ONE product entry. Never create multiple rows with the same tag.
- STRICT ROW ISOLATION: Every field for a product MUST come from that product's own row. Never borrow data from adjacent rows. If a cell is empty, use "N/A".
- Do not include non-product line items, like services (freight, tax, install).
- One product entry per line item.
- Consolidate multi-line descriptions WITHIN a single cell into a single entry per product.
- Use "N/A" when information cannot be confidently identified — do not guess or infer.
- For Product Name: if you are not confident in a common, generic name, use "N/A". Do NOT put the full description here.
- Preserve document order in output.
- Only extract explicitly stated information from each row.

OUTPUT: Return valid JSON array of product objects. Each object must include all defined fields (use "N/A" for missing values).

VALIDATION CHECKLIST (verify EVERY item before returning):

1. ROW COUNT: Does my product count match the number of product rows in the table? If not, I am missing products — go back and find them.
2. ROW ISOLATION: For each product, did every field value come from that product's own row? If I filled in a blank field with data from a neighboring row, that is WRONG — change it to "N/A".
3. TAG FORMAT: Does every tag match the pattern LETTERS+NUMBERS (e.g., C-01, EQ1)? If any tag is pure numbers, pure letters, lowercase, or a model number, change it to "N/A".
4. TAG UNIQUENESS: Does each tag appear only ONCE in the output?
5. Item Name: Is this a CONCISE, DESCRIPTIVE product name like "Dual Monitor Arm" or "Mesh-Back Task Chair"? If it contains a model name, brand, or detailed feature lists, it is WRONG — move that to Product Description.
6. Product Description: Does this contain the full manufacturer-specific description WITHOUT duplicating tag, spec ID, finish, size, or price?
7. Manufacturer: Is this verifiably a company/brand name, not a product descriptor?
8. Spec ID Number: Does this match a CSI Section Number / Masterformat structure exactly?
9. Finish: Have I captured all finish, color, fabric, and material specifications?
10. Details: Are these critical implementation notes, not information already in other fields?
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
              "The architect's project-specific reference code if present. STRICT FORMAT: Must be CAPITAL LETTERS followed by DIGITS, with optional dash (e.g., 'C-01', 'EQ-01', 'ACC-01', 'EQ1'). REJECT and use 'N/A' for: pure numbers ('01', '123'), pure letters ('ACC', 'EQ'), lowercase ('c-01'), descriptions ('Chair'), model numbers, section/article numbers ('2.1', '2.3A'). Usually N/A in specifications. Each tag must appear in exactly ONE product entry.",
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

═══════════════════════════════════════════════════════════════════
CRITICAL RULE — TAG FORMAT ENFORCEMENT:
═══════════════════════════════════════════════════════════════════

If tags appear in the specification, they MUST match this pattern: one or more CAPITAL LETTERS, optionally followed by a dash, then one or more DIGITS.
Valid examples: C-01, T-04, ACC-01, B-01, EQ1, EQ-01
Invalid examples that MUST be rejected (use "N/A" instead):
  - Pure numbers: "01", "123", "4"
  - Pure letters: "ACC", "EQ", "CHAIR"
  - Lowercase: "c-01", "eq1"
  - Descriptions: "Chair", "Table", "Equipment"
  - Model numbers: "K-28669-9-2MB", "5T524"
  - Section/article numbers: "2.1", "2.3A"

If a value does not match LETTERS+NUMBERS, it is NOT a tag — always output "N/A".
Tags are usually N/A in specifications (they typically appear in schedules and drawings).

═══════════════════════════════════════════════════════════════════
CRITICAL RULE — PRODUCT ISOLATION:
═══════════════════════════════════════════════════════════════════

Each product entry MUST contain ONLY information from its own specification subsection. NEVER mix data between different product subsections.

- If a specification has multiple product subsections (e.g., 2.3 Locksets, 2.4 Hinges, 2.5 Closers), each is a SEPARATE product.
- Manufacturers listed under one product subsection MUST NOT be applied to a different product subsection.
- Performance criteria from one product MUST NOT be attributed to another.

═══════════════════════════════════════════════════════════════════

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

- Tag: The architect's project-specific reference code if present in the specification. Tags MUST follow the format of capital letters followed by numbers, with an optional dash separator (e.g., "C-01", "T-04", "ACC-01", "EQ1", "EQ-01"). If a value does not match this LETTERS-NUMBERS pattern, it is NOT a valid tag — use "N/A". Usually N/A in specifications (tags typically appear in door/window schedules and drawings, not in spec sections). If tags ARE present, each unique tag should appear in ONLY ONE product entry.

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

VALIDATION CHECKLIST (verify EVERY item before returning):

1. PRODUCT ISOLATION: For each product, did all extracted data come from that product's own subsection? If I mixed manufacturers or descriptions from different subsections, that is WRONG — fix it.
2. TAG FORMAT: If tags are present, does every tag match the pattern LETTERS+NUMBERS (e.g., C-01, EQ1)? Section numbers like "2.1" or article numbers are NOT tags — use "N/A". Pure numbers, pure letters, lowercase, or model numbers are NOT tags — use "N/A".
3. TAG UNIQUENESS: If tags exist, does each appear only once?
4. Manufacturer Approval: Does this product have a dedicated manufacturer approval subsection with specific company names?
5. Masterformat Alignment: Does this product belong to the CSI Masterformat section being specified? Is this product the reason this spec section exists?
6. Item Name: Is this a CONCISE, DESCRIPTIVE product category like "Wood Athletic Flooring" or "Door Hardware"? If it contains a model name, brand, or detailed features, it is WRONG.
7. Product Description: Does this contain the full manufacturer-specific description WITHOUT duplicating tag, spec ID, finish, size, or price?
8. Spec ID Number: Does this match the section number from the header?
9. Supporting Materials: Have I avoided extracting materials from other Masterformat sections?`;

/**
 * JSON Schema for drawing schedule extraction
 */
const DRAWING_SCHEMA = {
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
              "The CONCISE, HUMAN-RECOGNIZABLE product name derived from the schedule's description column. This must be a real product name — not a bare category, and not a long manufacturer description. Use the FULL descriptive product name when available, including adjectives and qualifiers that distinguish this product from similar ones. CORRECT: 'Pull Down Faucet' (NOT just 'Faucet'), 'Undercounter Refrigerator' (NOT just 'Refrigerator'), 'Carpet Tile' (NOT just 'Carpet'), 'Luxury Vinyl Tile' (NOT just 'Tile'), 'Acoustic Ceiling Panel', 'Rubber Wall Base', 'Hardwood Flooring'. WRONG (manufacturer-specific descriptions, NOT names): 'Sierra Tile 5T524' → should be 'Carpet Tile', 'Ultima - Beveled Tegular 9/16' → should be 'Acoustic Ceiling Panel'. If the schedule does NOT clearly indicate a recognizable product name, output 'N/A' — do NOT guess. NEVER include: manufacturer name, model/line name, detailed feature lists, tag, spec ID, finish, size, or price.",
          },
          productDescription: {
            type: "string",
            description:
              "The FULL product description from the schedule, including model name, model number, and all distinguishing characteristics. This is the detailed, manufacturer-specific description that identifies the exact product being specified. Examples: '30\" Over-and-Under Refrigerator/Freezer with Ice Maker', 'Sierra Tile 5T524, Native-21105', 'Ultima - Beveled Tegular 9/16', 'Formica Laminate 9923-ML, Patine Chalk - Monolith Texture'. MUST NOT include: tag, spec ID number, finish/color, size/dimensions, or ANY information already captured in other columns. N/A if no description is available beyond the product name.",
          },
          manufacturer: {
            type: "string",
            description:
              "The company or brand name from the schedule's MFGR/MANUFACTURER column. Verify this is an actual manufacturer, not a product descriptor or category. If uncertain whether a term is a manufacturer or product descriptor, use 'N/A'.",
          },
          tag: {
            type: "string",
            description:
              "The schedule's row identifier from the TAG/Type/Mark column. STRICT FORMAT: Must be CAPITAL LETTERS followed by DIGITS, with optional dash (e.g., 'EQ1', 'EQ-01', 'B-01', 'CPT-02', 'ACT-01', 'LVT-01'). REJECT and use 'N/A' for: pure numbers ('01', '1', '123'), pure letters ('ACC', 'EQ', 'CARPET'), lowercase ('eq-01'), descriptions ('Chair', 'Table'), model numbers ('K-28669-9-2MB', '5T524', '9923-ML'). Each tag must appear in exactly ONE product entry.",
          },
          specIdNumber: {
            type: "string",
            description:
              "The CSI Masterformat code (also known as CSI Section Number) that classifies this product's specification section. Follows the structure 'DD SS ss' where DD=division (2 digits), SS=section (2 digits), ss=subsection (2 digits). Only extract if the value matches this numeric Masterformat pattern. N/A if not found.",
          },
          project: {
            type: "string",
            description:
              "The project name or identifier from the drawing's title block. N/A if not found.",
          },
          finish: {
            type: "string",
            description:
              "The finish designation from the schedule's FINISH/COLOR column, including color, surface finish, coating, material treatment, or any combination (e.g., 'Matte Black', 'Stainless Steel', 'Snow White W', 'Native-21105', 'Plastic Laminate Panel to Match Adjacent Millwork'). Include finish codes, color codes, and material grades if present. N/A if not found.",
          },
          size: {
            type: "string",
            description:
              "Product dimensions from the schedule's SIZE column in any format provided (e.g., '18\" X 36\"', '24\" X 72\"', '4\" HIGH'). N/A if not found.",
          },
          price: {
            type: "string",
            description:
              "N/A (architectural drawing schedules do not contain pricing).",
          },
          details: {
            type: "string",
            description:
              'Consolidate supplementary schedule columns here: "Provided by" designations (e.g., "Provided by: GC"), contact information for product representatives, installation methods or notes, comments or remarks from the schedule. EXCLUDE: any component already captured in Item Name, Product Description, Finish, Size, or Manufacturer. Default to "N/A" unless supplementary information is present. Limit to 1-3 concise notes.',
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
        "List of all products extracted from schedule tables on the drawing. Each tag must appear in only one product entry.",
    },
  },
  required: ["products"],
} as const;

/**
 * System prompt for drawing schedule extraction
 */
const DRAWING_PROMPT = `EXTRACTION TASK: Extract ALL products from schedule tables embedded in architectural drawings into precise, structured data for catalog reference.

═══════════════════════════════════════════════════════════════════
CRITICAL RULE #1 — STRICT ROW ISOLATION:
═══════════════════════════════════════════════════════════════════

Each product entry MUST contain ONLY information from its own table row. NEVER pull data from adjacent rows.

- If a field is empty in a row, output "N/A" — do NOT fill it with data from the row above or below.
- If a cell spans multiple lines WITHIN the same row, consolidate it. But NEVER merge data across different rows.
- Double-check: for every field you extract, verify it belongs to the SAME row as the tag/identifier for that product.
- Schedules often have rows that look similar — pay close attention to horizontal grid lines and cell boundaries.

VIOLATION EXAMPLES (these are WRONG):
  - Copying the manufacturer from the row above because the current row's manufacturer cell is empty
  - Using a finish value from a different product's row
  - Combining descriptions from two separate rows into one product
  - Attributing a size from one row to a different product

═══════════════════════════════════════════════════════════════════
CRITICAL RULE #2 — EXTRACT EVERY SINGLE ROW:
═══════════════════════════════════════════════════════════════════

You MUST extract EVERY row from EVERY schedule table on the drawing. Missing even one row is a critical error.

- Count the number of data rows in each schedule table (excluding the header row). Your output MUST have the same total number of product entries.
- If a row has sparse data (e.g., only a tag and description, no manufacturer), STILL extract it with "N/A" for missing fields.
- If a row has only a tag and no other data, STILL extract it.
- Rows at the bottom of the schedule are easy to miss — scan to the very last row.
- If a schedule continues on another part of the drawing or another page, extract ALL rows from ALL parts.
- After extraction, COUNT your output products and compare to the total rows across all schedules. If they don't match, go back and find the missing rows.

═══════════════════════════════════════════════════════════════════
CRITICAL RULE #3 — TAG FORMAT ENFORCEMENT:
═══════════════════════════════════════════════════════════════════

Tags MUST match this pattern: one or more CAPITAL LETTERS, optionally followed by a dash, then one or more DIGITS.
Valid examples: EQ-01, EQ1, B-01, CPT-02, ACT-01, LVT-01, WD-01, P-1, F-03
Invalid examples that MUST be rejected (use "N/A" instead):
  - Pure numbers: "01", "123", "4", "1"
  - Pure letters: "ACC", "EQ", "CARPET"
  - Lowercase: "eq-01", "cpt1"
  - Descriptions: "Chair", "Table", "Equipment"
  - Model numbers: "K-28669-9-2MB", "5T524", "9923-ML"
  - Row/line numbers that are just sequential digits

If a value does not match LETTERS+NUMBERS, it is NOT a tag — always output "N/A".
Each valid tag MUST appear in exactly ONE product entry.

═══════════════════════════════════════════════════════════════════
EXTRACTION SCOPE:
═══════════════════════════════════════════════════════════════════

Extract ONLY from tables explicitly labeled as SCHEDULES. These are structured tables with column headers typically found in the margins or dedicated areas of architectural drawing sheets.

Common schedule types to look for:
- Equipment Schedule
- Finish Schedule
- Door Schedule / Door Hardware Schedule
- Window Schedule
- Plumbing Fixture Schedule
- Lighting Fixture Schedule
- Furniture Schedule
- Appliance Schedule

You MUST IGNORE all other content on the drawing sheet, including:
- Elevations, floor plans, sections, and detail drawings
- Dimensions and dimension strings
- Annotations, callouts, keynotes, and reference symbols
- General notes, finish notes, and construction notes
- Legends (e.g., "Finish Tag Legend") — these define tag formatting, NOT products
- Title block information (except for project name)
- Furniture plans or furniture layouts shown graphically (these are NOT schedules)
- Device mounting diagrams

If the drawing contains NO schedule tables, return an empty products array.

═══════════════════════════════════════════════════════════════════
COLUMN MAPPING — Schedule columns vary by type. Map them as follows:
═══════════════════════════════════════════════════════════════════

Schedule columns do NOT have a fixed format. Different schedule types use different column headers. Map whatever columns exist in the schedule to the standard product fields:

- TAG / Type / Mark / ID → tag
- DESCRIPTION / Name → used for both itemName and productDescription (see rules below)
- MFGR / MANUFACTURER / Mfr → manufacturer
- MODEL / MODEL NAME / MODEL NUMBER / Cat. No. → include in productDescription
- FINISH / COLOR / Material → finish
- SIZE / Dimensions → size
- PROVIDED BY / CONTACT / COMMENTS / NOTE / Remarks → details (consolidate all of these into the details field)

If a column does not map to any of the above fields, consolidate it into the details field if the information is useful for product specification or procurement. Ignore purely administrative columns.

CRITICAL RULE - ONE PRODUCT PER TAG:
When a TAG is present (e.g., "EQ1", "B-01", "CPT-02", "ACT-01"), extract ONLY ONE product entry for that tag. If a description appears to have multiple components or features, consolidate them into a SINGLE entry. Do NOT create separate product rows for what is clearly one tagged item.

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
     "Pull Down Faucet" — NOT just "Faucet"
     "Undermount Sink" — NOT just "Sink"
     "Undercounter Refrigerator" — NOT just "Refrigerator"
     "Drawer Microwave" — NOT just "Microwave"
     "Carpet Tile" — NOT just "Carpet"
     "Luxury Vinyl Tile" — NOT just "Tile"
     "Acoustic Ceiling Panel" — NOT just "Ceiling"
     "Rubber Wall Base" — NOT just "Base"
     "Hardwood Flooring"
     "Solid Surface Countertop"
     "Wallcovering"
     "Wood Veneer Wallcovering"
     "Paint"
     "Plastic Laminate"

   WRONG examples (these are descriptions, NOT names):
     "30" Over-and-Under Refrigerator/Freezer with Ice Maker" → should be "Refrigerator/Freezer"
     "Sierra Tile 5T524" → should be "Carpet Tile"
     "Ultima - Beveled Tegular 9/16" → should be "Acoustic Ceiling Panel"
     "K-28669-9-2MB" → this is a model number, NOT a name

   NEVER include in the product name:
     - Manufacturer name (e.g., "Kohler", "Sub-Zero", "ShawContract")
     - Model number or line name (e.g., "Sierra Tile", "Ultima", "EON")
     - Detailed feature lists or specifications
     - Tag, spec ID, finish, size, or price

   If you CANNOT determine a clear, common product name, use "N/A".
   STRONGLY prefer "N/A" over guessing — an incorrect name is worse than no name.

** Product Description (productDescription) ** — The FULL product description.
   This is the detailed, manufacturer-specific description that identifies the exact
   product being specified. Include model name, model number, and all distinguishing
   characteristics from the schedule.

   CORRECT examples:
     "30" Over-and-Under Refrigerator/Freezer with Ice Maker"
     "Sierra Tile 5T524, Native-21105"
     "Ultima - Beveled Tegular 9/16"
     "Ricochet Strata R611, Mesmerized"
     "Authenticity CA362, Persona Oak-01027"
     "Formica Laminate 9923-ML, Patine Chalk - Monolith Texture"

   MUST NOT include: tag, spec ID number, finish/color, size/dimensions, price,
   or ANY information already captured in other columns.
   N/A if no description beyond the product name is available.

═══════════════════════════════════════════════════════════════════

CORE FIELDS (populate with "N/A" if information is genuinely absent):

- Item Name (Product Name): See above — the CONCISE, DESCRIPTIVE product name. Use the full descriptive name when the document provides it (e.g., "Undercounter Refrigerator" not just "Refrigerator").

- Product Description: See above — the FULL manufacturer-specific description.

- Manufacturer: The company or brand name that produces the product. Verify this is an actual manufacturer, not a product descriptor or category. If uncertain whether a term is a manufacturer or product descriptor, use "N/A".

- Tag: The schedule's row identifier. Tags MUST follow the format of capital letters followed by numbers, with an optional dash separator (e.g., "EQ-01", "EQ1", "B-01", "CPT-02", "ACT-01", "LVT-01", "WD-01"). If a value does not match this LETTERS-NUMBERS pattern, it is NOT a valid tag — use "N/A". Each unique tag should appear in ONLY ONE product entry.

- Spec ID Number: The CSI Masterformat code (also known as CSI Section Number) that classifies this product's specification section. Follows the structure "DD SS ss" where DD=division (2 digits), SS=section (2 digits), ss=subsection (2 digits). Only extract if the value matches this numeric Masterformat pattern. N/A if not found.

- Project: The project name or identifier. Look in the drawing's title block if visible. N/A if not found.

SECONDARY FIELDS (populate with "N/A" if absent):

- Finish: The finish designation for the product, including color, surface finish, coating, material treatment, fabric grade, or any combination (e.g., "Matte Black", "Stainless Steel", "Snow White W", "Native-21105", "Plastic Laminate Panel to Match Adjacent Millwork"). Include finish codes, color codes, fabric specifications, and material grades if present.

- Size: Product dimensions in any format provided (e.g., "18\\" X 36\\"", "24\\" X 72\\"", "4\\" HIGH", "7\\" X 82.5\\""). N/A if not found.

- Price: N/A (architectural drawing schedules do not contain pricing).

- Details: Consolidate supplementary schedule information here. This includes: "Provided by" designations (e.g., "Provided by: GC"), contact information for product representatives, installation methods or notes (e.g., "Installation Method: Ashlar"), comments or remarks from the schedule, and any other useful information from schedule columns that does not fit into other defined fields. EXCLUDE: any component already captured in Item Name, Product Description, Finish, Size, or Manufacturer. Default to "N/A" unless supplementary information is present. Limit to 1-3 concise notes.

EXTRACTION GUIDELINES:

- Extract EVERY row from EVERY schedule table — missing even one row is a critical error.
- Count rows in each schedule and verify your output count matches the total.
- ONE PRODUCT PER TAG: Each tag must correspond to exactly ONE product entry. Never create multiple rows with the same tag.
- STRICT ROW ISOLATION: Every field for a product MUST come from that product's own row. Never borrow data from adjacent rows. If a cell is empty, use "N/A".
- Extract ALL rows, even those with incomplete data. Use "N/A" for missing fields but preserve whatever information IS present.
- Do not extract non-product items like services, general notes, or legend entries.
- One product entry per schedule row.
- Consolidate multi-line descriptions WITHIN a single row into a single entry.
- Use "N/A" when information cannot be confidently identified — do not guess or infer.
- For Product Name: if you are not confident in a common, generic name, use "N/A". Do NOT put the full description here.
- Preserve schedule order in output.
- Only extract explicitly stated information from the schedule cells.

OUTPUT: Return valid JSON array of product objects. Each object must include all defined fields (use "N/A" for missing values).

VALIDATION CHECKLIST (verify EVERY item before returning):

1. ROW COUNT: Count the total data rows across ALL schedule tables on the drawing. Does my product count match? If not, I am missing products — go back and find them. Pay special attention to rows at the bottom of schedules and schedules that continue on other parts of the drawing.
2. ROW ISOLATION: For each product, did every field value come from that product's own row? If I filled a blank field with data from a neighboring row, that is WRONG — change it to "N/A".
3. TAG FORMAT: Does every tag match the pattern LETTERS+NUMBERS (e.g., EQ-01, CPT-02, B-01)? If any tag is pure numbers, pure letters, lowercase, or a model number, change it to "N/A".
4. TAG UNIQUENESS: Does each tag appear only ONCE in the output?
5. Schedule Source: Did I extract ONLY from tables labeled as schedules? Did I ignore elevations, plans, legends, and other non-schedule content?
6. Item Name: Is this a CONCISE, DESCRIPTIVE product name like "Pull Down Faucet" or "Carpet Tile"? If it contains a model name, brand, or detailed feature lists, it is WRONG.
7. Product Description: Does this contain the full manufacturer-specific description WITHOUT duplicating tag, spec ID, finish, size, or price?
8. Manufacturer: Is this verifiably a company/brand name, not a product descriptor?
9. Spec ID Number: Does this match a CSI Section Number / Masterformat structure exactly?
10. Finish: Have I captured all finish, color, fabric, and material specifications from the schedule?
11. Details: Have I consolidated supplementary columns (provided by, contact, comments, notes) here?`;

/**
 * Extraction configs per document type.
 *
 * Each document type maps to its own prompt and schema. For now, some types
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
    schema: DRAWING_SCHEMA,
    prompt: DRAWING_PROMPT,
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
