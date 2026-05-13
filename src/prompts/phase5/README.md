# Phase 5 — v21 Architecture

As of v21-R1 (2026-05-13), Phase 5 has been restructured around the funder's actual form schema rather than scoring-weight-derived section categories. See the design documents in the parent design directory:

- `phase5-rebuild-01-architecture.md` — architecture lock plus 5 v21 invariants
- `phase5-rebuild-02-form-schema.md` — Form_Schema.json design rationale
- `phase5-rebuild-02-meta-schema.json` — JSON Schema Draft 2020-12 validation artifact
- `phase5-rebuild-02-example-get.json` — GET 2026 Transformative worked example
- `phase5-rebuild-02-example-horizon-msca.json` — Horizon MSCA worked example
- `phase5-rebuild-03-extraction-prompt.md` — extraction prompt design rationale
- `phase5-rebuild-03-tier1-prompt.md` — Tier 1 prompt (upload-derived)
- `phase5-rebuild-03-tier2-prompt.md` — Tier 2 prompt (web-reconstructed)

## v21 surface area added in v21-R1

| Module | Path | Purpose |
|---|---|---|
| Types | `src/lib/form-schema/types.ts` | Hand-written TypeScript mirror of the meta-schema. |
| Validator | `src/lib/form-schema/validator.ts` | Ajv 8.x with Draft 2020-12 support. |
| Meta-schema | `src/lib/form-schema/meta-schema.json` | Locked validation artifact. |
| Paste parser | `src/lib/form-schema/parsing.ts` | Strips markdown fences + prose; reports parse errors. |
| Storage | `src/lib/form-schema/storage.ts` | IndexedDB persistence for FormSchema + form files. |
| Prompts | `src/lib/form-schema/extraction-prompts/` | Tier 1 + Tier 2 prompt builders. |
| Confidence | `src/lib/form-schema/confidence.ts` | Overall schema confidence reduction. |
| UI workspace | `src/components/form-schema/Phase5_0Workspace.tsx` | Three-tier selector + paste-back. |
| UI editor | `src/components/form-schema/SchemaEditor.tsx` | Read-only schema viewer. |
| Phase 5 routing | `src/components/phase/Phase5Client.tsx` | Tabs between Phase 5-0 and legacy steps. |

## Legacy step files

Files in this directory named `step1-data-compiler.ts` through `step8-assembly-polish.ts` (and `step4b-citation-resolver.ts`) are the v20 architecture. They remain functional for projects in flight. The Phase 5 UI now defaults to the Phase 5-0 Form Schema workspace; the legacy steps remain accessible via the "Legacy steps" tab on the Phase 5 page.

v21-R4 (later round) will formally deprecate the legacy step files. v21-R1 does not deprecate them.

## v21 invariants enforced here

1. **Form_Schema.json is universal by design** — no per-scheme branches in `src/lib/form-schema/` or `src/components/form-schema/`.
2. **Worked examples are diversity stress tests** — GET and Horizon MSCA fixtures are used to exercise schema variation, not to enumerate supported schemes.
3. **The schema is the source of truth** for Phase 5-2 and beyond (v21-R2 onward).
4. **Right context beats rule stacks** — generation prompts shipped in v21-R2 will use minimum rule sets, not the deprecated 30 STOP RULES.
5. **Paste-flow is model-agnostic** — the bundle format is plain markdown plus attached documents.

Any future change that violates these invariants is rejected.
