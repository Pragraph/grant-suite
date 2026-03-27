"use client";

import { FileText } from "lucide-react";

import { useUiStore } from "@/stores/ui-store";
import { StatusDot } from "@/components/ui/status-dot";
import type { Status } from "@/components/ui/status-dot";

const appStatusMap: Record<string, { dotStatus: Status; pulse: boolean }> = {
  idle: { dotStatus: "complete", pulse: false },
  working: { dotStatus: "active", pulse: true },
  error: { dotStatus: "error", pulse: false },
};

function StatusBar() {
  const { appStatus, operationText, documentCount } = useUiStore();

  const { dotStatus, pulse } = appStatusMap[appStatus] ?? appStatusMap.idle;

  return (
    <footer className="fixed inset-x-0 bottom-0 z-30 flex h-8 items-center justify-between border-t border-gray-200 bg-gray-50 px-4">
      {/* Left: App status */}
      <div className="flex items-center gap-2">
        <StatusDot status={dotStatus} pulse={pulse} />
        <span className="text-xs capitalize text-gray-500">
          {appStatus === "idle"
            ? "Idle"
            : appStatus === "working"
              ? "Working…"
              : "Error"}
        </span>
      </div>

      {/* Center: Operation text */}
      <span className="hidden text-xs text-gray-400 sm:block">
        {operationText}
      </span>

      {/* Right: Document count */}
      <div className="flex items-center gap-1.5 text-xs text-gray-400">
        <FileText className="h-3 w-3" />
        <span>
          {documentCount} {documentCount === 1 ? "document" : "documents"}
        </span>
      </div>
    </footer>
  );
}

export { StatusBar };
