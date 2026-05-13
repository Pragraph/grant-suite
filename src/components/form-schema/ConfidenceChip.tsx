import { CheckCircle2, AlertCircle, AlertTriangle } from "lucide-react";

import type { ExtractionConfidence } from "@/lib/form-schema";
import { cn } from "@/lib/utils";

interface ConfidenceChipProps {
  confidence: ExtractionConfidence | null | undefined;
  className?: string;
  size?: "sm" | "md";
}

const CONFIG: Record<
  ExtractionConfidence,
  { label: string; classes: string; Icon: React.ComponentType<{ className?: string }> }
> = {
  high: {
    label: "High",
    classes: "bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300",
    Icon: CheckCircle2,
  },
  medium: {
    label: "Medium",
    classes: "bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300",
    Icon: AlertCircle,
  },
  low: {
    label: "Low",
    classes: "bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300",
    Icon: AlertTriangle,
  },
};

export function ConfidenceChip({ confidence, className, size = "sm" }: ConfidenceChipProps) {
  if (!confidence) return null;
  const cfg = CONFIG[confidence];
  const sizeClasses = size === "sm" ? "text-[10px] px-2 py-0.5 gap-1" : "text-xs px-2.5 py-1 gap-1.5";
  const iconSize = size === "sm" ? "h-2.5 w-2.5" : "h-3 w-3";
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full font-medium",
        sizeClasses,
        cfg.classes,
        className,
      )}
      title={`Extraction confidence: ${cfg.label}`}
    >
      <cfg.Icon className={iconSize} />
      {cfg.label}
    </span>
  );
}
