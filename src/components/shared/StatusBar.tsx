"use client";

import { useLayoutStore } from "@/stores/layout-store";
import { StatusDot } from "@/components/ui/status-dot";
import type { Status } from "@/components/ui/status-dot";

const aiStatusMap: Record<string, { dotStatus: Status; pulse: boolean }> = {
  idle: { dotStatus: "complete", pulse: false },
  generating: { dotStatus: "active", pulse: true },
  error: { dotStatus: "error", pulse: false },
};

function StatusBar() {
  const { aiStatus, operationText, tokenCount, estimatedCost } =
    useLayoutStore();

  const { dotStatus, pulse } = aiStatusMap[aiStatus] ?? aiStatusMap.idle;

  return (
    <footer className="fixed inset-x-0 bottom-0 z-30 flex h-8 items-center justify-between border-t border-border bg-secondary px-4">
      {/* Left: AI status */}
      <div className="flex items-center gap-2">
        <StatusDot status={dotStatus} pulse={pulse} />
        <span className="text-xs capitalize text-muted-foreground">
          {aiStatus === "idle" ? "AI Ready" : aiStatus === "generating" ? "Generating…" : "Error"}
        </span>
      </div>

      {/* Center: Operation text */}
      <span className="hidden text-xs text-muted-foreground sm:block">
        {operationText}
      </span>

      {/* Right: Token count + cost */}
      <div className="flex items-center gap-3 font-mono text-xs text-muted-foreground">
        <span>{tokenCount.toLocaleString()} tokens</span>
        <span>${estimatedCost.toFixed(4)}</span>
      </div>
    </footer>
  );
}

export { StatusBar };
