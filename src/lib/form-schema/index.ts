// Public exports for the Form Schema infrastructure (v21-R1).
// Design: phase5-rebuild-02-form-schema.md.
// Universal-by-design contract: this module never branches per scheme.

export type {
  FormSchema,
  FormMetadata,
  FormFunder,
  FormSection,
  FormField,
  BaseField,
  TextField,
  LongtextField,
  RadioField,
  CheckboxField,
  MultiselectField,
  NumberField,
  DateField,
  TableField,
  FileUploadField,
  SignatureField,
  AttachmentReferenceField,
  TableStructure,
  TableColumn,
  RowGroup,
  RowGroupRow,
  RowGroupConstraints,
  FixedRow,
  PerRowAttachment,
  CrossFieldRule,
  ValidationArtifact,
  ValidationRule,
  Visibility,
  VisibilityCondition,
  AIGeneration,
  Option,
  LengthLimit,
  LengthLimitKind,
  ExtractionConfidence,
  SourceMetadata,
  PageAuditEntry,
  NumberConstraints,
  DateConstraints,
  BilingualString,
  Iso639_1,
  Iso4217,
  FieldType,
} from "./types";

export {
  validateFormSchema,
  isFormSchema,
  type ValidationResult,
  type ValidationError,
} from "./validator";

export { parseSchemaPaste, stripMarkdownFences, type ParseResult } from "./parsing";

export {
  saveFormSchema,
  loadFormSchema,
  deleteFormSchema,
  hasFormSchema,
  saveFormFile,
  loadFormFiles,
  deleteFormFile,
  deleteAllFormFiles,
  type StoredFormFile,
} from "./storage";

export { computeOverallConfidence } from "./confidence";

export {
  TIER1_PROMPT,
  buildTier1Prompt,
  TIER2_PROMPT_TEMPLATE,
  buildTier2Prompt,
  type Tier2Inputs,
} from "./extraction-prompts";
