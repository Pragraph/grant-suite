import { describe, it, expect, beforeEach, vi } from "vitest";
import { DOCUMENT_DEPENDENCIES } from "@/lib/constants";
import type { Document } from "@/lib/types";

// ─── Mock the Zustand document store ─────────────────────────────────────────

let mockDocuments: Document[] = [];

vi.mock("@/stores/document-store", () => ({
  useDocumentStore: {
    getState: () => ({ documents: mockDocuments }),
  },
}));

// Import after mock is set up
import { documentPipeline } from "@/lib/document-pipeline";

// ─── Helpers ─────────────────────────────────────────────────────────────────

function makeDoc(canonicalName: string, phase = 1): Document {
  return {
    id: `doc-${canonicalName}`,
    projectId: "proj-1",
    phase,
    step: 1,
    name: canonicalName.replace(/_/g, " ").replace(".md", ""),
    canonicalName,
    content: `# ${canonicalName}\nContent for ${canonicalName}`,
    format: "md",
    version: 1,
    isCurrent: true,
    wordCount: 100,
    createdAt: new Date().toISOString(),
  };
}

// ─── Tests ───────────────────────────────────────────────────────────────────

describe("DocumentPipeline — getRequiredDocuments", () => {
  beforeEach(() => {
    mockDocuments = [];
  });

  it("returns correct list for Phase 1 Step 3 (no dependencies)", () => {
    const result = documentPipeline.getRequiredDocuments("proj-1", 1, 3);
    // Phase 1 Step 3 produces Grant_Intelligence.md with no requires/optional
    const entry = DOCUMENT_DEPENDENCIES.find(
      (d) => d.phase === 1 && d.step === 3,
    );
    expect(entry).toBeDefined();
    expect(result).toHaveLength(0); // no required or optional inputs
  });

  it("returns correct list for Phase 2 Step 5", () => {
    const result = documentPipeline.getRequiredDocuments("proj-1", 2, 5);
    // Phase 2 Step 5 requires Grant_Intelligence.md
    // and optionally: Requirements_Analysis, Competitive_Analysis, Evaluator_Psychology, Impact_Framework
    expect(result.some((r) => r.canonicalName === "Grant_Intelligence.md" && r.required)).toBe(true);
    expect(result.some((r) => r.canonicalName === "Requirements_Analysis.md" && !r.required)).toBe(true);
    expect(result.some((r) => r.canonicalName === "Competitive_Analysis.md" && !r.required)).toBe(true);
    expect(result.some((r) => r.canonicalName === "Evaluator_Psychology.md" && !r.required)).toBe(true);
    expect(result.some((r) => r.canonicalName === "Impact_Framework.md" && !r.required)).toBe(true);
  });

  it("returns correct list for Phase 5 Step 1", () => {
    const result = documentPipeline.getRequiredDocuments("proj-1", 5, 1);
    // Phase 5 Step 1 requires: Grant_Intelligence, Proposal_Blueprint, Research_Design, Budget_Team_Plan
    const requiredNames = result
      .filter((r) => r.required)
      .map((r) => r.canonicalName);
    expect(requiredNames).toContain("Grant_Intelligence.md");
    expect(requiredNames).toContain("Proposal_Blueprint.md");
    expect(requiredNames).toContain("Research_Design.md");
    expect(requiredNames).toContain("Budget_Team_Plan.md");

    // Optional: Partnership_Plan, Patent_Analysis, SDG_Alignment, National_Alignment, KPI_Plan
    const optionalNames = result
      .filter((r) => !r.required)
      .map((r) => r.canonicalName);
    expect(optionalNames).toContain("Partnership_Plan.md");
    expect(optionalNames).toContain("KPI_Plan.md");
  });

  it("marks documents as present when they exist in the store", () => {
    mockDocuments = [makeDoc("Grant_Intelligence.md")];
    const result = documentPipeline.getRequiredDocuments("proj-1", 2, 5);
    const gi = result.find((r) => r.canonicalName === "Grant_Intelligence.md");
    expect(gi?.present).toBe(true);
  });

  it("marks documents as not present when missing from the store", () => {
    mockDocuments = [];
    const result = documentPipeline.getRequiredDocuments("proj-1", 2, 5);
    const gi = result.find((r) => r.canonicalName === "Grant_Intelligence.md");
    expect(gi?.present).toBe(false);
  });
});

describe("DocumentPipeline — validateReadiness", () => {
  beforeEach(() => {
    mockDocuments = [];
  });

  it("fails when required docs are missing", () => {
    const result = documentPipeline.validateReadiness("proj-1", 2, 5);
    expect(result.ready).toBe(false);
    expect(result.missing).toContain("Grant_Intelligence.md");
  });

  it("passes when all required docs are present", () => {
    mockDocuments = [makeDoc("Grant_Intelligence.md")];
    const result = documentPipeline.validateReadiness("proj-1", 2, 5);
    expect(result.ready).toBe(true);
    expect(result.missing).toHaveLength(0);
  });

  it("optional documents don't block readiness", () => {
    mockDocuments = [makeDoc("Grant_Intelligence.md")];
    const result = documentPipeline.validateReadiness("proj-1", 2, 5);
    expect(result.ready).toBe(true);
    // But optionalMissing should list them
    expect(result.optionalMissing.length).toBeGreaterThan(0);
    expect(result.optionalMissing).toContain("Requirements_Analysis.md");
  });

  it("returns ready for a step with no dependencies", () => {
    const result = documentPipeline.validateReadiness("proj-1", 1, 3);
    expect(result.ready).toBe(true);
    expect(result.missing).toHaveLength(0);
  });
});

describe("DocumentPipeline — markDownstreamStale", () => {
  it("propagates stale from Grant_Intelligence.md to downstream docs", () => {
    const stale = documentPipeline.markDownstreamStale(
      "proj-1",
      "Grant_Intelligence.md",
    );
    // Grant_Intelligence feeds into many Phase 2+ documents
    expect(stale).toContain("Requirements_Analysis.md");
    expect(stale).toContain("Proposal_Blueprint.md");
    // Should propagate transitively
    expect(stale).toContain("Research_Design.md");
    expect(stale).toContain("Complete_Proposal.md");
  });

  it("propagates stale from Proposal_Blueprint.md correctly", () => {
    const stale = documentPipeline.markDownstreamStale(
      "proj-1",
      "Proposal_Blueprint.md",
    );
    expect(stale).toContain("Research_Design.md");
    // Should NOT include upstream docs
    expect(stale).not.toContain("Grant_Intelligence.md");
  });

  it("marks form-ready proposal stale when the final proposal changes", () => {
    const stale = documentPipeline.markDownstreamStale(
      "proj-1",
      "Final_Proposal.md",
    );
    expect(stale).toEqual(["Form_Ready_Proposal.md"]);
  });
});

describe("DocumentPipeline — getDocumentGraph", () => {
  beforeEach(() => {
    mockDocuments = [];
  });

  it("returns correct structure with all dependency entries", () => {
    const graph = documentPipeline.getDocumentGraph("proj-1");
    expect(graph).toHaveLength(DOCUMENT_DEPENDENCIES.length);
    expect(graph[0]).toHaveProperty("name");
    expect(graph[0]).toHaveProperty("phase");
    expect(graph[0]).toHaveProperty("present");
    expect(graph[0]).toHaveProperty("stale");
    expect(graph[0]).toHaveProperty("dependsOn");
  });

  it("marks present documents correctly", () => {
    mockDocuments = [makeDoc("Grant_Intelligence.md")];
    const graph = documentPipeline.getDocumentGraph("proj-1");
    const gi = graph.find((n) => n.name === "Grant_Intelligence.md");
    expect(gi?.present).toBe(true);

    const blueprint = graph.find((n) => n.name === "Proposal_Blueprint.md");
    expect(blueprint?.present).toBe(false);
  });

  it("marks stale documents when stale set is provided", () => {
    const staleSet = new Set(["Proposal_Blueprint.md"]);
    const graph = documentPipeline.getDocumentGraph("proj-1", staleSet);
    const blueprint = graph.find((n) => n.name === "Proposal_Blueprint.md");
    expect(blueprint?.stale).toBe(true);

    const gi = graph.find((n) => n.name === "Grant_Intelligence.md");
    expect(gi?.stale).toBe(false);
  });
});
