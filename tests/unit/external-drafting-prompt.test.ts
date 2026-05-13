import { describe, it, expect } from "vitest";
import { EXTERNAL_DRAFTING_PROMPT } from "@/lib/external-drafting/prompt";

describe("EXTERNAL_DRAFTING_PROMPT", () => {
  it("declares the Grant Application Drafting Assistant header", () => {
    expect(EXTERNAL_DRAFTING_PROMPT).toMatch(/^# Grant Application Drafting Assistant/);
  });

  it("includes the Workflow section with section-by-section discipline", () => {
    expect(EXTERNAL_DRAFTING_PROMPT).toContain("## Workflow");
    expect(EXTERNAL_DRAFTING_PROMPT).toContain("section by section");
    expect(EXTERNAL_DRAFTING_PROMPT).toContain("Do NOT proceed without my pick");
  });

  it("includes the critical drafting rules — no invented content + no AI tells", () => {
    expect(EXTERNAL_DRAFTING_PROMPT).toContain("## Critical drafting rules");
    expect(EXTERNAL_DRAFTING_PROMPT).toContain("No invented content");
    expect(EXTERNAL_DRAFTING_PROMPT).toContain("No AI tells");
  });

  it("specifies the markdown output format heading rules", () => {
    expect(EXTERNAL_DRAFTING_PROMPT).toContain("## Output format");
    expect(EXTERNAL_DRAFTING_PROMPT).toContain("`#` for the form title");
  });

  it("ends with a Begin section instructing the LLM to wait for the user's pick", () => {
    expect(EXTERNAL_DRAFTING_PROMPT).toContain("## Begin");
    expect(EXTERNAL_DRAFTING_PROMPT.trim().endsWith("Wait for my section pick.")).toBe(true);
  });

  it("has a non-trivial length so the prompt is genuinely inlined", () => {
    expect(EXTERNAL_DRAFTING_PROMPT.length).toBeGreaterThan(2000);
  });
});
