import { create } from "zustand";
import { persist } from "zustand/middleware";
import { storage } from "@/lib/storage";
import type { Project } from "@/lib/types";

interface ProjectState {
  projects: Project[];
  activeProjectId: string | null;

  // Derived
  activeProject: Project | null;

  // Actions
  loadProjects: () => void;
  createProject: (
    data: Omit<Project, "id" | "createdAt" | "updatedAt" | "currentPhase" | "currentStep" | "status" | "metadata">
  ) => Project;
  updateProject: (id: string, updates: Partial<Project>) => void;
  deleteProject: (id: string) => void;
  setActiveProject: (id: string | null) => void;
}

export const useProjectStore = create<ProjectState>()(
  persist(
    (set, get) => ({
      projects: [],
      activeProjectId: null,
      activeProject: null,

      loadProjects: () => {
        const projects = storage.getProjects();
        const activeId = get().activeProjectId;
        set({
          projects,
          activeProject: projects.find((p) => p.id === activeId) ?? null,
        });
      },

      createProject: (data) => {
        const now = new Date().toISOString();
        const project: Project = {
          id: storage.createId(),
          ...data,
          currentPhase: 1,
          currentStep: 1,
          status: "active",
          metadata: {},
          createdAt: now,
          updatedAt: now,
        };
        storage.saveProject(project);
        const projects = storage.getProjects();
        set({ projects });
        return project;
      },

      updateProject: (id, updates) => {
        const project = storage.getProject(id);
        if (!project) return;
        const updated = { ...project, ...updates, updatedAt: new Date().toISOString() };
        storage.saveProject(updated);
        const projects = storage.getProjects();
        const activeId = get().activeProjectId;
        set({
          projects,
          activeProject: activeId === id ? updated : get().activeProject,
        });
      },

      deleteProject: (id) => {
        storage.deleteProject(id);
        const projects = storage.getProjects();
        const activeId = get().activeProjectId;
        set({
          projects,
          activeProjectId: activeId === id ? null : activeId,
          activeProject: activeId === id ? null : get().activeProject,
        });
      },

      setActiveProject: (id) => {
        const project = id ? storage.getProject(id) : null;
        set({ activeProjectId: id, activeProject: project });
      },
    }),
    {
      name: "grant-suite-project-store",
      partialize: (state) => ({
        activeProjectId: state.activeProjectId,
      }),
    }
  )
);
