import { describe, it, expect } from "vitest";

import {
  PASS1_PROMPT,
  buildPass1Prompt,
  PASS2_PROMPT_TEMPLATE,
  buildPass2Prompt,
  buildPass2PromptForSection,
  PASS3_PROMPT_TEMPLATE,
  buildPass3Prompt,
  compactSchemaForPass3,
} from "@/lib/form-schema";

import { SKELETON_THREE_SECTION } from "./fixtures/skeleton-three-section";

describe("Pass 1 prompt", () => {
  it("contains the three-pass header", () => {
    expect(PASS1_PROMPT).toContain("Pass 1 of 3");
    expect(PASS1_PROMPT).toContain("Don't extract fields");
  });

  it("contains the bilingual labels rule", () => {
    expect(PASS1_PROMPT).toContain("Bilingual labels");
  });

  it("prepends DOCX markdown when provided", () => {
    const result = buildPass1Prompt({ docxMarkdown: "# Test Form\n\nSection A" });
    expect(result).toContain("# Test Form");
    expect(result.indexOf("# Test Form")).toBeLessThan(result.indexOf("Grant Form Skeleton Extraction"));
  });

  it("returns the bare prompt when no DOCX markdown is given", () => {
    const result = buildPass1Prompt();
    expect(result).toBe(PASS1_PROMPT);
  });
});

describe("Pass 2 prompt", () => {
  it("substitutes all template variables", () => {
    const prompt = buildPass2Prompt({
      sectionId: "D",
      sectionLabelPrimary: "Methodology",
      sectionLabelSecondary: "Metodologi",
      sectionPageStart: 12,
      sectionPageEnd: 16,
      existingSectionIds: ["A", "B1", "B2", "C", "D"],
      primaryLanguage: "en",
    });
    expect(prompt).not.toContain("{{SECTION_ID}}");
    expect(prompt).not.toContain("{{SECTION_LABEL_PRIMARY}}");
    expect(prompt).toContain("section `D`");
    expect(prompt).toContain("Methodology");
    expect(prompt).toContain("12 to 16");
    expect(prompt).toContain("A, B1, B2, C, D");
  });

  it("references the deferral of cross-field rules to Pass 3", () => {
    const prompt = buildPass2Prompt({
      sectionId: "A",
      sectionLabelPrimary: "Applicant",
      sectionLabelSecondary: "",
      sectionPageStart: 1,
      sectionPageEnd: 2,
      existingSectionIds: ["A"],
      primaryLanguage: "en",
    });
    expect(prompt).toContain("cross-field rules");
    expect(prompt).toContain("deferred to Pass 3");
  });

  it("template still has placeholders before substitution", () => {
    expect(PASS2_PROMPT_TEMPLATE).toContain("{{SECTION_ID}}");
    expect(PASS2_PROMPT_TEMPLATE).toContain("{{EXISTING_SECTION_IDS}}");
  });

  it("replaces all occurrences of repeated placeholders (replaceAll, not replace)", () => {
    const prompt = buildPass2Prompt({
      sectionId: "D",
      sectionLabelPrimary: "Methodology",
      sectionLabelSecondary: "Metodologi",
      sectionPageStart: 12,
      sectionPageEnd: 16,
      existingSectionIds: ["A", "D"],
      primaryLanguage: "en",
    });
    // {{SECTION_ID}} appears multiple times in the template — confirm none remain.
    expect(prompt.match(/\{\{SECTION_ID\}\}/g)).toBeNull();
    // {{SECTION_PAGE_START}} also repeats.
    expect(prompt.match(/\{\{SECTION_PAGE_START\}\}/g)).toBeNull();
  });

  it("buildPass2PromptForSection extracts context from the schema", () => {
    const prompt = buildPass2PromptForSection(SKELETON_THREE_SECTION, "B");
    expect(prompt).toContain("section `B`");
    expect(prompt).toContain("Project Details");
    expect(prompt).toContain("A, B, C");
  });

  it("buildPass2PromptForSection throws for unknown section_id", () => {
    expect(() => buildPass2PromptForSection(SKELETON_THREE_SECTION, "ZZ")).toThrow();
  });
});

describe("Pass 3 prompt", () => {
  it("embeds the schema as JSON", () => {
    const prompt = buildPass3Prompt({ schema: SKELETON_THREE_SECTION });
    expect(prompt).not.toContain("{{COMPLETED_SCHEMA_JSON}}");
    expect(prompt).toContain('"section_id"');
    expect(prompt).toContain('"Project Details"');
  });

  it("warns the LLM not to re-extract fields", () => {
    const prompt = buildPass3Prompt({ schema: SKELETON_THREE_SECTION });
    expect(prompt).toContain("Don't re-extract");
  });

  it("compactSchemaForPass3 strips page_audit_trail", () => {
    const compact = compactSchemaForPass3(SKELETON_THREE_SECTION);
    expect(compact.form_metadata.source.page_audit_trail).toBeUndefined();
  });

  it("template still has placeholder before substitution", () => {
    expect(PASS3_PROMPT_TEMPLATE).toContain("{{COMPLETED_SCHEMA_JSON}}");
  });
});
