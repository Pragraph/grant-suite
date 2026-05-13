import { describe, it, expect } from "vitest";

import {
  computeExtractionStatus,
  initialWorkspaceState,
  reconcileWithSchema,
  type Phase50WorkspaceState,
  type SectionStatus,
} from "@/lib/form-schema";

import { SKELETON_THREE_SECTION } from "./fixtures/skeleton-three-section";

describe("initialWorkspaceState", () => {
  it("returns skeleton-only status when every section is not-extracted", () => {
    const state = initialWorkspaceState("proj-1", SKELETON_THREE_SECTION);
    expect(state.extractionStatus).toBe("skeleton-only");
    expect(Object.keys(state.sectionStatuses)).toEqual(["A", "B", "C"]);
    for (const status of Object.values(state.sectionStatuses)) {
      expect(status).toBe("not-extracted");
    }
  });
});

describe("computeExtractionStatus", () => {
  it("returns no-schema when schema is null", () => {
    expect(computeExtractionStatus(null, {}, false)).toBe("no-schema");
  });

  it("returns skeleton-only when no section is touched", () => {
    const statuses: Record<string, SectionStatus> = {
      A: "not-extracted",
      B: "not-extracted",
      C: "not-extracted",
    };
    expect(computeExtractionStatus(SKELETON_THREE_SECTION, statuses, false)).toBe(
      "skeleton-only",
    );
  });

  it("returns partial when some sections are touched but not all", () => {
    const statuses: Record<string, SectionStatus> = {
      A: "extracted",
      B: "not-extracted",
      C: "not-extracted",
    };
    expect(computeExtractionStatus(SKELETON_THREE_SECTION, statuses, false)).toBe(
      "partial",
    );
  });

  it("returns fields-complete when every section is extracted/manual/skipped and no Pass 3 output", () => {
    const statuses: Record<string, SectionStatus> = {
      A: "extracted",
      B: "manual",
      C: "skipped",
    };
    expect(computeExtractionStatus(SKELETON_THREE_SECTION, statuses, false)).toBe(
      "fields-complete",
    );
  });

  it("returns relationships-extracted when Pass 3 has produced output", () => {
    const statuses: Record<string, SectionStatus> = {
      A: "extracted",
      B: "extracted",
      C: "skipped",
    };
    expect(computeExtractionStatus(SKELETON_THREE_SECTION, statuses, true)).toBe(
      "relationships-extracted",
    );
  });
});

describe("reconcileWithSchema", () => {
  it("drops section IDs that are no longer in the schema", () => {
    const state: Phase50WorkspaceState = {
      projectId: "proj-1",
      extractionStatus: "partial",
      sectionStatuses: {
        A: "extracted",
        B: "not-extracted",
        C: "not-extracted",
        OLD: "skipped",
      },
      lastUpdatedAt: "2026-05-13T00:00:00Z",
    };
    const next = reconcileWithSchema(state, SKELETON_THREE_SECTION);
    expect(Object.keys(next.sectionStatuses).sort()).toEqual(["A", "B", "C"]);
    expect(next.sectionStatuses.A).toBe("extracted");
  });

  it("preserves existing statuses for sections still in the schema", () => {
    const state: Phase50WorkspaceState = {
      projectId: "proj-1",
      extractionStatus: "partial",
      sectionStatuses: {
        A: "extracted",
        B: "manual",
      },
      lastUpdatedAt: "2026-05-13T00:00:00Z",
    };
    const next = reconcileWithSchema(state, SKELETON_THREE_SECTION);
    expect(next.sectionStatuses.A).toBe("extracted");
    expect(next.sectionStatuses.B).toBe("manual");
    expect(next.sectionStatuses.C).toBe("not-extracted");
  });
});
