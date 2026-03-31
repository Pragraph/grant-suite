/**
 * Generate an optimized natural language search prompt for Google Scholar Labs.
 * Scholar Labs accepts queries up to 2048 characters and uses AI to find
 * relevant papers matching the research question.
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

  let prompt = `Find systematic reviews or meta-analyses on ${selectedTopic} in ${discipline} published between ${startYear} and ${currentYear} that explicitly discuss "future research directions" or "research gaps" or "limitations and future work". What specific future studies, unresolved questions, or underexplored areas do the authors recommend for further investigation?`;

  // If within limit, add refinement
  if (prompt.length < SCHOLAR_LABS_MAX_CHARS - 200) {
    prompt += ` Prioritise reviews that identify specific methodological gaps, understudied populations, or unexplored contexts.`;
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
