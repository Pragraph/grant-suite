import { cn } from "@/lib/utils";

type Phase = 1 | 2 | 3 | 4 | 5 | 6 | 7;
type PhaseSize = "sm" | "md" | "lg";

interface PhaseIconProps {
  phase: Phase;
  size?: PhaseSize;
  active?: boolean;
  className?: string;
}

const phaseColors: Record<Phase, { bg: string; text: string; activeBg: string }> = {
  1: { bg: "bg-phase-1-muted", text: "text-phase-1", activeBg: "bg-phase-1" },
  2: { bg: "bg-phase-2-muted", text: "text-phase-2", activeBg: "bg-phase-2" },
  3: { bg: "bg-phase-3-muted", text: "text-phase-3", activeBg: "bg-phase-3" },
  4: { bg: "bg-phase-4-muted", text: "text-phase-4", activeBg: "bg-phase-4" },
  5: { bg: "bg-phase-5-muted", text: "text-phase-5", activeBg: "bg-phase-5" },
  6: { bg: "bg-phase-6-muted", text: "text-phase-6", activeBg: "bg-phase-6" },
  7: { bg: "bg-phase-7-muted", text: "text-phase-7", activeBg: "bg-phase-7" },
};

const sizeClasses: Record<PhaseSize, string> = {
  sm: "h-6 w-6 text-xs rounded",
  md: "h-8 w-8 text-sm rounded-md",
  lg: "h-10 w-10 text-base rounded-lg",
};

function PhaseIcon({
  phase,
  size = "md",
  active = false,
  className,
}: PhaseIconProps) {
  const colors = phaseColors[phase];

  return (
    <div
      className={cn(
        "inline-flex items-center justify-center font-semibold transition-colors duration-fast",
        sizeClasses[size],
        active
          ? cn(colors.activeBg, "text-white")
          : cn(colors.bg, colors.text),
        className
      )}
    >
      {phase}
    </div>
  );
}

export { PhaseIcon };
export type { PhaseIconProps, Phase, PhaseSize };
