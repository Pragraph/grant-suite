import { describe, it, expect, beforeEach, vi } from "vitest";
import type { Document } from "@/lib/types";

// ─── Mock the Zustand document store ─────────────────────────────────────────

let mockDocuments: Document[] = [];

vi.mock("@/stores/document-store", () => ({
  useDocumentStore: {
    getState: () => ({ documents: mockDocuments }),
  },
}));

// Import after mock is set up
import { qualityGateService } from "@/lib/quality-gate";

// ─── Helpers ─────────────────────────────────────────────────────────────────

function makeDoc(
  canonicalName: string,
  content: string,
  phase = 1,
): Document {
  return {
    id: `doc-${canonicalName}`,
    projectId: "proj-1",
    phase,
    step: 1,
    name: canonicalName.replace(/_/g, " ").replace(".md", ""),
    canonicalName,
    content,
    format: "md",
    version: 1,
    isCurrent: true,
    wordCount: content.split(/\s+/).filter(Boolean).length,
    createdAt: new Date().toISOString(),
  };
}

const FULL_GRANT_INTELLIGENCE = `# Grant Intelligence: Test Grant

## Grant Program Overview
Overview of the grant program.

## Eligibility Requirements
Must be early career researcher.

## Evaluation Criteria
- Scientific excellence
- Innovation
- Impact

## Funding Parameters
Maximum: $500,000

## Strategic Priorities
Climate and sustainability.

## Application Requirements
Word limit: 10000 words.

## Timeline & Deadlines
Deadline: March 2026.

## Intelligence Gaps
No major gaps identified.
`;

// ─── Gate 1 Tests ────────────────────────────────────────────────────────────

describe("QualityGate — Gate 1", () => {
  beforeEach(() => {
    mockDocuments = [];
  });

  it("fails without Grant_Intelligence.md", () => {
    const result = qualityGateService.checkGate(1);
    expect(result.passed).toBe(false);
    const existsCheck = result.checks.find((c) => c.id === "g1-exists");
    expect(existsCheck?.status).toBe("fail");
  });

  it("passes with valid Grant_Intelligence.md containing all 8 sections", () => {
    mockDocuments = [makeDoc("Grant_Intelligence.md", FULL_GRANT_INTELLIGENCE)];
    const result = qualityGateService.checkGate(1);
    expect(result.passed).toBe(true);
    expect(result.checks.every((c) => c.status === "pass")).toBe(true);
  });

  it("warns if sections are missing", () => {
    const partialContent = `# Grant Intelligence
## Grant Program Overview
Some overview.
## Eligibility Requirements
Some requirements.
`;
    mockDocuments = [makeDoc("Grant_Intelligence.md", partialContent)];
    const result = qualityGateService.checkGate(1);
    // Should not hard-fail (doc exists) but warn about missing sections
    const sectionsCheck = result.checks.find((c) => c.id === "g1-sections");
    expect(sectionsCheck?.status).toBe("warn");
    expect(sectionsCheck?.detail).toContain("Missing sections");
  });

  it("warns if critical gaps are detected", () => {
    const contentWithCriticalGap = FULL_GRANT_INTELLIGENCE.replace(
      "No major gaps identified.",
      "CRITICAL: Missing budget cap information.",
    );
    mockDocuments = [makeDoc("Grant_Intelligence.md", contentWithCriticalGap)];
    const result = qualityGateService.checkGate(1);
    const gapsCheck = result.checks.find((c) => c.id === "g1-gaps");
    expect(gapsCheck?.status).toBe("warn");
  });

  it("only returns early fail check when document is missing", () => {
    const result = qualityGateService.checkGate(1);
    // When doc is missing, only the exists check should be returned
    expect(result.checks).toHaveLength(1);
    expect(result.checks[0].id).toBe("g1-exists");
  });
});

// ─── Gate 5 Tests ────────────────────────────────────────────────────────────

describe("QualityGate — Gate 5", () => {
  beforeEach(() => {
    mockDocuments = [];
  });

  it("fails without Complete_Proposal.md", () => {
    const result = qualityGateService.checkGate(5);
    expect(result.passed).toBe(false);
    const existsCheck = result.checks.find((c) => c.id === "g5-exists");
    expect(existsCheck?.status).toBe("fail");
  });

  it("passes with a clean Complete_Proposal.md", () => {
    mockDocuments = [
      makeDoc(
        "Complete_Proposal.md",
        "# Complete Proposal\n\nThis is a fully written proposal with no placeholders.",
        5,
      ),
    ];
    const result = qualityGateService.checkGate(5);
    const existsCheck = result.checks.find((c) => c.id === "g5-exists");
    expect(existsCheck?.status).toBe("pass");
    const citationCheck = result.checks.find((c) => c.id === "g5-citations");
    expect(citationCheck?.status).toBe("pass");
    const userInputCheck = result.checks.find((c) => c.id === "g5-userinput");
    expect(userInputCheck?.status).toBe("pass");
  });

  it("warns if [CITATION NEEDED] markers present", () => {
    mockDocuments = [
      makeDoc(
        "Complete_Proposal.md",
        "# Proposal\nResearch shows [CITATION NEEDED] that X is true. Also [CITATION NEEDED] here.",
        5,
      ),
    ];
    const result = qualityGateService.checkGate(5);
    const citationCheck = result.checks.find((c) => c.id === "g5-citations");
    expect(citationCheck?.status).toBe("warn");
    expect(citationCheck?.detail).toContain("2");
  });

  it("fails if [USER INPUT NEEDED] markers present", () => {
    mockDocuments = [
      makeDoc(
        "Complete_Proposal.md",
        "# Proposal\nThe PI has [USER INPUT NEEDED] years of experience.",
        5,
      ),
    ];
    const result = qualityGateService.checkGate(5);
    const userInputCheck = result.checks.find((c) => c.id === "g5-userinput");
    expect(userInputCheck?.status).toBe("fail");
    expect(result.passed).toBe(false);
  });

  it("[USER INPUT NEEDED] makes canOverride false", () => {
    mockDocuments = [
      makeDoc(
        "Complete_Proposal.md",
        "# Proposal\n[USER INPUT NEEDED] complete this section.",
        5,
      ),
    ];
    const result = qualityGateService.checkGate(5);
    expect(result.canOverride).toBe(false);
  });
});

// ─── Override flag handling ──────────────────────────────────────────────────

describe("QualityGate — override behavior", () => {
  beforeEach(() => {
    mockDocuments = [];
  });

  it("canOverride is true when only warnings exist (no fails)", () => {
    // Gate 1 with partial sections = warn only
    const partialContent = `# Grant Intelligence
## Grant Program Overview
Some overview.
## Eligibility Requirements
Some requirements.
`;
    mockDocuments = [makeDoc("Grant_Intelligence.md", partialContent)];
    const result = qualityGateService.checkGate(1);
    expect(result.canOverride).toBe(true);
    expect(result.passed).toBe(false);
  });

  it("canOverride is false when fails exist", () => {
    // No document = fail
    const result = qualityGateService.checkGate(1);
    expect(result.canOverride).toBe(false);
  });

  it("returns a timestamp on every result", () => {
    const result = qualityGateService.checkGate(1);
    expect(result.timestamp).toBeDefined();
    expect(new Date(result.timestamp).getTime()).not.toBeNaN();
  });

  it("returns passed=true for a phase with no checker", () => {
    // Phase 6 and 7 have no gate checkers
    const result = qualityGateService.checkGate(6);
    expect(result.passed).toBe(true);
    expect(result.checks).toHaveLength(0);
  });
});
