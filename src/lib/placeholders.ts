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

export function parsePlaceholders(content: string): TagInstance[] {
  const instances: TagInstance[] = [];
  if (!content) return instances;

  const re = new RegExp(PLACEHOLDER_TAG_REGEX.source, "g");
  let match: RegExpExecArray | null;
  while ((match = re.exec(content)) !== null) {
    const startIndex = match.index;
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
