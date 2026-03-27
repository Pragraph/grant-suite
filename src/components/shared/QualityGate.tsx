"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  CheckCircle2,
  XCircle,
  AlertTriangle,
  ChevronDown,
  ChevronRight,
  ArrowRight,
  ArrowLeft,
  ShieldCheck,
  Loader2,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import type { GateCheck, GateResult } from "@/lib/quality-gate";
import { PHASES } from "@/lib/types";

// ─── Status icon mapping ────────────────────────────────────────────────────

const statusConfig = {
  pass: {
    icon: CheckCircle2,
    color: "text-emerald-700",
    bg: "bg-emerald-50",
    label: "Passed",
  },
  fail: {
    icon: XCircle,
    color: "text-red-700",
    bg: "bg-red-50",
    label: "Failed",
  },
  warn: {
    icon: AlertTriangle,
    color: "text-warning",
    bg: "bg-warning/10",
    label: "Warning",
  },
} as const;

// ─── Individual check row ───────────────────────────────────────────────────

function GateCheckRow({
  check,
  index,
}: {
  check: GateCheck;
  index: number;
}) {
  const [expanded, setExpanded] = useState(false);
  const config = statusConfig[check.status];
  const Icon = config.icon;

  return (
    <motion.div
      initial={{ opacity: 0, x: -12 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.1, duration: 0.25, ease: "easeOut" }}
    >
      <button
        type="button"
        onClick={() => check.detail && setExpanded(!expanded)}
        className="flex w-full items-start gap-3 rounded-lg px-3 py-2.5 text-left transition-colors hover:bg-gray-50"
      >
        <div className={`mt-0.5 rounded-full p-0.5 ${config.bg}`}>
          <Icon className={`h-4 w-4 ${config.color}`} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-foreground">{check.label}</p>
          <p className="text-xs text-muted-foreground mt-0.5">
            {check.description}
          </p>
        </div>
        {check.detail && (
          <div className="mt-1 text-muted-foreground">
            {expanded ? (
              <ChevronDown className="h-3.5 w-3.5" />
            ) : (
              <ChevronRight className="h-3.5 w-3.5" />
            )}
          </div>
        )}
      </button>
      <AnimatePresence>
        {expanded && check.detail && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="ml-10 mr-3 mb-2 rounded-md bg-muted/30 px-3 py-2">
              <p className="text-xs text-muted-foreground leading-relaxed">
                {check.detail}
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ─── Verdict banner ─────────────────────────────────────────────────────────

function VerdictBanner({
  result,
}: {
  result: GateResult;
}) {
  const failCount = result.checks.filter((c) => c.status === "fail").length;
  const warnCount = result.checks.filter((c) => c.status === "warn").length;

  if (result.passed) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: result.checks.length * 0.1 + 0.15 }}
        className="flex items-center gap-2 rounded-lg bg-emerald-50 border border-emerald-200 px-4 py-3"
      >
        <ShieldCheck className="h-5 w-5 text-emerald-700" />
        <p className="text-sm font-medium text-emerald-700">
          All checks passed
        </p>
      </motion.div>
    );
  }

  if (failCount > 0) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: result.checks.length * 0.1 + 0.15 }}
        className="flex items-center gap-2 rounded-lg bg-red-50 border border-red-200 px-4 py-3"
      >
        <XCircle className="h-5 w-5 text-red-700" />
        <p className="text-sm font-medium text-red-700">
          {failCount} required issue{failCount > 1 ? "s" : ""} must be
          resolved
        </p>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: result.checks.length * 0.1 + 0.15 }}
      className="flex items-center gap-2 rounded-lg bg-warning/10 border border-warning/20 px-4 py-3"
    >
      <AlertTriangle className="h-5 w-5 text-warning" />
      <p className="text-sm font-medium text-warning">
        {warnCount} warning{warnCount > 1 ? "s" : ""} detected
      </p>
    </motion.div>
  );
}

// ─── Main component ─────────────────────────────────────────────────────────

interface QualityGateProps {
  isOpen: boolean;
  isRunning: boolean;
  gateResult: GateResult | null;
  onClose: () => void;
  onContinue: () => void;
  onOverride: () => void;
}

export function QualityGate({
  isOpen,
  isRunning,
  gateResult,
  onClose,
  onContinue,
  onOverride,
}: QualityGateProps) {
  const [confirmOverride, setConfirmOverride] = useState(false);

  const phase = gateResult?.phase ?? 0;
  const nextPhase = phase + 1;
  const nextPhaseName =
    PHASES.find((p) => p.id === nextPhase)?.name ?? `Phase ${nextPhase}`;

  const failCount =
    gateResult?.checks.filter((c) => c.status === "fail").length ?? 0;
  const warnCount =
    gateResult?.checks.filter((c) => c.status === "warn").length ?? 0;

  function handleOpenChange(open: boolean) {
    if (!open) {
      setConfirmOverride(false);
      onClose();
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-[520px] gap-0 p-0">
        {/* Header */}
        <DialogHeader className="border-b border-border/50 px-6 py-4">
          <DialogTitle className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-accent-500" />
            Phase {phase} Quality Gate
          </DialogTitle>
          <DialogDescription>
            Pre-flight checks before advancing to {nextPhaseName}
          </DialogDescription>
        </DialogHeader>

        {/* Checks list */}
        <div className="px-3 py-4 max-h-[400px] overflow-y-auto">
          {isRunning ? (
            <div className="flex items-center justify-center py-8 gap-3">
              <Loader2 className="h-5 w-5 animate-spin text-accent-500" />
              <p className="text-sm text-muted-foreground">
                Running checks...
              </p>
            </div>
          ) : gateResult ? (
            <div className="space-y-1">
              {gateResult.checks.map((check, i) => (
                <GateCheckRow key={check.id} check={check} index={i} />
              ))}
            </div>
          ) : null}
        </div>

        {/* Verdict + Actions */}
        {gateResult && !isRunning && (
          <div className="border-t border-border/50 px-6 py-4 space-y-4">
            <VerdictBanner result={gateResult} />

            <DialogFooter className="sm:justify-between">
              {/* All passed — continue */}
              {gateResult.passed && failCount === 0 && warnCount === 0 && (
                <Button onClick={onContinue} className="w-full">
                  Continue to {nextPhaseName}
                  <ArrowRight className="h-4 w-4 ml-1.5" />
                </Button>
              )}

              {/* Fails exist — go back */}
              {failCount > 0 && (
                <Button
                  onClick={() => {
                    setConfirmOverride(false);
                    onClose();
                  }}
                  variant="secondary"
                  className="w-full"
                >
                  <ArrowLeft className="h-4 w-4 mr-1.5" />
                  Go Back & Resolve Issues
                </Button>
              )}

              {/* Warnings only — override option */}
              {failCount === 0 && warnCount > 0 && (
                <div className="flex w-full flex-col gap-2">
                  {!confirmOverride ? (
                    <div className="flex gap-2">
                      <Button
                        onClick={() => {
                          setConfirmOverride(false);
                          onClose();
                        }}
                        variant="secondary"
                        className="flex-1"
                      >
                        <ArrowLeft className="h-4 w-4 mr-1.5" />
                        Go Back
                      </Button>
                      <Button
                        onClick={() => setConfirmOverride(true)}
                        variant="ghost"
                        className="flex-1 text-warning hover:text-warning"
                      >
                        Override & Continue
                        <ArrowRight className="h-4 w-4 ml-1.5" />
                      </Button>
                    </div>
                  ) : (
                    <motion.div
                      initial={{ opacity: 0, y: 4 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="space-y-3"
                    >
                      <p className="text-xs text-muted-foreground text-center leading-relaxed">
                        You have {warnCount} unresolved warning
                        {warnCount > 1 ? "s" : ""}. Proceeding may affect
                        proposal quality.
                      </p>
                      <div className="flex gap-2">
                        <Button
                          onClick={() => setConfirmOverride(false)}
                          variant="secondary"
                          className="flex-1"
                        >
                          Cancel
                        </Button>
                        <Button
                          onClick={onOverride}
                          className="flex-1 bg-warning/90 hover:bg-warning text-warning-foreground"
                        >
                          Confirm Override
                          <ArrowRight className="h-4 w-4 ml-1.5" />
                        </Button>
                      </div>
                    </motion.div>
                  )}
                </div>
              )}
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
