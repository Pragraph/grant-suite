"use client";

import { Menu, ChevronRight } from "lucide-react";
import Link from "next/link";

import { cn } from "@/lib/utils";
import { useUiStore } from "@/stores/ui-store";
import { Button } from "@/components/ui/button";

function TopBar() {
  const { breadcrumbs, actions, setMobileDrawerOpen } = useUiStore();

  return (
    <header className="flex h-12 shrink-0 items-center justify-between border-b border-border bg-card px-4">
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
                  <ChevronRight className="h-3 w-3 text-gray-300" />
                )}
                {crumb.href && !isLast ? (
                  <Link
                    href={crumb.href}
                    className="text-gray-500 transition-colors duration-fast hover:text-gray-700"
                  >
                    {crumb.label}
                  </Link>
                ) : (
                  <span
                    className={cn(
                      isLast
                        ? "font-medium text-gray-900"
                        : "text-gray-500"
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

      {/* Right: Context-dependent actions + Powered by */}
      <div className="flex items-center gap-4">
        {actions.length > 0 && (
          <div className="flex items-center gap-2">
            {actions.map((action, i) => (
              <Button
                key={i}
                variant={
                  (action.variant as "default" | "secondary" | "ghost" | "outline") ??
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

        <div className="hidden sm:block text-right ml-auto">
          <p className="text-xs text-gray-500 font-extrabold leading-tight">
            Powered by <span className="animate-bounce-gentle">🎓</span> BelajarAI
          </p>
          <p className="text-[10px] text-gray-400 font-bold leading-tight">
            by Adam Linoby
          </p>
        </div>
      </div>
    </header>
  );
}

export { TopBar };
