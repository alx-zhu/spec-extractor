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
              "The product name as it would appear in a manufacturer's catalog, sufficient for an architect to identify and search for the product type. Include the product category and essential distinguishing characteristics that define what the product is. Exclude: brand/manufacturer names, model numbers, finish selections, material specifications, dimensions, fabric grades.",
          },
          manufacturer: {
            type: "string",
            description:
              "The company or brand name that produces the product. Verify this is an actual manufacturer, not a product descriptor or category. If uncertain whether a term is a manufacturer or product descriptor, use 'N/A'.",
          },
          modelNumber: {
            type: "string",
            description:
              "The manufacturer's model number or product code that uniquely identifies this specific product. This is the alphanumeric code assigned by the manufacturer (e.g., 'TS93', 'ESR-1000', 'LP-24-LED'). Extract ONLY the model/code identifier, NOT the product name, description, or other columns. N/A if not found.",
          },
          tag: {
            type: "string",
            description:
              "The architect's project-specific reference code used in drawings and project documentation. This is distinct from the manufacturer's product identifier. Format varies (e.g., 'C-01', 'T-04', 'ACC-01', 'B-01'). N/A if not found.",
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
              "The finish designation for the architectural product, including color, surface finish, coating, material treatment, or any combination (e.g., 'Brushed Nickel', 'White', 'Powder Coated', 'Satin Chrome', 'Anthracite', 'Wood Veneer', 'Matte Black'). Include finish codes or color codes if present. N/A if not found.",
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
              'Details: Critical implementation notes, special requirements, or important exceptions that affect product specification, procurement, installation, or usage. Include only information that is essential for proper product implementation and does not fit into other defined fields. Examples: installation requirements (e.g., "Requires blocking in the wall"), special delivery instructions, product alternatives or substitutions, compatibility requirements, or critical usage limitations. EXCLUDE: any component of the item name, finish (use Finish), dimensions (use Size), manufacturer (use Manufacturer), pricing, material grades or quality levels, standard product features, and all information already captured in other fields. Default to "N/A" unless the information represents a critical implementation consideration. Limit to 1-3 concise notes.',
          },
        },
        required: [
          "itemName",
          "manufacturer",
          "modelNumber",
          "tag",
          "specIdNumber",
          "project",
          "finish",
          "size",
          "price",
          "details",
        ],
      },
      description: "List of all products extracted from the document",
    },
  },
  required: ["products"],
} as const;

/**
 * System prompt for purchase order product extraction
 */
const PURCHASE_ORDER_PROMPT = `EXTRACTION TASK: Extract ALL products from furniture purchase orders into precise, structured data for catalog reference.

CORE FIELDS (populate with "N/A" if information is genuinely absent):

- Item Name: The product name as it would appear in a manufacturer's catalog, sufficient for an architect to identify and search for the product type. Include the product category and essential distinguishing characteristics that define what the product is. Exclude: brand/manufacturer names, model numbers, finish selections, material specifications, dimensions, fabric grades.
- Manufacturer: The company or brand name that produces the product. Verify this is an actual manufacturer, not a product descriptor or category. If uncertain whether a term is a manufacturer or product descriptor, use "N/A".
- Model Number: The manufacturer's model number or product code that uniquely identifies this specific product. This is the alphanumeric code assigned by the manufacturer (e.g., "TS93", "ESR-1000", "LP-24-LED"). Extract ONLY the model/code identifier, NOT the product name, description, or other columns.
- Tag: The architect's project-specific reference code used in drawings and project documentation. This is distinct from the manufacturer's product identifier. Format varies (e.g., "C-01", "T-04", "ACC-01", "B-01")
- Masterformat Code: The CSI Section Number (Masterformat code) that classifies this product's specification section. Follows the structure "DD SS ss" where DD=division (2 digits), SS=section (2 digits), ss=subsection (2 digits). Common examples: "09 51 00" (Acoustical Ceilings), "08 71 00" (Door Hardware). Separators may be spaces, periods, dashes, or none. Only extract if the value matches this numeric Masterformat pattern.
Project: The project name or identifier from the document.

SECONDARY FIELDS (populate with "N/A" if absent):

- Finish: The finish designation for the architectural product, including color, surface finish, coating, material treatment, or any combination (e.g., "Brushed Nickel", "White", "Powder Coated", "Satin Chrome", "Anthracite", "Matte Black"). Include finish codes or color codes if present.
- Size: Product dimensions in any format provided (e.g., WxDxH, LxWxH, diameter measurements, or other dimensional specifications).
- Price: Unit price including currency symbol if present. If there are multiple prices, you MUST list the unit price.
- Details: Critical implementation notes, special requirements, or important exceptions that affect product specification, procurement, installation, or usage. Include only information that is essential for proper product implementation and does not fit into other defined fields. Examples: installation requirements (e.g., "Requires blocking in the wall"), special delivery instructions, product alternatives or substitutions, compatibility requirements, or critical usage limitations. EXCLUDE: any component of the item name, finish (use Finish), dimensions (use Size), manufacturer (use Manufacturer), pricing, material grades or quality levels, standard product features, and all information already captured in other fields. Default to "N/A" unless the information represents a critical implementation consideration. Limit to 1-3 concise notes.

EXTRACTION GUIDELINES:

Extract every line item that is a product - missing products is a critical error.
Do not include non-product line items, like services.
One product entry per line item.
Consolidate multi-line descriptions into a single entry per product.
Use "N/A" when information cannot be confidently identified - do not guess or infer.
Preserve document order in output.
Only extract explicitly stated information.

OUTPUT: Return valid JSON array of product objects. Each object must include all defined fields (use "N/A" for missing values).
VALIDATION CHECKLIST:

Item Name: Is this how the product would be listed in a catalog?
Manufacturer: Is this verifiably a company/brand name, not a product descriptor?
Model Number: Is this the manufacturer's model number/code, not the product name or architect's tag?
Tag: Is this the architect's identifier, not the manufacturer's code?
Masterformat Code: Does this match a CSI Section Number / Masterformat structure exactly?
Details: Are these product variants/features, not finishes, sizes, or redundant information?
`;

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
    schema: PURCHASE_ORDER_SCHEMA,
    prompt: PURCHASE_ORDER_PROMPT,
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
