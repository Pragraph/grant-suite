// Confidence helpers — compute overall extraction confidence from a schema.

import type { ExtractionConfidence, FormSchema, FormSection } from "./types";

const RANK: Record<ExtractionConfidence, number> = { high: 3, medium: 2, low: 1 };

function reduceField(
  acc: ExtractionConfidence | null,
  field: ExtractionConfidence | null | undefined,
): ExtractionConfidence | null {
  if (!field) return acc;
  if (!acc) return field;
  return RANK[acc] <= RANK[field] ? acc : field;
}

function reduceSection(section: FormSection, acc: ExtractionConfidence | null): ExtractionConfidence | null {
  let result = acc;
  for (const f of section.fields ?? []) {
    result = reduceField(result, f.extraction_confidence ?? null);
  }
  for (const sub of section.subsections ?? []) {
    result = reduceSection(sub, result);
  }
  return result;
}

export function computeOverallConfidence(schema: FormSchema): ExtractionConfidence | null {
  let result: ExtractionConfidence | null = null;
  for (const s of schema.sections) {
    result = reduceSection(s, result);
  }
  // Fall back to source.extraction_confidence if no per-field confidence is recorded.
  if (result === null) {
    return schema.form_metadata.source.extraction_confidence ?? null;
  }
  return result;
}
