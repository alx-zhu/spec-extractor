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
              "The complete product name/description (e.g., 'Field Lounge Chair - Edwards Charcoal w/ Plum Base', 'Acoustic Ceiling Panel')",
          },
          manufacturer: {
            type: "string",
            description:
              "Brand or manufacturer name (look for company names in product codes or descriptions)",
          },
          specIdNumber: {
            type: "string",
            description:
              "CSI Masterformat standard codes (e.g., '09 30 00' for Tiling, '09 51 00' for Acoustic Ceilings). This is the product code before the '/' or the model number at the start of the description.",
          },
          productKey: {
            type: "string",
            description:
              "The key used to reference the product, sometimes referred to as Tag, across the architecture documents like drawings. N/A if not found.",
          },
          color: {
            type: "string",
            description:
              "Fabric color, finish color, or material color (e.g., 'Onyx 029', 'Soft-Greige 3553-012', 'Black'). Include both code and description. Material/fabric specifications (e.g., 'Grade 4 Material', 'Maharam Messenger') should be included here. Use 'N/A' if not found.",
          },
          size: {
            type: "string",
            description:
              "Dimensions in format WxDxH (e.g., '23w x 22.5d x 32.5h', '60x24', '2\\'x4\\''). Look for patterns like '##w x ##d x ##h' or '##\"L x ##\"W'. Use 'N/A' if not found.",
          },
          price: {
            type: "string",
            description:
              "Unit price from 'Sell' column (include currency symbol, e.g., '$142.50', '$3.25/sf'). Use 'N/A' if not found.",
          },
          quantity: {
            type: "string",
            description: "Number of units ordered. Use 'N/A' if not found.",
          },
          extendedPrice: {
            type: "string",
            description:
              "Total price (Quantity × Unit Price) from 'Ext. Sell' column. Use 'N/A' if not found.",
          },
          tag: {
            type: "string",
            description:
              "Tag/location identifier (e.g., 'C-01', 'T-04', 'B-01'). Use 'N/A' if not found.",
          },
          project: {
            type: "string",
            description:
              "Project name from document header, notes section, 'SO Notes', or 'Project:' field. Use 'N/A' if not found.",
          },
          linkToProduct: {
            type: "string",
            description:
              "URL or web link to product information if available in the document. Use 'N/A' if not found.",
          },
        },
        required: [
          "itemName",
          "manufacturer",
          "specIdNumber",
          "productKey",
          "color",
          "size",
          "price",
          "quantity",
          "extendedPrice",
          "tag",
          "project",
          "linkToProduct",
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
export const PRODUCT_EXTRACTION_PROMPT = `You are a precise data extraction system for architectural specifications, furniture purchase orders, and sales orders. Extract product information for ALL items listed in the document.

DOCUMENT TYPES:
1. **3-Part Specifications** (CSI format): Typically specify a single product per section with detailed requirements in Part 2 (Products). Look for manufacturer, model numbers, and material specifications.
2. **Purchase Orders/Sales Orders**: Multiple line items with pricing and quantities.
3. **Product Schedules**: Tables or lists of products with specifications.

REQUIRED FIELDS:
- Item Name: The complete product name/description (e.g., "Field Lounge Chair - Edwards Charcoal w/ Plum Base", "Acoustic Ceiling Panel", "Armstrong Ultima 2x4 Ceiling Tile")
- Manufacturer: Brand or manufacturer name (look for company names in product codes, descriptions, or Part 2 sections)
- Spec ID Number: CSI Masterformat standard codes (e.g., "09 30 00" for Tiling, "09 51 00" for Acoustic Ceilings, "08 11 13" for Hollow Metal Doors)
- Product Key: The key used to reference the product, sometimes referred to as Tag, Mark, or Type across architecture documents. For 3-part specs, this might be a model number or product line designation.
- Project: Project name from document header, title block, or notes section

OPTIONAL FIELDS (use "N/A" if not found):
- Color: Fabric color, finish color, or material color (e.g., "Onyx 029", "Soft-Greige 3553-012", "Black", "Satin Chrome")
- Size: Dimensions in format WxDxH (e.g., "23w x 22.5d x 32.5h", "60x24", "2'x4'")
- Price: Unit price from "Sell" column (include currency symbol)
- Quantity: Number of units ordered
- Tag: Tag/location identifier (e.g., "C-01", "T-04", "B-01", "Door Type A")
- Extended Price: Total price from "Ext. Sell" column
- Link to Product: URL or web link to product information

EXTRACTION RULES FOR 3-PART SPECIFICATIONS:
1. **Section Identification**: The spec section number (e.g., "09 51 00") is your Spec ID Number
2. **Part 2 - Products**: This section contains manufacturer names, product lines, and model numbers
3. **Basis of Design**: Look for phrases like "Basis of Design", "or approved equal", "as manufactured by" - these indicate the primary specified product
4. **Manufacturer Names**: Often listed as "Manufacturer: [Name]" or embedded in sentences like "as manufactured by Armstrong"
5. **Product Line/Model**: Look for specific product names after manufacturer (e.g., "Armstrong Ultima System")
6. **Acceptable Substitutes**: If multiple manufacturers are listed, create separate product entries for each
7. **Material Specifications**: Color, finish, and material details are often in Part 2 under product description
8. **Single Product Specs**: If the spec clearly describes one product, return one product entry
9. **Product Key/Type**: Look for product type designations (e.g., "Type A", "Model 2400", "Series 100")

EXTRACTION RULES FOR PURCHASE ORDERS/SCHEDULES:
1. Process EVERY line item - do not skip any products
2. Each numbered line represents a separate product entry
3. Manufacturer may be implied by product code prefix or explicitly stated
4. Color/finish information is often in specification codes (e.g., "BLKP", "BKO", "MAMG") - extract both code and description
5. Extract dimensions from descriptions - look for patterns like "##w x ##d x ##h" or "##"L x ##"W"
6. Material/fabric specifications (e.g., "Grade 4 Material", "Maharam Messenger") should be included in Color field
7. Tag identifiers (e.g., "Tag 1: C-04") indicate item location/grouping

SPECIAL CASES:
- **"Or Equal" Specifications**: If document says "Product X or approved equal", extract Product X as the primary product
- **Multiple Acceptable Manufacturers**: Create separate product entries for each manufacturer listed
- **Multi-line descriptions**: Combine all specification details into Item Name
- **Option codes**: Include option descriptions (e.g., "W48: Black Hard Wheel Caster - Std")
- **Custom products**: Preserve all custom specifications and details
- **Freight line items**: Extract with carrier name as Manufacturer

OUTPUT FORMAT:
Return valid JSON as a list of products. Each product should be a complete object with all available fields. 
- For 3-part specs: Typically return 1-3 products (basis of design + acceptable alternates). Make sure to ONLY return UNIQUE products.
- For purchase orders: Return all line items in order
Use "N/A" for any optional field that cannot be found.

VALIDATION:
- If the spec has only a single product DO NOT return multiple. You MUST ensure the products you return are unique.
- For purchase orders: Verify Quantity * Price = Extended Price when possible
- Every product must have all 12 fields (itemName, manufacturer, specIdNumber, productKey, color, size, price, quantity, extendedPrice, tag, project, linkToProduct)
- Spec ID Number should always be a valid CSI Masterformat code when present`;
/**
 * Alternative simplified prompt for basic extraction
 */
export const SIMPLE_EXTRACTION_PROMPT = `Extract all products from this architectural specification document. For each product, identify the item name, manufacturer, specification ID number, color, size, price, project name, and any product links. Use "N/A" for fields that are not present.`;
