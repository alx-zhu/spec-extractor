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
  findScheduleHeaderIndex,
  detectScheduleBounds,
  cropToSchedule,
  transformCitations,
  type ParseChunk,
} from "./reducto.drawing";
import { updateDocument } from "./documents.api";

export type ExtractionStage =
  | "uploading"
  | "parsing"
  | "detecting"
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
   * For drawings, runs parse → detect schedule → crop → extract pipeline.
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
      if (signal?.aborted) throw new DOMException("Aborted", "AbortError");

      const upload = await this.client.upload({ file }, { signal });
      console.log("[Reducto] File uploaded:", upload);

      // Drawing pipeline: parse → detect → crop → extract → transform
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
   * Drawing-specific pipeline: parse layout → find schedule header →
   * LLM block detection → crop to schedule → extract → transform citations.
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
      { input: upload },
      { signal },
    );

    if (!("result" in parseResult)) {
      throw new Error("Unexpected async parse response");
    }
    if (parseResult.result.type === "url") {
      throw new Error("Parse result too large for inline response");
    }

    const chunks = parseResult.result.chunks as ParseChunk[];
    const blocks = chunks.flatMap((c) => c.blocks);

    // Step 2: Heuristic gate — find schedule header
    const headerIndex = findScheduleHeaderIndex(blocks);

    let extractInput: Upload;
    let bounds: import("@/types/reducto").ReductoBBox | null = null;

    if (headerIndex >= 0) {
      console.log(
        `[Reducto] Drawing: schedule header found at block ${headerIndex}: "${blocks[headerIndex].content.trim()}"`,
      );

      // Step 3: LLM-assisted block detection
      onProgress?.("detecting");
      signal?.throwIfAborted();
      bounds = await detectScheduleBounds(blocks, headerIndex);

      if (bounds) {
        console.log("[Reducto] Drawing: schedule bounds detected:", bounds);
        onProgress?.("cropping");
        await updateDocument(documentId, { scheduleBounds: bounds });

        signal?.throwIfAborted();
        const cropped = await cropToSchedule(file, bounds);
        extractInput = await this.client.upload(
          { file: cropped },
          { signal },
        );
      } else {
        console.warn(
          "[Reducto] Drawing: LLM could not determine schedule bounds, extracting full page",
        );
        extractInput = upload;
      }
    } else {
      console.warn(
        "[Reducto] Drawing: no schedule header found, extracting full page",
      );
      extractInput = upload;
    }

    // Step 4: Extract from the (possibly cropped) upload
    onProgress?.("extracting");
    let products = await this.extractFromUpload(
      extractInput,
      documentId,
      "drawing",
      pdfPath,
      signal,
    );

    // Step 5: Transform citations back to original PDF space
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

    return this.mapReductoToProducts(
      resultArray,
      documentId,
      documentType,
      pdfPath,
    );
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
        modelNumber: extractedProduct.modelNumber?.value,
        manufacturer: extractedProduct.manufacturer?.value,
        citationsCount: extractedProduct.itemName?.citations?.length,
      });

      // Guardrail: clear modelNumber if it's actually a tag
      const modelVal = extractedProduct.modelNumber?.value?.trim();
      const tagVal = extractedProduct.tag?.value?.trim();
      if (modelVal && modelVal !== "N/A") {
        const isTagValue = tagVal && modelVal.toUpperCase() === tagVal.toUpperCase();
        // Tag pattern: 1-4 letters, optional dash, 1-3 digits, optional trailing letter
        const isTagPattern = /^[A-Z]{1,5}-?\d{1,3}[A-Z]?$/i.test(modelVal);

        if (isTagValue || isTagPattern) {
          console.warn(
            `[Reducto] Clearing modelNumber "${modelVal}" — matches tag pattern or equals tag "${tagVal}"`,
          );
          extractedProduct.modelNumber = { value: "N/A", citations: [] };
        }
      }

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
