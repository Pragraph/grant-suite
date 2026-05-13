// Tier 2 (web-reconstructed) Form Schema extraction prompt.
// Source: phase5-rebuild-03-tier2-prompt.md (text between ---PROMPT BEGIN--- and ---PROMPT END--- markers).
// Template variables: {{SCHEME_NAME}}, {{FUNDER}}, {{YEAR}}, {{URL}}.
// Two placeholders are replaced at runtime with Tier 1 sections:
//   {{SHAPE_REFERENCE}} → Tier 1 "## Shape reference" through "## Critical extraction rules"
//   {{CRITICAL_RULES}}  → Tier 1 "## Critical extraction rules" through "## Additional rules"
// Prompt v1.0.1 (v21-R1.1, 2026-05-13): adds CRITICAL_RULES placeholder so Rule 0 propagates to Tier 2.

import { TIER1_PROMPT } from "./tier1";

export interface Tier2Inputs {
  schemeName: string;
  funder: string;
  year: number;
  url?: string;
}

export const TIER2_PROMPT_TEMPLATE = `# Grant Form Schema Reconstruction (Web-Based)

You are reconstructing a grant application form schema (\`Form_Schema.json\`) from publicly available call documentation. The user does not have the actual form file — your job is to web-search for the call's published template, instructions, and evaluation criteria, then build a structured schema from those sources.

## Your task

Reconstruct one complete \`Form_Schema.json\` instance for this grant scheme:

- **Scheme:** {{SCHEME_NAME}}
- **Funder:** {{FUNDER}}
- **Year:** {{YEAR}}
- **URL (if provided):** {{URL}}

Web-search the funder's official call documentation. Read the application template, the call text, and the evaluation criteria. Produce a \`Form_Schema.json\` describing the form's structure as accurately as possible from these sources.

## Confidence ceiling

Because you do not have the actual form, NO field may be marked \`extraction_confidence: "high"\`. The maximum confidence is "medium." Use "low" liberally for any field where the documentation is ambiguous or you are inferring from convention.

Set \`form_metadata.source.type: "web-reconstructed"\` and \`form_metadata.source.extraction_confidence: "medium"\` (or "low" if multiple key fields are uncertain).

## Output target

Same as Tier 1: a single JSON object with \`schema_version\`, \`form_metadata\`, \`sections\`, \`cross_field_rules\`, and optional \`validation_artifacts\`. Shape v1.0.

## Field type taxonomy (CLOSED)

\`text\`, \`longtext\`, \`radio\`, \`checkbox\`, \`multiselect\`, \`number\`, \`date\`, \`table\`, \`file-upload\`, \`signature\`, \`attachment-reference\`.

## Shape reference

(Same as Tier 1 prompt. The codebase substitutes the \`{{SHAPE_REFERENCE}}\` placeholder with the Tier 1 shape spec at runtime. Treat the shape rules as identical to Tier 1, including Rule 0 "Bilingual everywhere," the validation-array shape, per_row_attachments shape, and validation_artifact shape.)

{{SHAPE_REFERENCE}}

## Web search guidance

### Search query order

Run searches in this order. Stop when you have authoritative sources covering structure, fields, and constraints.

1. **Official funder source** (highest authority):
   - \`"{{SCHEME_NAME}} {{YEAR}} application form template"\`
   - \`"{{SCHEME_NAME}} {{YEAR}} proposal template"\`
   - \`"{{SCHEME_NAME}} {{YEAR}} call text" OR "work programme"\`
   - \`"{{SCHEME_NAME}} {{YEAR}} guide for applicants"\`
   - Restrict to funder domain when known: append \`site:funder-domain.org\`.
2. **National Contact Point (NCP) sources** (high authority for EU schemes):
   - \`"{{SCHEME_NAME}} NCP {{YEAR}}"\` (typically per-country NCP sites publish summaries with field-level detail)
3. **University research office help pages** (moderate authority):
   - \`"{{SCHEME_NAME}} {{YEAR}} application guide site:edu"\`
4. **Forum posts and blogs** (low authority — use only to disambiguate):
   - \`"{{SCHEME_NAME}} {{YEAR}} application experience"\`

### Source authority hierarchy

When sources disagree, prefer in this order:
1. The funder's own published template or call text (the actual document the funder produces).
2. The funder's website summary page.
3. National Contact Points or designated delivery partners (e.g., Academy of Sciences Malaysia for ISPF, British Council for UK schemes in third countries).
4. Reputable research-administration sites (university research offices, GrantConnect, GrantForward).
5. Blogs, forum posts, AI-generated guides (least authoritative).

### What to extract from each source

From the **application template / proposal template** (highest priority): section structure, field labels, field types, length limits, content requirements.

From the **call text**: scheme metadata, eligibility rules, currency, budget ceilings, duration options, cross-field rules ("must use same X as Y").

From the **evaluation criteria**: scoring weights are NOT extracted into the schema (decision from architecture: schema is structure, not scoring). But the evaluation criteria can clarify what content requirements the funder weighs.

From the **guide for applicants**: edge cases, clarifications, examples of well-written sections.

### When the LLM cannot find authoritative sources

If after reasonable search effort (at least 3-5 queries across the source hierarchy) you cannot find a definitive source describing the form's structure, return a minimal \`Form_Schema.json\`:

\`\`\`json
{
  "schema_version": "1.0",
  "form_metadata": {
    "form_id": "{{SCHEME_NAME-slugified}}-{{YEAR}}",
    "form_title": { "en": "{{SCHEME_NAME}} ({{YEAR}})" },
    "funder": { "name": "{{FUNDER}}", "country": "...", "scheme": "{{SCHEME_NAME}}", "year": {{YEAR}} },
    "primary_language": "en",
    "supported_languages": ["en"],
    "source": {
      "type": "web-reconstructed",
      "extraction_date": "<today>",
      "extraction_method": "llm-tier2",
      "extraction_confidence": "low",
      "reviewed_by_user": false,
      "page_audit_trail": []
    },
    "notes": "Web search did not return authoritative documentation. The user should obtain the actual form file (Tier 1) or build the schema manually (Tier 3)."
  },
  "sections": [
    {
      "section_id": "manual-placeholder",
      "label": { "en": "Add sections manually in the schema editor" },
      "level": 1,
      "ordering": 1,
      "required": false,
      "visibility": { "type": "always-visible" },
      "fields": []
    }
  ],
  "cross_field_rules": []
}
\`\`\`

This minimal schema signals to the workspace that the user should switch to Tier 1 or Tier 3.

## URL audit trail

Instead of \`page_audit_trail\`, populate a \`url_audit_trail\` array in \`form_metadata.source\`:

\`\`\`json
"url_audit_trail": [
  { "section_id": "<id>", "source_url": "https://funder.example.org/template.pdf", "source_type": "official-template" },
  { "section_id": "<id>", "source_url": "https://funder.example.org/call-text.html", "source_type": "call-text" }
]
\`\`\`

\`source_type\` values: \`"official-template"\` | \`"call-text"\` | \`"evaluation-criteria"\` | \`"ncp-summary"\` | \`"university-guide"\` | \`"other"\`.

## Critical extraction rules

(Same as Tier 1 prompt — Rules 0 through 8. The codebase substitutes the \`{{CRITICAL_RULES}}\` placeholder with the Tier 1 critical rules at runtime. Rule 0 "Bilingual everywhere" is especially important for web-reconstructed schemas because public documentation often uses inconsistent formatting.)

{{CRITICAL_RULES}}

## Confidence calibration for Tier 2

- **\`"medium"\`** (default for all fields with documentation backing): the field structure is described in the call documentation, you have enough information to populate label/type/constraints, but you have not seen the actual form.
- **\`"low"\`** (use generously): the field is mentioned but details (length limit, exact labels, options) are unclear; you are inferring from analogous schemes; the field's existence is implied but not confirmed.

Never \`"high"\`. The user always reviews Tier 2 schemas before locking.

## Output format

Return ONLY the JSON. No prose, no markdown fences, no preamble. The first character is \`{\` and the last is \`}\`.

## Process

1. Run web searches following the query order above. Read at least the funder's official template if available. Note the URLs you read.
2. Populate \`form_metadata\` with what you learned. Set \`source.type: "web-reconstructed"\`, \`source.extraction_date\` to today's date.
3. Identify the form's section structure from the documentation. Build the section tree.
4. For each section, identify fields with as much detail as the documentation supports.
5. Extract labels (in the language(s) the documentation uses).
6. For longtext fields, extract content_requirements when the documentation includes them.
7. Extract length limits from the documentation.
8. For tables, determine row mode and structure.
9. Extract conditional visibility rules if documented.
10. Extract cross-field rules if documented.
11. Populate \`url_audit_trail\` with the URLs you used.
12. Set \`extraction_confidence\` per field (medium or low only).
13. Set \`form_metadata.source.extraction_confidence\` based on overall confidence.

Return the complete JSON.`;

function extractShapeReferenceSection(): string {
  const start = TIER1_PROMPT.indexOf("## Shape reference");
  const end = TIER1_PROMPT.indexOf("## Critical extraction rules");
  if (start === -1 || end === -1) {
    throw new Error(
      "Tier 1 prompt structure unexpected — shape reference markers not found. Check tier1.ts inlining matches the canonical prompt artifact.",
    );
  }
  return TIER1_PROMPT.slice(start, end).trim();
}

function extractCriticalRulesSection(): string {
  const start = TIER1_PROMPT.indexOf("## Critical extraction rules");
  const end = TIER1_PROMPT.indexOf("## Additional rules");
  if (start === -1 || end === -1) {
    throw new Error(
      "Tier 1 prompt structure unexpected — critical rules markers not found. Check tier1.ts inlining matches the canonical prompt artifact.",
    );
  }
  return TIER1_PROMPT.slice(start, end).trim();
}

export function buildTier2Prompt(inputs: Tier2Inputs): string {
  // Each placeholder occurs twice in the template — once inside a descriptor parenthetical
  // (wrapped in backticks) and once standalone. replaceAll handles both.
  return TIER2_PROMPT_TEMPLATE.replaceAll("{{SHAPE_REFERENCE}}", extractShapeReferenceSection())
    .replaceAll("{{CRITICAL_RULES}}", extractCriticalRulesSection())
    .replace(/\{\{SCHEME_NAME\}\}/g, inputs.schemeName)
    .replace(/\{\{FUNDER\}\}/g, inputs.funder)
    .replace(/\{\{YEAR\}\}/g, inputs.year.toString())
    .replace(/\{\{URL\}\}/g, inputs.url || "(none provided — search for it)");
}
