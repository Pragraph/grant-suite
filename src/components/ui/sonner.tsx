"use client";

import { Toaster as Sonner } from "sonner";

type ToasterProps = React.ComponentProps<typeof Sonner>;

const Toaster = ({ ...props }: ToasterProps) => {
  return (
    <Sonner
      position="top-right"
      toastOptions={{
        classNames: {
          toast:
            "group rounded-lg border border-border/50 bg-secondary p-4 shadow-md text-foreground text-sm",
          title: "font-medium text-foreground",
          description: "text-muted-foreground text-sm",
          actionButton:
            "bg-accent-500 text-white hover:bg-accent-600 rounded-md px-3 py-1.5 text-xs font-medium",
          cancelButton:
            "bg-transparent text-muted-foreground hover:text-foreground rounded-md px-3 py-1.5 text-xs font-medium",
          success: "!border-l-4 !border-l-success",
          error: "!border-l-4 !border-l-error",
          warning: "!border-l-4 !border-l-warning",
          info: "!border-l-4 !border-l-info",
        },
      }}
      {...props}
    />
  );
};

export { Toaster };
