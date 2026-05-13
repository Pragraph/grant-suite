import { describe, it, expect } from "vitest";

import {
  applyPass2Result,
  applyPass3Result,
  findUnresolvedReferences,
  validatePartialSchema,
  type FormSchema,
  type Pass2Result,
  type Pass3Result,
} from "@/lib/form-schema";

import { SKELETON_THREE_SECTION } from "./fixtures/skeleton-three-section";

function freshSchema(): FormSchema {
  return JSON.parse(JSON.stringify(SKELETON_THREE_SECTION)) as FormSchema;
}

describe("Pass 2 merge — applyPass2Result", () => {
  it("merges fields into the matching section by section_id", () => {
    const schema = freshSchema();
    const result: Pass2Result = {
      section_id: "B",
      fields: [
        {
          field_id: "B-project-title",
          label: { en: "Project Title" },
          type: "text",
          required: true,
          ordering: 1,
        },
      ],
    };
    const { schema: next, warnings } = applyPass2Result(schema, result);
    expect(warnings).toEqual([]);
    expect(next.sections[1].fields).toHaveLength(1);
    expect(next.sections[1].fields?.[0].field_id).toBe("B-project-title");
  });

  it("does not mutate the input schema (immutability)", () => {
    const schema = freshSchema();
    const result: Pass2Result = {
      section_id: "B",
      fields: [
        {
          field_id: "B-project-title",
          label: { en: "Project Title" },
          type: "text",
          required: true,
        },
      ],
    };
    const { schema: next } = applyPass2Result(schema, result);
    expect(schema.sections[1].fields).toEqual([]);
    expect(next).not.toBe(schema);
  });

  it("appends a new section if section_id is not in the schema", () => {
    const schema = freshSchema();
    const result: Pass2Result = {
      section_id: "Z",
      fields: [
        { field_id: "Z-extra", label: { en: "Extra" }, type: "text", required: false },
      ],
    };
    const { schema: next, warnings } = applyPass2Result(schema, result);
    expect(warnings).toHaveLength(1);
    expect(warnings[0]).toMatch(/not in the schema/i);
    expect(next.sections).toHaveLength(4);
    expect(next.sections[3].section_id).toBe("Z");
  });

  it("replaces subsections when Pass 2 emits them", () => {
    const schema = freshSchema();
    schema.sections[1].subsections = [
      { section_id: "B1", label: { en: "Old subsection" }, level: 2, fields: [] },
    ];
    const result: Pass2Result = {
      section_id: "B",
      fields: [],
      subsections: [
        {
          section_id: "B1",
          label: { en: "New B1" },
          level: 2,
          fields: [
            { field_id: "B1-thing", label: { en: "Thing" }, type: "text", required: false },
          ],
        },
      ],
    };
    const { schema: next } = applyPass2Result(schema, result);
    expect(next.sections[1].subsections).toHaveLength(1);
    expect(next.sections[1].subsections?.[0].label.en).toBe("New B1");
  });
});

describe("Pass 3 merge — applyPass3Result", () => {
  it("replaces cross_field_rules entirely", () => {
    const schema = freshSchema();
    schema.cross_field_rules = [
      { rule_id: "old-rule", kind: "value-equality" },
    ];
    const result: Pass3Result = {
      cross_field_rules: [{ rule_id: "new-rule", kind: "computed-bound" }],
      validation_artifacts: [],
      section_visibility_updates: [],
    };
    const { schema: next } = applyPass3Result(schema, result);
    expect(next.cross_field_rules).toHaveLength(1);
    expect(next.cross_field_rules?.[0].rule_id).toBe("new-rule");
  });

  it("replaces validation_artifacts entirely", () => {
    const schema = freshSchema();
    const result: Pass3Result = {
      cross_field_rules: [],
      validation_artifacts: [
        { artifact_id: "cv", label: { en: "CV" }, required: true },
      ],
      section_visibility_updates: [],
    };
    const { schema: next } = applyPass3Result(schema, result);
    expect(next.validation_artifacts).toHaveLength(1);
    expect(next.validation_artifacts?.[0].artifact_id).toBe("cv");
  });

  it("applies section_visibility_updates by section_id", () => {
    const schema = freshSchema();
    const result: Pass3Result = {
      cross_field_rules: [],
      validation_artifacts: [],
      section_visibility_updates: [
        {
          section_id: "B",
          visibility: {
            type: "conditional",
            condition: { field_id: "A-applicant-type", operator: "equals", value: "external" },
            operator_message: { en: "Only for external applicants" },
          },
        },
      ],
    };
    const { schema: next, warnings } = applyPass3Result(schema, result);
    expect(next.sections[1].visibility?.type).toBe("conditional");
    // A-applicant-type doesn't exist, so we expect a warning.
    expect(warnings.some((w) => w.includes("A-applicant-type"))).toBe(true);
  });

  it("emits warnings when cross_field_rules reference unknown field_ids", () => {
    const schema = freshSchema();
    const result: Pass3Result = {
      cross_field_rules: [
        {
          rule_id: "bad-rule",
          kind: "value-equality",
          source_field_id: "non-existent",
          target_field_id: "also-non-existent",
        },
      ],
      validation_artifacts: [],
      section_visibility_updates: [],
    };
    const { warnings } = applyPass3Result(schema, result);
    expect(warnings.length).toBeGreaterThanOrEqual(2);
    expect(warnings.some((w) => w.includes("non-existent"))).toBe(true);
  });
});

describe("findUnresolvedReferences", () => {
  it("returns empty when all references resolve", () => {
    const schema = freshSchema();
    schema.sections[0].fields = [
      { field_id: "A-name", label: { en: "Name" }, type: "text", required: true },
    ];
    schema.cross_field_rules = [
      {
        rule_id: "r1",
        kind: "value-equality",
        source_field_id: "A-name",
        target_field_id: "A-name",
      },
    ];
    expect(findUnresolvedReferences(schema)).toEqual([]);
  });

  it("flags field_ids in cross_field_rules that don't exist", () => {
    const schema = freshSchema();
    schema.cross_field_rules = [
      {
        rule_id: "r1",
        kind: "value-equality",
        source_field_id: "missing-field",
      },
    ];
    const unresolved = findUnresolvedReferences(schema);
    expect(unresolved).toHaveLength(1);
    expect(unresolved[0].referenced_id).toBe("missing-field");
    expect(unresolved[0].context).toMatch(/cross_field_rules/);
  });

  it("flags section visibility condition field_ids that don't exist", () => {
    const schema = freshSchema();
    schema.sections[1].visibility = {
      type: "conditional",
      condition: { field_id: "ghost-field", operator: "equals", value: "x" },
    };
    const unresolved = findUnresolvedReferences(schema);
    expect(unresolved.length).toBeGreaterThanOrEqual(1);
    expect(unresolved.some((u) => u.referenced_id === "ghost-field")).toBe(true);
  });

  it("ignores TBD and UNRESOLVED placeholders", () => {
    const schema = freshSchema();
    schema.sections[1].visibility = {
      type: "conditional",
      condition: { field_id: "TBD", operator: "equals", value: "TBD" },
    };
    expect(findUnresolvedReferences(schema)).toEqual([]);
  });
});

describe("validatePartialSchema", () => {
  it("accepts a skeleton-only schema with empty fields arrays", () => {
    const result = validatePartialSchema(SKELETON_THREE_SECTION);
    expect(result.valid).toBe(true);
    expect(result.errors).toEqual([]);
  });

  it("rejects a schema without schema_version", () => {
    const broken = { ...SKELETON_THREE_SECTION } as Record<string, unknown>;
    delete broken.schema_version;
    const result = validatePartialSchema(broken);
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.toLowerCase().includes("schema_version"))).toBe(true);
  });

  it("rejects a schema without form_metadata", () => {
    const broken = { ...SKELETON_THREE_SECTION } as Record<string, unknown>;
    delete broken.form_metadata;
    const result = validatePartialSchema(broken);
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.toLowerCase().includes("form_metadata"))).toBe(true);
  });

  it("rejects a schema with no sections", () => {
    const broken = { ...SKELETON_THREE_SECTION, sections: [] };
    const result = validatePartialSchema(broken);
    expect(result.valid).toBe(false);
  });
});
