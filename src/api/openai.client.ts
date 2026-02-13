/**
 * OpenAI API Client
 *
 * Lightweight client for LLM classification tasks (e.g., spec ID generation).
 * Uses gpt-4o-mini for cost-effective inference.
 */

import OpenAI from "openai";

let openaiClient: OpenAI | null = null;

function getOpenAIClient(): OpenAI {
  if (!openaiClient) {
    const key = import.meta.env.VITE_OPENAI_API_KEY;
    if (!key) {
      throw new Error(
        "OpenAI API key not found. Set VITE_OPENAI_API_KEY in your .env file.",
      );
    }
    openaiClient = new OpenAI({
      apiKey: key,
      dangerouslyAllowBrowser: true,
    });
  }
  return openaiClient;
}

/**
 * Default scope of MasterFormat divisions/sections for this project.
 *
 * - Full divisions: any section within that division is valid.
 * - Restricted divisions: only the listed section(s) are valid.
 */
export const DEFAULT_MASTERFORMAT_SCOPE = [
  "Division 09 - Finishes (all sections, e.g. 09 21 00, 09 30 00, 09 51 00, 09 64 00, 09 68 00, 09 91 00)",
  "Division 11 - Equipment: 11 22 00 - Commercial Equipment / Appliances only",
  "Division 12 - Furnishings (all sections, e.g. 12 21 00, 12 24 00, 12 35 00, 12 36 00, 12 48 00, 12 50 00, 12 93 00)",
  "Division 22 - Plumbing: 22 40 00 - Plumbing Fixtures only",
  "Division 26 - Electrical: 26 50 00 - Lighting Fixtures only",
];

/**
 * Classify a product into a CSI MasterFormat section number.
 *
 * @param itemName - Concise product name (e.g., "Acoustic Ceiling Panel")
 * @param productDescription - Full manufacturer description
 * @param manufacturer - Manufacturer name
 * @param availableSections - Project-specific MasterFormat scope (defaults to DEFAULT_MASTERFORMAT_SCOPE)
 * @returns MasterFormat section number (e.g., "09 51 00") or "N/A"
 */
export async function classifySpecId(
  itemName: string,
  productDescription: string,
  manufacturer: string,
  availableSections: string[] = DEFAULT_MASTERFORMAT_SCOPE,
): Promise<string> {
  const client = getOpenAIClient();

  const sectionsBlock = `Allowed MasterFormat scope (classify ONLY within these):\n${availableSections.join("\n")}`;

  const prompt = `Classify this product into a CSI MasterFormat section number.

Product: ${itemName}
Description: ${productDescription}
Manufacturer: ${manufacturer}

${sectionsBlock}

If the product does not fit any allowed section, return "N/A".
Return ONLY the section number (e.g., "09 51 00") or "N/A". No explanation.`;

  const response = await client.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [{ role: "user", content: prompt }],
    max_tokens: 15,
    temperature: 0,
  });

  const raw = response.choices[0]?.message?.content?.trim() ?? "N/A";

  // Validate format: 2-digit groups separated by spaces/dots/dashes
  const match = raw.match(/(\d{2})\s?(\d{2})\s?(\d{2})/);
  if (!match) return "N/A";

  return `${match[1]} ${match[2]} ${match[3]}`;
}
