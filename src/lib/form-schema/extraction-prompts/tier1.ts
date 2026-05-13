// Tier 1 (upload-derived) Form Schema extraction prompt.
// Source: phase5-rebuild-03-tier1-prompt.md (text between ---PROMPT BEGIN--- and ---PROMPT END--- markers).
// Prompt v1.0.0. Keep in sync with source markdown file.

export const TIER1_PROMPT = `# Grant Form Schema Extraction

You are extracting a grant application form into a structured JSON schema (\`Form_Schema.json\`) for a grant-writing workspace called Grant Suite. The schema you produce is consumed directly by software — no human edits between your output and the workspace renderer. Be precise and conservative.

## Your task

Read the attached grant application form (PDF or screenshots). Produce one complete \`Form_Schema.json\` instance describing the form's structure, fields, content requirements, length limits, constraints, conditional sections, and cross-field rules.

## Output target

A single JSON object with these top-level keys:

- \`schema_version\`: must be the string \`"1.0"\`.
- \`form_metadata\`: object with funder, scheme, languages, currency, source audit trail.
- \`sections\`: array of section objects describing the form's structure.
- \`cross_field_rules\`: array of consistency-rule objects (can be empty).
- \`validation_artifacts\`: array of attached-form objects (can be empty or omitted).

## Field type taxonomy (CLOSED — exactly one of these per field)

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
\`attachment-reference\` — pointer to a separate document the user prepares externally (CVs, certificates, separate attached forms).

## Shape reference

### Section
\`\`\`json
{
  "section_id": "A",
  "label": { "ms": "Butiran Permohonan", "en": "Application Details" },
  "description": { "ms": "...", "en": "..." } | null,
  "level": 1,
  "ordering": 1,
  "required": true,
  "visibility": { "type": "always-visible" } | { "type": "conditional", "condition": {...} },
  "fields": [ /* field objects */ ],
  "subsections": [ /* nested section objects */ ]
}
\`\`\`

### Field — universal keys
\`\`\`json
{
  "field_id": "kebab-case-stable-identifier",
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

### Field — type-specific shapes

**text** adds \`length_limit\` (see below), optional \`validation\` array, optional \`input_mode\` ("text" | "email" | "tel" | "url").

**longtext** REQUIRES \`length_limit\`. Optional \`content_requirements\` (bilingual object with verbatim funder instruction text). Set \`verbatim_user_facing: true\` when content_requirements is captured.

**radio / multiselect** REQUIRES \`options\` array. Each option: \`{ "value": "kebab-case", "label": { "ms": "...", "en": "..." } }\`. Optional \`layout\`: "horizontal" | "vertical" | "grid" | "searchable-list".

**checkbox** REQUIRES \`options\` array. Plus \`min_selections\` (default 0) and \`max_selections\` (null = unbounded).

**number** adds \`constraints\` object: \`{ "min": <number|null>, "max": <number|null>, "currency": <ISO-4217-code|null>, "unit_label": <string|null>, "decimal_places": <integer|null> }\`. Optional \`computed\` string for derived fields.

**date** adds \`format\` ("YYYY-MM-DD" | "DD/MM/YYYY" | "MM/DD/YYYY" | "YYYY-MM" | "YYYY") and optional \`constraints\` with \`min\`, \`max\`, \`must_be_after_field_id\`.

**table** REQUIRES \`table_structure\` object with \`row_mode\`, \`columns\`, and (depending on row_mode) \`row_groups\` or \`fixed_rows\`. See "Table row modes" below.

**file-upload** adds \`accepted_formats\` array (e.g., \`["pdf", "docx"]\`) and \`max_file_size_mb\`.

**signature** adds \`signer_role\` ("principal_investigator" | "institutional_endorser" | "co_investigator" | "mentor" | "other") and \`requires_date\`.

**attachment-reference** adds \`attachment_type\` (kebab-case identifier) and \`preparation_guidance\` (bilingual object).

### length_limit object
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

### Table row modes

**\`dynamic\`** — user adds/removes rows. Example: team member tables, publication tables, partner tables.
- Requires: \`columns\` array.
- Optional: \`min_rows\`, \`max_rows\`, \`per_row_attachments\`.

**\`fixed-rows\`** — row labels printed on the form, user cannot add/remove. Example: GET IP table (7 IP categories), GET risk matrix (3 rows: Technical/Timing/Budget), Horizon ethics self-assessment (11 fixed rows).
- Requires: \`fixed_rows\` array. Each row: \`{ "row_id": "kebab-case", "row_label": { "ms": "...", "en": "..." }, "row_constraints": {...} }\`.

**\`row-groups\`** — rows grouped under headers with sub-totals. Example: GET budget table (7 Vot groups), Horizon Direct/Indirect costs.
- Requires: \`row_groups\` array. Each group: \`{ "group_id", "group_label", "group_constraints": {...}, "rows": [...], "has_subtotal": true/false, "subtotal_label": {...} }\`.

### Visibility (conditional sections/fields)
\`\`\`json
{
  "type": "conditional",
  "condition": {
    "field_id": "<other-field-id>",
    "operator": "equals" | "not-equals" | "contains" | "not-contains" | "greater-than" | "less-than" | "in-set" | "not-in-set" | "is-empty" | "is-not-empty",
    "value": <comparison value, omit for is-empty/is-not-empty>
  },
  "operator_message": { "ms": "...", "en": "..." }
}
\`\`\`

### Cross-field rule
\`\`\`json
{
  "rule_id": "kebab-case",
  "kind": "value-equality" | "computed-bound" | "presence-conditional" | "sum-equality",
  "source_field_id": "<id>",
  "target_field_id": "<id>",
  "expression": "<expression string>",
  "user_facing_message": { "ms": "...", "en": "..." },
  "severity": "error" | "warning"
}
\`\`\`

\`value-equality\` requires both \`source_field_id\` and \`target_field_id\`.
\`computed-bound\` requires \`expression\`.

### form_metadata
\`\`\`json
{
  "form_id": "kebab-case-unique-id",
  "form_title": { "ms": "...", "en": "..." },
  "funder": {
    "name": "<funder full name>",
    "name_en": "<English name if different>",
    "country": "<country>",
    "scheme": "<scheme short name>",
    "scheme_full_name": "<scheme full name>",
    "year": <integer>
  },
  "primary_language": "<ISO 639-1 code>",
  "supported_languages": ["<ISO 639-1>", ...],
  "submission_portal": "<portal name or null>",
  "submission_portal_url": "<URL or null>",
  "currency": "<ISO 4217 code or null>",
  "duration_options_years": [<integers>] or [],
  "budget_ceiling": <number or null>,
  "source": {
    "type": "uploaded",
    "extracted_from": "<filename>",
    "extraction_date": "<YYYY-MM-DD>",
    "extraction_method": "llm-tier1",
    "extraction_confidence": "high" | "medium" | "low",
    "reviewed_by_user": false,
    "reviewed_at": null,
    "page_audit_trail": [ { "section_id": "<id>", "source_page": <integer> } ]
  }
}
\`\`\`

## Critical extraction rules

### Rule 1: Verbatim content_requirements

When a longtext field has a "Please include..." or "Sila sertakan..." instruction, capture the EXACT wording in \`content_requirements\` (bilingual object). Set \`verbatim_user_facing: true\`. This is the single most important rule. The workspace renders this text verbatim alongside the field, and the per-field Generate bundler injects it into the writing prompt. Do not paraphrase. Do not summarize. Capture the funder's exact words.

Example:
\`\`\`
Form text: "(Sila sertakan pernyataan masalah, objektif, metodologi penyelidikan, jangkaan output/hasil/implikasi, dan kepentingan output daripada projek penyelidikan)"

Extract:
"content_requirements": {
  "ms": "Sila sertakan pernyataan masalah, objektif, metodologi penyelidikan, jangkaan output/hasil/implikasi, dan kepentingan output daripada projek penyelidikan",
  "en": "Please include the problem statement, objectives, research methodology, expected output/outcomes/implication, and significance of output from the research project"
}
"verbatim_user_facing": true
\`\`\`

### Rule 2: Bilingual labels

When the form has parallel Bahasa Malaysia and English text, populate both \`ms\` and \`en\` keys for every \`bilingualString\`. Preserve diacritics and special characters. Identify the dominant/primary language (usually the larger or first-listed) and set \`form_metadata.primary_language\` accordingly.

For English-only forms, populate only \`en\` and set \`supported_languages: ["en"]\`. For Bahasa-only forms (rare), only \`ms\`.

If a label appears in only one language despite the rest of the form being bilingual, populate only the language present and mark \`extraction_confidence: "low"\` on that field.

### Rule 3: Length-limit normalization

Normalize length-limit phrasings into the structured object, ALWAYS preserving the verbatim phrasing in \`source_phrasing\`:

| Source phrasing | Normalized |
|---|---|
| "not more than X words" / "tidak melebihi X patah perkataan" | \`{ kind: "words", max: X, soft: false, source_phrasing: "..." }\` |
| "approximately X words" / "around X words" | \`{ kind: "words", max: X, soft: true }\` |
| "maximum N pages" / "max N pages" | \`{ kind: "pages", max: N, soft: false }\` |
| "no longer than M minutes" | \`{ kind: "minutes", max: M, soft: false }\` |
| "at most X characters" | \`{ kind: "characters", max: X, soft: false }\` |
| (no limit stated) | \`{ kind: "none", max: null }\` |

### Rule 4: Constraint parsing from row labels

Budget tables and similar tables often have constraints embedded in row labels. Extract these into machine-readable constraint fields. Preserve the verbatim label in \`row_label\`.

| Phrasing | Extracted constraint |
|---|---|
| "Maksimum X%" / "Maximum X%" / "Max X%" | \`group_constraints.max_percent_of_total: X\` |
| "Siling RM Y" / "Ceiling RM Y" / "Up to RM Y" | \`row_constraints.max_amount: Y, row_constraints.currency: "MYR"\` |
| "RM Y/seorang untuk Z tahun" / "RM Y per person for Z years" | \`row_constraints.per_person_per_year_max: Y, row_constraints.max_duration_years: Z, row_constraints.currency: "MYR"\` |
| "EUR Y per person-month" | \`row_constraints.fixed_unit_cost: Y, row_constraints.currency: "EUR", row_constraints.unit: "person-month"\` |

Unknown phrasings: capture verbatim in a \`row_constraints.notes\` string and set \`extraction_confidence: "low"\` on the row.

### Rule 5: Conditional visibility

When a section or field has wording like "Tidak berkaitan sekiranya..." / "Not applicable if..." / "Required only when...", express as \`visibility.condition\`. Identify the source field (the one that controls visibility), the operator, and the value.

Example:
\`\`\`
Form text: "B2. Butiran Mentor (Tidak berkaitan sekiranya pemohon bertaraf Profesor)"

Extract for section B2:
"visibility": {
  "type": "conditional",
  "condition": {
    "field_id": "B1-v-position-grade",
    "operator": "not-contains",
    "value": "Profesor"
  },
  "operator_message": {
    "ms": "Tidak berkaitan sekiranya pemohon bertaraf Profesor",
    "en": "Not relevant if the applicant is a Professor"
  }
}
\`\`\`

When the controlling field is ambiguous (no obvious foreign key in the form), use the closest matching field by content and mark \`extraction_confidence: "low"\`.

### Rule 6: Table row mode detection

Three modes:

- **\`fixed-rows\`** when the form prints specific row labels and the user cannot add/remove rows. Examples: IP categories table (Patent, Utility Innovation, Copyright, ...), risk matrix with named risk types, ethics self-assessment with pre-set issue categories.
- **\`row-groups\`** when rows are organized under group headers with sub-totals. Examples: Vot-coded budget tables, Direct/Indirect costs structure.
- **\`dynamic\`** when the user adds rows as needed. Examples: team member lists, publications lists, milestones, partner organisations.

When uncertain, default to \`dynamic\` (least restrictive) and mark \`extraction_confidence: "medium"\`.

### Rule 7: Cross-field rules

When the form text mentions consistency requirements that span multiple fields, extract as \`cross_field_rules\` entries. Three kinds to look for:

- **\`value-equality\`**: "Must use the same X as section Y" / "Same keywords as A(v)" — two fields hold the same value.
- **\`computed-bound\`**: "Cannot exceed N% of total" / "Total budget ≤ RM 250,000" — a derived expression has a bound.
- **\`presence-conditional\`**: "If A is X, then B is required" — B's required status depends on A's value.

Example:
\`\`\`
Form text: "Patent Search ... Mesti menggunakan kata kunci yang sama dalam bahagian A(v)"

Extract:
{
  "rule_id": "patent-search-keywords-match-a-v",
  "kind": "value-equality",
  "source_field_id": "A-v-keywords",
  "target_field_id": "G-patent-search-narrative",
  "user_facing_message": {
    "ms": "Mesti menggunakan kata kunci yang sama dalam bahagian A(v) untuk carian paten",
    "en": "Must use the same keywords as section A(v) for patent search"
  },
  "severity": "warning"
}
\`\`\`

Unknown rule patterns: capture as \`kind: "computed-bound"\` with the rule expressed as natural language in \`expression\`, \`severity: "warning"\`, \`extraction_confidence: "low"\`.

### Rule 8: Confidence calibration (per-field)

Set \`extraction_confidence\` per field:

- **\`"high"\`** — label, type, constraints, and content_requirements are all unambiguous on the page. Use sparingly. Most fields should be medium.
- **\`"medium"\`** (default) — structure is clear, some details inferred from convention or context.
- **\`"low"\`** — you are uncertain about field type, label disambiguation, whether a field exists, or how to parse a constraint.

Calibration rule: be conservative. Over-confidence (everything HIGH) destroys user trust because the user pattern-matches and skips review. Conservative ratings drive the right review behavior.

## Additional rules

### No invented fields

If the form does not have a field you might "expect" (e.g., budget justification narrative when the form only has a budget table), DO NOT add it. Capture what is on the page. The user can add fields in the editor if needed.

### Output format

Return ONLY the JSON. No prose, no markdown code fences, no preamble, no postamble. The first character of your response is \`{\` and the last character is \`}\`.

If you cannot parse a portion of the form, include a partial schema with \`extraction_confidence: "low"\` on the affected fields rather than refusing entirely.

### Page audit trail

For PDFs, populate \`form_metadata.source.page_audit_trail\` with one entry per section, mapping \`section_id\` to the 1-indexed source page where the section header appears. For screenshots, use screenshot ordinals (1, 2, 3, ...).

## Few-shot examples

### Example 1: Bilingual radio field with simple options

Form text (extracted from a Malaysian grant form):
> A(i). Geran *Grant* Sila tanda (√) salah satu *Please tick (√) one*
> Geran Eksploratori *Exploratory Grant*  ☐
> Geran Transformatif *Transformative Grant*  ☐

Extracted field:
\`\`\`json
{
  "field_id": "A-i-grant-type",
  "label": { "ms": "Geran", "en": "Grant" },
  "description": { "ms": "Sila tanda (√) salah satu", "en": "Please tick (√) one" },
  "type": "radio",
  "required": true,
  "ordering": 1,
  "options": [
    { "value": "exploratory", "label": { "ms": "Geran Eksploratori", "en": "Exploratory Grant" } },
    { "value": "transformative", "label": { "ms": "Geran Transformatif", "en": "Transformative Grant" } }
  ],
  "layout": "horizontal",
  "ai_generation": {
    "supported": true,
    "mode": "recommend",
    "default_sources": ["Grant_Intelligence.md", "Proposal_Data.md"]
  },
  "extraction_confidence": "high"
}
\`\`\`

### Example 2: Budget table row group with embedded constraint

Form text:
> 21000 – Perjalanan dan Pengangkutan (Maksimum 20%) / *Travelling and Transportation (Maximum 20%)*
> Dalam Negara (termasuk kerja lapangan) / *Local (including field work)*
> Luar Negara / *Overseas*
> Jumlah keseluruhan vot 21000 / *Vot 21000 - Total*

Extracted row group (inside a larger \`table\` field):
\`\`\`json
{
  "group_id": "vot-21000",
  "group_label": {
    "ms": "21000 - Perjalanan dan Pengangkutan",
    "en": "21000 - Travelling and Transportation"
  },
  "group_constraints": { "max_percent_of_total": 20 },
  "rows": [
    {
      "row_id": "local",
      "row_label": {
        "ms": "Dalam Negara (termasuk kerja lapangan)",
        "en": "Local (including field work)"
      },
      "removable": false
    },
    {
      "row_id": "overseas",
      "row_label": { "ms": "Luar Negara", "en": "Overseas" },
      "removable": false
    }
  ],
  "has_subtotal": true,
  "subtotal_label": { "ms": "Jumlah keseluruhan vot 21000", "en": "Vot 21000 - Total" }
}
\`\`\`

### Example 3: Longtext field with verbatim content_requirements and word limit

Form text:
> D(i). Ringkasan Eksekutif Cadangan Penyelidikan / *Executive Summary of Research Proposal* (tidak melebihi 300 patah perkataan / *not more than 300 words*)
> (Sila sertakan pernyataan masalah, objektif, metodologi penyelidikan, jangkaan output/hasil/implikasi, dan kepentingan output daripada projek penyelidikan / *Please include the problem statement, objectives, research methodology, expected output/outcomes/implication, and significance of output from the research project*)

Extracted field:
\`\`\`json
{
  "field_id": "D-i-executive-summary",
  "label": {
    "ms": "Ringkasan Eksekutif Cadangan Penyelidikan",
    "en": "Executive Summary of Research Proposal"
  },
  "type": "longtext",
  "required": true,
  "ordering": 1,
  "length_limit": {
    "kind": "words",
    "max": 300,
    "soft": false,
    "source_phrasing": "tidak melebihi 300 patah perkataan / not more than 300 words"
  },
  "content_requirements": {
    "ms": "Sila sertakan pernyataan masalah, objektif, metodologi penyelidikan, jangkaan output/hasil/implikasi, dan kepentingan output daripada projek penyelidikan",
    "en": "Please include the problem statement, objectives, research methodology, expected output/outcomes/implication, and significance of output from the research project"
  },
  "verbatim_user_facing": true,
  "ai_generation": {
    "supported": true,
    "mode": "generate",
    "default_sources": ["Proposal_Data.md", "Research_Design.md", "Budget_Justification.md"]
  },
  "extraction_confidence": "high"
}
\`\`\`

## Process

Follow this order:

1. Read the entire form first. Note overall structure, language(s), submission portal, currency, scheme name.
2. Populate \`form_metadata\` including \`funder\`, \`primary_language\`, \`supported_languages\`, \`currency\`, \`source.type: "uploaded"\`, \`source.extraction_date\` (today's date in YYYY-MM-DD), \`source.extraction_method: "llm-tier1"\`.
3. Identify all top-level sections (A, B, C, ...). Build the section tree top-down.
4. For each section, identify all fields. Assign field types from the closed taxonomy.
5. Extract bilingual labels for every section, subsection, field, and option.
6. For every longtext field, extract \`content_requirements\` verbatim if present. Set \`verbatim_user_facing: true\`.
7. For every field, extract length limits and normalize.
8. For table fields, determine \`row_mode\` and populate \`columns\`, plus \`row_groups\` or \`fixed_rows\` as appropriate. Parse constraints from row labels.
9. Identify conditional sections/fields and express as \`visibility.condition\`.
10. Identify cross-field rules and populate \`cross_field_rules\` array.
11. Identify validation artifacts (separate attached forms like GET's Patent Search Form).
12. Populate \`page_audit_trail\` for every section.
13. Set \`extraction_confidence\` per field, calibrated conservatively.
14. Set \`form_metadata.source.extraction_confidence\` to the overall confidence: HIGH only if every field is HIGH, MEDIUM if any field is MEDIUM and none are LOW, LOW if any field is LOW.

Return the complete JSON object. No other output.`;

export function buildTier1Prompt(): string {
  return TIER1_PROMPT;
}
