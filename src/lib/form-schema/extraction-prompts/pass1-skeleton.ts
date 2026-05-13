// Pass 1 — Skeleton extraction prompt (v21-R1.2).
// Source: phase5-rebuild-03-pass1-skeleton-prompt.md text between
// ---PROMPT BEGIN--- and ---PROMPT END--- markers. Keep in sync with the design doc.

export const PASS1_PROMPT = `# Grant Form Skeleton Extraction (Pass 1 of 3)

You are extracting the SKELETON STRUCTURE of a grant application form. This is the first of three passes:

- **Pass 1 (this pass):** sections and form metadata. No fields.
- **Pass 2 (later):** fields within each section, one section per call.
- **Pass 3 (later):** cross-field rules and validation artifacts.

Focus on identifying the form's structure. Do NOT extract individual fields, length limits, content requirements, or constraints. Those come in Pass 2.

## Output target

A JSON object with these top-level keys:

- \`schema_version\`: must be \`"1.0"\`
- \`form_metadata\`: complete form metadata (see shape below)
- \`sections\`: array of section objects, each with empty \`fields: []\`
- \`cross_field_rules\`: \`[]\` (empty — filled in Pass 3)
- \`validation_artifacts\`: \`[]\` (empty — filled in Pass 3)

## Section shape

Each section object:

\`\`\`json
{
  "section_id": "A",
  "label": { "ms": "Butiran Permohonan", "en": "Application Details" },
  "description": null,
  "level": 1,
  "ordering": 1,
  "required": true,
  "visibility": { "type": "always-visible" },
  "fields": [],
  "subsections": []
}
\`\`\`

For conditional sections (e.g., "B2. Mentor Details (Not relevant if applicant is Professor)"), capture the wording as text-only — Pass 3 will formalize the condition once field IDs are known:

\`\`\`json
{
  "section_id": "B2",
  "label": { "ms": "Butiran Mentor", "en": "Mentor Details" },
  "level": 1,
  "ordering": 3,
  "required": false,
  "visibility": {
    "type": "conditional",
    "condition": { "field_id": "TBD", "operator": "equals", "value": "TBD" },
    "operator_message": {
      "ms": "Tidak berkaitan sekiranya pemohon bertaraf Profesor",
      "en": "Not relevant if the applicant is a Professor"
    }
  },
  "fields": []
}
\`\`\`

Use \`field_id: "TBD"\` and \`value: "TBD"\` for now. Pass 3 will fill these in.

## form_metadata shape

\`\`\`json
{
  "form_id": "kebab-case-id",
  "form_title": { "ms": "...", "en": "..." },
  "funder": {
    "name": "<funder full name>",
    "name_en": "<English name if different>",
    "country": "<country>",
    "scheme": "<scheme short name>",
    "scheme_full_name": "<scheme full name>",
    "year": <integer>
  },
  "primary_language": "<ISO 639-1>",
  "supported_languages": ["<ISO 639-1>", ...],
  "submission_portal": "<portal name or null>",
  "submission_portal_url": "<URL or null>",
  "currency": "<ISO 4217 or omit>",
  "duration_options_years": [<integers>] or [],
  "budget_ceiling": <number or null>,
  "source": {
    "type": "uploaded",
    "extracted_from": "<filename>",
    "extraction_date": "<YYYY-MM-DD>",
    "extraction_method": "llm-tier1-pass1",
    "extraction_confidence": "high" | "medium" | "low",
    "reviewed_by_user": false,
    "reviewed_at": null,
    "page_audit_trail": [
      { "section_id": "<id>", "source_page": <integer> }
    ]
  }
}
\`\`\`

\`submission_portal\` and \`submission_portal_url\` are STRINGS or \`null\`. Use \`null\` when the scheme has no online portal. Same for \`budget_ceiling\`.

## Rules

### Rule 1: Bilingual labels (most fundamental)

For bilingual forms (Bahasa Malaysia + English), populate BOTH \`ms\` and \`en\` keys in every label. Never a bare string. For English-only forms, populate only \`en\`. For Bahasa-only forms, only \`ms\`.

\`form_title\`, section \`label\`, section \`description\`, \`operator_message\` — all are bilingual objects.

### Rule 2: Identify all sections

Read the form top-to-bottom. Note every section header and subsection header. Most forms use letter (A, B, C, ...) or number (1, 2, 3, ...) numbering. Some use named sections (Executive Summary, Methodology). Capture every one.

Common section patterns:
- Top-level numbered sections (A, B, C, D, ...)
- Nested numbered subsections (A.i, A.ii, ... or A1, A2, ...)
- Special sections (Declaration, Signatures, Appendix)

For each section, set \`level: 1\` for top-level, \`level: 2\` for first-level subsections, etc.

### Rule 3: Page audit trail

For PDFs, populate \`page_audit_trail\` with one entry per section mapping \`section_id\` to the 1-indexed page where the section header appears. For screenshots, use screenshot ordinals.

### Rule 4: Conditional visibility (sections only)

If a section has text like "Not applicable if X" / "Tidak berkaitan sekiranya X", capture as \`visibility.conditional\` with the verbatim text as \`operator_message\`. Set \`condition.field_id\` and \`condition.value\` to \`"TBD"\` — Pass 3 formalizes the condition.

If a section is always visible, set \`visibility: { "type": "always-visible" }\`.

### Rule 5: Don't extract fields

This is critical. Do NOT extract individual fields, options, length limits, content requirements, table structures, or constraints. Pass 2 handles that.

Set every section's \`fields: []\` empty array. Set \`cross_field_rules: []\` empty. Set \`validation_artifacts: []\` empty.

### Rule 6: Confidence calibration (overall, not per-section)

Set \`form_metadata.source.extraction_confidence\`:
- \`"high"\` — every section is clearly visible on the form with unambiguous structure. Use sparingly.
- \`"medium"\` (default) — structure is clear but some sections required inference.
- \`"low"\` — significant uncertainty about section boundaries or hierarchy.

### Rule 7: Don't invent sections

If the form doesn't have a section you might "expect" (e.g., budget summary when the form only has a budget table), DO NOT add it. Capture what is on the page.

## Output format

Return ONLY the JSON. No prose, no markdown code fences, no preamble, no postamble. First character \`{\`, last character \`}\`.

## Process

1. Read the entire form once. Note overall structure, primary language, funder.
2. Populate \`form_metadata\` including funder details, languages, currency, scheme info.
3. Identify all sections and subsections. Note their page numbers.
4. Build the section tree top-down: top-level sections first, then subsections nested via \`subsections\` or as separate \`level: 2\` entries (use whichever matches the form's structure).
5. For each section, capture: section_id, bilingual label, level, ordering, conditional visibility text if any.
6. Populate \`page_audit_trail\` with section → page mappings.
7. Set every section's \`fields: []\` and \`subsections: []\` empty unless the form has explicit named subsections.
8. Set \`cross_field_rules: []\` and \`validation_artifacts: []\`.
9. Set \`form_metadata.source.extraction_confidence\`.

Return the complete skeleton JSON.
`;

export interface Pass1Inputs {
  docxMarkdown?: string;
}

export function buildPass1Prompt(inputs: Pass1Inputs = {}): string {
  if (!inputs.docxMarkdown) return PASS1_PROMPT;
  return `## Form content (extracted from uploaded DOCX)

${inputs.docxMarkdown}

---

${PASS1_PROMPT}`;
}
