"use client";

import { useEffect } from "react";
import { useUiStore } from "@/stores/ui-store";

export function useKeyboardShortcuts() {
  const { toggleSidebar, setCommandPaletteOpen } = useUiStore();

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      const meta = e.metaKey || e.ctrlKey;

      // Cmd+B — toggle sidebar
      if (meta && e.key === "b") {
        e.preventDefault();
        toggleSidebar();
      }

      // Cmd+K — toggle command palette
      if (meta && e.key === "k") {
        e.preventDefault();
        setCommandPaletteOpen(true);
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [toggleSidebar, setCommandPaletteOpen]);
}
