import { create } from "zustand";
import { storage } from "@/lib/storage";
import type { PhaseProgress, StepStatus, GateStatus } from "@/lib/types";
import { PHASES } from "@/lib/types";

interface ProgressState {
  progress: PhaseProgress;

  // Actions
  loadProgress: (projectId: string) => void;
  updateStepStatus: (
    projectId: string,
    phase: number,
    step: number,
    status: StepStatus
  ) => void;
  updateGateStatus: (
    projectId: string,
    phase: number,
    status: GateStatus
  ) => void;
  getPhaseCompletion: (phase: number) => number;
  canAccessPhase: (phase: number) => boolean;
  clearProgress: () => void;
}

export const useProgressStore = create<ProgressState>()((set, get) => ({
  progress: { phases: {} },

  loadProgress: (projectId) => {
    const progress = storage.getProgress(projectId);
    set({ progress });
  },

  updateStepStatus: (projectId, phase, step, status) => {
    storage.updateProgress(projectId, phase, step, status);
    const progress = storage.getProgress(projectId);
    set({ progress });
  },

  updateGateStatus: (projectId, phase, status) => {
    const progress = get().progress;
    if (!progress.phases[phase]) {
      progress.phases[phase] = { steps: {}, gateStatus: status };
    } else {
      progress.phases[phase].gateStatus = status;
    }
    const key = `grant-suite-progress-${projectId}`;
    localStorage.setItem(key, JSON.stringify(progress));
    set({ progress: { ...progress } });
  },

  getPhaseCompletion: (phase) => {
    const { progress } = get();
    const phaseInfo = PHASES.find((p) => p.id === phase);
    if (!phaseInfo) return 0;

    const phaseProgress = progress.phases[phase];
    if (!phaseProgress) return 0;

    const completedSteps = Object.values(phaseProgress.steps).filter(
      (s) => s === "complete"
    ).length;

    return Math.round((completedSteps / phaseInfo.stepCount) * 100);
  },

  canAccessPhase: (phase) => {
    if (phase === 1) return true;
    const { progress } = get();
    const prevPhase = progress.phases[phase - 1];
    if (!prevPhase) return false;
    // Allow access if previous phase gate is passed or overridden
    return (
      prevPhase.gateStatus === "passed" ||
      prevPhase.gateStatus === "overridden"
    );
  },

  clearProgress: () => {
    set({ progress: { phases: {} } });
  },
}));
