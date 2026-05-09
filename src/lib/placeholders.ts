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
  // Bracket position (unchanged across rounds): used by tag.id, click-detection,
  // and visual decoration anchors.
  startIndex: number;
  endIndex: number;
  // Scope position. May extend beyond the bracket either backward (Pattern B,
  // tag inside bold span) or forward (Pattern A, bold span follows tag) or
  // both directions for replace-required types it stays equal to the bracket.
  scopeStartIndex: number;
  scopeEndIndex: number;
  scopeRaw: string;
  assertionText?: string;
  contextBefore: string;
  contextAfter: string;
}

export const PLACEHOLDER_TAG_REGEX =
  /\[(CITATION NEEDED|USER INPUT NEEDED|VERIFY|ESTIMATED|CHECK DATE)(?::\s*([^\]]+))?\]/g;

const CONTEXT_WINDOW = 80;

// Confirm-or-replace types may carry an LLM-supplied assertion. Two patterns
// observed in real LLM output:
//   Pattern A: `[VERIFY] **assertion**`           (tag outside bold, bold follows)
//   Pattern B: `**[VERIFY] assertion**`           (tag inside bold span)
// Replace-required types ([CITATION NEEDED], [USER INPUT NEEDED]) always keep
// bracket-only scope; their content is human-supplied, not LLM-asserted.
const CONFIRM_OR_REPLACE_TYPES: ReadonlySet<TagType> = new Set([
  "VERIFY",
  "ESTIMATED",
  "CHECK DATE",
]);

// Pattern A lookahead: anchored right after the closing `]`. Allows optional
// inline whitespace (spaces/tabs but NOT newlines), then `**…**` whose inner
// text is one or more non-newline, non-asterisk characters. Conservative on
// purpose so it doesn't accidentally consume an italic or unrelated bold span.
const PATTERN_A_LOOKAHEAD = /^[ \t]*\*\*([^\n*]+)\*\*/;

interface ScopeResult {
  scopeStart: number;
  scopeEnd: number;
  scopeRaw: string;
  assertionText: string | undefined;
}

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

function rangesOverlap(
  s: number,
  e: number,
  ranges: ReadonlyArray<readonly [number, number]>,
): boolean {
  return ranges.some(([cs, ce]) => s < ce && e > cs);
}

/**
 * Pattern B: tag sits INSIDE a bold span. Scope extends backward to include
 * the opening `**` and forward through the closing `**` on the same line.
 *
 * Returns null when:
 *   - no unclosed `**` precedes the tag on the same line,
 *   - no closing `**` follows the tag on the same line,
 *   - the resulting assertion text is empty (e.g. `**[VERIFY]**`),
 *   - the assertion contains stray `*` (e.g. `***[VERIFY]***` bold-italic
 *     wrapping, or italic markers inside bold). Conservative bail.
 */
function detectPatternB(
  content: string,
  tagStart: number,
  tagEnd: number,
): ScopeResult | null {
  const lineStart = content.lastIndexOf("\n", tagStart - 1) + 1;
  const before = content.slice(lineStart, tagStart);

  // Walk forward through `before`, toggling open/close on each `**`. The most
  // recent unclosed `**` position is our scope-opening candidate.
  let openIdx = -1;
  let cursor = 0;
  let openCount = 0;
  while (cursor < before.length) {
    const next = before.indexOf("**", cursor);
    if (next === -1) break;
    openCount++;
    openIdx = openCount % 2 === 1 ? next : -1;
    cursor = next + 2;
  }
  if (openIdx === -1) return null;

  const scopeStart = lineStart + openIdx;

  const lineEnd = content.indexOf("\n", tagEnd);
  const searchEnd = lineEnd === -1 ? content.length : lineEnd;
  const after = content.slice(tagEnd, searchEnd);
  const closeIdx = after.indexOf("**");
  if (closeIdx === -1) return null;

  const scopeEnd = tagEnd + closeIdx + 2;

  const innerStart = scopeStart + 2;
  const innerEnd = scopeEnd - 2;
  const beforeTagInner = content.slice(innerStart, tagStart);
  const afterTagInner = content.slice(tagEnd, innerEnd);
  const assertionText = (beforeTagInner + afterTagInner)
    .replace(/\s+/g, " ")
    .trim();

  if (!assertionText) return null;
  if (assertionText.includes("*")) return null;

  return {
    scopeStart,
    scopeEnd,
    scopeRaw: content.slice(scopeStart, scopeEnd),
    assertionText,
  };
}

/**
 * Pattern A: tag is followed (with optional inline whitespace) by `**bold**`.
 * Scope starts at the bracket and ends after the closing `**`.
 */
function detectPatternA(
  content: string,
  tagStart: number,
  tagEnd: number,
): ScopeResult | null {
  const after = content.slice(tagEnd);
  const match = after.match(PATTERN_A_LOOKAHEAD);
  if (!match) return null;

  const scopeEnd = tagEnd + match[0].length;
  return {
    scopeStart: tagStart,
    scopeEnd,
    scopeRaw: content.slice(tagStart, scopeEnd),
    assertionText: match[1].trim(),
  };
}

/**
 * Determines the scope for a confirm-or-replace tag.
 *
 * Order: Pattern B (tag-inside-bold) first, then Pattern A (bold-follows-tag),
 * then bracket-only fallback. Detected scopes that would overlap an
 * already-claimed range are rejected so the caller can fall through to a
 * narrower pattern.
 */
function detectScope(
  content: string,
  tagStart: number,
  tagEnd: number,
  claimedRanges: ReadonlyArray<readonly [number, number]>,
): ScopeResult {
  const b = detectPatternB(content, tagStart, tagEnd);
  if (b && !rangesOverlap(b.scopeStart, b.scopeEnd, claimedRanges)) {
    return b;
  }

  const a = detectPatternA(content, tagStart, tagEnd);
  if (a && !rangesOverlap(a.scopeStart, a.scopeEnd, claimedRanges)) {
    return a;
  }

  return {
    scopeStart: tagStart,
    scopeEnd: tagEnd,
    scopeRaw: content.slice(tagStart, tagEnd),
    assertionText: undefined,
  };
}

export function parsePlaceholders(content: string): TagInstance[] {
  const instances: TagInstance[] = [];
  if (!content) return instances;

  const codeRanges = findCodeBlockRanges(content);
  // Wider-scope claims from earlier tags. A subsequent tag whose bracket
  // falls inside a claimed range is skipped entirely (avoids overlapping
  // pill spans and keeps the substitution loop in applyResolutions sound).
  const claimedRanges: Array<[number, number]> = [];

  const re = new RegExp(PLACEHOLDER_TAG_REGEX.source, "g");
  let match: RegExpExecArray | null;
  while ((match = re.exec(content)) !== null) {
    const startIndex = match.index;
    if (isInsideRange(startIndex, codeRanges)) continue;
    const endIndex = startIndex + match[0].length;
    const type = match[1] as TagType;

    // Skip tags whose brackets fall inside an already-claimed wider scope.
    if (rangesOverlap(startIndex, endIndex, claimedRanges)) continue;

    let scope: ScopeResult;
    if (CONFIRM_OR_REPLACE_TYPES.has(type)) {
      scope = detectScope(content, startIndex, endIndex, claimedRanges);
      // Register only widened scopes. Bracket-only scopes don't claim
      // territory because they can coexist with siblings.
      if (
        scope.scopeStart < startIndex ||
        scope.scopeEnd > endIndex
      ) {
        claimedRanges.push([scope.scopeStart, scope.scopeEnd]);
      }
    } else {
      scope = {
        scopeStart: startIndex,
        scopeEnd: endIndex,
        scopeRaw: match[0],
        assertionText: undefined,
      };
    }

    const contextBefore = content
      .slice(Math.max(0, scope.scopeStart - CONTEXT_WINDOW), scope.scopeStart)
      .replace(/\s+/g, " ")
      .trim();
    const contextAfter = content
      .slice(scope.scopeEnd, Math.min(content.length, scope.scopeEnd + CONTEXT_WINDOW))
      .replace(/\s+/g, " ")
      .trim();

    instances.push({
      id: `${match[1]}-${startIndex}`,
      type,
      hint: match[2]?.trim(),
      raw: match[0],
      startIndex,
      endIndex,
      scopeStartIndex: scope.scopeStart,
      scopeEndIndex: scope.scopeEnd,
      scopeRaw: scope.scopeRaw,
      assertionText: scope.assertionText,
      contextBefore,
      contextAfter,
    });
  }

  return instances;
}

/**
 * Splices the tag bracket out of a scope and tidies the residual content.
 * Used by both `applyResolutions` and `preprocessPlaceholdersForMarkdown`
 * to produce identical confirm-as-is output.
 *
 * - Collapses runs of whitespace to single spaces.
 * - Trims spaces immediately inside `**` markers so `** assertion**` →
 *   `**assertion**`.
 * - Trims outer whitespace.
 *
 * Bold markers ARE preserved when present — the surrounding `**` survives so
 * Pattern A confirms `[VERIFY] **X**` to `**X**` and Pattern B confirms
 * `**[VERIFY] X**` to `**X**`. Bracket-only scopes confirm to the empty
 * string (the bracket is removed and there's nothing else in scope).
 */
function cleanScopeAfterTagRemoval(
  scopeContent: string,
  tagStartInScope: number,
  tagEndInScope: number,
): string {
  let cleaned =
    scopeContent.slice(0, tagStartInScope) + scopeContent.slice(tagEndInScope);
  cleaned = cleaned.replace(/\s+/g, " ");
  cleaned = cleaned.replace(/\*\*\s+/g, "**").replace(/\s+\*\*/g, "**");
  return cleaned.trim();
}

/**
 * Applies user resolutions to the original content.
 * - resolutions: tagId -> replacement text (replaces full scope verbatim).
 * - confirmed: tag IDs where the user clicked "Confirm as-is". The tag
 *   bracket is removed; surrounding bold markers (if any) are preserved.
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
        result.slice(0, tag.scopeStartIndex) +
        resolutions[tag.id] +
        result.slice(tag.scopeEndIndex);
      continue;
    }

    if (confirmed.has(tag.id)) {
      const scopeContent = result.slice(
        tag.scopeStartIndex,
        tag.scopeEndIndex,
      );
      const cleaned = cleanScopeAfterTagRemoval(
        scopeContent,
        tag.startIndex - tag.scopeStartIndex,
        tag.endIndex - tag.scopeStartIndex,
      );
      result =
        result.slice(0, tag.scopeStartIndex) +
        cleaned +
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
 * Builds the inner HTML for a tag's pill span. Markdown bold markers are
 * converted to HTML `<strong>` so we never depend on remark parsing inside
 * inline HTML, which is unreliable under react-markdown + rehype-raw.
 *
 *   Pattern B  (`**[VERIFY] X**`)         → `<strong>[VERIFY] X</strong>`
 *   Pattern A  (`[VERIFY] **X**`)         → `[VERIFY] <strong>X</strong>`
 *   Bracket-only (`[VERIFY]`)             → `[VERIFY]`
 */
function buildPillInnerHtml(tag: TagInstance): string {
  // Pattern B: scope opens before the bracket. The whole scope content (with
  // outer `**` stripped) renders as one bold span containing the tag bracket.
  if (tag.scopeStartIndex < tag.startIndex) {
    const stripped = tag.scopeRaw.slice(2, -2);
    return `<strong>${escapeHtmlText(stripped)}</strong>`;
  }

  // Pattern A: scope opens at the bracket and extends through a following
  // bold span. Render bracket plain, assertion in <strong>.
  if (
    tag.scopeEndIndex > tag.endIndex &&
    tag.assertionText !== undefined
  ) {
    return `${escapeHtmlText(tag.raw)} <strong>${escapeHtmlText(tag.assertionText)}</strong>`;
  }

  // Bracket-only fallback.
  return escapeHtmlText(tag.raw);
}

/**
 * Wraps each placeholder tag in the source markdown with an HTML span
 * carrying a stable id, data attributes, and a tag-type CSS class.
 * Code-block tags are excluded by `parsePlaceholders` itself, so code
 * samples remain literal. Resolved tags are replaced with their resolution
 * text (entire scope substituted), confirmed tags have the bracket spliced
 * out with surrounding bold markers preserved, and pending tags become
 * spans wrapped around the full scope.
 *
 * The output is meant to feed react-markdown with rehype-raw so the spans
 * survive markdown parsing.
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
        result.slice(0, tag.scopeStartIndex) +
        resolutions[tag.id] +
        result.slice(tag.scopeEndIndex);
      continue;
    }

    if (confirmed.has(tag.id)) {
      const scopeContent = result.slice(
        tag.scopeStartIndex,
        tag.scopeEndIndex,
      );
      const cleaned = cleanScopeAfterTagRemoval(
        scopeContent,
        tag.startIndex - tag.scopeStartIndex,
        tag.endIndex - tag.scopeStartIndex,
      );
      result =
        result.slice(0, tag.scopeStartIndex) +
        cleaned +
        result.slice(tag.scopeEndIndex);
      continue;
    }

    const baseClass = tagTypeToCssClass(tag.type);
    const widerScope =
      tag.scopeEndIndex - tag.scopeStartIndex >
      tag.endIndex - tag.startIndex;
    const cssClass = widerScope ? `${baseClass} placeholder-pill-wide` : baseClass;
    const innerHtml = buildPillInnerHtml(tag);

    const span =
      `<span id="tag-pill-${escapeHtmlAttr(tag.id)}"` +
      ` data-tag-id="${escapeHtmlAttr(tag.id)}"` +
      ` data-tag-type="${escapeHtmlAttr(tag.type)}"` +
      ` class="${cssClass}">${innerHtml}</span>`;

    result =
      result.slice(0, tag.scopeStartIndex) +
      span +
      result.slice(tag.scopeEndIndex);
  }

  return result;
}
