"use client";

import { useCallback } from "react";
import { motion } from "framer-motion";
import { CheckCircle2, ArrowRight } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useQualityGate } from "@/hooks/useQualityGate";
import { qualityGateService } from "@/lib/quality-gate";
import { QualityGate } from "@/components/shared/QualityGate";
import { useProgressStore } from "@/stores/progress-store";
import { PHASES } from "@/lib/types";

interface PhaseCompleteCTAProps {
  projectId: string;
  phase: number;
  phaseCompletion: number;
}

export function PhaseCompleteCTA({
  projectId,
  phase,
  phaseCompletion,
}: PhaseCompleteCTAProps) {
  const { gateResult, isOpen, isRunning, showGate, closeGate, overrideGate } =
    useQualityGate();
  const { updateGateStatus, recordGateResult } = useProgressStore();

  const nextPhase = phase + 1;
  const nextPhaseName =
    PHASES.find((p) => p.id === nextPhase)?.name ?? `Phase ${nextPhase}`;

  const navigateToNext = useCallback(() => {
    window.location.assign(`/projects/${projectId}/phase/${nextPhase}`);
  }, [projectId, nextPhase]);

  const handleContinueClick = useCallback(() => {
    const result = qualityGateService.checkGate(phase);

    // If all checks pass, transition silently
    if (result.passed) {
      updateGateStatus(projectId, phase, "passed");
      recordGateResult(projectId, phase, result);
      navigateToNext();
      return;
    }

    // Otherwise show the gate modal
    showGate(projectId, phase);
  }, [
    phase,
    projectId,
    navigateToNext,
    showGate,
    updateGateStatus,
    recordGateResult,
  ]);

  const handleOverride = useCallback(() => {
    overrideGate(projectId);
    navigateToNext();
  }, [projectId, overrideGate, navigateToNext]);

  if (phaseCompletion < 100) return null;

  return (
    <>
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="text-center py-6"
      >
        <Card className={`border-phase-${phase}/30 bg-phase-${phase}/5`}>
          <CardContent className="p-6 space-y-3">
            <CheckCircle2
              className={`h-8 w-8 text-phase-${phase} mx-auto`}
            />
            <h2 className="text-lg font-heading font-bold text-foreground">
              Phase {phase} Complete!
            </h2>
            <p className="text-sm text-muted-foreground">
              All steps finished. Continue to {nextPhaseName}.
            </p>
            <Button
              onClick={handleContinueClick}
              className={`bg-phase-${nextPhase} hover:bg-phase-${nextPhase}/90 text-white`}
            >
              Continue to Phase {nextPhase}
              <ArrowRight className="h-4 w-4 ml-1.5" />
            </Button>
          </CardContent>
        </Card>
      </motion.div>

      <QualityGate
        isOpen={isOpen}
        isRunning={isRunning}
        gateResult={gateResult}
        onClose={closeGate}
        onContinue={navigateToNext}
        onOverride={handleOverride}
      />
    </>
  );
}
