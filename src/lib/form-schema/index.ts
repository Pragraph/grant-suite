// Public exports for the Form Schema infrastructure (v21-R1, extended v21-R1.2).
// Design: phase5-rebuild-02-form-schema.md, phase5-rebuild-03-multipass-architecture.md.
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
  ExtractionStatus,
  SectionStatus,
  Phase50WorkspaceState,
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
  PASS1_PROMPT,
  buildPass1Prompt,
  type Pass1Inputs,
  PASS2_PROMPT_TEMPLATE,
  buildPass2Prompt,
  buildPass2PromptForSection,
  type Pass2Inputs,
  PASS3_PROMPT_TEMPLATE,
  buildPass3Prompt,
  compactSchemaForPass3,
  type Pass3Inputs,
} from "./extraction-prompts";

export {
  applyPass2Result,
  applyPass3Result,
  findUnresolvedReferences,
  validatePartialSchema,
  type Pass2Result,
  type Pass3Result,
  type Pass3SectionVisibilityUpdate,
  type MergeResult,
  type UnresolvedReference,
  type PartialSchemaValidationResult,
} from "./merging";

export {
  convertDocxToMarkdown,
  detectFileStrategy,
  type DocxConversionResult,
  type FileStrategy,
} from "./docx-conversion";

export {
  getDocxMarkdown,
  setDocxMarkdown,
  deleteDocxMarkdown,
  deleteDocxMarkdownCache,
  listCachedDocxMarkdown,
} from "./docx-markdown-cache";

export {
  loadWorkspaceState,
  saveWorkspaceState,
  deleteWorkspaceState,
  initialWorkspaceState,
  computeExtractionStatus,
  updateSectionStatus,
  reconcileWithSchema,
} from "./workspace-state";
