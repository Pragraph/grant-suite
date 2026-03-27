"use client";

import { useState, useCallback } from "react";
import { qualityGateService } from "@/lib/quality-gate";
import type { GateResult } from "@/lib/quality-gate";
import { useProgressStore } from "@/stores/progress-store";

interface UseQualityGateReturn {
  gateResult: GateResult | null;
  isOpen: boolean;
  isRunning: boolean;
  showGate: (projectId: string, phase: number) => void;
  closeGate: () => void;
  overrideGate: (projectId: string) => void;
}

export function useQualityGate(): UseQualityGateReturn {
  const [gateResult, setGateResult] = useState<GateResult | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [isRunning, setIsRunning] = useState(false);

  const { updateGateStatus, recordGateResult } = useProgressStore();

  const showGate = useCallback(
    (projectId: string, phase: number) => {
      setIsRunning(true);
      setIsOpen(true);

      // Simulate slight delay for the pre-flight animation effect
      setTimeout(() => {
        const result = qualityGateService.checkGate(phase);
        setGateResult(result);
        setIsRunning(false);

        // Record the result
        recordGateResult(projectId, phase, result);

        // Update gate status based on result
        if (result.passed) {
          updateGateStatus(projectId, phase, "passed");
        } else if (!result.canOverride) {
          updateGateStatus(projectId, phase, "failed");
        }
        // If canOverride (warnings only), status stays as-is until user decides
      }, 150);
    },
    [updateGateStatus, recordGateResult]
  );

  const closeGate = useCallback(() => {
    setIsOpen(false);
    setGateResult(null);
  }, []);

  const overrideGate = useCallback(
    (projectId: string) => {
      if (gateResult) {
        updateGateStatus(projectId, gateResult.phase, "overridden");
        recordGateResult(projectId, gateResult.phase, {
          ...gateResult,
          passed: true,
        });
      }
      setIsOpen(false);
      setGateResult(null);
    },
    [gateResult, updateGateStatus, recordGateResult]
  );

  return {
    gateResult,
    isOpen,
    isRunning,
    showGate,
    closeGate,
    overrideGate,
  };
}
