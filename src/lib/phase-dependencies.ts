import type { PhaseProgress } from "@/lib/types";
import { PHASE_DEFINITIONS } from "@/lib/constants";

export interface DownstreamProgress {
  hasProgress: boolean;
  blockingPhases: {
    phase: number;
    name: string;
    completedSteps: number;
    totalSteps: number;
  }[];
}

/**
 * Check if any phase strictly downstream of `phase` has any step with
 * progress (status !== "not-started" and !== "not-applicable"). Used to
 * refuse phase reset and step reset (when in SAVED state) if downstream
 * work would be invalidated.
 */
export function getDownstreamProgress(
  progress: PhaseProgress,
  phase: number,
): DownstreamProgress {
  const blockingPhases: DownstreamProgress["blockingPhases"] = [];

  for (const phaseDef of PHASE_DEFINITIONS) {
    if (phaseDef.phase <= phase) continue;

    const phaseProgress = progress.phases[phaseDef.phase];
    if (!phaseProgress) continue;

    const stepEntries = Object.entries(phaseProgress.steps);
    const activeSteps = stepEntries.filter(
      ([, status]) => status !== "not-started" && status !== "not-applicable",
    );

    if (activeSteps.length > 0) {
      const completedSteps = stepEntries.filter(
        ([, status]) => status === "complete",
      ).length;
      blockingPhases.push({
        phase: phaseDef.phase,
        name: phaseDef.name,
        completedSteps,
        totalSteps: phaseDef.steps.length,
      });
    }
  }

  return {
    hasProgress: blockingPhases.length > 0,
    blockingPhases,
  };
}

/**
 * Check if any LATER step in the same phase OR any downstream phase has
 * progress. Used by per-step reset (in SAVED state) to refuse mid-phase
 * resets that would invalidate later work.
 */
export function getLaterStepProgress(
  progress: PhaseProgress,
  phase: number,
  step: number,
): {
  hasProgress: boolean;
  blockingSteps: { phase: number; step: number; name: string }[];
  downstream: DownstreamProgress;
} {
  const blockingSteps: { phase: number; step: number; name: string }[] = [];
  const phaseDef = PHASE_DEFINITIONS.find((p) => p.phase === phase);

  if (phaseDef) {
    const phaseProgress = progress.phases[phase];
    if (phaseProgress) {
      for (const stepDef of phaseDef.steps) {
        if (stepDef.step <= step) continue;
        const status = phaseProgress.steps[stepDef.step];
        if (status && status !== "not-started" && status !== "not-applicable") {
          blockingSteps.push({
            phase,
            step: stepDef.step,
            name: stepDef.name,
          });
        }
      }
    }
  }

  const downstream = getDownstreamProgress(progress, phase);

  return {
    hasProgress: blockingSteps.length > 0 || downstream.hasProgress,
    blockingSteps,
    downstream,
  };
}
