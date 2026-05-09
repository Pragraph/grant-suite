"use client";

import { ArrowUpToLine } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface JumpToStartButtonProps {
  phase: number;
  firstStep?: number;
  className?: string;
}

/**
 * Pure navigation. Fires the existing `grant-suite:expand-step` event so
 * phase clients can scroll + expand step 1 without any data side effects.
 */
export function JumpToStartButton({
  phase,
  firstStep = 1,
  className,
}: JumpToStartButtonProps) {
  const handleClick = () => {
    window.dispatchEvent(
      new CustomEvent("grant-suite:expand-step", {
        detail: { phase, step: firstStep },
      }),
    );
  };

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={handleClick}
      className={cn("text-muted-foreground hover:text-foreground", className)}
    >
      <ArrowUpToLine className="h-3.5 w-3.5" />
      Jump to start
    </Button>
  );
}
