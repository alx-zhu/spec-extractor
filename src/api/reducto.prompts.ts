/**
 * Reducto Extraction Prompts
 *
 * System prompts and schemas for extracting structured data from documents.
 */

/**
 * JSON Schema for product extraction
 * Defines the structure of data we want to extract from architecture spec documents
 */
/**
 * JSON Schema for product extraction
 * Defines the structure of data we want to extract from architecture spec documents
 */
export const PRODUCT_EXTRACTION_SCHEMA = {
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
              "The product name as it would appear in a manufacturer's catalog, sufficient for an architect to identify and search for the product type. Include the product category and essential distinguishing characteristics that define what the product is. Exclude: brand/manufacturer names, specific model/SKU identifiers, color/finish selections, material specifications, dimensions, fabric grades.",
          },
          manufacturer: {
            type: "string",
            description:
              "The company or brand name that produces the product. Verify this is an actual manufacturer, not a product descriptor or category. If uncertain whether a term is a manufacturer or product descriptor, use 'N/A'.",
          },
          productKey: {
            type: "string",
            description:
              "The manufacturer's unique identifier for this product (model number, SKU, series code, or part number). This is the code used to locate this specific product in the manufacturer's catalog system.",
          },
          tag: {
            type: "string",
            description:
              "The architect's project-specific reference code used in drawings and project documentation. This is distinct from the manufacturer's product identifier. Format varies (e.g., 'C-01', 'T-04', 'ACC-01', 'B-01'). N/A if not found.",
          },
          specIdNumber: {
            type: "string",
            description:
              "CSI Masterformat code following the structure 'DD SS ss' where DD=division (2 digits), SS=section (2 digits), ss=subsection (2 digits). Separators may be spaces, periods, dashes, or none. Additional subsection digits may follow. Only extract if the value matches this structural pattern. N/A if not found.",
          },
          project: {
            type: "string",
            description:
              "The project name or identifier from the document. N/A if not found.",
          },
          color: {
            type: "string",
            description:
              "Color names, finish designations, or material color specifications, including any associated codes. N/A if not found.",
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
              "Distinguishes between variants of the same base product (e.g., specific configuration options, model variations). Identifies functional components or mechanisms that are selectable/variable; Notes packaging specifications relevant to procurement (e.g., multi-unit packaging, carton quantities); Highlights critical limitations, requirements, or exceptions that affect product use or installation. This field is for essential differentiators that don't fit other categories. EXCLUDE: color/finish (use Color), dimensions (use Size), manufacturer (use Manufacturer), pricing, fabric/material grades, standard features, installation instructions, and all information already captured in other fields. Default to 'N/A' unless the information is truly necessary for product identification or represents a critical caveat. Limit to 1-3 concise specifications.",
          },
        },
        required: [
          "itemName",
          "manufacturer",
          "productKey",
          "tag",
          "specIdNumber",
          "project",
          "color",
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
 * System prompt for product extraction
 * Provides context and rules for the LLM to follow
 */
export const PRODUCT_EXTRACTION_PROMPT = `EXTRACTION TASK: Extract ALL products from furniture purchase orders into precise, structured data for catalog reference.

CORE FIELDS (populate with "N/A" if information is genuinely absent):

- Item Name: The product name as it would appear in a manufacturer's catalog, sufficient for an architect to identify and search for the product type. Include the product category and essential distinguishing characteristics that define what the product is. Exclude: brand/manufacturer names, specific model/SKU identifiers, color/finish selections, material specifications, dimensions, fabric grades.
- Manufacturer: The company or brand name that produces the product. Verify this is an actual manufacturer, not a product descriptor or category. If uncertain whether a term is a manufacturer or product descriptor, use "N/A".
- Product Key: The manufacturer's unique identifier for this product (model number, SKU, series code, or part number). This is the code used to locate this specific product in the manufacturer's catalog system and is NOT the item name.
- Tag: The architect's project-specific reference code used in drawings and project documentation. This is distinct from the manufacturer's product identifier. Format varies (e.g., "C-01", "T-04", "ACC-01", "B-01")
- Spec ID Number: CSI Masterformat code following the structure "DD SS ss" where DD=division (2 digits), SS=section (2 digits), ss=subsection (2 digits). Separators may be spaces, periods, dashes, or none. Additional subsection digits may follow. Only extract if the value matches this structural pattern.
Project: The project name or identifier from the document.

SECONDARY FIELDS (populate with "N/A" if absent):

- Color: Color names, finish designations, or material color specifications, including any associated codes.
- Size: Product dimensions in any format provided (e.g., WxDxH, LxWxH, diameter measurements, or other dimensional specifications).
- Price: Unit price including currency symbol if present. If there are multiple prices, you MUST list the unit price.
- Details: Distinguishes between variants of the same base product (e.g., specific configuration options, model variations). Identifies functional components or mechanisms that are selectable/variable; Notes packaging specifications relevant to procurement (e.g., multi-unit packaging, carton quantities); Highlights critical limitations, requirements, or exceptions that affect product use or installation. This field is for essential differentiators that don't fit other categories. EXCLUDE: color/finish (use Color), dimensions (use Size), manufacturer (use Manufacturer), pricing, fabric/material grades, standard features, installation instructions, and all information already captured in other fields. Default to "N/A" unless the information is truly necessary for product identification or represents a critical caveat. Limit to 1-3 concise specifications.

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
Product Key: Is this the manufacturer's identifier, not the architect's tag?
Tag: Is this the architect's identifier, not the manufacturer's code?
Spec ID Number: Does this match CSI Masterformat structure exactly?
Details: Are these product variants/features, not colors, sizes, or redundant information?
`;
