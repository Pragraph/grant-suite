// Pass 3 — Relationships extraction prompt (v21-R1.2).
// Source: phase5-rebuild-03-pass3-relationships-prompt.md text between
// ---PROMPT BEGIN--- and ---PROMPT END--- markers. Keep in sync with the design doc.
//
// Template variable {{COMPLETED_SCHEMA_JSON}} expands to a compact schema JSON.

import type { FormSchema, FormSection, FormField } from "../types";

export const PASS3_PROMPT_TEMPLATE = `# Grant Form Relationships Extraction (Pass 3 of 3)

You are extracting RELATIONSHIPS between fields in a grant application form. This is the third and final pass:

- **Pass 1 (done):** form skeleton.
- **Pass 2 (done):** fields within each section.
- **Pass 3 (this pass):** cross-field rules, validation artifacts, and formalization of section-level conditional visibility.

The current schema (sections and fields already extracted) is below. Read the attached form to identify relationships between fields. Use the schema's field IDs as references — every field ID you use in your output MUST exist in the schema below.

## Current schema

\`\`\`json
{{COMPLETED_SCHEMA_JSON}}
\`\`\`

## Output target

A single JSON object with three keys:

\`\`\`json
{
  "cross_field_rules": [ ...rule objects... ],
  "validation_artifacts": [ ...artifact objects... ],
  "section_visibility_updates": [ ...visibility update objects... ]
}
\`\`\`

All three arrays can be empty if the form has no rules/artifacts/conditional sections.

## Cross-field rule shape

\`\`\`json
{
  "rule_id": "kebab-case-id",
  "kind": "value-equality" | "computed-bound" | "presence-conditional" | "sum-equality",
  "source_field_id": "<field id from the schema above>",
  "target_field_id": "<field id from the schema above>",
  "expression": "<expression string>",
  "user_facing_message": { "ms": "...", "en": "..." },
  "severity": "error" | "warning"
}
\`\`\`

\`value-equality\` requires both \`source_field_id\` and \`target_field_id\`.
\`computed-bound\` requires \`expression\`.

## Validation artifact shape

\`\`\`json
{
  "artifact_id": "kebab-case-id",
  "label": { "ms": "...", "en": "..." },
  "filename_pattern": "<glob or null>",
  "linked_field_id": "<field id from schema, or null>",
  "linked_section_id": "<section id from schema, or null>",
  "required": true | false,
  "accepted_formats": ["pdf", "docx", "xlsx"],
  "user_guidance": { "ms": "...", "en": "..." }
}
\`\`\`

\`artifact_id\` and \`label\` are required. Use \`linked_field_id\` when the artifact attaches to a specific field. Use \`linked_section_id\` when the artifact spans a section (e.g., per-team-member CVs span the team section). \`accepted_formats\` is an array of file extension strings (no leading dot).

## Section visibility update shape

For sections that have conditional visibility (Pass 1 captured the \`operator_message\` text but left \`condition.field_id\` and \`condition.value\` as \`"TBD"\`), formalize the condition now that field IDs are known:

\`\`\`json
{
  "section_id": "<section id from schema>",
  "visibility": {
    "type": "conditional",
    "condition": {
      "field_id": "<actual field id from schema>",
      "operator": "equals" | "not-equals" | "contains" | "not-contains" | "greater-than" | "less-than" | "in-set" | "not-in-set" | "is-empty" | "is-not-empty",
      "value": <comparison value>
    },
    "operator_message": { "ms": "...", "en": "..." }
  }
}
\`\`\`

Only include sections that need updating. The workspace looks up sections by \`section_id\` and replaces their \`visibility\` block.

## What to extract — cross-field rules

Three kinds:

### \`value-equality\`
Two fields must hold the same value. Example: "Patent search keywords must match the keywords in A(v)" → source_field_id is the keywords field in A, target_field_id is the patent search field.

### \`computed-bound\`
A derived value has a bound. Examples:
- "Vot 21000 total cannot exceed 20% of grand total budget" → expression like \`sum(vot-21000) <= 0.20 * grand_total\`
- "End date must be after start date" → expression like \`end_date > start_date\`

### \`presence-conditional\`
Field B's required status depends on field A's value. Example: "Contract end date is required if service type is Contract" → presence-conditional with source A (service type) and target B (contract end date).

### \`sum-equality\`
A computed total must equal a reference value. Example: "Sum of column X = grand total cell."

For each rule, write \`user_facing_message\` as a clear bilingual explanation (or single-language for monolingual forms) that the workspace shows the user when validation fails. \`severity: "error"\` for hard requirements that block submission. \`severity: "warning"\` for advisory rules.

## What to extract — validation artifacts

Validation artifacts are SEPARATE documents attached alongside the form. Common patterns:
- Patent search forms (e.g., GET's Borang Carian Paten)
- Team member CVs (one per researcher, spanning a section)
- Letters of intent / MoU / MoA documents
- Expected ROV / impact documents
- Endorsement letters

For each, identify whether it's:
- Tied to one specific field (\`linked_field_id\` set) — e.g., the Patent Search Form attached to the patent search narrative
- Spanning a section (\`linked_section_id\` set) — e.g., team CVs spanning the team section
- Neither (both \`null\`) — e.g., a general submission attachment

Set \`accepted_formats\` to the file types the funder accepts (commonly "pdf", "docx", "xlsx").

## What to extract — section visibility updates

For every section in the schema with \`visibility.condition.field_id === "TBD"\` or \`visibility.condition.value === "TBD"\`, formalize the condition. The \`operator_message\` text was captured by Pass 1 — use it to identify the controlling field and value.

Examples:
- Pass 1 captured: \`operator_message: "Tidak berkaitan sekiranya pemohon bertaraf Profesor"\`
- Look up the position/grade field in the schema (likely \`B1-v-position-grade\` or similar)
- Formalize: \`condition: { field_id: "B1-v-position-grade", operator: "not-contains", value: "Profesor" }\`

If you cannot resolve the field reference (no matching field in the schema), include the update with \`field_id: "UNRESOLVED"\` and add a note in \`operator_message\`. The workspace will surface unresolved references for manual correction.

## Critical rules

### Rule 1: Bilingual everywhere

Every user-facing string is a bilingual object: \`user_facing_message\`, validation artifact \`label\`, \`user_guidance\`. For English-only forms, only \`en\`. Never bare strings.

### Rule 2: Use existing field IDs

Every \`field_id\` you reference in cross-field rules or visibility conditions MUST exist in the schema above. If you think there should be a rule but the relevant field isn't in the schema, omit the rule and add a note in \`user_facing_message\`.

For section_visibility_updates, every \`section_id\` MUST exist in the schema.

### Rule 3: Don't invent rules

Only extract rules that are EXPLICITLY stated in the form text. Common patterns:
- "Must use the same X as Y" → value-equality
- "Cannot exceed N% of total" / "Maximum N%" → computed-bound
- "Not applicable if X" / "Required only when X" → presence-conditional or visibility condition
- "Total must match grand total" → sum-equality

If the form doesn't say it, don't extract it.

### Rule 4: Severity discipline

- \`error\` — the rule MUST hold for valid submission. Workspace blocks submission until fixed.
- \`warning\` — the rule SHOULD hold but doesn't block. Workspace surfaces a warning.

Default to \`error\` for explicit funder requirements. Use \`warning\` for soft guidance ("recommended").

### Rule 5: Don't re-extract fields or sections

The schema's sections and fields are already populated. Don't produce a \`sections\` array. Don't re-extract field definitions. Only produce the three output arrays specified above.

## Output format

Return ONLY the JSON object with \`cross_field_rules\`, \`validation_artifacts\`, and \`section_visibility_updates\`. No prose, no markdown code fences, no preamble. First character \`{\`, last character \`}\`.

If a category has nothing to extract, return an empty array for it (don't omit the key).

## Process

1. Review the schema's sections and fields list above. Understand what fields exist and their IDs.
2. Read the attached form again, focusing on:
   - Fine-print rules and footnotes
   - Cross-references between sections ("Must use same X as Y")
   - Numeric constraints ("Maximum X% of total")
   - Validation artifacts mentioned (separate attached forms)
   - Conditional section visibility (resolve the TBD references from Pass 1)
3. Compile \`cross_field_rules\` for each explicit rule. Use only field_ids that exist in the schema.
4. Compile \`validation_artifacts\` for each separate attached document mentioned.
5. Compile \`section_visibility_updates\` for any section in the schema with TBD condition references.
6. Verify every field_id and section_id you reference exists in the schema above.

Return the JSON.
`;

export interface Pass3Inputs {
  schema: FormSchema;
  docxMarkdown?: string;
}

export function buildPass3Prompt(inputs: Pass3Inputs): string {
  const compactSchema = compactSchemaForPass3(inputs.schema);
  const schemaJson = JSON.stringify(compactSchema, null, 2);
  let prompt = PASS3_PROMPT_TEMPLATE.replaceAll("{{COMPLETED_SCHEMA_JSON}}", schemaJson);
  if (inputs.docxMarkdown) {
    prompt = `## Form content (extracted from uploaded DOCX)\n\n${inputs.docxMarkdown}\n\n---\n\n${prompt}`;
  }
  return prompt;
}

// Strip optional fields that don't help relationship detection so the embedded
// schema fits comfortably even for large forms. Pass 3 only needs section_id,
// field_id, type, label, options, and table_structure shape.
export function compactSchemaForPass3(schema: FormSchema): FormSchema {
  return {
    ...schema,
    form_metadata: {
      ...schema.form_metadata,
      source: {
        ...schema.form_metadata.source,
        page_audit_trail: undefined,
      },
    },
    sections: schema.sections.map(compactSection),
  };
}

function compactSection(section: FormSection): FormSection {
  const next: FormSection = {
    section_id: section.section_id,
    label: section.label,
    level: section.level,
  };
  if (section.visibility) next.visibility = section.visibility;
  if (section.ordering !== undefined) next.ordering = section.ordering;
  if (section.fields) next.fields = section.fields.map(compactField);
  if (section.subsections) next.subsections = section.subsections.map(compactSection);
  return next;
}

function compactField(field: FormField): FormField {
  const base = {
    field_id: field.field_id,
    label: field.label,
    type: field.type,
    ...(field.required !== undefined && { required: field.required }),
    ...(field.visibility && { visibility: field.visibility }),
  };

  switch (field.type) {
    case "radio":
    case "multiselect":
    case "checkbox":
      return { ...base, type: field.type, options: field.options } as FormField;
    case "table":
      return {
        ...base,
        type: "table",
        table_structure: {
          row_mode: field.table_structure.row_mode,
          columns: field.table_structure.columns.map((c) => ({
            column_id: c.column_id,
            label: c.label,
            type: c.type,
          })),
          ...(field.table_structure.row_groups && {
            row_groups: field.table_structure.row_groups.map((g) => ({
              group_id: g.group_id,
              group_label: g.group_label,
              rows: g.rows.map((r) => ({ row_id: r.row_id, row_label: r.row_label })),
            })),
          }),
          ...(field.table_structure.fixed_rows && {
            fixed_rows: field.table_structure.fixed_rows.map((r) => ({
              row_id: r.row_id,
              row_label: r.row_label,
            })),
          }),
        },
      } as FormField;
    default:
      return base as FormField;
  }
}
