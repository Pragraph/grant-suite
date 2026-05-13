import { describe, it, expect, beforeEach } from "vitest";
import {
  getProjectOutputLanguage,
  setProjectOutputLanguage,
} from "@/lib/external-drafting/language-preference";
import { buildExternalDraftingPrompt } from "@/lib/external-drafting/prompt";
import { storage } from "@/lib/storage";
import type { Project } from "@/lib/types";

function makeProject(overrides: Partial<Project> = {}): Project {
  return {
    id: "proj-lang-test",
    title: "Language test project",
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

describe("getProjectOutputLanguage / setProjectOutputLanguage", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("returns English when no project exists", () => {
    expect(getProjectOutputLanguage("nonexistent")).toBe("English");
  });

  it("returns English when project has no outputLanguage in metadata", () => {
    const project = makeProject();
    storage.saveProject(project);
    expect(getProjectOutputLanguage(project.id)).toBe("English");
  });

  it("persists and reads back a supported language", () => {
    const project = makeProject();
    storage.saveProject(project);
    setProjectOutputLanguage(project.id, "Bahasa Malaysia");
    expect(getProjectOutputLanguage(project.id)).toBe("Bahasa Malaysia");
  });

  it("falls back to English when stored value is not in the supported list", () => {
    const project = makeProject({
      metadata: { outputLanguage: "Klingon" },
    });
    storage.saveProject(project);
    expect(getProjectOutputLanguage(project.id)).toBe("English");
  });

  it("preserves other metadata fields when updating language", () => {
    const project = makeProject({
      metadata: { someOtherKey: "preserved" },
    });
    storage.saveProject(project);
    setProjectOutputLanguage(project.id, "Japanese");
    const reloaded = storage.getProject(project.id);
    expect(reloaded?.metadata.someOtherKey).toBe("preserved");
    expect(reloaded?.metadata.outputLanguage).toBe("Japanese");
  });
});

describe("language selection flows through to the prompt", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("changing the project language produces a prompt with the new language substituted", () => {
    const project = makeProject();
    storage.saveProject(project);
    setProjectOutputLanguage(project.id, "French");
    const language = getProjectOutputLanguage(project.id);
    const prompt = buildExternalDraftingPrompt(language);
    expect(prompt).not.toContain("{{OUTPUT_LANGUAGE}}");
    expect(prompt).toContain("Write all output in French");
    expect(prompt).toContain("output_language: French");
  });
});
