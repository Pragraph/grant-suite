/**
 * Generate an optimized natural language search prompt for Google Scholar Labs.
 * Scholar Labs accepts queries up to 2048 characters and uses AI to find
 * relevant papers matching the research question.
 *
 * Targets systematic reviews, meta-analyses, AND highly cited original studies
 * to ensure coverage in both established and emerging/niche topics.
 *
 * @see https://scholar.google.com/scholar_labs/search
 */

const SCHOLAR_LABS_MAX_CHARS = 2048;

export function generateScholarLabsPrompt(
  selectedTopic: string,
  discipline: string,
): string {
  const currentYear = new Date().getFullYear();
  const startYear = currentYear - 3;

  let prompt = `Find systematic reviews, meta-analyses, and highly cited studies on ${selectedTopic} in ${discipline} published between ${startYear} and ${currentYear} that discuss "research gaps" or "future research directions" or "limitations and future work". What unresolved questions, underexplored areas, or evidence gaps do the authors identify for future investigation?`;

  // If within limit, add refinement focused on actionable, fundable gap types
  if (prompt.length < SCHOLAR_LABS_MAX_CHARS - 300) {
    prompt += ` Focus on gaps that represent actionable research opportunities, including gaps in real-world application or implementation, opportunities for novel or interdisciplinary approaches, and areas where current evidence is insufficient for context-specific or population-specific use.`;
  }

  // Safety check — truncate if somehow over limit
  if (prompt.length > SCHOLAR_LABS_MAX_CHARS) {
    prompt = prompt.substring(0, SCHOLAR_LABS_MAX_CHARS - 3) + "...";
  }

  return prompt;
}

export function getScholarLabsCharInfo(prompt: string) {
  return {
    length: prompt.length,
    max: SCHOLAR_LABS_MAX_CHARS,
    isValid: prompt.length <= SCHOLAR_LABS_MAX_CHARS,
    remaining: SCHOLAR_LABS_MAX_CHARS - prompt.length,
  };
}

export const SCHOLAR_LABS_URL = "https://scholar.google.com/scholar_labs/search";
