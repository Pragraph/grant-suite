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
  contextBefore: string;
  contextAfter: string;
}

export const PLACEHOLDER_TAG_REGEX =
  /\[(CITATION NEEDED|USER INPUT NEEDED|VERIFY|ESTIMATED|CHECK DATE)(?::\s*([^\]]+))?\]/g;

const CONTEXT_WINDOW = 80;

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
    const contextBefore = content
      .slice(Math.max(0, startIndex - CONTEXT_WINDOW), startIndex)
      .replace(/\s+/g, " ")
      .trim();
    const contextAfter = content
      .slice(endIndex, Math.min(content.length, endIndex + CONTEXT_WINDOW))
      .replace(/\s+/g, " ")
      .trim();

    instances.push({
      id: `${match[1]}-${startIndex}`,
      type: match[1] as TagType,
      hint: match[2]?.trim(),
      raw: match[0],
      startIndex,
      endIndex,
      contextBefore,
      contextAfter,
    });
  }

  return instances;
}

/**
 * Applies user resolutions to the original content.
 * - resolutions: tagId -> replacement text (replaces full tag including brackets).
 * - confirmed: tag IDs where user clicked "Confirm as-is" (bracket marker removed).
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
        result.slice(tag.endIndex);
    } else if (confirmed.has(tag.id)) {
      result = result.slice(0, tag.startIndex) + result.slice(tag.endIndex);
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
 * replaced with their resolution text, confirmed tags have their
 * brackets stripped, and pending tags become spans.
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
        result.slice(tag.endIndex);
      continue;
    }

    if (confirmed.has(tag.id)) {
      result = result.slice(0, tag.startIndex) + result.slice(tag.endIndex);
      continue;
    }

    const cssClass = tagTypeToCssClass(tag.type);
    const span =
      `<span id="tag-pill-${escapeHtmlAttr(tag.id)}"` +
      ` data-tag-id="${escapeHtmlAttr(tag.id)}"` +
      ` data-tag-type="${escapeHtmlAttr(tag.type)}"` +
      ` class="${cssClass}">${escapeHtmlText(tag.raw)}</span>`;

    result = result.slice(0, tag.startIndex) + span + result.slice(tag.endIndex);
  }

  return result;
}
