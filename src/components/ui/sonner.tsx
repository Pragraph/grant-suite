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
            "group rounded-lg border border-gray-200 bg-white p-4 shadow-md text-foreground text-sm",
          title: "font-medium text-foreground",
          description: "text-muted-foreground text-sm",
          actionButton:
            "bg-[#4F7DF3] text-white hover:bg-[#3B63D4] rounded-md px-3 py-1.5 text-xs font-medium",
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
