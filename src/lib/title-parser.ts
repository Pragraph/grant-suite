/**
 * Parse and validate publication titles pasted from Excel/Publish or Perish.
 * Ported from the tested Topic Discovery via PoP web app.
 */

/** Split raw multi-line input into individual titles. */
export function parseTitles(rawInput: string): string[] {
  if (!rawInput || typeof rawInput !== "string") return [];
  return rawInput
    .split(/\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 10); // minimum title length
}

/** Validate parsed title count for meaningful analysis. */
export function validateTitles(titles: string[]): {
  valid: boolean;
  message: string;
} {
  if (titles.length < 4) {
    return {
      valid: false,
      message: "Minimum 4 titles required for meaningful analysis.",
    };
  }
  if (titles.length > 10) {
    return {
      valid: false,
      message: "Maximum 10 titles recommended. Select your top titles.",
    };
  }
  return { valid: true, message: "" };
}

/** Format titles as a numbered list for prompt injection. */
export function formatTitlesForPrompt(titles: string[]): string {
  return titles.map((title, i) => `${i + 1}. ${title}`).join("\n");
}
