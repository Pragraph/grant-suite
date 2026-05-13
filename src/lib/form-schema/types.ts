// Form_Schema.json TypeScript types — mirrors meta-schema.json (phase5-rebuild-02-meta-schema.json).
// Design rationale in phase5-rebuild-02-form-schema.md.
// Hand-written for readability and discriminated unions. Keep in sync with meta-schema.json.

export type Iso639_1 =
  | "ms" | "en" | "zh" | "ta" | "ja" | "ko" | "de" | "fr" | "es" | "pt"
  | "ar" | "it" | "nl" | "ru" | "tr" | "id" | "vi" | "th" | "tl" | "hi";

export type Iso4217 =
  | "MYR" | "USD" | "GBP" | "EUR" | "SGD" | "IDR" | "SAR" | "AUD" | "JPY" | "CHF"
  | "CAD" | "CNY" | "INR" | "KRW" | "THB" | "VND" | "PHP" | "NZD" | "HKD" | "TWD";

// At least one key required at runtime (enforced via validator).
export type BilingualString = Partial<Record<Iso639_1, string>>;

export type FieldType =
  | "text"
  | "longtext"
  | "radio"
  | "checkbox"
  | "multiselect"
  | "number"
  | "date"
  | "table"
  | "file-upload"
  | "signature"
  | "attachment-reference";

export type ExtractionConfidence = "high" | "medium" | "low";

export type LengthLimitKind = "words" | "characters" | "pages" | "minutes" | "none";

export interface LengthLimit {
  kind: LengthLimitKind;
  max?: number | null;
  min?: number | null;
  soft?: boolean;
  source_phrasing?: string | null;
}

export interface PageAuditEntry {
  section_id: string;
  source_page: number | string;
}

// SourceMetadata mirrors meta-schema $defs.source (additionalProperties: false).
// page_audit_trail accepts string entries to accommodate web-reconstructed audit references.
export interface SourceMetadata {
  type: "uploaded" | "web-reconstructed" | "manual";
  extracted_from?: string | null;
  extraction_date: string;
  extraction_method?: string | null;
  extraction_confidence?: ExtractionConfidence | null;
  reviewed_by_user?: boolean;
  reviewed_at?: string | null;
  page_audit_trail?: PageAuditEntry[];
}

export interface FormFunder {
  name: string;
  name_en?: string;
  country: string;
  scheme?: string;
  scheme_full_name?: string;
  year?: number;
}

export interface FormMetadata {
  form_id: string;
  form_title: BilingualString;
  funder: FormFunder;
  primary_language: Iso639_1;
  supported_languages: Iso639_1[];
  /** Nullable per v21-R1.1 (2026-05-13): schemes without an online portal emit null. */
  submission_portal?: string | null;
  /** Nullable per v21-R1.1 (2026-05-13): schemes without an online portal emit null. */
  submission_portal_url?: string | null;
  currency?: Iso4217;
  duration_options_years?: number[];
  budget_ceiling?: number | null;
  source: SourceMetadata;
}

export type Visibility =
  | { type: "always-visible" }
  | {
      type: "conditional";
      condition: VisibilityCondition;
      operator_message?: BilingualString;
    };

export interface VisibilityCondition {
  field_id: string;
  operator:
    | "equals"
    | "not-equals"
    | "contains"
    | "not-contains"
    | "greater-than"
    | "less-than"
    | "in-set"
    | "not-in-set"
    | "is-empty"
    | "is-not-empty";
  value?: unknown;
}

export interface AIGeneration {
  supported: boolean;
  mode?: "generate" | "recommend" | "import-from-source" | "none";
  default_sources?: string[];
  computed_from?: string | null;
}

export interface ValidationRule {
  kind: "regex" | "min-length" | "max-length";
  pattern?: string;
  value?: unknown;
  message?: BilingualString;
}

export interface BaseField {
  field_id: string;
  label: BilingualString;
  description?: BilingualString | null;
  required?: boolean;
  ordering?: number;
  visibility?: Visibility;
  ai_generation?: AIGeneration;
  extraction_confidence?: ExtractionConfidence | null;
}

export interface TextField extends BaseField {
  type: "text";
  length_limit?: LengthLimit;
  validation?: ValidationRule[];
  input_mode?: "text" | "email" | "tel" | "url";
}

export interface LongtextField extends BaseField {
  type: "longtext";
  length_limit: LengthLimit;
  content_requirements?: BilingualString;
  verbatim_user_facing?: boolean;
  minimum_paragraphs?: number | null;
}

export interface Option {
  value: string;
  label: BilingualString;
  metadata?: Record<string, unknown>;
}

export interface RadioField extends BaseField {
  type: "radio";
  options: Option[];
  layout?: "horizontal" | "vertical" | "grid" | "searchable-list";
}

export interface CheckboxField extends BaseField {
  type: "checkbox";
  options: Option[];
  min_selections?: number;
  max_selections?: number | null;
}

export interface MultiselectField extends BaseField {
  type: "multiselect";
  options: Option[];
  min_selections: number;
  max_selections?: number | null;
  ranking_required?: boolean;
}

export interface NumberConstraints {
  min?: number | null;
  max?: number | null;
  step?: number | null;
  currency?: Iso4217 | null;
  unit_label?: string | null;
  decimal_places?: number | null;
}

export interface NumberField extends BaseField {
  type: "number";
  constraints?: NumberConstraints;
  computed?: string | null;
}

export interface DateConstraints {
  min?: string | null;
  max?: string | null;
  must_be_after_field_id?: string | null;
}

export interface DateField extends BaseField {
  type: "date";
  format?: "YYYY-MM-DD" | "DD/MM/YYYY" | "MM/DD/YYYY" | "YYYY-MM" | "YYYY";
  constraints?: DateConstraints;
}

export interface TableColumn {
  column_id: string;
  label: BilingualString;
  type: "text" | "longtext" | "number" | "date" | "radio" | "checkbox" | "file-upload";
  required?: boolean;
  width_hint?: "narrow" | "medium" | "wide";
  constraints?: Record<string, unknown>;
  options?: Option[];
  computed?: string | null;
}

export interface RowGroupRow {
  row_id: string;
  row_label: BilingualString;
  row_constraints?: Record<string, unknown>;
  removable?: boolean;
}

export interface RowGroupConstraints {
  max_percent_of_total?: number | null;
  max_amount?: number | null;
  fixed_percent_of_direct?: number | null;
}

export interface RowGroup {
  group_id: string;
  group_label: BilingualString;
  group_constraints?: RowGroupConstraints;
  rows: RowGroupRow[];
  has_subtotal?: boolean;
  subtotal_label?: BilingualString;
}

export interface FixedRow {
  row_id: string;
  row_label: BilingualString;
  row_constraints?: Record<string, unknown>;
}

export interface PerRowAttachment {
  attachment_id: string;
  label: BilingualString;
  required?: boolean;
  default_source_pattern?: string | null;
}

export interface TableStructure {
  row_mode: "dynamic" | "fixed-rows" | "row-groups";
  min_rows?: number | null;
  max_rows?: number | null;
  columns: TableColumn[];
  row_groups?: RowGroup[] | null;
  fixed_rows?: FixedRow[] | null;
  has_grand_total_row?: boolean;
  grand_total_expression?: string | null;
  per_row_attachments?: PerRowAttachment[];
}

export interface TableField extends BaseField {
  type: "table";
  table_structure: TableStructure;
}

export interface FileUploadField extends BaseField {
  type: "file-upload";
  accepted_formats?: string[];
  max_file_size_mb?: number | null;
  default_source_pattern?: string | null;
}

export interface SignatureField extends BaseField {
  type: "signature";
  signer_role?:
    | "principal_investigator"
    | "institutional_endorser"
    | "co_investigator"
    | "mentor"
    | "other";
  requires_date?: boolean;
}

export interface AttachmentReferenceField extends BaseField {
  type: "attachment-reference";
  attachment_type?: string;
  preparation_guidance?: BilingualString;
}

export type FormField =
  | TextField
  | LongtextField
  | RadioField
  | CheckboxField
  | MultiselectField
  | NumberField
  | DateField
  | TableField
  | FileUploadField
  | SignatureField
  | AttachmentReferenceField;

export interface FormSection {
  section_id: string;
  label: BilingualString;
  description?: BilingualString | null;
  level: number;
  ordering?: number;
  required?: boolean;
  visibility?: Visibility;
  fields?: FormField[];
  subsections?: FormSection[];
}

export interface CrossFieldRule {
  rule_id: string;
  kind: "value-equality" | "computed-bound" | "presence-conditional" | "sum-equality";
  source_field_id?: string | null;
  target_field_id?: string | null;
  expression?: string | null;
  user_facing_message?: BilingualString;
  severity?: "error" | "warning";
}

export interface ValidationArtifact {
  artifact_id: string;
  label: BilingualString;
  filename_pattern?: string | null;
  linked_field_id?: string | null;
  /** Added v21-R1.1 (2026-05-13): artifacts that span a whole section rather than one field. */
  linked_section_id?: string | null;
  required?: boolean;
  /** Added v21-R1.1 (2026-05-13): accepted upload extensions (no leading dot). */
  accepted_formats?: string[];
  user_guidance?: BilingualString;
}

export interface FormSchema {
  schema_version: "1.0";
  form_metadata: FormMetadata;
  sections: FormSection[];
  cross_field_rules?: CrossFieldRule[];
  validation_artifacts?: ValidationArtifact[];
}
