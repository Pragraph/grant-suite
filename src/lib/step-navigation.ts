import { PHASE_DEFINITIONS } from "@/lib/constants";

export function advanceToNextStep(projectId: string, phase: number, currentStep: number) {
  const phaseDef = PHASE_DEFINITIONS.find((p) => p.phase === phase);
  if (!phaseDef) return;

  const idx = phaseDef.steps.findIndex((s) => s.step === currentStep);
  const nextStep = phaseDef.steps[idx + 1];

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
