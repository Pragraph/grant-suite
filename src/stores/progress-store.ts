import { create } from "zustand";
import { storage } from "@/lib/storage";
import type { PhaseProgress, StepStatus, GateStatus } from "@/lib/types";
import { PHASES } from "@/lib/types";
import type { GateResult } from "@/lib/quality-gate";

interface ProgressState {
  progress: PhaseProgress;
  gateResults: Record<number, GateResult>;

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
  recordGateResult: (
    projectId: string,
    phase: number,
    result: GateResult
  ) => void;
  getGateResult: (phase: number) => GateResult | undefined;
  getPhaseCompletion: (phase: number) => number;
  canAccessPhase: (phase: number) => boolean;
  bypassPhases: (projectId: string, phases: number[]) => void;
  clearProgress: () => void;
}

export const useProgressStore = create<ProgressState>()((set, get) => ({
  progress: { phases: {} },
  gateResults: {},

  loadProgress: (projectId) => {
    const progress = storage.getProgress(projectId);
    // Load persisted gate results
    const gateResultsRaw = localStorage.getItem(
      `grant-suite-gate-results-${projectId}`
    );
    const gateResults = gateResultsRaw
      ? (JSON.parse(gateResultsRaw) as Record<number, GateResult>)
      : {};
    set({ progress, gateResults });
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

    // Check if this phase was the starting phase or earlier phases were bypassed
    const prevPhase = progress.phases[phase - 1];

    // Allow access if previous phase gate passed/overridden (existing behavior)
    if (prevPhase?.gateStatus === "passed" || prevPhase?.gateStatus === "overridden") {
      return true;
    }

    // Allow access if previous phase was bypassed
    if (prevPhase?.gateStatus === "bypassed") {
      return true;
    }

    // Allow access if any step in the CURRENT phase has progress
    const currentPhaseProgress = progress.phases[phase];
    if (currentPhaseProgress) {
      const hasAnyProgress = Object.values(currentPhaseProgress.steps).some(
        (s) => s !== "not-started"
      );
      if (hasAnyProgress) return true;
    }

    return false;
  },

  recordGateResult: (projectId, phase, result) => {
    const gateResults = { ...get().gateResults, [phase]: result };
    localStorage.setItem(
      `grant-suite-gate-results-${projectId}`,
      JSON.stringify(gateResults)
    );
    set({ gateResults });
  },

  getGateResult: (phase) => {
    return get().gateResults[phase];
  },

  bypassPhases: (projectId, phases) => {
    const progress = { ...get().progress, phases: { ...get().progress.phases } };
    for (const phase of phases) {
      if (!progress.phases[phase]) {
        progress.phases[phase] = { steps: {}, gateStatus: "bypassed" };
      } else {
        progress.phases[phase] = { ...progress.phases[phase], gateStatus: "bypassed" };
      }
    }
    const key = `grant-suite-progress-${projectId}`;
    localStorage.setItem(key, JSON.stringify(progress));
    set({ progress });
  },

  clearProgress: () => {
    set({ progress: { phases: {} }, gateResults: {} });
  },
}));
