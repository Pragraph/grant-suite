import type { Project, JourneyMode } from "@/lib/types";
import { JOURNEY_MODES } from "@/lib/constants";

export interface ApplicabilityRule {
  applicable: boolean;
  reason?: "bypassed-phase" | "scheme-decided";
}

/**
 * Determines whether a step is applicable to the project's configuration.
 *
 * Rules (priority order):
 * 1. Phase is in the journey mode's `bypassedPhases` → not applicable.
 * 2. Phase 1 Step 2 (Grant Matching) and `project.grantScheme` is a
 *    specific scheme (anything except "Undecided" / "Other") → not
 *    applicable.
 *
 * Default: applicable.
 *
 * Note: the spec also references "Phase 7 Step 4 — Reviewer Response
 * Letter when journey mode is not resubmit". Phase 7 currently has
 * three steps and no step 4, and non-resubmit users may legitimately
 * reach Phase 7 if their proposal is rejected. Until the schema gains
 * a dedicated step 4, this rule is intentionally omitted; revisit if
 * Phase 7 grows a step that is exclusively meaningful in a resubmit.
 */
export function getStepApplicability(
  project: Project | null | undefined,
  phase: number,
  step: number,
): ApplicabilityRule {
  if (!project) return { applicable: true };

  const journeyMode = project.journeyMode as JourneyMode | undefined;
  const journeyDef = journeyMode
    ? JOURNEY_MODES.find((j) => j.id === journeyMode)
    : undefined;

  if (journeyDef?.bypassedPhases?.includes(phase)) {
    return { applicable: false, reason: "bypassed-phase" };
  }

  if (phase === 1 && step === 2) {
    const scheme = project.grantScheme;
    if (scheme && scheme !== "Undecided" && scheme !== "Other") {
      return { applicable: false, reason: "scheme-decided" };
    }
  }

  return { applicable: true };
}

export function isStepApplicable(
  project: Project | null | undefined,
  phase: number,
  step: number,
): boolean {
  return getStepApplicability(project, phase, step).applicable;
}

export function applicableSteps<T extends { step: number }>(
  steps: T[],
  project: Project | null | undefined,
  phase: number,
): T[] {
  return steps.filter((s) => isStepApplicable(project, phase, s.step));
}

export function getNotApplicableTooltip(
  reason: ApplicabilityRule["reason"],
): string {
  switch (reason) {
    case "bypassed-phase":
      return "Not applicable for this journey mode.";
    case "scheme-decided":
      return "Not applicable — your grant scheme is already chosen.";
    default:
      return "Not applicable for this project.";
  }
}
