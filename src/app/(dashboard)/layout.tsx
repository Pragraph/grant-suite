"use client";

import { DesktopSidebar, MobileSidebar } from "@/components/shared/Sidebar";
import { TopBar } from "@/components/shared/TopBar";
import { StatusBar } from "@/components/shared/StatusBar";
import { CommandPalette } from "@/components/shared/CommandPalette";
import { useKeyboardShortcuts } from "@/hooks/use-keyboard-shortcuts";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  useKeyboardShortcuts();

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Desktop sidebar */}
      <DesktopSidebar />

      {/* Mobile drawer sidebar */}
      <MobileSidebar />

      {/* Main content area */}
      <div className="flex min-w-0 flex-1 flex-col bg-background">
        <TopBar />

        <main className="flex-1 overflow-y-auto pb-8">
          <div className="mx-auto w-full max-w-300 px-4 py-4 sm:px-6 sm:py-6">
            {children}
          </div>
        </main>
      </div>

      {/* Status bar — fixed bottom */}
      <StatusBar />

      {/* Command palette — modal */}
      <CommandPalette />
    </div>
  );
}
