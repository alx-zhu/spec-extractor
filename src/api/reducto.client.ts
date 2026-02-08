/**
 * Reducto API Client
 *
 * Handles document upload and extraction using Reducto's Extract API.
 * Uses the official Reducto Node.js SDK.
 */

import Reducto from "reductoai";
import type { ReductoFieldValue } from "@/types/reducto";
import type { DocumentType, Product } from "@/types/product";
import { getExtractionConfig } from "./reducto.prompts";

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
    documentType: DocumentType,
    pdfPath: string,
  ): Promise<Product[]> {
    try {
      console.log("[Reducto] Starting upload and extraction for:", file.name);

      // Step 1: Upload the file
      const upload = await this.client.upload({
        file: file,
      });

      console.log("[Reducto] File uploaded:", upload);

      // Step 2: Extract with citations enabled using document-type-specific config
      const { schema, prompt } = getExtractionConfig(documentType);
      const result = await this.client.extract.run({
        input: upload,
        instructions: {
          schema,
          system_prompt: prompt,
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
        documentType,
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
    documentType: DocumentType,
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

      // Generate product ID
      const productId = `prod-${Date.now()}-${index}-${Math.random().toString(36).slice(2, 9)}`;

      const product: Product = {
        ...extractedProduct,
        id: productId,
        specDocumentId: documentId,
        documentType,
        createdAt: new Date(),
      };

      return product;
    });
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
