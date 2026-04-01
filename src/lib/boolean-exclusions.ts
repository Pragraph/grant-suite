/**
 * Boolean exclusion operators for Publish or Perish search strings.
 * Ported from the tested Topic Discovery via PoP web app.
 * These operators filter out review/non-original studies at search time.
 */

export const REVIEW_EXCLUSIONS = `-"review" -"reviews" -"systematic review" -"meta-analysis" -"meta analysis" -"metaanalysis" -"scoping" -"narrative" -"overview" -"bibliometric" -"bibliometrics" -"realist synthesis" -"qualitative synthesis" -"qualitative evidence synthesis" -"evidence synthesis" -"research synthesis" -"systematic mapping" -"evidence map" -"scientometric" -"citation analysis" -"publication trends" -"state of the art" -"PRISMA" -"thematic synthesis" -"pooled analysis" -"systematic search" -"editorial" -"commentary" -"letter to the editor" -"correspondence" -"study protocol" -"research protocol" -"trial protocol" -"guideline" -"statement" -"expert consensus" -"conceptual framework" -"theoretical framework" -"perspective" -"viewpoint"`;

/**
 * Append review exclusion operators to a Title Words string.
 */
export function buildTitleWordsWithExclusions(titleWords: string): string {
  if (!titleWords?.trim()) return "";
  return `${titleWords.trim()} ${REVIEW_EXCLUSIONS}`;
}

/**
 * Build a Keywords string by combining AI-generated keywords with
 * the user's field/discipline and area of interest.
 */
export function buildKeywordsString(
  aiKeywords: string,
  fieldDiscipline: string,
  areaOfInterest: string,
): string {
  const parts = [
    aiKeywords?.trim(),
    fieldDiscipline ? `"${fieldDiscipline}"` : "",
    areaOfInterest ? `"${areaOfInterest}"` : "",
  ].filter(Boolean);
  return parts.join(" OR ");
}
