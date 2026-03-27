"use client";

import * as React from "react";
import { ScrollArea as RadixScrollArea } from "radix-ui";

import { cn } from "@/lib/utils";

const ScrollArea = React.forwardRef<
  React.ComponentRef<typeof RadixScrollArea.Root>,
  React.ComponentPropsWithoutRef<typeof RadixScrollArea.Root>
>(({ className, children, ...props }, ref) => (
  <RadixScrollArea.Root
    ref={ref}
    className={cn("relative overflow-hidden", className)}
    {...props}
  >
    <RadixScrollArea.Viewport className="h-full w-full rounded-[inherit]">
      {children}
    </RadixScrollArea.Viewport>
    <ScrollBar />
    <RadixScrollArea.Corner />
  </RadixScrollArea.Root>
));
ScrollArea.displayName = RadixScrollArea.Root.displayName;

const ScrollBar = React.forwardRef<
  React.ComponentRef<typeof RadixScrollArea.Scrollbar>,
  React.ComponentPropsWithoutRef<typeof RadixScrollArea.Scrollbar>
>(({ className, orientation = "vertical", ...props }, ref) => (
  <RadixScrollArea.Scrollbar
    ref={ref}
    orientation={orientation}
    className={cn(
      "flex touch-none select-none transition-colors",
      orientation === "vertical" &&
        "h-full w-2 border-l border-l-transparent p-[1px]",
      orientation === "horizontal" &&
        "h-2 flex-col border-t border-t-transparent p-[1px]",
      className
    )}
    {...props}
  >
    <RadixScrollArea.Thumb className="relative flex-1 rounded-full bg-gray-300 hover:bg-gray-400" />
  </RadixScrollArea.Scrollbar>
));
ScrollBar.displayName = RadixScrollArea.Scrollbar.displayName;

export { ScrollArea, ScrollBar };
