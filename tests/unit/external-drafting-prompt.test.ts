import { describe, it, expect } from "vitest";
import {
  EXTERNAL_DRAFTING_PROMPT,
  EXTERNAL_DRAFTING_PROMPT_TEMPLATE,
  SUPPORTED_OUTPUT_LANGUAGES,
  DEFAULT_OUTPUT_LANGUAGE,
  buildExternalDraftingPrompt,
  isSupportedOutputLanguage,
} from "@/lib/external-drafting/prompt";

describe("EXTERNAL_DRAFTING_PROMPT_TEMPLATE", () => {
  it("starts with the Grant Application Drafting Assistant header", () => {
    expect(EXTERNAL_DRAFTING_PROMPT_TEMPLATE).toMatch(
      /^# Grant Application Drafting Assistant/,
    );
  });

  it("contains the {{OUTPUT_LANGUAGE}} placeholder before substitution", () => {
    expect(EXTERNAL_DRAFTING_PROMPT_TEMPLATE).toContain("{{OUTPUT_LANGUAGE}}");
    const occurrences = EXTERNAL_DRAFTING_PROMPT_TEMPLATE.match(
      /\{\{OUTPUT_LANGUAGE\}\}/g,
    );
    expect(occurrences?.length).toBe(3);
  });

  it("documents APA 7th citation discipline (Adam revision)", () => {
    expect(EXTERNAL_DRAFTING_PROMPT_TEMPLATE).toContain("APA 7th");
  });

  it("includes Step 1b recommended drafting sequence table (Adam revision)", () => {
    expect(EXTERNAL_DRAFTING_PROMPT_TEMPLATE).toContain(
      "Recommended drafting sequence table",
    );
    expect(EXTERNAL_DRAFTING_PROMPT_TEMPLATE).toContain("| Order | Section |");
  });

  it("instructs the LLM to bundle related sections into single rows", () => {
    expect(EXTERNAL_DRAFTING_PROMPT_TEMPLATE).toContain(
      "Bundle related sections",
    );
    expect(EXTERNAL_DRAFTING_PROMPT_TEMPLATE).toContain(
      "Target table length: 10",
    );
  });

  it("gives concrete bundle examples including the methodology spine", () => {
    expect(EXTERNAL_DRAFTING_PROMPT_TEMPLATE).toContain("Methodology spine");
    expect(EXTERNAL_DRAFTING_PROMPT_TEMPLATE).toContain("Research-design spine");
    expect(EXTERNAL_DRAFTING_PROMPT_TEMPLATE).toContain(
      "Application identity bundle",
    );
  });

  it("references the docx skill path for DOCX export", () => {
    expect(EXTERNAL_DRAFTING_PROMPT_TEMPLATE).toContain(
      "/mnt/skills/public/docx/SKILL.md",
    );
  });

  it("documents the no-invented-content and no-AI-tells rules", () => {
    expect(EXTERNAL_DRAFTING_PROMPT_TEMPLATE).toContain("No invented content");
    expect(EXTERNAL_DRAFTING_PROMPT_TEMPLATE).toContain("No AI tells");
  });

  it("specifies markdown-only output with heading discipline", () => {
    expect(EXTERNAL_DRAFTING_PROMPT_TEMPLATE).toContain("## Output format");
    expect(EXTERNAL_DRAFTING_PROMPT_TEMPLATE).toContain("`#` for the form title");
  });

  it("ends with a Begin section instructing the LLM to wait for the user's pick", () => {
    expect(EXTERNAL_DRAFTING_PROMPT_TEMPLATE).toContain("## Begin");
    expect(EXTERNAL_DRAFTING_PROMPT_TEMPLATE.trim().endsWith("Wait for the section pick.")).toBe(
      true,
    );
  });

  it("has a non-trivial length (template is genuinely inlined)", () => {
    expect(EXTERNAL_DRAFTING_PROMPT_TEMPLATE.length).toBeGreaterThan(2000);
  });
});

describe("buildExternalDraftingPrompt", () => {
  it("substitutes all OUTPUT_LANGUAGE placeholders for the default English value", () => {
    const out = buildExternalDraftingPrompt();
    expect(out).not.toContain("{{OUTPUT_LANGUAGE}}");
    expect(out).toContain("Draft body content in English");
    expect(out).toContain("output_language: English");
    expect(out).toContain("Write all output in English");
  });

  it("substitutes a custom language across all three occurrences", () => {
    const out = buildExternalDraftingPrompt("Bahasa Malaysia");
    expect(out).not.toContain("{{OUTPUT_LANGUAGE}}");
    expect(out).toContain("Draft body content in Bahasa Malaysia");
    expect(out).toContain("output_language: Bahasa Malaysia");
    expect(out).toContain("Write all output in Bahasa Malaysia");
  });

  it("substitutes non-Latin scripts like Mandarin Chinese", () => {
    const out = buildExternalDraftingPrompt("Mandarin Chinese");
    expect(out).not.toContain("{{OUTPUT_LANGUAGE}}");
    expect(out).toContain("Write all output in Mandarin Chinese");
  });
});

describe("SUPPORTED_OUTPUT_LANGUAGES", () => {
  it("exposes 16 supported languages", () => {
    expect(SUPPORTED_OUTPUT_LANGUAGES).toHaveLength(16);
  });

  it("defaults to English at index 0", () => {
    expect(SUPPORTED_OUTPUT_LANGUAGES[0].value).toBe("English");
    expect(DEFAULT_OUTPUT_LANGUAGE).toBe("English");
  });

  it("includes Bahasa Malaysia, Mandarin Chinese, and Filipino", () => {
    const values = SUPPORTED_OUTPUT_LANGUAGES.map((l) => l.value);
    expect(values).toContain("Bahasa Malaysia");
    expect(values).toContain("Mandarin Chinese");
    expect(values).toContain("Filipino");
  });
});

describe("isSupportedOutputLanguage", () => {
  it("accepts known language values", () => {
    expect(isSupportedOutputLanguage("English")).toBe(true);
    expect(isSupportedOutputLanguage("Japanese")).toBe(true);
  });

  it("rejects unknown or non-string values", () => {
    expect(isSupportedOutputLanguage("Klingon")).toBe(false);
    expect(isSupportedOutputLanguage("")).toBe(false);
    expect(isSupportedOutputLanguage(null)).toBe(false);
    expect(isSupportedOutputLanguage(undefined)).toBe(false);
    expect(isSupportedOutputLanguage(123)).toBe(false);
  });
});

describe("EXTERNAL_DRAFTING_PROMPT backwards-compat export", () => {
  it("matches buildExternalDraftingPrompt() with the English default", () => {
    expect(EXTERNAL_DRAFTING_PROMPT).toBe(buildExternalDraftingPrompt());
  });

  it("contains no remaining template placeholders", () => {
    expect(EXTERNAL_DRAFTING_PROMPT).not.toContain("{{OUTPUT_LANGUAGE}}");
  });
});
