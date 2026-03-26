import { cn } from "@/lib/utils";

type Status = "active" | "complete" | "pending" | "error";

interface StatusDotProps {
  status: Status;
  pulse?: boolean;
  className?: string;
}

const statusColors: Record<Status, string> = {
  active: "bg-accent-500",
  complete: "bg-success",
  pending: "bg-warning",
  error: "bg-error",
};

function StatusDot({ status, pulse = false, className }: StatusDotProps) {
  return (
    <span
      className={cn(
        "inline-block h-2 w-2 rounded-full",
        statusColors[status],
        pulse && "animate-pulse-dot",
        className
      )}
      aria-label={status}
    />
  );
}

export { StatusDot };
export type { StatusDotProps, Status };
