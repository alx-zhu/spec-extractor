/**
 * Reducto API Client
 *
 * Handles document upload and extraction using Reducto's Extract API.
 * Uses the official Reducto Node.js SDK.
 */

import Reducto from "reductoai";
import type { Upload } from "reductoai/resources/shared";
import type { ReductoFieldValue } from "@/types/reducto";
import type { ProductDocumentType, ExtractedProduct } from "@/types/product";
import { getExtractionConfig } from "./reducto.prompts";
import {
  findScheduleBounds,
  cropToSchedule,
  transformCitations,
  setScheduleBounds,
} from "./reducto.drawing";

export type ExtractionStage =
  | "uploading"
  | "parsing"
  | "cropping"
  | "extracting";

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
   * Upload file and extract products with citations.
   * For drawings, runs parse → crop → extract pipeline automatically.
   *
   * @param onProgress Optional callback fired at each pipeline stage so callers
   *                   can surface progress to the user without polling.
   */
  async uploadAndExtract(
    file: File,
    documentId: string,
    documentType: ProductDocumentType,
    pdfPath: string,
    onProgress?: (stage: ExtractionStage) => void,
    signal?: AbortSignal,
  ): Promise<ExtractedProduct[]> {
    try {
      console.log("[Reducto] Starting upload and extraction for:", file.name);

      onProgress?.("uploading");
      const upload = await this.client.upload({ file }, { signal });
      console.log("[Reducto] File uploaded:", upload);

      // Drawing pipeline: parse → crop → extract → transform citations
      if (documentType === "drawing") {
        return this.uploadAndExtractDrawing(
          file,
          upload,
          documentId,
          pdfPath,
          onProgress,
          signal,
        );
      }

      onProgress?.("extracting");
      return this.extractFromUpload(
        upload,
        documentId,
        documentType,
        pdfPath,
        signal,
      );
    } catch (error) {
      console.error("[Reducto] Extraction failed:", error);
      throw error;
    }
  }

  /**
   * Drawing-specific pipeline: parse layout → find schedule bounds →
   * crop to schedule region → extract from crop → transform citations
   * back to original PDF coordinates.
   */
  private async uploadAndExtractDrawing(
    file: File,
    upload: Upload,
    documentId: string,
    pdfPath: string,
    onProgress?: (stage: ExtractionStage) => void,
    signal?: AbortSignal,
  ): Promise<ExtractedProduct[]> {
    // Step 1: Parse to get layout blocks with bboxes
    console.log("[Reducto] Drawing: parsing layout...");
    onProgress?.("parsing");
    const parseResult = await this.client.parse.run(
      {
        input: upload,
        formatting: {
          table_output_format: "html",
        },
      },
      { signal },
    );

    if (!("result" in parseResult)) {
      throw new Error("Unexpected async parse response");
    }
    if (parseResult.result.type === "url") {
      throw new Error(
        "Parse result too large for inline response — not expected for single-page drawings",
      );
    }

    // Step 2: Find schedule bounds
    const bounds = findScheduleBounds(parseResult.result.chunks);

    let extractInput: Upload;
    if (bounds) {
      console.log("[Reducto] Drawing: schedule found, cropping...", bounds);
      onProgress?.("cropping");
      setScheduleBounds(documentId, bounds);
      // Crop is a local canvas operation — check signal before starting it
      signal?.throwIfAborted();
      const cropped = await cropToSchedule(file, bounds);
      extractInput = await this.client.upload({ file: cropped }, { signal });
    } else {
      console.warn(
        "[Reducto] Drawing: no schedule header found, extracting full page",
      );
      extractInput = upload;
    }

    // Step 3: Extract from the (possibly cropped) upload
    onProgress?.("extracting");
    let products = await this.extractFromUpload(
      extractInput,
      documentId,
      "drawing",
      pdfPath,
      signal,
    );

    // Step 4: Transform citations back to original PDF space
    if (bounds) {
      products = transformCitations(products, bounds);
    }

    return products;
  }

  /**
   * Run extract on an already-uploaded file and map results to products.
   * Shared by both the standard and drawing pipelines.
   */
  private async extractFromUpload(
    upload: Upload,
    documentId: string,
    documentType: ProductDocumentType,
    pdfPath: string,
    signal?: AbortSignal,
  ): Promise<ExtractedProduct[]> {
    const { schema, prompt } = getExtractionConfig(documentType);
    const result = await this.client.extract.run(
      {
        input: upload,
        instructions: {
          schema,
          system_prompt: prompt,
        },
        settings: {
          array_extract: true,
          citations: {
            enabled: true,
            numerical_confidence: true,
          },
        },
      },
      { signal },
    );

    if ("job_id" in result && !("result" in result)) {
      throw new Error(
        "Received async response. Please use synchronous extraction or poll for results.",
      );
    }
    if (!("result" in result)) {
      throw new Error("Invalid response format from Reducto API");
    }

    const extractedData = result.result as { products?: unknown[] };
    const resultArray = extractedData.products || [];

    console.log("[Reducto] Extraction complete:", {
      job_id: result.job_id,
      num_products: resultArray.length,
      usage: result.usage,
      studio_link: result.studio_link,
    });

    const products = this.mapReductoToProducts(
      resultArray,
      documentId,
      documentType,
      pdfPath,
    );

    console.log(`[Reducto] Mapped ${products.length} products`);
    return products;
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
    documentType: ProductDocumentType,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _pdfPath: string,
  ): ExtractedProduct[] {
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

      const product: ExtractedProduct = {
        ...extractedProduct,
        id: productId,
        productDocumentId: documentId,
        documentType,
        reviewed: false,
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
