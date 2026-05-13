"use client";

import { useMemo } from "react";
import {
  AlertTriangle,
  Asterisk,
  CalendarDays,
  CheckSquare,
  FileSignature,
  FileText,
  FileUp,
  Hash,
  Link as LinkIcon,
  ListChecks,
  ListTree,
  Paperclip,
  Radio,
  Table as TableIcon,
  TextCursorInput,
} from "lucide-react";

import { cn } from "@/lib/utils";
import {
  computeOverallConfidence,
  type BilingualString,
  type CrossFieldRule,
  type FormField,
  type FormSchema,
  type FormSection,
  type Iso639_1,
  type ValidationArtifact,
} from "@/lib/form-schema";

import { ConfidenceChip } from "./ConfidenceChip";

interface SchemaEditorProps {
  schema: FormSchema;
}

const FIELD_TYPE_ICON: Record<string, React.ComponentType<{ className?: string }>> = {
  text: TextCursorInput,
  longtext: FileText,
  radio: Radio,
  checkbox: CheckSquare,
  multiselect: ListChecks,
  number: Hash,
  date: CalendarDays,
  table: TableIcon,
  "file-upload": FileUp,
  signature: FileSignature,
  "attachment-reference": Paperclip,
};

const FIELD_TYPE_LABEL: Record<string, string> = {
  text: "Short text",
  longtext: "Long text",
  radio: "Single select",
  checkbox: "Checkboxes",
  multiselect: "Multi-select",
  number: "Number",
  date: "Date",
  table: "Table",
  "file-upload": "File upload",
  signature: "Signature",
  "attachment-reference": "Attachment reference",
};

function bilingualText(s: BilingualString | null | undefined, primary: Iso639_1): string {
  if (!s) return "";
  if (s[primary]) return s[primary] as string;
  const first = Object.keys(s)[0] as Iso639_1 | undefined;
  return first ? (s[first] as string) : "";
}

function secondaryText(s: BilingualString | null | undefined, primary: Iso639_1): string | null {
  if (!s) return null;
  const keys = (Object.keys(s) as Iso639_1[]).filter((k) => k !== primary);
  if (keys.length === 0) return null;
  return s[keys[0]] ?? null;
}

function formatLengthLimit(limit: { kind: string; max?: number | null; min?: number | null; soft?: boolean }): string {
  if (limit.kind === "none") return "No length limit";
  const range = limit.min ? `${limit.min}–${limit.max ?? "?"}` : `≤ ${limit.max ?? "?"}`;
  const softTag = limit.soft ? " (soft)" : "";
  return `${range} ${limit.kind}${softTag}`;
}

function flattenSections(sections: FormSection[]): FormSection[] {
  const out: FormSection[] = [];
  function walk(list: FormSection[]) {
    for (const s of list) {
      out.push(s);
      if (s.subsections?.length) walk(s.subsections);
    }
  }
  walk(sections);
  return out;
}

export function SchemaEditor({ schema }: SchemaEditorProps) {
  const primary = schema.form_metadata.primary_language;
  const flat = useMemo(() => flattenSections(schema.sections), [schema.sections]);
  const overall = useMemo(() => computeOverallConfidence(schema), [schema]);
  const pageAuditMap = useMemo(() => {
    const m = new Map<string, number | string>();
    for (const entry of schema.form_metadata.source.page_audit_trail ?? []) {
      m.set(entry.section_id, entry.source_page);
    }
    return m;
  }, [schema.form_metadata.source.page_audit_trail]);

  const sourceType = schema.form_metadata.source.type;
  const sourceLabel =
    sourceType === "uploaded" ? "Uploaded" : sourceType === "web-reconstructed" ? "Web-reconstructed" : "Manual";

  return (
    <div className="space-y-6">
      <header className="rounded-xl border border-border bg-card p-5 space-y-3">
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div className="space-y-1 min-w-0">
            <p className="text-xs uppercase tracking-wider text-muted-foreground">Form Schema</p>
            <h2 className="text-lg font-semibold text-foreground truncate">
              {bilingualText(schema.form_metadata.form_title, primary)}
            </h2>
            {secondaryText(schema.form_metadata.form_title, primary) && (
              <p className="text-xs text-muted-foreground truncate">
                {secondaryText(schema.form_metadata.form_title, primary)}
              </p>
            )}
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="inline-flex items-center rounded-full bg-[#F0F4FF] text-[#4F7DF3] px-2.5 py-1 text-[11px] font-medium">
              {sourceLabel}
            </span>
            <ConfidenceChip confidence={overall ?? undefined} size="md" />
          </div>
        </div>
        <dl className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
          <div>
            <dt className="text-muted-foreground">Funder</dt>
            <dd className="text-foreground font-medium">{schema.form_metadata.funder.name}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Scheme</dt>
            <dd className="text-foreground font-medium">{schema.form_metadata.funder.scheme ?? "—"}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Year</dt>
            <dd className="text-foreground font-medium">{schema.form_metadata.funder.year ?? "—"}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Currency</dt>
            <dd className="text-foreground font-medium">{schema.form_metadata.currency ?? "—"}</dd>
          </div>
        </dl>
        {sourceType === "web-reconstructed" && (
          <div className="flex items-start gap-2 rounded-md border border-amber-300/60 bg-amber-50 dark:bg-amber-950/30 p-3">
            <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
            <p className="text-xs text-amber-800 dark:text-amber-200">
              <strong>Tier 2 — Review carefully.</strong> This schema was reconstructed from public documentation
              without access to the actual form. Verify every field against the funder&apos;s published template
              before relying on the workspace.
            </p>
          </div>
        )}
        {overall === "low" && sourceType !== "web-reconstructed" && (
          <div className="flex items-start gap-2 rounded-md border border-red-300/60 bg-red-50 dark:bg-red-950/30 p-3">
            <AlertTriangle className="h-4 w-4 text-red-600 shrink-0 mt-0.5" />
            <p className="text-xs text-red-800 dark:text-red-200">
              <strong>Review needed.</strong> One or more fields have low extraction confidence. Inspect flagged
              fields below and reconcile against the source form.
            </p>
          </div>
        )}
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-[260px_1fr] gap-6">
        <aside className="lg:sticky lg:top-4 self-start space-y-2">
          <div className="rounded-xl border border-border bg-card p-4 space-y-2">
            <div className="flex items-center gap-2">
              <ListTree className="h-4 w-4 text-muted-foreground" />
              <p className="text-xs font-medium text-foreground uppercase tracking-wider">Sections</p>
            </div>
            <nav className="space-y-1">
              {flat.map((s) => (
                <a
                  key={`${s.section_id}-${s.level}`}
                  href={`#section-${s.section_id}`}
                  className={cn(
                    "block text-xs rounded px-2 py-1 hover:bg-muted text-muted-foreground hover:text-foreground transition-colors truncate",
                    s.level > 1 && "pl-4 text-muted-foreground/80",
                  )}
                >
                  <span className="text-muted-foreground/60 mr-1.5">{s.section_id}</span>
                  {bilingualText(s.label, primary)}
                </a>
              ))}
            </nav>
          </div>
        </aside>

        <div className="space-y-4">
          {schema.sections.map((section) => (
            <SectionCard
              key={section.section_id}
              section={section}
              primary={primary}
              pageAuditMap={pageAuditMap}
            />
          ))}

          {schema.cross_field_rules && schema.cross_field_rules.length > 0 && (
            <CrossFieldRulesPanel rules={schema.cross_field_rules} primary={primary} />
          )}

          {schema.validation_artifacts && schema.validation_artifacts.length > 0 && (
            <ValidationArtifactsPanel artifacts={schema.validation_artifacts} primary={primary} />
          )}
        </div>
      </div>
    </div>
  );
}

function SectionCard({
  section,
  primary,
  pageAuditMap,
}: {
  section: FormSection;
  primary: Iso639_1;
  pageAuditMap: Map<string, number | string>;
}) {
  const auditPage = pageAuditMap.get(section.section_id);
  const conditional = section.visibility?.type === "conditional" ? section.visibility : null;
  return (
    <section
      id={`section-${section.section_id}`}
      className={cn(
        "rounded-xl border border-border bg-card",
        section.level > 1 && "ml-4 border-dashed",
      )}
    >
      <header className="border-b border-border px-5 py-3 space-y-1">
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs text-muted-foreground font-mono">{section.section_id}</span>
              <h3 className="text-sm font-semibold text-foreground">{bilingualText(section.label, primary)}</h3>
              {section.level > 1 && (
                <span className="text-[10px] uppercase tracking-wider text-muted-foreground/70 rounded bg-muted px-1.5 py-0.5">
                  Level {section.level}
                </span>
              )}
            </div>
            {secondaryText(section.label, primary) && (
              <p className="text-xs text-muted-foreground/80 mt-0.5">{secondaryText(section.label, primary)}</p>
            )}
          </div>
          {auditPage !== undefined && (
            <span className="inline-flex items-center gap-1 text-[10px] text-muted-foreground bg-muted rounded px-1.5 py-0.5">
              <LinkIcon className="h-3 w-3" />
              Source: page {auditPage}
            </span>
          )}
        </div>
        {section.description && (
          <p className="text-xs text-muted-foreground">{bilingualText(section.description, primary)}</p>
        )}
        {conditional && (
          <p className="text-[11px] text-amber-700 dark:text-amber-300">
            Only shown when{" "}
            <span className="font-mono">{conditional.condition.field_id}</span>{" "}
            {conditional.condition.operator}{" "}
            {conditional.condition.value !== undefined && (
              <span className="font-mono">{JSON.stringify(conditional.condition.value)}</span>
            )}
          </p>
        )}
      </header>

      <div className="p-5 space-y-3">
        {(section.fields ?? []).map((field) => (
          <FieldCard key={field.field_id} field={field} primary={primary} />
        ))}
        {(section.subsections ?? []).map((sub) => (
          <SectionCard
            key={sub.section_id}
            section={sub}
            primary={primary}
            pageAuditMap={pageAuditMap}
          />
        ))}
        {(section.fields?.length ?? 0) === 0 && (section.subsections?.length ?? 0) === 0 && (
          <p className="text-xs italic text-muted-foreground">No fields in this section.</p>
        )}
      </div>
    </section>
  );
}

function FieldCard({ field, primary }: { field: FormField; primary: Iso639_1 }) {
  const Icon = FIELD_TYPE_ICON[field.type] ?? TextCursorInput;
  const typeLabel = FIELD_TYPE_LABEL[field.type] ?? field.type;
  return (
    <article className="rounded-lg border border-border bg-background/40 p-4 space-y-2">
      <header className="flex items-start justify-between gap-3 flex-wrap">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <Icon className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
            <span className="text-xs font-mono text-muted-foreground">{field.field_id}</span>
            {field.required && (
              <span className="inline-flex items-center text-red-500" title="Required">
                <Asterisk className="h-3 w-3" />
              </span>
            )}
          </div>
          <p className="text-sm font-medium text-foreground mt-1">{bilingualText(field.label, primary)}</p>
          {secondaryText(field.label, primary) && (
            <p className="text-xs text-muted-foreground/80">{secondaryText(field.label, primary)}</p>
          )}
          {field.description && (
            <p className="text-xs text-muted-foreground mt-1">{bilingualText(field.description, primary)}</p>
          )}
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-[10px] uppercase tracking-wider text-muted-foreground/70 rounded bg-muted px-1.5 py-0.5">
            {typeLabel}
          </span>
          <ConfidenceChip confidence={field.extraction_confidence ?? undefined} />
        </div>
      </header>

      {field.type === "longtext" && (
        <>
          <div className="text-[11px] text-muted-foreground">
            <span className="font-medium text-foreground">Length: </span>
            {formatLengthLimit(field.length_limit)}
            {field.length_limit.source_phrasing && (
              <span className="italic"> — &quot;{field.length_limit.source_phrasing}&quot;</span>
            )}
          </div>
          {field.content_requirements && (
            <div
              className={cn(
                "rounded-md border-l-2 px-3 py-2 text-xs",
                field.verbatim_user_facing
                  ? "border-l-[#4F7DF3] bg-[#F0F4FF] text-foreground"
                  : "border-l-muted-foreground/40 bg-muted text-foreground",
              )}
            >
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">
                Content requirements{field.verbatim_user_facing && " (verbatim)"}
              </p>
              <p>{bilingualText(field.content_requirements, primary)}</p>
            </div>
          )}
        </>
      )}

      {field.type === "text" && field.length_limit && (
        <p className="text-[11px] text-muted-foreground">
          Length: {formatLengthLimit(field.length_limit)}
        </p>
      )}

      {(field.type === "radio" || field.type === "checkbox" || field.type === "multiselect") && (
        <div className="space-y-1">
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
            Options ({field.options.length})
          </p>
          <ul className="text-xs text-foreground space-y-0.5 max-h-32 overflow-auto">
            {field.options.slice(0, 8).map((o) => (
              <li key={o.value} className="flex items-center gap-2">
                <span className="font-mono text-[10px] text-muted-foreground">{o.value}</span>
                <span>{bilingualText(o.label, primary)}</span>
              </li>
            ))}
            {field.options.length > 8 && (
              <li className="text-muted-foreground italic">…and {field.options.length - 8} more</li>
            )}
          </ul>
        </div>
      )}

      {field.type === "number" && field.constraints && (
        <p className="text-[11px] text-muted-foreground">
          {field.constraints.min !== undefined && field.constraints.min !== null && (
            <span>min {field.constraints.min}</span>
          )}
          {field.constraints.max !== undefined && field.constraints.max !== null && (
            <span>{field.constraints.min !== undefined && " · "}max {field.constraints.max}</span>
          )}
          {field.constraints.currency && <span> · {field.constraints.currency}</span>}
          {field.constraints.unit_label && <span> · {field.constraints.unit_label}</span>}
        </p>
      )}

      {field.type === "date" && field.format && (
        <p className="text-[11px] text-muted-foreground">Format: {field.format}</p>
      )}

      {field.type === "table" && (
        <TableStructurePreview field={field} primary={primary} />
      )}

      {field.type === "file-upload" && (
        <p className="text-[11px] text-muted-foreground">
          {field.accepted_formats && field.accepted_formats.length > 0 && (
            <span>Accepts: {field.accepted_formats.join(", ")}</span>
          )}
          {field.max_file_size_mb && <span> · max {field.max_file_size_mb} MB</span>}
        </p>
      )}

      {field.type === "signature" && (
        <p className="text-[11px] text-muted-foreground">
          Signer: {field.signer_role ?? "other"}
          {field.requires_date && " · date required"}
        </p>
      )}

      {field.type === "attachment-reference" && field.preparation_guidance && (
        <p className="text-[11px] text-muted-foreground italic">
          {bilingualText(field.preparation_guidance, primary)}
        </p>
      )}

      <footer className="flex items-center justify-end pt-1">
        <button
          type="button"
          disabled
          className="text-[10px] text-muted-foreground/50 cursor-not-allowed"
          title="Available in v21-R2"
        >
          Edit (v21-R2)
        </button>
      </footer>
    </article>
  );
}

function TableStructurePreview({
  field,
  primary,
}: {
  field: Extract<FormField, { type: "table" }>;
  primary: Iso639_1;
}) {
  const { table_structure } = field;
  return (
    <div className="space-y-2">
      <p className="text-[11px] text-muted-foreground">
        Mode: <span className="font-mono">{table_structure.row_mode}</span>
        {" · "}Columns: {table_structure.columns.length}
        {table_structure.row_mode === "row-groups" &&
          table_structure.row_groups &&
          ` · ${table_structure.row_groups.length} row groups`}
        {table_structure.row_mode === "fixed-rows" &&
          table_structure.fixed_rows &&
          ` · ${table_structure.fixed_rows.length} rows`}
      </p>
      <div className="rounded border border-border bg-card overflow-hidden">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 p-2">
          {table_structure.columns.slice(0, 6).map((col) => (
            <div key={col.column_id} className="text-[11px]">
              <p className="text-foreground font-medium truncate">{bilingualText(col.label, primary)}</p>
              <p className="text-muted-foreground/70 font-mono text-[10px]">{col.type}</p>
            </div>
          ))}
        </div>
        {table_structure.columns.length > 6 && (
          <p className="text-[10px] text-muted-foreground italic px-2 pb-2">
            …and {table_structure.columns.length - 6} more columns
          </p>
        )}
      </div>
    </div>
  );
}

function CrossFieldRulesPanel({
  rules,
  primary,
}: {
  rules: CrossFieldRule[];
  primary: Iso639_1;
}) {
  return (
    <section className="rounded-xl border border-border bg-card">
      <header className="border-b border-border px-5 py-3">
        <h3 className="text-sm font-semibold text-foreground">Cross-field rules ({rules.length})</h3>
      </header>
      <ul className="p-5 space-y-2">
        {rules.map((rule) => (
          <li key={rule.rule_id} className="rounded-md border border-border bg-background/40 p-3 space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-mono text-muted-foreground">{rule.rule_id}</span>
              <span className="text-[10px] uppercase tracking-wider text-muted-foreground/70 rounded bg-muted px-1.5 py-0.5">
                {rule.kind}
              </span>
              {rule.severity && (
                <span
                  className={cn(
                    "text-[10px] uppercase tracking-wider rounded px-1.5 py-0.5",
                    rule.severity === "error"
                      ? "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300"
                      : "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300",
                  )}
                >
                  {rule.severity}
                </span>
              )}
            </div>
            {rule.user_facing_message && (
              <p className="text-xs text-foreground">{bilingualText(rule.user_facing_message, primary)}</p>
            )}
            {rule.expression && (
              <p className="text-[11px] font-mono text-muted-foreground">{rule.expression}</p>
            )}
          </li>
        ))}
      </ul>
    </section>
  );
}

function ValidationArtifactsPanel({
  artifacts,
  primary,
}: {
  artifacts: ValidationArtifact[];
  primary: Iso639_1;
}) {
  return (
    <section className="rounded-xl border border-border bg-card">
      <header className="border-b border-border px-5 py-3">
        <h3 className="text-sm font-semibold text-foreground">Validation artifacts ({artifacts.length})</h3>
      </header>
      <ul className="p-5 space-y-2">
        {artifacts.map((a) => (
          <li key={a.artifact_id} className="rounded-md border border-border bg-background/40 p-3 space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <Paperclip className="h-3.5 w-3.5 text-muted-foreground" />
              <span className="text-sm font-medium text-foreground">{bilingualText(a.label, primary)}</span>
              {a.required && (
                <span className="text-[10px] uppercase tracking-wider rounded bg-red-100 text-red-700 px-1.5 py-0.5">
                  Required
                </span>
              )}
            </div>
            {a.user_guidance && (
              <p className="text-xs text-muted-foreground">{bilingualText(a.user_guidance, primary)}</p>
            )}
            {a.filename_pattern && (
              <p className="text-[11px] font-mono text-muted-foreground">Filename: {a.filename_pattern}</p>
            )}
          </li>
        ))}
      </ul>
    </section>
  );
}
