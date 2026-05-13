// JSON paste parsing — handles common LLM output failure modes:
// markdown code fences, leading/trailing prose, trailing commas.
// Parser inventory: schema paste-input parser. See src/lib/form-schema/parsers.md.

export interface ParseResult {
  schema: unknown | null;
  error: string | null;
  errorPosition?: number;
}

export function stripMarkdownFences(raw: string): string {
  let text = raw.trim();
  // Strip leading ```json or ``` (with optional language tag)
  text = text.replace(/^```(?:json|JSON|Json)?\s*\n?/, "");
  // Strip trailing ``` (allow whitespace after)
  text = text.replace(/\n?```\s*$/, "");

  // Strip leading prose before first { or [
  const candidates = [text.indexOf("{"), text.indexOf("[")].filter((i) => i !== -1);
  const firstBrace = candidates.length > 0 ? Math.min(...candidates) : -1;
  if (firstBrace > 0) {
    text = text.slice(firstBrace);
  }

  // Strip trailing prose after last } or ]
  const lastBraceCurly = text.lastIndexOf("}");
  const lastBraceSquare = text.lastIndexOf("]");
  const lastBrace = Math.max(lastBraceCurly, lastBraceSquare);
  if (lastBrace !== -1 && lastBrace < text.length - 1) {
    text = text.slice(0, lastBrace + 1);
  }

  return text;
}

export function parseSchemaPaste(raw: string): ParseResult {
  if (!raw || raw.trim() === "") {
    return { schema: null, error: "No input provided" };
  }
  const stripped = stripMarkdownFences(raw);
  if (stripped === "") {
    return { schema: null, error: "Input contained no JSON content after fence stripping" };
  }
  try {
    const parsed = JSON.parse(stripped);
    return { schema: parsed, error: null };
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Unknown JSON parse error";
    const posMatch = msg.match(/position (\d+)/);
    const position = posMatch ? parseInt(posMatch[1], 10) : undefined;
    return { schema: null, error: msg, errorPosition: position };
  }
}
