"use client";

import * as React from "react";
import { Progress as RadixProgress } from "radix-ui";

import { cn } from "@/lib/utils";

const Progress = React.forwardRef<
  React.ComponentRef<typeof RadixProgress.Root>,
  React.ComponentPropsWithoutRef<typeof RadixProgress.Root>
>(({ className, value, ...props }, ref) => (
  <RadixProgress.Root
    ref={ref}
    className={cn(
      "relative h-1 w-full overflow-hidden rounded-full bg-gray-200",
      className
    )}
    {...props}
  >
    <RadixProgress.Indicator
      className="h-full rounded-full bg-[#4F7DF3] transition-all duration-[600ms] ease-out"
      style={{ width: `${value ?? 0}%` }}
    />
  </RadixProgress.Root>
));
Progress.displayName = RadixProgress.Root.displayName;

export { Progress };
