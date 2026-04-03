"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronLeft,
  ChevronRight,
  FileText,
  Settings,
  Sun,
  Moon,
  Circle,
  CircleDot,
  CheckCircle2,

  Home,
  ShieldCheck,
  ShieldX,
  ShieldAlert,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { useUiStore } from "@/stores/ui-store";
import { useProgressStore } from "@/stores/progress-store";
import { useProjectStore } from "@/stores/project-store";
import { useTheme } from "@/components/providers/theme-provider";
import { PhaseIcon } from "@/components/ui/phase-icon";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
  TooltipProvider,
} from "@/components/ui/tooltip";
import type { Phase } from "@/components/ui/phase-icon";

// ── Phase data ────────────────────────────────────────────────────────────────

const phases: {
  phase: Phase;
  name: string;
  shortName: string;
}[] = [
  { phase: 1, name: "Foundation & Discovery", shortName: "Foundation" },
  { phase: 2, name: "Strategic Positioning", shortName: "Strategy" },
  { phase: 3, name: "Research Design", shortName: "Research" },
  { phase: 4, name: "Team & Budget", shortName: "Team" },
  { phase: 5, name: "Proposal Writing", shortName: "Writing" },
  { phase: 6, name: "Review & Optimization", shortName: "Review" },
  { phase: 7, name: "Post-Submission", shortName: "Post-Sub" },
];

type CompletionStatus = "not-started" | "in-progress" | "complete";

const statusIcons: Record<CompletionStatus, typeof Circle> = {
  "not-started": Circle,
  "in-progress": CircleDot,
  complete: CheckCircle2,
};

// ── Workspace nav items ───────────────────────────────────────────────────────

const workspaceItems = [
  { label: "Documents", icon: FileText, href: "/documents" },
  { label: "Settings", icon: Settings, href: "/settings" },
];

// ── Sidebar content (shared between desktop sidebar and mobile drawer) ────────

interface SidebarContentProps {
  collapsed: boolean;
  currentPhase?: number;
  phaseStatuses?: Record<number, CompletionStatus>;
  hasProject?: boolean;
}

function SidebarContent({
  collapsed,
  currentPhase,
  phaseStatuses = {},
  hasProject = false,
}: SidebarContentProps) {
  const pathname = usePathname();
  const { theme, toggleTheme } = useTheme();
  const { toggleSidebar } = useUiStore();
  const { progress } = useProgressStore();
  const { activeProjectId } = useProjectStore();

  return (
    <div className="flex h-full flex-col pb-8 bg-sidebar text-sidebar-foreground">
      {/* ── Header ──────────────────────────────────────────────────────── */}
      <div className="flex h-12 items-center justify-between border-b border-sidebar-border px-3">
        <AnimatePresence mode="wait">
          {!collapsed ? (
            <motion.div
              key="brand-full"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
            >
              <button
                type="button"
                onClick={() => window.location.assign("/")}
                className="flex items-center gap-2 cursor-pointer hover:opacity-80 transition-opacity"
                aria-label="Back to home page"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/logo.png" alt="Research Grant Suite" className="h-6" />
                <span className="font-heading text-sm font-bold text-sidebar-foreground">
                  Research Grant Suite
                </span>
              </button>
            </motion.div>
          ) : (
            <motion.div
              key="brand-icon"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
            >
              <button
                type="button"
                onClick={() => window.location.assign("/")}
                className="cursor-pointer hover:opacity-80 transition-opacity"
                aria-label="Back to home page"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/logo.png" alt="Research Grant Suite" className="h-6" />
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7 text-gray-400 hover:text-gray-600"
          onClick={toggleSidebar}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {collapsed ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <ChevronLeft className="h-4 w-4" />
          )}
        </Button>
      </div>

      {/* ── Navigation ──────────────────────────────────────────────────── */}
      <ScrollArea className="flex-1 py-3">
        <div className="px-3">
          {/* Pipeline Group */}
          {!collapsed && (
            <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-gray-400">
              Pipeline
            </p>
          )}

          <nav
            className="flex flex-col gap-0.5"
            role="navigation"
            aria-label="Pipeline phases"
          >
            {phases.map(({ phase, name }) => {
              const status = phaseStatuses[phase] ?? "not-started";
              const StatusIcon = statusIcons[status];
              const isActive = currentPhase === phase;
              const disabled = !hasProject;

              const phaseUrl = `/projects/phase/${phase}`;
              const isCurrentRoute = pathname?.startsWith(phaseUrl);

              const item = (
                <div
                  className={cn(
                    "group relative flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition-colors duration-fast",
                    isActive || isCurrentRoute
                      ? "text-[#4F7DF3] bg-accent-50 dark:bg-accent-900/30 font-semibold"
                      : "text-muted-foreground hover:bg-muted/50",
                    disabled && "pointer-events-none opacity-40",
                    collapsed && "justify-center px-0"
                  )}
                  style={
                    isActive || isCurrentRoute
                      ? {
                          borderLeft: `3px solid var(--phase-${phase})`,
                          paddingLeft: collapsed
                            ? 0
                            : "calc(0.5rem - 3px)",
                        }
                      : undefined
                  }
                >
                  <PhaseIcon
                    phase={phase}
                    size="sm"
                    active={isActive || isCurrentRoute}
                  />
                  {!collapsed && (
                    <>
                      <span className="flex-1 truncate text-xs font-medium">
                        {name}
                      </span>
                      {(() => {
                        const gateStatus = progress.phases[phase]?.gateStatus;
                        if (gateStatus === "passed") return <ShieldCheck className="h-3 w-3 shrink-0 text-success" />;
                        if (gateStatus === "failed") return <ShieldX className="h-3 w-3 shrink-0 text-error" />;
                        if (gateStatus === "overridden") return <ShieldAlert className="h-3 w-3 shrink-0 text-warning" />;
                        return null;
                      })()}
                      <StatusIcon
                        className={cn(
                          "h-3.5 w-3.5 shrink-0",
                          status === "complete" && "text-success",
                          status === "in-progress" && "text-warning",
                          status === "not-started" &&
                            "text-gray-300"
                        )}
                      />
                    </>
                  )}
                </div>
              );

              if (disabled) {
                return (
                  <TooltipProvider key={phase} delayDuration={300}>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div>{item}</div>
                      </TooltipTrigger>
                      <TooltipContent side="right">
                        Select a project first
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                );
              }

              return (
                <Link key={phase} href={phaseUrl}>
                  {item}
                </Link>
              );
            })}
          </nav>

          {/* Workspace Group */}
          <div className="mt-6">
            {!collapsed && (
              <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-gray-400">
                Workspace
              </p>
            )}

            {collapsed && (
              <div className="mx-auto my-2 h-px w-6 bg-sidebar-border" />
            )}

            <nav
              className="flex flex-col gap-0.5"
              role="navigation"
              aria-label="Workspace"
            >
              {workspaceItems.map(({ label, icon: Icon, href }) => {
                const resolvedHref =
                  label === "Documents" && activeProjectId
                    ? `/projects/${activeProjectId}/documents`
                    : href;
                const isCurrentRoute =
                  pathname === resolvedHref || pathname === href;

                const item = (
                  <div
                    className={cn(
                      "flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition-colors duration-fast",
                      isCurrentRoute
                        ? "text-foreground bg-muted font-medium"
                        : "text-muted-foreground hover:bg-muted/50",
                      collapsed && "justify-center px-0"
                    )}
                  >
                    <Icon className="h-4 w-4 shrink-0" />
                    {!collapsed && (
                      <span className="text-xs font-medium">{label}</span>
                    )}
                  </div>
                );

                if (collapsed) {
                  return (
                    <TooltipProvider key={label} delayDuration={300}>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Link href={resolvedHref}>{item}</Link>
                        </TooltipTrigger>
                        <TooltipContent side="right">
                          {label}
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  );
                }

                return (
                  <Link key={label} href={resolvedHref}>
                    {item}
                  </Link>
                );
              })}
            </nav>
          </div>
        </div>
      </ScrollArea>

      {/* ── Footer ──────────────────────────────────────────────────────── */}
      <div className="border-t border-sidebar-border px-3 py-3">
        <div
          className={cn(
            "flex items-center",
            collapsed ? "flex-col gap-2" : "justify-between"
          )}
        >
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-gray-400 hover:text-gray-600"
            onClick={toggleTheme}
            aria-label={
              theme === "dark"
                ? "Switch to light mode"
                : "Switch to dark mode"
            }
          >
            {theme === "dark" ? (
              <Sun className="h-3.5 w-3.5" />
            ) : (
              <Moon className="h-3.5 w-3.5" />
            )}
          </Button>

          {!collapsed ? (
            <button
              type="button"
              onClick={() => window.location.assign("/")}
              className="flex items-center gap-1.5 text-xs text-muted-foreground transition-colors duration-fast hover:text-foreground"
            >
              <Home className="h-3.5 w-3.5" />
              Main Page
            </button>
          ) : (
            <TooltipProvider delayDuration={300}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    type="button"
                    onClick={() => window.location.assign("/")}
                    className="flex h-7 w-7 items-center justify-center text-gray-400 hover:text-gray-600"
                    aria-label="Main Page"
                  >
                    <Home className="h-3.5 w-3.5" />
                  </button>
                </TooltipTrigger>
                <TooltipContent side="right">
                  Main Page
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
        </div>

      </div>
    </div>
  );
}

// ── Responsive auto-collapse hook ─────────────────────────────────────────────

function useResponsiveSidebar() {
  const { setSidebarMode, setMobileDrawerOpen } = useUiStore();

  useEffect(() => {
    const mediaQuery = window.matchMedia("(min-width: 768px) and (max-width: 1023px)");

    function handleChange(e: MediaQueryListEvent | MediaQueryList) {
      if (e.matches) {
        setSidebarMode("collapsed");
      }
    }

    // Check on mount
    handleChange(mediaQuery);

    mediaQuery.addEventListener("change", handleChange);
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, [setSidebarMode]);

  // Close mobile drawer when resizing to desktop
  useEffect(() => {
    const mediaQuery = window.matchMedia("(min-width: 768px)");

    function handleChange(e: MediaQueryListEvent | MediaQueryList) {
      if (e.matches) {
        setMobileDrawerOpen(false);
      }
    }

    mediaQuery.addEventListener("change", handleChange);
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, [setMobileDrawerOpen]);
}

// ── Mobile drawer ─────────────────────────────────────────────────────────────

function MobileSidebar() {
  const { mobileDrawerOpen, setMobileDrawerOpen } = useUiStore();

  return (
    <AnimatePresence>
      {mobileDrawerOpen && (
        <>
          {/* Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm"
            onClick={() => setMobileDrawerOpen(false)}
          />
          {/* Drawer */}
          <motion.aside
            initial={{ x: -280 }}
            animate={{ x: 0 }}
            exit={{ x: -280 }}
            transition={{ duration: 0.2, ease: [0.2, 0, 0, 1] }}
            className="fixed inset-y-0 left-0 z-50 w-70 shadow-xl"
          >
            <SidebarContent collapsed={false} />
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}

// ── Desktop sidebar ───────────────────────────────────────────────────────────

function DesktopSidebar() {
  const { sidebarMode } = useUiStore();
  const collapsed = sidebarMode === "collapsed";

  useResponsiveSidebar();

  return (
    <motion.aside
      initial={false}
      animate={{ width: collapsed ? 64 : 240 }}
      transition={{ duration: 0.2, ease: [0.2, 0, 0, 1] }}
      className="hidden shrink-0 border-r border-sidebar-border md:block"
    >
      <SidebarContent collapsed={collapsed} />
    </motion.aside>
  );
}

// ── Exports ───────────────────────────────────────────────────────────────────

export { DesktopSidebar, MobileSidebar, SidebarContent };
