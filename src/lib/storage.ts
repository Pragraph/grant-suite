import { get, set, del, keys, clear } from "idb-keyval";
import { nanoid } from "nanoid";
import type {
  Project,
  Document,
  PhaseProgress,
  AppSettings,
  StepStatus,
} from "./types";
import { STORAGE_KEYS } from "./types";

// ─── Helpers ────────────────────────────────────────────────────────────────

function readJSON<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function writeJSON(key: string, value: unknown): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(key, JSON.stringify(value));
}

// ─── Default settings ───────────────────────────────────────────────────────

const DEFAULT_SETTINGS: AppSettings = {
  theme: "dark",
  sidebarCollapsed: false,
  defaultExportFormat: "md",
};

// ─── Storage Service ────────────────────────────────────────────────────────

export const storage = {
  // ── Projects (localStorage — small metadata) ───────────────────────────

  getProjects(): Project[] {
    return readJSON<Project[]>(STORAGE_KEYS.PROJECTS, []);
  },

  getProject(id: string): Project | null {
    return this.getProjects().find((p) => p.id === id) ?? null;
  },

  saveProject(project: Project): void {
    const projects = this.getProjects();
    const idx = projects.findIndex((p) => p.id === project.id);
    if (idx >= 0) {
      projects[idx] = { ...project, updatedAt: new Date().toISOString() };
    } else {
      projects.push(project);
    }
    writeJSON(STORAGE_KEYS.PROJECTS, projects);
  },

  deleteProject(id: string): void {
    const projects = this.getProjects().filter((p) => p.id !== id);
    writeJSON(STORAGE_KEYS.PROJECTS, projects);
    // Clean up related data
    localStorage.removeItem(STORAGE_KEYS.PROGRESS_PREFIX + id);
    // Clean up IndexedDB documents
    this._deleteProjectDocuments(id);
  },

  // ── Documents (IndexedDB — large content) ─────────────────────────────

  async getDocuments(projectId: string): Promise<Document[]> {
    const allKeys = await keys();
    const prefix = `${STORAGE_KEYS.DOCUMENTS_PREFIX}${projectId}/`;
    const docKeys = allKeys.filter(
      (k) => typeof k === "string" && k.startsWith(prefix)
    );
    const docs: Document[] = [];
    for (const key of docKeys) {
      const doc = await get<Document>(key as string);
      if (doc) docs.push(doc);
    }
    return docs;
  },

  async getDocument(
    projectId: string,
    canonicalName: string
  ): Promise<Document | null> {
    const docs = await this.getDocuments(projectId);
    return (
      docs.find((d) => d.canonicalName === canonicalName && d.isCurrent) ?? null
    );
  },

  async saveDocument(projectId: string, doc: Document): Promise<void> {
    const key = `${STORAGE_KEYS.DOCUMENTS_PREFIX}${projectId}/${doc.id}`;
    await set(key, doc);
  },

  async getDocumentHistory(
    projectId: string,
    canonicalName: string
  ): Promise<Document[]> {
    const docs = await this.getDocuments(projectId);
    return docs
      .filter((d) => d.canonicalName === canonicalName)
      .sort((a, b) => b.version - a.version);
  },

  async _deleteProjectDocuments(projectId: string): Promise<void> {
    const allKeys = await keys();
    const prefix = `${STORAGE_KEYS.DOCUMENTS_PREFIX}${projectId}/`;
    for (const key of allKeys) {
      if (typeof key === "string" && key.startsWith(prefix)) {
        await del(key);
      }
    }
  },

  // ── Phase Progress (localStorage) ─────────────────────────────────────

  getProgress(projectId: string): PhaseProgress {
    return readJSON<PhaseProgress>(
      STORAGE_KEYS.PROGRESS_PREFIX + projectId,
      { phases: {} }
    );
  },

  updateProgress(
    projectId: string,
    phase: number,
    step: number,
    status: StepStatus
  ): void {
    const progress = this.getProgress(projectId);
    if (!progress.phases[phase]) {
      progress.phases[phase] = { steps: {}, gateStatus: "not-checked" };
    }
    progress.phases[phase].steps[step] = status;
    writeJSON(STORAGE_KEYS.PROGRESS_PREFIX + projectId, progress);
  },

  // ── Settings (localStorage) ───────────────────────────────────────────

  getSettings(): AppSettings {
    return readJSON<AppSettings>(STORAGE_KEYS.SETTINGS, DEFAULT_SETTINGS);
  },

  saveSettings(settings: AppSettings): void {
    writeJSON(STORAGE_KEYS.SETTINGS, settings);
  },

  // ── Import / Export ───────────────────────────────────────────────────

  async exportAllData(): Promise<string> {
    const projects = this.getProjects();
    const settings = this.getSettings();

    const allProgress: Record<string, PhaseProgress> = {};
    const allDocuments: Record<string, Document[]> = {};

    for (const project of projects) {
      allProgress[project.id] = this.getProgress(project.id);
      allDocuments[project.id] = await this.getDocuments(project.id);
    }

    return JSON.stringify(
      { version: 1, exportedAt: new Date().toISOString(), projects, settings, progress: allProgress, documents: allDocuments },
      null,
      2
    );
  },

  async importData(json: string): Promise<void> {
    const data = JSON.parse(json) as {
      projects: Project[];
      settings: AppSettings;
      progress: Record<string, PhaseProgress>;
      documents: Record<string, Document[]>;
    };

    writeJSON(STORAGE_KEYS.PROJECTS, data.projects);
    writeJSON(STORAGE_KEYS.SETTINGS, data.settings);

    for (const [projectId, progress] of Object.entries(data.progress)) {
      writeJSON(STORAGE_KEYS.PROGRESS_PREFIX + projectId, progress);
    }

    for (const [projectId, docs] of Object.entries(data.documents)) {
      for (const doc of docs) {
        await this.saveDocument(projectId, doc);
      }
    }
  },

  clearAllData(): void {
    const keysToRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith("grant-suite-")) {
        keysToRemove.push(key);
      }
    }
    keysToRemove.forEach((k) => localStorage.removeItem(k));
    clear(); // clear IndexedDB
  },

  // ── Utilities ─────────────────────────────────────────────────────────

  createId(): string {
    return nanoid();
  },
};
