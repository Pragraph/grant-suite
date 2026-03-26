"use client";

import { Menu, ChevronRight } from "lucide-react";
import Link from "next/link";

import { cn } from "@/lib/utils";
import { useLayoutStore } from "@/stores/layout-store";
import { Button } from "@/components/ui/button";

function TopBar() {
  const { breadcrumbs, actions, setMobileDrawerOpen } = useLayoutStore();

  return (
    <header className="flex h-12 shrink-0 items-center justify-between border-b border-border bg-background px-4">
      {/* Left: Mobile hamburger + Breadcrumbs */}
      <div className="flex items-center gap-2">
        {/* Hamburger — mobile only */}
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 md:hidden"
          onClick={() => setMobileDrawerOpen(true)}
          aria-label="Open navigation"
        >
          <Menu className="h-4 w-4" />
        </Button>

        {/* Breadcrumbs */}
        <nav
          className="flex items-center gap-1 text-sm"
          aria-label="Breadcrumb"
        >
          {breadcrumbs.map((crumb, i) => {
            const isLast = i === breadcrumbs.length - 1;
            return (
              <span key={i} className="flex items-center gap-1">
                {i > 0 && (
                  <ChevronRight className="h-3 w-3 text-muted-foreground" />
                )}
                {crumb.href && !isLast ? (
                  <Link
                    href={crumb.href}
                    className="text-muted-foreground transition-colors duration-fast hover:text-foreground"
                  >
                    {crumb.label}
                  </Link>
                ) : (
                  <span
                    className={cn(
                      isLast
                        ? "font-medium text-foreground"
                        : "text-muted-foreground"
                    )}
                  >
                    {crumb.label}
                  </span>
                )}
              </span>
            );
          })}
        </nav>
      </div>

      {/* Center: reserved for search */}
      <div className="hidden flex-1 lg:block" />

      {/* Right: Context-dependent actions */}
      {actions.length > 0 && (
        <div className="flex items-center gap-2">
          {actions.map((action, i) => (
            <Button
              key={i}
              variant={
                (action.variant as "default" | "secondary" | "ghost") ??
                "secondary"
              }
              size="sm"
              onClick={action.onClick}
            >
              {action.label}
            </Button>
          ))}
        </div>
      )}
    </header>
  );
}

export { TopBar };
