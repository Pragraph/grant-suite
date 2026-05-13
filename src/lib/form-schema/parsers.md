# Form Schema Parser Inventory (v21-R1.2)

Per v20 Round 15 parser inventory + sync protocol. Parsers and stateful utilities shipped with this module:

| Parser / utility | Location | Purpose | Inputs | Outputs |
|---|---|---|---|---|
| `validateFormSchema` | `validator.ts` | Validates a candidate object against the locked meta-schema (JSON Schema Draft 2020-12). | `unknown` candidate | `{ valid: boolean, errors: ValidationError[] }` |
| `parseSchemaPaste` | `parsing.ts` | Parses raw LLM clipboard paste — strips markdown code fences, leading/trailing prose, then `JSON.parse`s. | `string` raw paste | `{ schema: unknown \| null, error: string \| null, errorPosition?: number }` |
| `validatePartialSchema` | `merging.ts` | Validates a partial schema (skeleton-only, partial fields) by injecting defaults for optional arrays before running the meta-schema validator. | `unknown` candidate | `{ valid: boolean, errors: string[] }` |
| `applyPass2Result` | `merging.ts` | Immutably merges a Pass 2 per-section result into a Form_Schema, replacing the matching section's `fields`. Appends a new section if the section_id is unknown. | `(schema, result)` | `{ schema, warnings }` |
| `applyPass3Result` | `merging.ts` | Immutably merges a Pass 3 relationships result, replacing top-level `cross_field_rules` and `validation_artifacts`, applying section visibility updates. | `(schema, result)` | `{ schema, warnings }` |
| `findUnresolvedReferences` | `merging.ts` | Walks the merged schema and reports any `field_id` / `section_id` references that don't resolve. Used to surface Pass 3 warnings. | `schema` | `UnresolvedReference[]` |
| `convertDocxToMarkdown` | `docx-conversion.ts` | Browser-side DOCX → markdown via mammoth + Turndown. Tables are preserved as GFM markdown tables. | `File \| Blob` | `{ markdown, warnings }` |
| `detectFileStrategy` | `docx-conversion.ts` | Determines whether a file should be embedded as markdown (DOCX), attached directly (PDF), attached as image (PNG/JPG/WEBP), or rejected. | `File` | `FileStrategy` discriminated union |
| `compactSchemaForPass3` | `extraction-prompts/pass3-relationships.ts` | Strips optional fields from a schema (descriptions, page_audit_trail, content_requirements) before embedding in the Pass 3 prompt. Keeps the prompt size manageable for large forms. | `schema` | `schema` (compacted) |
| `computeExtractionStatus` | `workspace-state.ts` | Derives the overall multi-pass `extraction_status` from per-section statuses and whether Pass 3 has run. | `(schema, sectionStatuses, hasPass3Output)` | `ExtractionStatus` |
| `reconcileWithSchema` | `workspace-state.ts` | Reconciles a workspace state's section_statuses map against the current schema, dropping stale entries and adding new ones. | `(state, schema)` | `Phase50WorkspaceState` |

## Extraction prompts inlined into the codebase

| Prompt | Module | Source markdown | Notes |
|---|---|---|---|
| Tier 1 single-pass | `extraction-prompts/tier1.ts` | `phase5-rebuild-03-tier1-prompt.md` | Original v21-R1 single-pass extractor; kept as advanced fallback. |
| Tier 2 single-pass | `extraction-prompts/tier2.ts` | `phase5-rebuild-03-tier2-prompt.md` | Web-reconstructed variant; uses `{{SHAPE_REFERENCE}}` + `{{CRITICAL_RULES}}` placeholders sourced from Tier 1. |
| Pass 1 — skeleton | `extraction-prompts/pass1-skeleton.ts` | `phase5-rebuild-03-pass1-skeleton-prompt.md` | Multi-pass step 1. DOCX markdown is prepended when provided. |
| Pass 2 — per-section fields | `extraction-prompts/pass2-section.ts` | `phase5-rebuild-03-pass2-section-prompt.md` | Multi-pass step 2 per section. Template variables substituted with `replaceAll` (multiple occurrences). |
| Pass 3 — relationships | `extraction-prompts/pass3-relationships.ts` | `phase5-rebuild-03-pass3-relationships-prompt.md` | Multi-pass step 3. Embeds the compacted schema as JSON inline. |

## IndexedDB storage layers

| Layer | Module | Key prefix | Stores |
|---|---|---|---|
| Form_Schema document | `storage.ts` | `grant-suite-form-schema-` | The full Form_Schema JSON per project. |
| Uploaded form files | `storage.ts` | `grant-suite-form-file-{projectId}:` | Raw uploaded files (PDF, DOCX, PNG, JPG, WEBP). |
| Workspace state | `workspace-state.ts` | `grant-suite-phase5-workspace-` | Per-section extraction status, overall extraction_status, last update timestamp. Sidecar to Form_Schema. |
| DOCX markdown cache | `docx-markdown-cache.ts` | `grant-suite-docx-markdown-{projectId}:` | Converted markdown per uploaded DOCX. Avoids re-running mammoth on every prompt build. |

## Sync protocol obligations

- The meta-schema artifact at `meta-schema.json` MUST stay byte-identical to `phase5-rebuild-02-meta-schema.json` in the design directory.
- TypeScript types in `types.ts` are hand-written to mirror the meta-schema shape. Any meta-schema change requires a corresponding types update.
- Extraction prompts (Tier 1, Tier 2, Pass 1, Pass 2, Pass 3) are verbatim copies of the canonical markdown between `---PROMPT BEGIN---` and `---PROMPT END---`. When a design doc changes, update the corresponding `.ts` file and bump the source-of-truth comment at the top.

## Version history

- 2026-05-13 (v21-R1.2): Multi-pass extraction architecture. Added Pass 1 / Pass 2 / Pass 3 prompts as separate modules. Added `merging.ts` (applyPass2Result, applyPass3Result, findUnresolvedReferences, validatePartialSchema). Added `docx-conversion.ts` (convertDocxToMarkdown via mammoth + turndown, detectFileStrategy). Added `workspace-state.ts` (per-section extraction tracking). Added `docx-markdown-cache.ts`. Single-pass Tier 1 and Tier 2 preserved as advanced fallback.
- 2026-05-13 (v21-R1.1): Meta-schema patched to allow `submission_portal: null` and `submission_portal_url: null`. `validation_artifact` shape extended with `linked_section_id` and `accepted_formats`. Tier 1 prompt adds Rule 0 "Bilingual everywhere" and explicit shape specs. Tier 2 prompt assembly now substitutes `{{CRITICAL_RULES}}` placeholder alongside `{{SHAPE_REFERENCE}}`.

## Future v21 rounds may add

- Manual field creation UI (v21-R2): for sections marked "Add manually," the editor needs full field creation UI.
- Source mapping resolver (v21-R2): maps form schema fields to upstream Phase 1-4 source documents.
- Generate bundler (v21-R2): assembles per-field bundles for the paste-flow.
- Assembly composer (v21-R2): orders field outputs into the final submission document.

These parsers are not in v21-R1.2 scope.
