import { describe, it, expect } from "vitest";
import JSZip from "jszip";
import {
  buildBundleReadme,
  buildBundleZip,
  groupDocumentsByPhase,
} from "@/lib/external-drafting/bundle";
import type { Document, Project } from "@/lib/types";

function makeDoc(overrides: Partial<Document> = {}): Document {
  return {
    id: `doc-${Math.random().toString(36).slice(2, 8)}`,
    projectId: "proj-1",
    phase: 1,
    name: overrides.canonicalName ?? "Doc.md",
    canonicalName: overrides.canonicalName ?? "Doc.md",
    content: "# Doc",
    format: "md",
    version: 1,
    isCurrent: true,
    wordCount: 2,
    createdAt: "2026-05-13T00:00:00.000Z",
    ...overrides,
  };
}

function makeProject(overrides: Partial<Project> = {}): Project {
  return {
    id: "proj-1",
    title: "Genome Editing Initiative",
    discipline: "Bioengineering",
    country: "Malaysia",
    careerStage: "Early Career",
    grantScheme: "FRGS",
    currentPhase: 5,
    currentStep: 1,
    status: "active",
    metadata: {},
    createdAt: "2026-05-13T00:00:00.000Z",
    updatedAt: "2026-05-13T00:00:00.000Z",
    ...overrides,
  };
}

describe("groupDocumentsByPhase", () => {
  it("filters out non-current docs", () => {
    const docs = [
      makeDoc({ phase: 1, canonicalName: "Current.md", isCurrent: true }),
      makeDoc({ phase: 1, canonicalName: "Old.md", isCurrent: false }),
    ];
    const grouped = groupDocumentsByPhase(docs);
    expect(grouped[1]).toHaveLength(1);
    expect(grouped[1][0].canonicalName).toBe("Current.md");
  });

  it("keeps phases 1-5 and discards 6-7", () => {
    const docs = [
      makeDoc({ phase: 1, canonicalName: "P1.md" }),
      makeDoc({ phase: 5, canonicalName: "P5.md" }),
      makeDoc({ phase: 6, canonicalName: "P6.md" }),
      makeDoc({ phase: 7, canonicalName: "P7.md" }),
    ];
    const grouped = groupDocumentsByPhase(docs);
    expect(grouped[1]).toBeDefined();
    expect(grouped[5]).toBeDefined();
    expect(grouped[6]).toBeUndefined();
    expect(grouped[7]).toBeUndefined();
  });

  it("sorts each phase by canonicalName for stable bundle output", () => {
    const docs = [
      makeDoc({ phase: 3, canonicalName: "Zebra.md" }),
      makeDoc({ phase: 3, canonicalName: "Alpha.md" }),
      makeDoc({ phase: 3, canonicalName: "Mango.md" }),
    ];
    const grouped = groupDocumentsByPhase(docs);
    expect(grouped[3].map((d) => d.canonicalName)).toEqual([
      "Alpha.md",
      "Mango.md",
      "Zebra.md",
    ]);
  });
});

describe("buildBundleReadme", () => {
  it("includes project metadata when project is supplied", () => {
    const project = makeProject({ targetFunder: "Ministry of Higher Education" });
    const readme = buildBundleReadme(
      project,
      { 1: [makeDoc({ phase: 1, canonicalName: "Grant_Intelligence.md" })] },
      new Date("2026-05-13T12:00:00Z"),
    );
    expect(readme).toContain("# Grant Suite Project Bundle");
    expect(readme).toContain("Title: Genome Editing Initiative");
    expect(readme).toContain("Discipline: Bioengineering");
    expect(readme).toContain("Country: Malaysia");
    expect(readme).toContain("Grant scheme: FRGS");
    expect(readme).toContain("Target funder: Ministry of Higher Education");
    expect(readme).toContain("Grant_Intelligence.md");
  });

  it("emits a friendly message when no documents are bundled", () => {
    const readme = buildBundleReadme(null, {}, new Date("2026-05-13T12:00:00Z"));
    expect(readme).toContain("No documents bundled");
  });
});

describe("buildBundleZip", () => {
  it("creates a zip with README.md and per-phase folders containing markdown", async () => {
    const project = makeProject();
    const docs = [
      makeDoc({ phase: 1, canonicalName: "Grant_Intelligence.md", content: "# GI" }),
      makeDoc({ phase: 4, canonicalName: "Budget_Justification.md", content: "# BJ" }),
      makeDoc({ phase: 6, canonicalName: "Should_Be_Excluded.md", content: "# X" }),
    ];

    const { blob, summary } = await buildBundleZip(
      project,
      docs,
      new Date("2026-05-13T10:00:00Z"),
    );
    expect(summary.documentCount).toBe(2);
    expect(summary.phases).toEqual([1, 4]);
    expect(summary.filename).toBe("genome-editing-initiative_bundle_20260513.zip");

    const reopened = await JSZip.loadAsync(blob);
    const filenames = Object.keys(reopened.files);
    expect(filenames).toContain("README.md");
    expect(filenames.some((f) => f.includes("Phase_1_") && f.endsWith("Grant_Intelligence.md"))).toBe(
      true,
    );
    expect(filenames.some((f) => f.includes("Phase_4_") && f.endsWith("Budget_Justification.md"))).toBe(
      true,
    );
    expect(filenames.some((f) => f.includes("Should_Be_Excluded.md"))).toBe(false);

    const readmeText = await reopened.file("README.md")?.async("string");
    expect(readmeText).toContain("Grant_Intelligence.md");
  });

  it("still produces a valid zip when there are zero documents", async () => {
    const project = makeProject({ title: "Empty Project" });
    const { blob, summary } = await buildBundleZip(
      project,
      [],
      new Date("2026-05-13T10:00:00Z"),
    );
    expect(summary.documentCount).toBe(0);
    expect(summary.filename).toBe("empty-project_bundle_20260513.zip");
    const reopened = await JSZip.loadAsync(blob);
    const readmeText = await reopened.file("README.md")?.async("string");
    expect(readmeText).toContain("No documents bundled");
  });
});
