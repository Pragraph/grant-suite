// Numbered prefix forms supported in pasted reference lists:
//   "1. Smith..." / "1) Smith..." / "[1] Smith..."
const NUMBERED_PREFIX_REGEX = /^\s*(?:\d+[.)]|\[\d+\])\s+/;

function normalizeWhitespace(value: string): string {
  return value.replace(/\s+/g, " ").trim();
}

/**
 * Parses a pasted reference list into individual citation strings.
 *
 * Detection order:
 *   1. **Numbered list** — when 2+ lines start with `1. `, `1) `, or `[1] `,
 *      the input is treated as numbered. Each citation begins at a numbered
 *      prefix line; intermediate lines are joined onto the prior citation.
 *      Numbered prefixes themselves are stripped from the output.
 *   2. **Blank-line separated** — fall through; if the input contains 2+
 *      blocks separated by blank lines, each block is one (possibly
 *      multi-line) citation.
 *   3. **One per line** — final fallback. Each non-empty line is one citation.
 *
 * Empty lines are skipped. All returned citations have whitespace collapsed
 * to single spaces. Returns an empty array for empty input.
 */
export function parseCitationList(input: string): string[] {
  if (!input.trim()) return [];

  const lines = input.split("\n");
  const numberedLineCount = lines.filter((l) => NUMBERED_PREFIX_REGEX.test(l)).length;
  const isNumbered = numberedLineCount >= 2;

  if (isNumbered) {
    const citations: string[] = [];
    let current = "";
    for (const line of lines) {
      if (NUMBERED_PREFIX_REGEX.test(line)) {
        if (current.trim()) citations.push(normalizeWhitespace(current));
        current = line.replace(NUMBERED_PREFIX_REGEX, "");
      } else {
        current += " " + line;
      }
    }
    if (current.trim()) citations.push(normalizeWhitespace(current));
    return citations;
  }

  // Blank-line separated multi-line citations.
  const blocks = input
    .split(/\n\s*\n/)
    .map(normalizeWhitespace)
    .filter(Boolean);
  if (blocks.length >= 2) return blocks;

  // Single-line per citation.
  return lines.map((l) => l.trim()).filter(Boolean);
}
