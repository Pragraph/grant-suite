"use client";

import { useUiStore } from "@/stores/ui-store";
import {
  CommandDialog,
  CommandInput,
  CommandList,
  CommandEmpty,
} from "@/components/ui/command";

function CommandPalette() {
  const { commandPaletteOpen, setCommandPaletteOpen } = useUiStore();

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
