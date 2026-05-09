import { PHASE_DEFINITIONS } from "@/lib/constants";
import { isStepApplicable } from "@/lib/applicability";
import { storage } from "@/lib/storage";

export function advanceToNextStep(projectId: string, phase: number, currentStep: number) {
  const phaseDef = PHASE_DEFINITIONS.find((p) => p.phase === phase);
  if (!phaseDef) return;

  const project = storage.getProject(projectId);
  const idx = phaseDef.steps.findIndex((s) => s.step === currentStep);

  // Find the next applicable step (skip N/A steps).
  const nextStep = phaseDef.steps
    .slice(idx + 1)
    .find((s) => isStepApplicable(project, phase, s.step));

  if (nextStep) {
    window.dispatchEvent(
      new CustomEvent("grant-suite:expand-step", {
        detail: { phase, step: nextStep.step },
      }),
    );
    requestAnimationFrame(() => {
      document
        .getElementById(`phase${phase}-step-${nextStep.step}`)
        ?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  } else if (phase < 7) {
    window.location.assign(`/projects/${projectId}/phase/${phase + 1}`);
  } else {
    window.location.assign(`/projects/${projectId}`);
  }
}
