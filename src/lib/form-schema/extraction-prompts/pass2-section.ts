// Pass 2 — Per-section field extraction prompt (v21-R1.2).
// Source: phase5-rebuild-03-pass2-section-prompt.md text between
// ---PROMPT BEGIN--- and ---PROMPT END--- markers. Keep in sync with the design doc.
//
// Template variables (use replaceAll, not replace — placeholders occur multiple times):
//   {{SECTION_ID}}, {{SECTION_LABEL_PRIMARY}}, {{SECTION_LABEL_SECONDARY}},
//   {{SECTION_PAGE_START}}, {{SECTION_PAGE_END}}, {{EXISTING_SECTION_IDS}},
//   {{PRIMARY_LANGUAGE}}.

import type { BilingualString, FormSchema, FormSection, Iso639_1 } from "../types";

export const PASS2_PROMPT_TEMPLATE = `# Grant Form Section Field Extraction (Pass 2 of 3)

You are extracting the FIELDS for ONE specific section of a grant application form. This is the second of three passes:

- **Pass 1 (done):** form skeleton — sections identified, metadata captured.
- **Pass 2 (this pass):** fields within ONE section. You are extracting section \`{{SECTION_ID}}\` only.
- **Pass 3 (later):** cross-field rules and validation artifacts.

**Target section:** \`{{SECTION_ID}}\` — "{{SECTION_LABEL_PRIMARY}}" / "{{SECTION_LABEL_SECONDARY}}"
**Pages:** {{SECTION_PAGE_START}} to {{SECTION_PAGE_END}}
**Existing sections in the schema (for cross-references):** {{EXISTING_SECTION_IDS}}
**Primary language:** {{PRIMARY_LANGUAGE}}

Read pages {{SECTION_PAGE_START}}-{{SECTION_PAGE_END}} of the attached form. Identify every field in section \`{{SECTION_ID}}\`. Extract them into a structured JSON object.

## Output target

A single JSON object:

\`\`\`json
{
  "section_id": "{{SECTION_ID}}",
  "fields": [ ...field objects... ],
  "subsections": [ ...optional subsection objects... ]
}
\`\`\`

If section \`{{SECTION_ID}}\` has subsections that were not split out as separate sections in Pass 1 (e.g., if the form structures B as containing both B1 and B2 as subsections rather than separate top-level sections), include them in \`subsections\` with full fields.

Set \`section_id\` exactly to \`{{SECTION_ID}}\` — the workspace uses this to verify your output before merging.

## Field type taxonomy (CLOSED — exactly one per field)

\`text\` — single-line text. Names, IC numbers, emails, phone numbers, titles.
\`longtext\` — multi-line paragraph text. Narrative fields. Most grant prose lives here.
\`radio\` — single selection from a closed option list.
\`checkbox\` — zero or more selections from a closed option list.
\`multiselect\` — multiple selections, optionally ordered or ranked.
\`number\` — numeric input. Currency, percentages, counts, ages.
\`date\` — date input.
\`table\` — repeating rows with a fixed column structure. Team tables, budget tables, milestone tables.
\`file-upload\` — file attachment field.
\`signature\` — signature or signoff. Always AI-non-generatable.
\`attachment-reference\` — pointer to a separate document the user prepares externally.

## Field shape — universal keys

\`\`\`json
{
  "field_id": "kebab-case-stable-id",
  "label": { "ms": "...", "en": "..." },
  "description": null | { "ms": "...", "en": "..." },
  "type": "<one of the 11 types>",
  "required": true | false,
  "ordering": 1,
  "ai_generation": {
    "supported": true | false,
    "mode": "generate" | "recommend" | "import-from-source" | "none",
    "default_sources": []
  },
  "extraction_confidence": "high" | "medium" | "low"
}
\`\`\`

Plus type-specific keys.

## Field shape — type-specific

**text** adds optional \`length_limit\`, optional \`validation\` array, optional \`input_mode\` ("text" | "email" | "tel" | "url").

The \`validation\` array contains OBJECTS, never bare strings:
\`\`\`json
"validation": [
  {
    "kind": "regex" | "min-length" | "max-length",
    "pattern": "<regex string when kind is regex>",
    "value": <number when kind is min-length or max-length>,
    "message": { "ms": "...", "en": "..." }
  }
]
\`\`\`
If no validation is needed, OMIT the \`validation\` key entirely.

**longtext** REQUIRES \`length_limit\`. Optional \`content_requirements\` (bilingual object with verbatim funder instruction text). Set \`verbatim_user_facing: true\` when content_requirements is captured.

**radio / multiselect** REQUIRE \`options\` array. Each option: \`{ "value": "kebab-case", "label": { "ms": "...", "en": "..." } }\`. Optional \`layout\`: "horizontal" | "vertical" | "grid" | "searchable-list".

**checkbox** REQUIRES \`options\` array. Plus \`min_selections\` (default 0) and \`max_selections\` (null = unbounded).

**number** adds \`constraints\` object: \`{ "min": <number|null>, "max": <number|null>, "currency": <ISO-4217|null>, "unit_label": <string|null>, "decimal_places": <integer|null> }\`.

**date** adds \`format\` ("YYYY-MM-DD" | "DD/MM/YYYY" | "MM/DD/YYYY" | "YYYY-MM" | "YYYY") and optional \`constraints\` with \`min\`, \`max\`, \`must_be_after_field_id\`.

**table** REQUIRES \`table_structure\`. See "Table structure" below.

**file-upload** adds \`accepted_formats\` array (e.g., \`["pdf", "docx"]\`) and \`max_file_size_mb\`.

**signature** adds \`signer_role\` ("principal_investigator" | "institutional_endorser" | "co_investigator" | "mentor" | "other") and \`requires_date\`.

**attachment-reference** adds \`attachment_type\` (kebab-case) and \`preparation_guidance\` (bilingual object).

## length_limit object

\`\`\`json
{
  "kind": "words" | "characters" | "pages" | "minutes" | "none",
  "max": <integer or null>,
  "min": <integer or null>,
  "soft": true | false,
  "source_phrasing": "<verbatim text from the form>"
}
\`\`\`

If \`kind\` is \`"none"\`, set \`max: null\`. Otherwise \`max\` is required.

## Table structure

Three row modes:

**\`dynamic\`** — user adds/removes rows. Example: team member tables, publication tables.
- Requires: \`columns\` array.
- Optional: \`min_rows\`, \`max_rows\`, \`per_row_attachments\`.

**\`fixed-rows\`** — row labels printed on the form, user cannot add/remove.
- Requires: \`fixed_rows\` array. Each row: \`{ "row_id": "kebab-case", "row_label": { "ms": "...", "en": "..." }, "row_constraints": {...} }\`.

**\`row-groups\`** — rows grouped under headers with sub-totals.
- Requires: \`row_groups\` array. Each group: \`{ "group_id", "group_label", "group_constraints": {...}, "rows": [...], "has_subtotal": true/false, "subtotal_label": {...} }\`.
- \`subtotal_label\` is ALWAYS a bilingual object, NEVER a bare string. Apply consistently across every row group — don't switch to a string for later groups.

For \`per_row_attachments\` (inside table_structure):
\`\`\`json
"per_row_attachments": [
  {
    "attachment_id": "cv",
    "label": { "ms": "CV ahli pasukan", "en": "Team member CV" },
    "required": true,
    "default_source_pattern": "Researcher_Profile.md"
  }
]
\`\`\`
NEVER as a string array like \`["CV"]\`. Always objects with \`attachment_id\` and bilingual \`label\`.

## Conditional visibility (field-level)

If a field is conditionally visible, populate \`visibility\`:
\`\`\`json
"visibility": {
  "type": "conditional",
  "condition": {
    "field_id": "<other field id, may be in a different section>",
    "operator": "equals" | "not-equals" | "contains" | "not-contains" | "greater-than" | "less-than" | "in-set" | "not-in-set" | "is-empty" | "is-not-empty",
    "value": <comparison value>
  },
  "operator_message": { "ms": "...", "en": "..." }
}
\`\`\`

Cross-section field references are allowed — if a field in section \`{{SECTION_ID}}\` depends on a field in another section, reference its field_id directly. The list of existing sections is: {{EXISTING_SECTION_IDS}}. Use a \`field_id\` that follows the section's naming convention (e.g., \`B1-v-position-grade\` for a field in section B1).

## Critical extraction rules

### Rule 1: Bilingual everywhere

Every user-facing string is a BILINGUAL OBJECT, never a bare string. This applies to:
- \`label\`, \`description\` on every field
- \`option.label\`, \`row_label\`, \`group_label\`, \`subtotal_label\`
- \`per_row_attachments[*].label\`
- \`operator_message\`, \`message\` (in validation entries)
- \`attachment-reference.preparation_guidance\`

\`length_limit.source_phrasing\` is the EXCEPTION — it is a single string holding verbatim source text.

For English-only forms: populate only \`{ "en": "..." }\`. Even single-language objects are objects, not bare strings.

Apply consistently across every row group, every subsection, every nested object.

### Rule 2: Verbatim content_requirements

When a longtext field has "Please include..." / "Sila sertakan..." instructions, capture the EXACT wording in \`content_requirements\`. Set \`verbatim_user_facing: true\`. Do not paraphrase. Do not summarize.

Example:
\`\`\`
Form text: "(Sila sertakan pernyataan masalah, objektif, metodologi penyelidikan)"

Extract:
"content_requirements": {
  "ms": "Sila sertakan pernyataan masalah, objektif, metodologi penyelidikan",
  "en": "Please include the problem statement, objectives, research methodology"
},
"verbatim_user_facing": true
\`\`\`

### Rule 3: Length-limit normalization

| Source phrasing | Normalized |
|---|---|
| "not more than X words" / "tidak melebihi X patah perkataan" | \`{ kind: "words", max: X, soft: false, source_phrasing: "..." }\` |
| "approximately X words" | \`{ kind: "words", max: X, soft: true }\` |
| "maximum N pages" | \`{ kind: "pages", max: N, soft: false }\` |
| "at most X characters" | \`{ kind: "characters", max: X, soft: false }\` |
| (no limit stated) | \`{ kind: "none", max: null }\` |

ALWAYS preserve verbatim phrasing in \`source_phrasing\`.

### Rule 4: Constraint parsing from row labels

Budget table row labels often have embedded constraints. Parse into machine-readable:

| Phrasing | Constraint |
|---|---|
| "Maksimum X%" / "Maximum X%" | \`group_constraints.max_percent_of_total: X\` |
| "Siling RM Y" / "Up to RM Y" | \`row_constraints.max_amount: Y, currency: "MYR"\` |
| "RM Y/seorang untuk Z tahun" | \`row_constraints.per_person_per_year_max: Y, max_duration_years: Z, currency: "MYR"\` |

Unknown phrasings: capture in \`row_constraints.notes\` as freeform string, mark \`extraction_confidence: "low"\` on the row.

### Rule 5: Table row mode detection

- Pre-printed row labels, no add/remove → \`fixed-rows\`
- Rows grouped under headers with sub-totals → \`row-groups\`
- User adds rows as needed → \`dynamic\`

When uncertain, default to \`dynamic\` (least restrictive) and mark \`extraction_confidence: "medium"\`.

### Rule 6: Confidence calibration

Per-field \`extraction_confidence\`:
- \`"high"\` — label, type, constraints all unambiguous. Use sparingly.
- \`"medium"\` (default) — structure clear, some details inferred.
- \`"low"\` — uncertain about type, label, constraints.

Be conservative. Over-confidence destroys user trust.

### Rule 7: No invented fields

If the form doesn't have a field you might "expect," DO NOT add it. Capture what is on the page.

### Rule 8: Don't extract cross-field rules

Cross-field rules (e.g., "Must use same keywords as A(v)") are deferred to Pass 3. Do NOT include them in your output. Do not produce a \`cross_field_rules\` array. Do not extract validation_artifacts. Pass 3 handles those.

## ai_generation defaults

For each field, set \`ai_generation\` based on the field's content type:

- **Identity fields** (name, IC, phone, email, position, institution): \`{ "supported": false, "mode": "import-from-source", "default_sources": ["Applicant_Profile.md"] }\`
- **Title or keywords fields:** \`{ "supported": true, "mode": "generate", "default_sources": ["Proposal_Data.md", "Research_Design.md"] }\`
- **Methodology / executive summary / narrative fields:** \`{ "supported": true, "mode": "generate", "default_sources": ["Proposal_Data.md", "Research_Design.md", "Budget_Justification.md"] }\`
- **Radio / checkbox selections (research field, TRL, etc.):** \`{ "supported": true, "mode": "recommend", "default_sources": ["Grant_Intelligence.md", "Proposal_Data.md"] }\`
- **Signatures and date stamps:** \`{ "supported": false, "mode": "none", "default_sources": [] }\`
- **Declarations (checkboxes the user must affirm):** \`{ "supported": false, "mode": "none", "default_sources": [] }\`
- **Budget table cells:** \`{ "supported": false, "mode": "import-from-source", "default_sources": ["Budget_Draft.md", "Budget_Justification.md"] }\`

When uncertain, default to \`{ "supported": false, "mode": "none", "default_sources": [] }\` and mark \`extraction_confidence: "low"\`.

## Output format

Return ONLY the JSON object with \`section_id\`, \`fields\`, and optional \`subsections\`. No prose, no markdown code fences, no preamble. First character \`{\`, last character \`}\`.

## Process

1. Locate pages {{SECTION_PAGE_START}}-{{SECTION_PAGE_END}} of the attached form.
2. Read section \`{{SECTION_ID}}\` ("{{SECTION_LABEL_PRIMARY}}") fully.
3. Identify every field in the section. Assign type from the closed taxonomy.
4. For each field: extract bilingual label, description, type, required, ordering.
5. For longtext fields: extract content_requirements verbatim. Set verbatim_user_facing: true.
6. For text fields: determine input_mode (email, tel, url, or text). Add validation only if explicit format constraint is shown.
7. For radio/checkbox/multiselect: extract all options with bilingual labels and kebab-case values.
8. For tables: determine row_mode, extract columns, rows or row_groups, parse constraints.
9. For each field: extract length limits and normalize.
10. For each field: extract conditional visibility if present (operator + value referencing field_ids in this or other sections).
11. For each field: set ai_generation per the defaults above.
12. Set extraction_confidence per field (conservatively).

Return the JSON.
`;

export interface Pass2Inputs {
  sectionId: string;
  sectionLabelPrimary: string;
  sectionLabelSecondary: string;
  sectionPageStart: number;
  sectionPageEnd: number;
  existingSectionIds: string[];
  primaryLanguage: string;
  docxMarkdown?: string;
}

export function buildPass2Prompt(inputs: Pass2Inputs): string {
  let prompt = PASS2_PROMPT_TEMPLATE
    .replaceAll("{{SECTION_ID}}", inputs.sectionId)
    .replaceAll("{{SECTION_LABEL_PRIMARY}}", inputs.sectionLabelPrimary)
    .replaceAll("{{SECTION_LABEL_SECONDARY}}", inputs.sectionLabelSecondary)
    .replaceAll("{{SECTION_PAGE_START}}", inputs.sectionPageStart.toString())
    .replaceAll("{{SECTION_PAGE_END}}", inputs.sectionPageEnd.toString())
    .replaceAll("{{EXISTING_SECTION_IDS}}", inputs.existingSectionIds.join(", "))
    .replaceAll("{{PRIMARY_LANGUAGE}}", inputs.primaryLanguage);

  if (inputs.docxMarkdown) {
    prompt = `## Form content (extracted from uploaded DOCX)\n\n${inputs.docxMarkdown}\n\n---\n\n${prompt}`;
  }
  return prompt;
}

export function buildPass2PromptForSection(
  schema: FormSchema,
  sectionId: string,
  docxMarkdown?: string,
): string {
  const target = findSectionById(schema.sections, sectionId);
  if (!target) {
    throw new Error(`Section "${sectionId}" not found in the schema.`);
  }

  const primary = schema.form_metadata.primary_language;
  const labelPrimary = bilingualValue(target.label, primary);
  const labelSecondary = secondaryValue(target.label, primary);
  const pages = pageRangeFor(schema, sectionId);
  const existingIds = collectAllSectionIds(schema.sections);

  return buildPass2Prompt({
    sectionId,
    sectionLabelPrimary: labelPrimary,
    sectionLabelSecondary: labelSecondary,
    sectionPageStart: pages.start,
    sectionPageEnd: pages.end,
    existingSectionIds: existingIds,
    primaryLanguage: primary,
    docxMarkdown,
  });
}

function findSectionById(sections: FormSection[], id: string): FormSection | null {
  for (const s of sections) {
    if (s.section_id === id) return s;
    if (s.subsections?.length) {
      const found = findSectionById(s.subsections, id);
      if (found) return found;
    }
  }
  return null;
}

function collectAllSectionIds(sections: FormSection[]): string[] {
  const out: string[] = [];
  for (const s of sections) {
    out.push(s.section_id);
    if (s.subsections?.length) out.push(...collectAllSectionIds(s.subsections));
  }
  return out;
}

function bilingualValue(s: BilingualString, primary: Iso639_1): string {
  if (s[primary]) return s[primary] as string;
  const first = Object.keys(s)[0] as Iso639_1 | undefined;
  return first ? (s[first] as string) : "";
}

function secondaryValue(s: BilingualString, primary: Iso639_1): string {
  const keys = (Object.keys(s) as Iso639_1[]).filter((k) => k !== primary);
  if (keys.length === 0) return "";
  return s[keys[0]] ?? "";
}

function pageRangeFor(schema: FormSchema, sectionId: string): { start: number; end: number } {
  const trail = schema.form_metadata.source.page_audit_trail ?? [];
  const sectionIndex = trail.findIndex((e) => e.section_id === sectionId);
  if (sectionIndex === -1) return { start: 1, end: 1 };

  const startEntry = trail[sectionIndex];
  const start = typeof startEntry.source_page === "number"
    ? startEntry.source_page
    : parseInt(String(startEntry.source_page), 10) || 1;

  const nextEntry = trail[sectionIndex + 1];
  const end = nextEntry
    ? (typeof nextEntry.source_page === "number"
        ? nextEntry.source_page - 1
        : parseInt(String(nextEntry.source_page), 10) - 1) || start
    : start;

  return { start, end: Math.max(start, end) };
}
