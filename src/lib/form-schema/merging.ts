// Schema merging utilities for multi-pass extraction (v21-R1.2).
// Design: phase5-rebuild-03-multipass-architecture.md "Schema merging logic".
// Parser inventory: applyPass2Result, applyPass3Result, findUnresolvedReferences, validatePartialSchema.
//
// All operations are immutable — the input schema is never mutated; a new schema object is returned.

import type {
  CrossFieldRule,
  FormField,
  FormSchema,
  FormSection,
  ValidationArtifact,
  Visibility,
} from "./types";
import { validateFormSchema } from "./validator";

export interface Pass2Result {
  section_id: string;
  fields: FormField[];
  subsections?: FormSection[];
}

export interface Pass3SectionVisibilityUpdate {
  section_id: string;
  visibility: Visibility;
}

export interface Pass3Result {
  cross_field_rules: CrossFieldRule[];
  validation_artifacts: ValidationArtifact[];
  section_visibility_updates: Pass3SectionVisibilityUpdate[];
}

export interface MergeResult {
  schema: FormSchema;
  warnings: string[];
}

export interface UnresolvedReference {
  context: string;
  referenced_id: string;
  not_found: boolean;
}

export interface PartialSchemaValidationResult {
  valid: boolean;
  errors: string[];
}

// ─── Pass 2 merge ─────────────────────────────────────────────────────────────

export function applyPass2Result(schema: FormSchema, result: Pass2Result): MergeResult {
  const warnings: string[] = [];
  let merged = false;

  const nextSections = mapSectionsImmutable(schema.sections, (section) => {
    if (section.section_id !== result.section_id) return section;
    merged = true;
    const next: FormSection = {
      ...section,
      fields: [...result.fields],
    };
    if (result.subsections) {
      next.subsections = result.subsections.map(cloneSection);
    }
    return next;
  });

  if (merged) {
    return {
      schema: { ...schema, sections: nextSections },
      warnings,
    };
  }

  warnings.push(
    `Section "${result.section_id}" was not in the schema. Appended as a new top-level section.`,
  );
  const appended: FormSection = {
    section_id: result.section_id,
    label: { en: result.section_id },
    level: 1,
    fields: [...result.fields],
  };
  if (result.subsections) {
    appended.subsections = result.subsections.map(cloneSection);
  }
  return {
    schema: { ...schema, sections: [...nextSections, appended] },
    warnings,
  };
}

// ─── Pass 3 merge ─────────────────────────────────────────────────────────────

export function applyPass3Result(schema: FormSchema, result: Pass3Result): MergeResult {
  const warnings: string[] = [];
  const allFieldIds = collectFieldIds(schema);
  const allSectionIds = collectSectionIds(schema);

  for (let i = 0; i < result.cross_field_rules.length; i++) {
    const rule = result.cross_field_rules[i];
    if (rule.source_field_id && !allFieldIds.has(rule.source_field_id)) {
      warnings.push(
        `cross_field_rules[${i}].source_field_id "${rule.source_field_id}" not found in schema.`,
      );
    }
    if (rule.target_field_id && !allFieldIds.has(rule.target_field_id)) {
      warnings.push(
        `cross_field_rules[${i}].target_field_id "${rule.target_field_id}" not found in schema.`,
      );
    }
  }

  for (let i = 0; i < result.validation_artifacts.length; i++) {
    const artifact = result.validation_artifacts[i];
    if (artifact.linked_field_id && !allFieldIds.has(artifact.linked_field_id)) {
      warnings.push(
        `validation_artifacts[${i}].linked_field_id "${artifact.linked_field_id}" not found in schema.`,
      );
    }
    if (artifact.linked_section_id && !allSectionIds.has(artifact.linked_section_id)) {
      warnings.push(
        `validation_artifacts[${i}].linked_section_id "${artifact.linked_section_id}" not found in schema.`,
      );
    }
  }

  const visibilityById = new Map<string, Visibility>();
  for (let i = 0; i < result.section_visibility_updates.length; i++) {
    const update = result.section_visibility_updates[i];
    if (!allSectionIds.has(update.section_id)) {
      warnings.push(
        `section_visibility_updates[${i}].section_id "${update.section_id}" not found in schema.`,
      );
      continue;
    }
    if (update.visibility.type === "conditional") {
      const fid = update.visibility.condition.field_id;
      if (fid && fid !== "UNRESOLVED" && !allFieldIds.has(fid)) {
        warnings.push(
          `section_visibility_updates[${i}].visibility.condition.field_id "${fid}" not found in schema.`,
        );
      }
    }
    visibilityById.set(update.section_id, update.visibility);
  }

  const nextSections = mapSectionsImmutable(schema.sections, (section) => {
    const nextVisibility = visibilityById.get(section.section_id);
    if (!nextVisibility) return section;
    return { ...section, visibility: nextVisibility };
  });

  return {
    schema: {
      ...schema,
      sections: nextSections,
      cross_field_rules: [...result.cross_field_rules],
      validation_artifacts: [...result.validation_artifacts],
    },
    warnings,
  };
}

// ─── Reference resolution ─────────────────────────────────────────────────────

export function findUnresolvedReferences(schema: FormSchema): UnresolvedReference[] {
  const fieldIds = collectFieldIds(schema);
  const sectionIds = collectSectionIds(schema);
  const out: UnresolvedReference[] = [];

  const rules = schema.cross_field_rules ?? [];
  rules.forEach((rule, i) => {
    if (rule.source_field_id && !fieldIds.has(rule.source_field_id)) {
      out.push({
        context: `cross_field_rules[${i}].source_field_id`,
        referenced_id: rule.source_field_id,
        not_found: true,
      });
    }
    if (rule.target_field_id && !fieldIds.has(rule.target_field_id)) {
      out.push({
        context: `cross_field_rules[${i}].target_field_id`,
        referenced_id: rule.target_field_id,
        not_found: true,
      });
    }
  });

  const artifacts = schema.validation_artifacts ?? [];
  artifacts.forEach((artifact, i) => {
    if (artifact.linked_field_id && !fieldIds.has(artifact.linked_field_id)) {
      out.push({
        context: `validation_artifacts[${i}].linked_field_id`,
        referenced_id: artifact.linked_field_id,
        not_found: true,
      });
    }
    if (artifact.linked_section_id && !sectionIds.has(artifact.linked_section_id)) {
      out.push({
        context: `validation_artifacts[${i}].linked_section_id`,
        referenced_id: artifact.linked_section_id,
        not_found: true,
      });
    }
  });

  walkSections(schema.sections, (section, path) => {
    if (section.visibility?.type === "conditional") {
      const fid = section.visibility.condition.field_id;
      if (fid && fid !== "TBD" && fid !== "UNRESOLVED" && !fieldIds.has(fid)) {
        out.push({
          context: `${path}.visibility.condition.field_id`,
          referenced_id: fid,
          not_found: true,
        });
      }
    }
    for (const field of section.fields ?? []) {
      if (field.visibility?.type === "conditional") {
        const fid = field.visibility.condition.field_id;
        if (fid && fid !== "TBD" && fid !== "UNRESOLVED" && !fieldIds.has(fid)) {
          out.push({
            context: `${path}.fields[${field.field_id}].visibility.condition.field_id`,
            referenced_id: fid,
            not_found: true,
          });
        }
      }
    }
  });

  return out;
}

// ─── Partial schema validation ────────────────────────────────────────────────

export function validatePartialSchema(schema: unknown): PartialSchemaValidationResult {
  if (!schema || typeof schema !== "object") {
    return { valid: false, errors: ["Schema must be an object."] };
  }
  const obj = schema as Record<string, unknown>;
  const errors: string[] = [];

  if (obj.schema_version !== "1.0") {
    errors.push('schema_version must be "1.0".');
  }
  if (!obj.form_metadata || typeof obj.form_metadata !== "object") {
    errors.push("form_metadata is required.");
  }
  if (!Array.isArray(obj.sections)) {
    errors.push("sections must be an array.");
  } else if (obj.sections.length === 0) {
    errors.push("sections must contain at least one entry.");
  }

  if (errors.length > 0) return { valid: false, errors };

  const candidate = {
    ...obj,
    sections: (obj.sections as unknown[]).map((s) => {
      const sectionObj = s as Record<string, unknown>;
      const cloned: Record<string, unknown> = { ...sectionObj };
      if (!Array.isArray(cloned.fields)) cloned.fields = [];
      return cloned;
    }),
    cross_field_rules: Array.isArray(obj.cross_field_rules) ? obj.cross_field_rules : [],
    validation_artifacts: Array.isArray(obj.validation_artifacts) ? obj.validation_artifacts : [],
  };

  const result = validateFormSchema(candidate);
  if (result.valid) return { valid: true, errors: [] };
  return {
    valid: false,
    errors: result.errors.map((e) => `${e.path || "(root)"} ${e.message}`),
  };
}

// ─── Internal helpers ─────────────────────────────────────────────────────────

function mapSectionsImmutable(
  sections: FormSection[],
  fn: (section: FormSection) => FormSection,
): FormSection[] {
  return sections.map((section) => {
    const mapped = fn(section);
    if (mapped.subsections && mapped.subsections.length > 0) {
      const mappedSubsections = mapSectionsImmutable(mapped.subsections, fn);
      if (mappedSubsections !== mapped.subsections) {
        return { ...mapped, subsections: mappedSubsections };
      }
    }
    return mapped;
  });
}

function cloneSection(section: FormSection): FormSection {
  const next: FormSection = { ...section };
  if (section.fields) next.fields = [...section.fields];
  if (section.subsections) next.subsections = section.subsections.map(cloneSection);
  return next;
}

function collectFieldIds(schema: FormSchema): Set<string> {
  const ids = new Set<string>();
  walkSections(schema.sections, (section) => {
    for (const field of section.fields ?? []) ids.add(field.field_id);
  });
  return ids;
}

function collectSectionIds(schema: FormSchema): Set<string> {
  const ids = new Set<string>();
  walkSections(schema.sections, (section) => ids.add(section.section_id));
  return ids;
}

function walkSections(
  sections: FormSection[],
  visit: (section: FormSection, path: string) => void,
  basePath = "sections",
): void {
  sections.forEach((section, i) => {
    const path = `${basePath}[${i}]`;
    visit(section, path);
    if (section.subsections?.length) {
      walkSections(section.subsections, visit, `${path}.subsections`);
    }
  });
}
