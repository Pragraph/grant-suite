export type TagType =
  | "CITATION NEEDED"
  | "USER INPUT NEEDED"
  | "VERIFY"
  | "ESTIMATED"
  | "CHECK DATE";

export interface TagInstance {
  id: string;
  type: TagType;
  hint?: string;
  raw: string;
  startIndex: number;
  endIndex: number;
  // scopeEndIndex equals endIndex when no assertion follows; for confirm-or-replace
  // tags followed by `**assertion**`, scopeEndIndex extends past the closing `**`.
  scopeEndIndex: number;
  // The full scope text (tag bracket plus optional `**assertion**` span). Equals
  // `raw` when no assertion follows.
  scopeRaw: string;
  // Inner text of the asserted bold span, without the `**` markers. Undefined
  // when the tag has no following assertion.
  assertionText?: string;
  contextBefore: string;
  contextAfter: string;
}

export const PLACEHOLDER_TAG_REGEX =
  /\[(CITATION NEEDED|USER INPUT NEEDED|VERIFY|ESTIMATED|CHECK DATE)(?::\s*([^\]]+))?\]/g;

const CONTEXT_WINDOW = 80;

// Confirm-or-replace types may carry an LLM-supplied assertion in a following
// bold span (e.g. `[VERIFY] **No minimum stated in provided guideline**`).
// Replace-required types keep bracket-only scope because there is no asserted
// text the user is verifying.
const CONFIRM_OR_REPLACE_TYPES: ReadonlySet<TagType> = new Set([
  "VERIFY",
  "ESTIMATED",
  "CHECK DATE",
]);

// Lookahead anchored at the position right after the closing `]`. Allows
// optional inline whitespace (spaces or tabs but NOT newlines), then a bold
// span `**…**` whose inner text is at least one non-newline, non-asterisk
// character. Conservative on purpose: strictly single-line bold spans, no
// nested asterisks, no line breaks before the assertion. Falls back to
// bracket-only scope when the lookahead does not match.
const ASSERTION_LOOKAHEAD_REGEX = /^[ \t]*\*\*([^\n*]+)\*\*/;

function findCodeBlockRanges(content: string): Array<[number, number]> {
  const ranges: Array<[number, number]> = [];

  // Triple-backtick fenced code blocks (lazy match across lines).
  const fenceRegex = /```[\s\S]*?```/g;
  let match: RegExpExecArray | null;
  while ((match = fenceRegex.exec(content)) !== null) {
    ranges.push([match.index, match.index + match[0].length]);
  }

  // Inline single-backtick spans, but only outside any fence range.
  const inlineRegex = /`[^`\n]+`/g;
  while ((match = inlineRegex.exec(content)) !== null) {
    const start = match.index;
    const insideFence = ranges.some(([s, e]) => start >= s && start < e);
    if (!insideFence) {
      ranges.push([start, start + match[0].length]);
    }
  }

  return ranges;
}

function isInsideRange(index: number, ranges: Array<[number, number]>): boolean {
  return ranges.some(([s, e]) => index >= s && index < e);
}

export function parsePlaceholders(content: string): TagInstance[] {
  const instances: TagInstance[] = [];
  if (!content) return instances;

  const codeRanges = findCodeBlockRanges(content);
  const re = new RegExp(PLACEHOLDER_TAG_REGEX.source, "g");
  let match: RegExpExecArray | null;
  while ((match = re.exec(content)) !== null) {
    const startIndex = match.index;
    if (isInsideRange(startIndex, codeRanges)) {
      // Tags inside fenced or inline code spans are intentionally
      // literal — skip them everywhere (resolver list, replacement,
      // and the in-place pill renderer).
      continue;
    }
    const endIndex = match.index + match[0].length;
    const type = match[1] as TagType;

    let scopeEndIndex = endIndex;
    let assertionText: string | undefined;

    if (CONFIRM_OR_REPLACE_TYPES.has(type)) {
      const lookahead = content.slice(endIndex).match(ASSERTION_LOOKAHEAD_REGEX);
      if (lookahead) {
        scopeEndIndex = endIndex + lookahead[0].length;
        assertionText = lookahead[1].trim();
        // Don't process tags that fall inside the asserted bold span; advance
        // the regex cursor past the scope so subsequent matches start cleanly.
        re.lastIndex = scopeEndIndex;
      }
    }

    const scopeRaw = content.slice(startIndex, scopeEndIndex);
    const contextBefore = content
      .slice(Math.max(0, startIndex - CONTEXT_WINDOW), startIndex)
      .replace(/\s+/g, " ")
      .trim();
    const contextAfter = content
      .slice(scopeEndIndex, Math.min(content.length, scopeEndIndex + CONTEXT_WINDOW))
      .replace(/\s+/g, " ")
      .trim();

    instances.push({
      id: `${match[1]}-${startIndex}`,
      type,
      hint: match[2]?.trim(),
      raw: match[0],
      startIndex,
      endIndex,
      scopeEndIndex,
      scopeRaw,
      assertionText,
      contextBefore,
      contextAfter,
    });
  }

  return instances;
}

/**
 * Applies user resolutions to the original content.
 * - resolutions: tagId -> replacement text (replaces full scope including
 *   any asserted bold span).
 * - confirmed: tag IDs where user clicked "Confirm as-is". When the tag has
 *   an asserted bold span the assertion text is kept (brackets stripped);
 *   otherwise the scope is removed entirely.
 * Skipped or pending tags remain in the output verbatim.
 */
export function applyResolutions(
  content: string,
  resolutions: Record<string, string>,
  confirmed: Set<string>,
): string {
  const instances = parsePlaceholders(content);
  let result = content;
  for (let i = instances.length - 1; i >= 0; i--) {
    const tag = instances[i];
    if (resolutions[tag.id] !== undefined) {
      result =
        result.slice(0, tag.startIndex) +
        resolutions[tag.id] +
        result.slice(tag.scopeEndIndex);
    } else if (confirmed.has(tag.id)) {
      const replacement = tag.assertionText ?? "";
      result =
        result.slice(0, tag.startIndex) +
        replacement +
        result.slice(tag.scopeEndIndex);
    }
  }
  return result;
}

export function getTagDisplayLabel(type: TagType): string {
  return type;
}

export function isReplaceRequired(type: TagType): boolean {
  return type === "CITATION NEEDED" || type === "USER INPUT NEEDED";
}

// ─── Source preprocessing for in-place pill rendering ──────────────────────

function tagTypeToCssClass(type: TagType): string {
  switch (type) {
    case "CITATION NEEDED":
    case "USER INPUT NEEDED":
      return "placeholder-pill placeholder-pill-required";
    case "VERIFY":
      return "placeholder-pill placeholder-pill-verify";
    case "ESTIMATED":
    case "CHECK DATE":
      return "placeholder-pill placeholder-pill-info";
  }
}

function escapeHtmlAttr(value: string): string {
  return value.replace(/&/g, "&amp;").replace(/"/g, "&quot;");
}

function escapeHtmlText(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

/**
 * Wraps each placeholder tag in the source markdown with an HTML
 * span carrying a stable id, data attributes, and a tag-type CSS
 * class. Code-block tags are excluded by `parsePlaceholders`
 * itself, so code samples remain literal. Resolved tags are
 * replaced with their resolution text, confirmed tags with their
 * assertion text (or stripped entirely when no assertion follows),
 * and pending tags become spans.
 *
 * Confirm-or-replace tags carrying an `**assertion**` span render
 * with a wider visual scope: the pill background extends across the
 * tag plus the asserted span, with the assertion rendered in bold.
 *
 * The output is meant to feed react-markdown with rehype-raw so
 * the spans survive markdown parsing.
 */
export function preprocessPlaceholdersForMarkdown(
  content: string,
  resolutions: Record<string, string>,
  confirmed: Set<string>,
): string {
  const tags = parsePlaceholders(content);

  let result = content;
  for (let i = tags.length - 1; i >= 0; i--) {
    const tag = tags[i];

    if (resolutions[tag.id] !== undefined) {
      result =
        result.slice(0, tag.startIndex) +
        resolutions[tag.id] +
        result.slice(tag.scopeEndIndex);
      continue;
    }

    if (confirmed.has(tag.id)) {
      const replacement = tag.assertionText ?? "";
      result =
        result.slice(0, tag.startIndex) +
        replacement +
        result.slice(tag.scopeEndIndex);
      continue;
    }

    const baseClass = tagTypeToCssClass(tag.type);
    const cssClass =
      tag.assertionText !== undefined
        ? `${baseClass} placeholder-pill-wide`
        : baseClass;

    // Render the asserted span as inline HTML <strong> so the wider pill
    // shows the assertion in bold without depending on markdown-in-HTML
    // parsing semantics.
    const innerHtml =
      tag.assertionText !== undefined
        ? `${escapeHtmlText(tag.raw)} <strong>${escapeHtmlText(tag.assertionText)}</strong>`
        : escapeHtmlText(tag.raw);

    const span =
      `<span id="tag-pill-${escapeHtmlAttr(tag.id)}"` +
      ` data-tag-id="${escapeHtmlAttr(tag.id)}"` +
      ` data-tag-type="${escapeHtmlAttr(tag.type)}"` +
      ` class="${cssClass}">${innerHtml}</span>`;

    result =
      result.slice(0, tag.startIndex) + span + result.slice(tag.scopeEndIndex);
  }

  return result;
}
