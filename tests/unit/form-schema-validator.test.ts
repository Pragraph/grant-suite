import { describe, it, expect } from "vitest";
import getFixture from "./fixtures/form-schema-get.json";
import horizonFixture from "./fixtures/form-schema-horizon-msca.json";
import regressionSubmissionPortalNull from "./fixtures/regression-submission-portal-null.json";
import regressionValidationArtifactExtended from "./fixtures/regression-validation-artifact-extended.json";
import { validateFormSchema, isFormSchema } from "@/lib/form-schema/validator";

describe("Form Schema validator — worked examples", () => {
  it("GET 2026 Transformative fixture validates", () => {
    const result = validateFormSchema(getFixture);
    if (!result.valid) {
      console.log("GET errors:", JSON.stringify(result.errors.slice(0, 5), null, 2));
    }
    expect(result.valid).toBe(true);
    expect(result.errors).toEqual([]);
  });

  it("Horizon MSCA fixture validates", () => {
    const result = validateFormSchema(horizonFixture);
    if (!result.valid) {
      console.log("Horizon errors:", JSON.stringify(result.errors.slice(0, 5), null, 2));
    }
    expect(result.valid).toBe(true);
    expect(result.errors).toEqual([]);
  });

  it("isFormSchema type guard returns true for valid fixtures", () => {
    expect(isFormSchema(getFixture)).toBe(true);
    expect(isFormSchema(horizonFixture)).toBe(true);
  });
});

describe("Form Schema validator — v21-R1.1 regressions", () => {
  it("submission_portal: null and submission_portal_url: null validate", () => {
    const result = validateFormSchema(regressionSubmissionPortalNull);
    if (!result.valid) {
      console.log("submission_portal null errors:", JSON.stringify(result.errors.slice(0, 5), null, 2));
    }
    expect(result.valid).toBe(true);
    expect(result.errors).toEqual([]);
  });

  it("validation_artifact with linked_section_id and accepted_formats validates", () => {
    const result = validateFormSchema(regressionValidationArtifactExtended);
    if (!result.valid) {
      console.log("validation_artifact errors:", JSON.stringify(result.errors.slice(0, 5), null, 2));
    }
    expect(result.valid).toBe(true);
    expect(result.errors).toEqual([]);
  });
});

describe("Form Schema validator — rejection cases", () => {
  it("rejects empty object", () => {
    const result = validateFormSchema({});
    expect(result.valid).toBe(false);
    expect(result.errors.length).toBeGreaterThan(0);
  });

  it("rejects schema_version mismatch", () => {
    const result = validateFormSchema({
      ...getFixture,
      schema_version: "0.9",
    });
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.path.includes("schema_version"))).toBe(true);
  });

  it("rejects unknown field type", () => {
    const broken = JSON.parse(JSON.stringify(getFixture));
    broken.sections[0].fields[0].type = "smiley-face";
    const result = validateFormSchema(broken);
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.keyword === "enum" || e.path.includes("/type"))).toBe(true);
  });

  it("rejects missing form_metadata", () => {
    const broken = JSON.parse(JSON.stringify(getFixture));
    delete broken.form_metadata;
    const result = validateFormSchema(broken);
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.params.missingProperty === "form_metadata")).toBe(true);
  });

  it("rejects bilingualString with no language keys", () => {
    const broken = JSON.parse(JSON.stringify(getFixture));
    broken.form_metadata.form_title = {};
    const result = validateFormSchema(broken);
    expect(result.valid).toBe(false);
  });

  it("rejects longtext without length_limit", () => {
    const broken = JSON.parse(JSON.stringify(getFixture));
    // Find first longtext field and strip length_limit
    function findLongtext(sections: Array<Record<string, unknown>>): Record<string, unknown> | null {
      for (const s of sections) {
        for (const f of (s.fields as Array<Record<string, unknown>> | undefined) ?? []) {
          if (f.type === "longtext") return f;
        }
        const sub = (s.subsections as Array<Record<string, unknown>> | undefined) ?? [];
        const nested = findLongtext(sub);
        if (nested) return nested;
      }
      return null;
    }
    const lt = findLongtext(broken.sections);
    if (lt) {
      delete lt.length_limit;
      const result = validateFormSchema(broken);
      expect(result.valid).toBe(false);
    }
  });
});
