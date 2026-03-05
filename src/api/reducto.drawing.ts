/**
 * Drawing-specific pre-processing for the Reducto extraction pipeline.
 *
 * For drawings, we parse the page layout first to locate the schedule table,
 * crop the PDF to just that region, then run extraction on the clean crop.
 * Citations are transformed back to original PDF coordinates afterward.
 *
 * Schedule detection uses a two-phase approach:
 *  1. Heuristic gate — find a short block containing "SCHEDULE"
 *  2. LLM end-detection — send blocks from the header onward to gpt-4o-mini
 *     to determine exactly which blocks belong to the schedule
 */

import { getDocument, GlobalWorkerOptions, version } from "pdfjs-dist";
import type { ReductoBBox, ReductoFieldValue } from "@/types/reducto";
import type { ExtractedProduct, ProductFieldKey } from "@/types/product";
import { getOpenAIClient } from "./openai.client";

// Ensure pdfjs worker is configured (idempotent — safe if react-pdf set it first)
if (!GlobalWorkerOptions.workerSrc) {
  GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${version}/build/pdf.worker.min.mjs`;
}

// ---------------------------------------------------------------------------
// Types (minimal subset of Reducto parse response we actually use)
// ---------------------------------------------------------------------------

export interface ParseBlock {
  bbox: ReductoBBox;
  content: string;
  type: string;
}

export interface ParseChunk {
  blocks: ParseBlock[];
}

// ---------------------------------------------------------------------------
// Schedule header detection (heuristic gate)
// ---------------------------------------------------------------------------

const SCHEDULE_RE = /SCHEDULE/i;
const MAX_HEADER_LENGTH = 80;

/** Block types that are never schedule content — exclude from LLM input. */
const EXCLUDED_BLOCK_TYPES = new Set(["Footer", "Header", "Figure", "Image"]);

/** Strip HTML tags from a string, returning only text content. */
function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
}

/**
 * Find the first block that looks like a schedule title/header.
 * Returns the index into the flattened block list, or -1 if none found.
 *
 * The length check (<80 chars) prevents false positives from general notes
 * that mention "schedule" incidentally (e.g., "...ITEMS WITH LONG LEAD TIMES
 * THAT WILL AFFECT THE PROJECT SCHEDULE").
 */
export function findScheduleHeaderIndex(blocks: ParseBlock[]): number {
  for (let i = 0; i < blocks.length; i++) {
    const text = stripHtml(blocks[i].content).trim();
    if (text.length < MAX_HEADER_LENGTH && SCHEDULE_RE.test(text)) {
      return i;
    }
  }
  return -1;
}

// ---------------------------------------------------------------------------
// LLM-assisted schedule block detection
// ---------------------------------------------------------------------------

const SCHEDULE_DETECT_SYSTEM_PROMPT = `You are analyzing parsed layout blocks from an architectural/engineering drawing. Your job is to identify ALL blocks that belong to product schedules.

Product schedules list architectural products with tags like LT.1, LT.2, B-01, CPT-01, WC-01, ACT-01, EQ-1, P-1, etc. Tags follow the pattern: uppercase letters (1-5 chars), optional dash or dot, then digits (e.g. LT.3A, B-01, CPT-02, WD-01, SS-01).

INCLUDE all of the following:
- Schedule title/header blocks (e.g. "LIGHTING FIXTURE SCHEDULE", "FINISH SCHEDULE")
- Every product entry and its sub-fields (description, driver, lamps, manufacturer, model, color, size, contact, notes)
- ALL rows — do not stop early. The entire schedule must be captured.
- If there are MULTIPLE product schedules on the page, include ALL of them.

EXCLUDE:
- General notes sections
- Panel schedules (electrical panels with circuit breaker listings)
- Title blocks, revision tables, compliance certificates
- Floor plan labels, room names, dimensions
- Legends that are not product schedules

Example: A lighting fixture schedule has entries like:
  "LT.1 RECESSED LED DOWNLIGHT FIXTURE" followed by DRIVER, LAMPS, MANUF lines.
  "LT.2 SURFACE MOUNTED DECORATIVE LED FIXTURE" followed by its spec lines.
  → Include the schedule title AND every LT.x entry with all its sub-lines.

Example: A finish schedule has entries like:
  "B-01 BASE JOHNSONITE/TARKETT..." with columns for description, manufacturer, model, color, size.
  "CPT-01 CARPET SHAWCONTRACT..." etc.
  → Include the schedule title AND every row.

Return JSON: { "indices": [0, 1, 2, ...] } using the original block indices provided.
If you cannot determine the schedule boundaries, return { "indices": [] }.`;

/**
 * Build a compact one-line-per-block summary for the LLM.
 * Only includes blocks from headerIndex onward, skipping non-content types
 * (Footer, Header, Figure, Image) that are never part of a schedule.
 * HTML tags are stripped so the LLM sees only text content.
 */
function buildBlockSummary(
  blocks: ParseBlock[],
  headerIndex: number,
): string {
  const lines: string[] = [];
  for (let i = headerIndex; i < blocks.length; i++) {
    const b = blocks[i];
    if (EXCLUDED_BLOCK_TYPES.has(b.type)) continue;
    const text = stripHtml(b.content);
    const preview = text.length > 120 ? text.slice(0, 120) + "…" : text;
    lines.push(`${i} | ${b.type} | ${preview}`);
  }
  return lines.join("\n");
}

/**
 * Use gpt-4o-mini to determine which blocks (from headerIndex onward) belong
 * to the product schedule. Returns the bounding box union, or null on failure.
 */
export async function detectScheduleBounds(
  blocks: ParseBlock[],
  headerIndex: number,
): Promise<ReductoBBox | null> {
  const summary = buildBlockSummary(blocks, headerIndex);

  console.log("[Drawing] Block summary for LLM:\n", summary);

  try {
    const client = getOpenAIClient();
    const response = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: SCHEDULE_DETECT_SYSTEM_PROMPT },
        { role: "user", content: summary },
      ],
      response_format: { type: "json_object" },
      max_tokens: 500,
      temperature: 0,
    });

    const raw = response.choices[0]?.message?.content?.trim() ?? "";
    console.log("[Drawing] LLM response:", raw);

    const parsed = JSON.parse(raw) as { indices?: number[] };
    const indices = (parsed.indices ?? []).filter(
      (idx) =>
        Number.isInteger(idx) &&
        idx >= headerIndex &&
        idx < blocks.length &&
        !EXCLUDED_BLOCK_TYPES.has(blocks[idx].type),
    );

    if (indices.length === 0) {
      console.warn("[Drawing] LLM returned no valid indices");
      return null;
    }

    console.log(`[Drawing] LLM selected ${indices.length} blocks:`, indices);

    const selectedBlocks = indices.map((i) => blocks[i]);
    for (const idx of indices) {
      const b = blocks[idx];
      console.log(
        `[Drawing]   block ${idx} | ${b.type} | bbox: L=${b.bbox.left.toFixed(4)} T=${b.bbox.top.toFixed(4)} W=${b.bbox.width.toFixed(4)} H=${b.bbox.height.toFixed(4)} | "${b.content.trim().slice(0, 60)}"`,
      );
    }

    const result = unionBBoxes(selectedBlocks.map((b) => b.bbox));
    console.log(
      `[Drawing] Union bbox: L=${result.left.toFixed(4)} T=${result.top.toFixed(4)} W=${result.width.toFixed(4)} H=${result.height.toFixed(4)} (page ${result.page})`,
    );

    return result;
  } catch (err) {
    console.error("[Drawing] LLM schedule detection failed:", err);
    return null;
  }
}

// ---------------------------------------------------------------------------
// Bbox helpers
// ---------------------------------------------------------------------------

function unionBBoxes(bboxes: ReductoBBox[]): ReductoBBox {
  let minL = bboxes[0].left;
  let minT = bboxes[0].top;
  let maxR = bboxes[0].left + bboxes[0].width;
  let maxB = bboxes[0].top + bboxes[0].height;

  for (let i = 1; i < bboxes.length; i++) {
    const b = bboxes[i];
    minL = Math.min(minL, b.left);
    minT = Math.min(minT, b.top);
    maxR = Math.max(maxR, b.left + b.width);
    maxB = Math.max(maxB, b.top + b.height);
  }

  return {
    left: minL,
    top: minT,
    width: maxR - minL,
    height: maxB - minT,
    page: bboxes[0].page,
  };
}

// ---------------------------------------------------------------------------
// PDF crop via pdfjs canvas rendering
// ---------------------------------------------------------------------------

const RENDER_SCALE = 2;

/**
 * Render a PDF page, crop to the schedule region, return a PNG File.
 *
 * @param file   Original drawing PDF
 * @param bounds Normalized (0–1) bbox from the parse step
 */
export async function cropToSchedule(
  file: File,
  bounds: ReductoBBox,
): Promise<File> {
  const data = new Uint8Array(await file.arrayBuffer());
  const pdf = await getDocument({ data }).promise;
  const page = await pdf.getPage(bounds.page);
  const viewport = page.getViewport({ scale: RENDER_SCALE });

  const canvas = document.createElement("canvas");
  canvas.width = viewport.width;
  canvas.height = viewport.height;
  await page.render({ canvas, viewport }).promise;

  // Crop to schedule region (normalized → pixels)
  const cx = Math.floor(bounds.left * viewport.width);
  const cy = Math.floor(bounds.top * viewport.height);
  const cw = Math.ceil(bounds.width * viewport.width);
  const ch = Math.ceil(bounds.height * viewport.height);

  const crop = document.createElement("canvas");
  crop.width = cw;
  crop.height = ch;
  crop.getContext("2d")!.drawImage(canvas, cx, cy, cw, ch, 0, 0, cw, ch);

  const blob = await new Promise<Blob>((resolve, reject) =>
    crop.toBlob(
      (b) => (b ? resolve(b) : reject(new Error("Canvas toBlob failed"))),
      "image/png",
    ),
  );

  pdf.destroy();

  const baseName = file.name.replace(/\.[^.]+$/, "");
  return new File([blob], `${baseName}-crop.png`, { type: "image/png" });
}

// ---------------------------------------------------------------------------
// Citation coordinate transform
// ---------------------------------------------------------------------------

const FIELD_KEYS: ProductFieldKey[] = [
  "itemName",
  "productDescription",
  "modelNumber",
  "manufacturer",
  "tag",
  "specIdNumber",
  "project",
  "finish",
  "size",
  "price",
  "details",
];

/**
 * Map citation bboxes from crop-relative coordinates back to the original
 * full-page coordinate space so SheetPdfViewer overlays render correctly.
 */
export function transformCitations(
  products: ExtractedProduct[],
  bounds: ReductoBBox,
): ExtractedProduct[] {
  return products.map((product) => {
    const out = { ...product };

    for (const key of FIELD_KEYS) {
      const field = out[key] as ReductoFieldValue<string> | undefined;
      if (!field?.citations?.length) continue;

      out[key] = {
        ...field,
        citations: field.citations.map((c) => ({
          ...c,
          bbox: {
            ...c.bbox,
            left: bounds.left + c.bbox.left * bounds.width,
            top: bounds.top + c.bbox.top * bounds.height,
            width: c.bbox.width * bounds.width,
            height: c.bbox.height * bounds.height,
            page: bounds.page,
          },
        })),
      };
    }

    return out;
  });
}
