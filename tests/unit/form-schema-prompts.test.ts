import { describe, it, expect } from "vitest";
import { buildTier1Prompt, buildTier2Prompt, TIER1_PROMPT } from "@/lib/form-schema";

describe("Tier 1 prompt", () => {
  it("starts with the expected heading", () => {
    expect(buildTier1Prompt().startsWith("# Grant Form Schema Extraction")).toBe(true);
  });

  it("includes the closed field-type taxonomy", () => {
    const p = buildTier1Prompt();
    for (const t of [
      "text",
      "longtext",
      "radio",
      "checkbox",
      "multiselect",
      "number",
      "date",
      "table",
      "file-upload",
      "signature",
      "attachment-reference",
    ]) {
      expect(p).toContain(t);
    }
  });

  it("contains the verbatim content_requirements rule", () => {
    expect(buildTier1Prompt()).toContain("Verbatim content_requirements");
  });

  it("contains shape reference markers used by Tier 2 inlining", () => {
    expect(TIER1_PROMPT).toContain("## Shape reference");
    expect(TIER1_PROMPT).toContain("## Critical extraction rules");
  });
});

describe("Tier 2 prompt", () => {
  it("substitutes scheme name, funder, year, URL", () => {
    const built = buildTier2Prompt({
      schemeName: "Horizon Europe MSCA Staff Exchanges",
      funder: "European Research Executive Agency",
      year: 2026,
      url: "https://example.org/template.pdf",
    });
    expect(built).toContain("Horizon Europe MSCA Staff Exchanges");
    expect(built).toContain("European Research Executive Agency");
    expect(built).toContain("2026");
    expect(built).toContain("https://example.org/template.pdf");
  });

  it("inlines the Tier 1 shape reference (placeholder replaced)", () => {
    const built = buildTier2Prompt({
      schemeName: "Test",
      funder: "Test Funder",
      year: 2026,
    });
    // The placeholder parenthetical must be replaced by the actual shape reference content.
    expect(built).not.toContain(
      "(Same as Tier 1 prompt. The codebase concatenates the Tier 1 shape reference",
    );
    expect(built).toContain("Section");
    expect(built).toContain("Field — universal keys");
  });

  it("falls back to default URL message when none provided", () => {
    const built = buildTier2Prompt({
      schemeName: "Test",
      funder: "Test Funder",
      year: 2026,
    });
    expect(built).toContain("(none provided — search for it)");
  });

  it("caps confidence at medium per Tier 2 design", () => {
    const built = buildTier2Prompt({
      schemeName: "Test",
      funder: "Test Funder",
      year: 2026,
    });
    expect(built).toContain("NO field may be marked");
  });
});
