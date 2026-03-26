"use client";

import { useLayoutStore } from "@/stores/layout-store";
import {
  CommandDialog,
  CommandInput,
  CommandList,
  CommandEmpty,
} from "@/components/ui/command";

function CommandPalette() {
  const { commandPaletteOpen, setCommandPaletteOpen } = useLayoutStore();

  return (
    <CommandDialog
      open={commandPaletteOpen}
      onOpenChange={setCommandPaletteOpen}
    >
      <CommandInput placeholder="Search or run a command…" />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>
      </CommandList>
    </CommandDialog>
  );
}

export { CommandPalette };
