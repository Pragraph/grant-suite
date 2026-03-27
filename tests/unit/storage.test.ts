import { describe, it, expect, beforeEach, vi } from "vitest";
import type { Project, AppSettings, Document } from "@/lib/types";
import { STORAGE_KEYS } from "@/lib/types";

// ─── Mock idb-keyval ─────────────────────────────────────────────────────────

const idbStore = new Map<string, unknown>();

vi.mock("idb-keyval", () => ({
  get: vi.fn((key: string) => Promise.resolve(idbStore.get(key))),
  set: vi.fn((key: string, value: unknown) => {
    idbStore.set(key, value);
    return Promise.resolve();
  }),
  del: vi.fn((key: string) => {
    idbStore.delete(key);
    return Promise.resolve();
  }),
  keys: vi.fn(() => Promise.resolve([...idbStore.keys()])),
  clear: vi.fn(() => {
    idbStore.clear();
    return Promise.resolve();
  }),
}));

// ─── Mock nanoid ─────────────────────────────────────────────────────────────

let idCounter = 0;
vi.mock("nanoid", () => ({
  nanoid: () => `test-id-${++idCounter}`,
}));

import { storage } from "@/lib/storage";

// ─── Helpers ─────────────────────────────────────────────────────────────────

function makeProject(overrides: Partial<Project> = {}): Project {
  return {
    id: `proj-${idCounter++}`,
    title: "Test Project",
    discipline: "Computer Science",
    country: "Netherlands",
    careerStage: "Early Career",
    currentPhase: 1,
    currentStep: 1,
    status: "active",
    metadata: {},
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...overrides,
  };
}

function makeDocument(
  projectId: string,
  canonicalName: string,
  version = 1,
  isCurrent = true,
): Document {
  return {
    id: `doc-${canonicalName}-v${version}`,
    projectId,
    phase: 1,
    step: 1,
    name: canonicalName.replace(/_/g, " ").replace(".md", ""),
    canonicalName,
    content: `Content for ${canonicalName} v${version}`,
    format: "md",
    version,
    isCurrent,
    wordCount: 5,
    createdAt: new Date().toISOString(),
  };
}

// ─── Setup ───────────────────────────────────────────────────────────────────

beforeEach(() => {
  localStorage.clear();
  idbStore.clear();
  idCounter = 0;
});

// ─── Project CRUD ────────────────────────────────────────────────────────────

describe("Storage — Project CRUD", () => {
  it("getProjects returns empty array initially", () => {
    expect(storage.getProjects()).toEqual([]);
  });

  it("saveProject creates a new project", () => {
    const project = makeProject({ id: "p1" });
    storage.saveProject(project);
    const projects = storage.getProjects();
    expect(projects).toHaveLength(1);
    expect(projects[0].id).toBe("p1");
  });

  it("saveProject updates existing project by id", () => {
    const project = makeProject({ id: "p1", title: "Original" });
    storage.saveProject(project);
    storage.saveProject({ ...project, title: "Updated" });
    const projects = storage.getProjects();
    expect(projects).toHaveLength(1);
    expect(projects[0].title).toBe("Updated");
  });

  it("saveProject sets updatedAt on update", () => {
    const project = makeProject({ id: "p1", updatedAt: "2025-01-01T00:00:00Z" });
    storage.saveProject(project);
    storage.saveProject({ ...project, title: "Changed" });
    const updated = storage.getProjects()[0];
    expect(updated.updatedAt).not.toBe("2025-01-01T00:00:00Z");
  });

  it("getProject returns project by id", () => {
    const project = makeProject({ id: "p1" });
    storage.saveProject(project);
    expect(storage.getProject("p1")?.id).toBe("p1");
    expect(storage.getProject("nonexistent")).toBeNull();
  });

  it("deleteProject removes the project", () => {
    const project = makeProject({ id: "p1" });
    storage.saveProject(project);
    storage.deleteProject("p1");
    expect(storage.getProjects()).toHaveLength(0);
  });

  it("deleteProject cleans up progress data", () => {
    const project = makeProject({ id: "p1" });
    storage.saveProject(project);
    storage.updateProgress("p1", 1, 1, "complete");
    storage.deleteProject("p1");
    const progress = storage.getProgress("p1");
    expect(progress.phases).toEqual({});
  });
});

// ─── Document Versioning ─────────────────────────────────────────────────────

describe("Storage — Document versioning", () => {
  it("saveDocument stores a document in IndexedDB", async () => {
    const doc = makeDocument("p1", "Grant_Intelligence.md");
    await storage.saveDocument("p1", doc);
    const docs = await storage.getDocuments("p1");
    expect(docs).toHaveLength(1);
    expect(docs[0].canonicalName).toBe("Grant_Intelligence.md");
  });

  it("saving a new version archives the old one", async () => {
    const v1 = makeDocument("p1", "Grant_Intelligence.md", 1, false);
    const v2 = makeDocument("p1", "Grant_Intelligence.md", 2, true);
    await storage.saveDocument("p1", v1);
    await storage.saveDocument("p1", v2);

    const docs = await storage.getDocuments("p1");
    expect(docs).toHaveLength(2);
    const current = docs.find((d) => d.isCurrent);
    expect(current?.version).toBe(2);
  });

  it("getDocument returns current version only", async () => {
    const v1 = makeDocument("p1", "Grant_Intelligence.md", 1, false);
    const v2 = makeDocument("p1", "Grant_Intelligence.md", 2, true);
    await storage.saveDocument("p1", v1);
    await storage.saveDocument("p1", v2);

    const doc = await storage.getDocument("p1", "Grant_Intelligence.md");
    expect(doc?.version).toBe(2);
    expect(doc?.isCurrent).toBe(true);
  });

  it("getDocumentHistory returns versions sorted descending", async () => {
    const v1 = makeDocument("p1", "Grant_Intelligence.md", 1, false);
    const v2 = makeDocument("p1", "Grant_Intelligence.md", 2, false);
    const v3 = makeDocument("p1", "Grant_Intelligence.md", 3, true);
    await storage.saveDocument("p1", v1);
    await storage.saveDocument("p1", v2);
    await storage.saveDocument("p1", v3);

    const history = await storage.getDocumentHistory("p1", "Grant_Intelligence.md");
    expect(history).toHaveLength(3);
    expect(history[0].version).toBe(3);
    expect(history[1].version).toBe(2);
    expect(history[2].version).toBe(1);
  });
});

// ─── Settings ────────────────────────────────────────────────────────────────

describe("Storage — Settings", () => {
  it("getSettings returns defaults when nothing saved", () => {
    const settings = storage.getSettings();
    expect(settings.theme).toBe("dark");
    expect(settings.sidebarCollapsed).toBe(false);
    expect(settings.defaultExportFormat).toBe("md");
  });

  it("saveSettings persists and retrieves settings", () => {
    const custom: AppSettings = {
      theme: "light",
      sidebarCollapsed: true,
      defaultExportFormat: "docx",
    };
    storage.saveSettings(custom);
    const result = storage.getSettings();
    expect(result.theme).toBe("light");
    expect(result.sidebarCollapsed).toBe(true);
    expect(result.defaultExportFormat).toBe("docx");
  });
});

// ─── Progress ────────────────────────────────────────────────────────────────

describe("Storage — Progress", () => {
  it("getProgress returns empty phases by default", () => {
    const progress = storage.getProgress("p1");
    expect(progress.phases).toEqual({});
  });

  it("updateProgress creates phase and step entries", () => {
    storage.updateProgress("p1", 1, 1, "in-progress");
    const progress = storage.getProgress("p1");
    expect(progress.phases[1].steps[1]).toBe("in-progress");
    expect(progress.phases[1].gateStatus).toBe("not-checked");
  });

  it("updateProgress preserves existing steps", () => {
    storage.updateProgress("p1", 1, 1, "complete");
    storage.updateProgress("p1", 1, 2, "in-progress");
    const progress = storage.getProgress("p1");
    expect(progress.phases[1].steps[1]).toBe("complete");
    expect(progress.phases[1].steps[2]).toBe("in-progress");
  });
});

// ─── Export / Import ─────────────────────────────────────────────────────────

describe("Storage — Export / Import", () => {
  it("export produces valid JSON with expected structure", async () => {
    const project = makeProject({ id: "p1" });
    storage.saveProject(project);
    storage.updateProgress("p1", 1, 1, "complete");

    const json = await storage.exportAllData();
    const data = JSON.parse(json);

    expect(data.version).toBe(1);
    expect(data.exportedAt).toBeDefined();
    expect(data.projects).toHaveLength(1);
    expect(data.projects[0].id).toBe("p1");
    expect(data.settings).toBeDefined();
    expect(data.progress).toBeDefined();
    expect(data.documents).toBeDefined();
  });

  it("import restores data correctly", async () => {
    const project = makeProject({ id: "p1" });
    storage.saveProject(project);
    const settings: AppSettings = { theme: "light", sidebarCollapsed: true, defaultExportFormat: "docx" };
    storage.saveSettings(settings);
    storage.updateProgress("p1", 1, 1, "complete");

    const doc = makeDocument("p1", "Grant_Intelligence.md");
    await storage.saveDocument("p1", doc);

    const exportedJson = await storage.exportAllData();

    // Clear everything
    localStorage.clear();
    idbStore.clear();

    // Import
    await storage.importData(exportedJson);

    // Verify restoration
    const projects = storage.getProjects();
    expect(projects).toHaveLength(1);
    expect(projects[0].id).toBe("p1");

    const restoredSettings = storage.getSettings();
    expect(restoredSettings.theme).toBe("light");

    const progress = storage.getProgress("p1");
    expect(progress.phases[1].steps[1]).toBe("complete");

    const docs = await storage.getDocuments("p1");
    expect(docs).toHaveLength(1);
    expect(docs[0].canonicalName).toBe("Grant_Intelligence.md");
  });
});

// ─── Utilities ───────────────────────────────────────────────────────────────

describe("Storage — Utilities", () => {
  it("createId returns a unique string", () => {
    const id1 = storage.createId();
    const id2 = storage.createId();
    expect(typeof id1).toBe("string");
    expect(id1.length).toBeGreaterThan(0);
    expect(id1).not.toBe(id2);
  });

  it("clearAllData removes all grant-suite keys", () => {
    storage.saveProject(makeProject({ id: "p1" }));
    storage.saveSettings({ theme: "light", sidebarCollapsed: false, defaultExportFormat: "md" });
    // Verify data exists
    expect(storage.getProjects().length).toBeGreaterThan(0);

    storage.clearAllData();
    expect(storage.getProjects()).toEqual([]);
    expect(storage.getSettings().theme).toBe("dark"); // back to default
  });
});
