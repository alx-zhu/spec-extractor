/**
 * Drawing-specific pre-processing for the Reducto extraction pipeline.
 *
 * For drawings, we parse the page layout first to locate the schedule table,
 * crop the PDF to just that region, then run extraction on the clean crop.
 * Citations are transformed back to original PDF coordinates afterward.
 */

import { getDocument, GlobalWorkerOptions, version } from "pdfjs-dist";
import type { ReductoBBox, ReductoFieldValue } from "@/types/reducto";
import type { ExtractedProduct, ProductFieldKey } from "@/types/product";

// Ensure pdfjs worker is configured (idempotent — safe if react-pdf set it first)
if (!GlobalWorkerOptions.workerSrc) {
  GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${version}/build/pdf.worker.min.mjs`;
}

// ---------------------------------------------------------------------------
// Types (minimal subset of Reducto parse response we actually use)
// ---------------------------------------------------------------------------

interface ParseBlock {
  bbox: ReductoBBox;
  content: string;
  type: string;
}

interface ParseChunk {
  blocks: ParseBlock[];
}

// ---------------------------------------------------------------------------
// Schedule bounds detection
// ---------------------------------------------------------------------------

const SCHEDULE_HEADER_PATTERN = /SCHEDULE/i;

/**
 * Walk parse blocks in reading order to find the product/fixture schedule.
 * Returns the union bbox of the header + all blocks until the next section
 * break, or null if no schedule header is found.
 */
export function findScheduleBounds(chunks: ParseChunk[]): ReductoBBox | null {
  const blocks = chunks.flatMap((c) => c.blocks);
  console.log(blocks);

  for (let i = 0; i < blocks.length; i++) {
    const block = blocks[i];
    const text = block.content.trim();
    console.log("block text", text);

    // Schedule headers are short labels — skip long content that happens
    // to contain "schedule" (e.g. a data cell or general note).
    if (!SCHEDULE_HEADER_PATTERN.test(text)) continue;

    const collected: ParseBlock[] = [block];
    console.log("matching block", block);

    for (let j = i + 1; j < blocks.length; j++) {
      const next = blocks[j];

      // Stop at the next section-level header or figure
      if (
        (["Title", "Section Header"].includes(next.type) &&
          next.content.trim().length < 80) ||
        next.type === "Figure"
      ) {
        console.log("breaking at: ", next);
        break;
      }

      collected.push(next);
    }

    // If the schedule content is all headers/text (no table blocks), a crop
    // would be unreliable — fall back to full-page extraction instead.
    if (!collected.some((b) => b.type === "Table")) return null;

    return unionBBoxes(collected.map((b) => b.bbox));
  }

  return null;
}

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

  // Render full page (pdfjs v5 requires `canvas`, not `canvasContext`)
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

// ---------------------------------------------------------------------------
// Debug: schedule bounds store (keyed by documentId)
// ---------------------------------------------------------------------------

const scheduleBoundsStore = new Map<string, ReductoBBox>();

export function setScheduleBounds(docId: string, bounds: ReductoBBox): void {
  scheduleBoundsStore.set(docId, bounds);
}

export function getScheduleBounds(docId: string): ReductoBBox | undefined {
  return scheduleBoundsStore.get(docId);
}

// ---------------------------------------------------------------------------
// Citation coordinate transform
// ---------------------------------------------------------------------------

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
