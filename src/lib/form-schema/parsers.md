# Form Schema Parser Inventory (v21-R1)

Per v20 Round 15 parser inventory + sync protocol. New parsers shipped with this module:

| Parser | Location | Purpose | Inputs | Outputs |
|---|---|---|---|---|
| `validateFormSchema` | `src/lib/form-schema/validator.ts` | Validates a candidate object against the locked meta-schema (JSON Schema Draft 2020-12). | `unknown` candidate (typically from `parseSchemaPaste`) | `{ valid: boolean, errors: ValidationError[] }` |
| `parseSchemaPaste` | `src/lib/form-schema/parsing.ts` | Parses raw LLM clipboard paste — strips markdown code fences, leading/trailing prose, then `JSON.parse`s. | `string` raw paste | `{ schema: unknown \| null, error: string \| null, errorPosition?: number }` |

## Sync protocol obligations

- The meta-schema artifact at `src/lib/form-schema/meta-schema.json` MUST stay byte-identical to `phase5-rebuild-02-meta-schema.json` in the design directory. Any schema-spec change in v1.x bumps a versioned copy here.
- TypeScript types in `src/lib/form-schema/types.ts` are hand-written to mirror the meta-schema shape. Any meta-schema change requires a corresponding types update.
- The Tier 1 and Tier 2 extraction prompts in `src/lib/form-schema/extraction-prompts/` are verbatim copies of the prompt text in the design directory's `phase5-rebuild-03-tier1-prompt.md` and `phase5-rebuild-03-tier2-prompt.md` between the `---PROMPT BEGIN---` and `---PROMPT END---` markers. Re-run the extraction script when those files change.

## Version history

- 2026-05-13 (v21-R1.1): Meta-schema patched to allow `submission_portal: null` and `submission_portal_url: null`. `validation_artifact` shape extended with `linked_section_id` and `accepted_formats`. Tier 1 prompt adds Rule 0 "Bilingual everywhere" and explicit shape specs for text-field `validation` array, `per_row_attachments`, and `validation_artifact`. Tier 2 prompt assembly now substitutes `{{CRITICAL_RULES}}` placeholder alongside `{{SHAPE_REFERENCE}}` so the canonical critical rules propagate to web-reconstructed extractions. No breaking changes to existing schemas; the v21-R1 GET and Horizon MSCA worked-example fixtures continue to validate unchanged.

## Future v21 rounds may add

- Source mapping resolver (v21-R2): maps form schema fields to upstream Phase 1-4 source documents.
- Generate bundler (v21-R2): assembles per-field bundles for the paste-flow.
- Assembly composer (v21-R2): orders field outputs into the final submission document.

These parsers are not in v21-R1 scope.
