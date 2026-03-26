import { cn } from "@/lib/utils";

function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "rounded-md bg-muted animate-shimmer bg-[length:200%_100%] bg-[linear-gradient(90deg,transparent_0%,var(--muted-foreground)/8%_50%,transparent_100%)]",
        className
      )}
      {...props}
    />
  );
}

export { Skeleton };
