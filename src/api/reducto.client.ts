/**
 * Reducto API Client
 *
 * Handles document upload and extraction using Reducto's Extract API.
 * Uses the official Reducto Node.js SDK.
 */

import Reducto from "reductoai";
import type { ReductoFieldValue } from "@/types/reducto";
import type { Product } from "@/types/product";
import {
  PRODUCT_EXTRACTION_SCHEMA,
  PRODUCT_EXTRACTION_PROMPT,
} from "./reducto.prompts";

/**
 * ReductoClient class for document extraction
 */
export class ReductoClient {
  private client: Reducto;

  constructor(apiKey?: string) {
    // Use provided API key or fall back to environment variable
    // Note: Vite uses VITE_ prefix for env vars
    const key = apiKey || import.meta.env.VITE_REDUCTO_API_KEY;

    if (!key) {
      throw new Error(
        "Reducto API key not found. Set VITE_REDUCTO_API_KEY in your .env file.",
      );
    }

    this.client = new Reducto({ apiKey: key });
  }

  /**
   * Upload file and extract products with citations
   *
   * @param file - PDF file to process
   * @param documentId - Document ID to associate products with
   * @param pdfPath - Path where PDF is stored (for reference in Product)
   * @returns Array of products with bounding boxes and citations
   */
  async uploadAndExtract(
    file: File,
    documentId: string,
    pdfPath: string,
  ): Promise<Product[]> {
    try {
      console.log("[Reducto] Starting upload and extraction for:", file.name);

      // Step 1: Upload the file
      const upload = await this.client.upload({
        file: file,
      });

      console.log("[Reducto] File uploaded:", upload);

      // Step 2: Extract with citations enabled
      const result = await this.client.extract.run({
        input: upload,
        instructions: {
          schema: PRODUCT_EXTRACTION_SCHEMA,
          system_prompt: PRODUCT_EXTRACTION_PROMPT,
        },
        settings: {
          array_extract: true, // Enable for extracting arrays of products
          citations: {
            enabled: true, // Get bboxes for each field
            numerical_confidence: true, // Get numeric confidence scores
          },
        },
      });

      // Check if this is an async response (job_id only)
      if ("job_id" in result && !("result" in result)) {
        throw new Error(
          "Received async response. Please use synchronous extraction or poll for results.",
        );
      }

      // Type guard: result is V3ExtractResponse with result field
      if (!("result" in result)) {
        throw new Error("Invalid response format from Reducto API");
      }

      // Log extraction results
      // The result has a "products" array wrapper based on our schema
      const extractedData = result.result as { products?: unknown[] };
      const resultArray = extractedData.products || [];

      console.log("[Reducto] Extraction complete:", {
        job_id: result.job_id,
        num_products: resultArray.length,
        usage: result.usage,
        studio_link: result.studio_link,
      });

      // Log the raw result array with deep inspection
      console.log("[Reducto] Raw result array:");
      console.dir(resultArray, { depth: null, colors: true });

      // Log each product individually for better visibility
      resultArray.forEach((product, index) => {
        console.log(
          `[Reducto] Product ${index + 1}:`,
          JSON.stringify(product, null, 2),
        );
      });

      // Step 3: Map Reducto response to our Product type
      const products = this.mapReductoToProducts(
        resultArray,
        documentId,
        pdfPath,
      );

      console.log(`[Reducto] Mapped ${products.length} products`);
      return products;
    } catch (error) {
      console.error("[Reducto] Extraction failed:", error);
      throw error;
    }
  }

  /**
   * Map Reducto extraction response to Product array
   *
   * @param resultArray - Array of extracted products from Reducto
   * @param documentId - Document ID to associate with products
   * @param _pdfPath - PDF path (reserved for future use, e.g., adding to product metadata)
   */
  private mapReductoToProducts(
    resultArray: unknown[],
    documentId: string,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _pdfPath: string,
  ): Product[] {
    if (!resultArray || !Array.isArray(resultArray)) {
      console.warn("[Reducto] No products found in extraction result");
      return [];
    }

    return resultArray.map((item, index) => {
      // Type assertion - we know the structure from our schema
      const extractedProduct = item as Record<
        string,
        ReductoFieldValue<string>
      >;

      console.log(`[Reducto] Mapping product ${index + 1}:`, {
        itemName: extractedProduct.itemName?.value,
        manufacturer: extractedProduct.manufacturer?.value,
        citationsCount: extractedProduct.itemName?.citations?.length,
      });

      // Helper to safely extract field data
      const extractField = (field: ReductoFieldValue<string> | undefined) => {
        if (!field) {
          console.warn("[Reducto] Field is undefined, using defaults");
          return {
            value: "",
            bbox: this.createDefaultBBox(),
            citation: undefined,
          };
        }

        // Get the first citation (primary source)
        const citation = field.citations?.[0];

        if (!citation) {
          console.warn("[Reducto] No citations found for field:", field.value);
        }

        return {
          value: field.value || "",
          bbox: citation?.bbox || this.createDefaultBBox(),
          citation: citation,
        };
      };

      // Generate product ID
      const productId = `prod-${Date.now()}-${index}-${Math.random().toString(36).slice(2, 9)}`;

      // Create full extracted text from all primary field values
      const extractedText = [
        extractedProduct.itemName?.value,
        extractedProduct.manufacturer?.value,
        extractedProduct.productKey?.value,
        extractedProduct.tag?.value,
      ]
        .filter(Boolean)
        .join(" | ");

      const product: Product = {
        id: productId,
        itemName: extractField(extractedProduct.itemName),
        manufacturer: extractField(extractedProduct.manufacturer),
        productKey: extractField(extractedProduct.productKey),
        tag: extractField(extractedProduct.tag),
        specIdNumber: extractField(extractedProduct.specIdNumber),
        project: extractField(extractedProduct.project),
        color: extractField(extractedProduct.color),
        size: extractField(extractedProduct.size),
        price: extractField(extractedProduct.price),
        details: extractField(extractedProduct.details),
        specDocumentId: documentId,
        extractedText: extractedText || "Extracted from Reducto",
        createdAt: new Date(),
      };

      console.log(`[Reducto] Mapped product ${index + 1}:`, {
        id: product.id,
        itemName: product.itemName.value,
        hasBBox: Boolean(product.itemName.bbox),
        page: product.itemName.bbox?.page,
      });

      return product;
    });
  }

  /**
   * Create default bounding box when citation is missing
   */
  private createDefaultBBox() {
    return {
      left: 0,
      top: 0,
      width: 0,
      height: 0,
      page: 1,
    };
  }
}

/**
 * Singleton instance for easy import
 */
let reductoClient: ReductoClient | null = null;

export function getReductoClient(): ReductoClient {
  if (!reductoClient) {
    reductoClient = new ReductoClient();
  }
  return reductoClient;
}
