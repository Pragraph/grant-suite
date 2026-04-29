"use client";

import { useEffect } from "react";
import {
  FileText,
  FolderOpen,
  Home,
  ListChecks,
  Settings,
} from "lucide-react";

import { useUiStore } from "@/stores/ui-store";
import { useProjectStore } from "@/stores/project-store";
import { PHASE_DEFINITIONS } from "@/lib/constants";
import {
  CommandDialog,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandSeparator,
} from "@/components/ui/command";

function navigateTo(url: string) {
  window.location.assign(url);
}

function CommandPalette() {
  const { commandPaletteOpen, setCommandPaletteOpen } = useUiStore();
  const {
    projects,
    activeProject,
    activeProjectId,
    loadProjects,
    setActiveProject,
  } = useProjectStore();

  useEffect(() => {
    if (commandPaletteOpen) {
      loadProjects();
    }
  }, [commandPaletteOpen, loadProjects]);

  const currentProject =
    activeProject ?? projects.find((project) => project.id === activeProjectId);

  const runCommand = (command: () => void) => {
    setCommandPaletteOpen(false);
    command();
  };

  return (
    <CommandDialog
      open={commandPaletteOpen}
      onOpenChange={setCommandPaletteOpen}
    >
      <CommandInput placeholder="Search or run a command…" />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>
        <CommandGroup heading="Navigation">
          <CommandItem
            value="home landing start"
            onSelect={() => runCommand(() => navigateTo("/"))}
          >
            <Home className="h-4 w-4" />
            Home
          </CommandItem>
          <CommandItem
            value="projects dashboard workspace grants"
            onSelect={() => runCommand(() => navigateTo("/projects"))}
          >
            <FolderOpen className="h-4 w-4" />
            Projects
          </CommandItem>
          <CommandItem
            value="settings preferences data backup"
            onSelect={() => runCommand(() => navigateTo("/settings"))}
          >
            <Settings className="h-4 w-4" />
            Settings
          </CommandItem>
        </CommandGroup>

        {currentProject ? (
          <>
            <CommandSeparator />
            <CommandGroup heading={currentProject.title}>
              <CommandItem
                value={`current project overview ${currentProject.title}`}
                onSelect={() =>
                  runCommand(() =>
                    navigateTo(`/projects/${currentProject.id}`)
                  )
                }
              >
                <FolderOpen className="h-4 w-4" />
                Project overview
              </CommandItem>
              <CommandItem
                value={`documents files inventory ${currentProject.title}`}
                onSelect={() =>
                  runCommand(() =>
                    navigateTo(`/projects/${currentProject.id}/documents`)
                  )
                }
              >
                <FileText className="h-4 w-4" />
                Documents
              </CommandItem>
              {PHASE_DEFINITIONS.map((phase) => (
                <CommandItem
                  key={phase.phase}
                  value={`phase ${phase.phase} ${phase.name} ${phase.description}`}
                  onSelect={() =>
                    runCommand(() =>
                      navigateTo(
                        `/projects/${currentProject.id}/phase/${phase.phase}`
                      )
                    )
                  }
                >
                  <ListChecks className="h-4 w-4" />
                  Phase {phase.phase}: {phase.name}
                </CommandItem>
              ))}
            </CommandGroup>
          </>
        ) : null}

        {projects.length > 0 ? (
          <>
            <CommandSeparator />
            <CommandGroup heading="Projects">
              {projects.slice(0, 8).map((project) => (
                <CommandItem
                  key={project.id}
                  value={`open project ${project.title} ${project.discipline}`}
                  onSelect={() =>
                    runCommand(() => {
                      setActiveProject(project.id);
                      navigateTo(`/projects/${project.id}`);
                    })
                  }
                >
                  <FolderOpen className="h-4 w-4" />
                  {project.title}
                </CommandItem>
              ))}
            </CommandGroup>
          </>
        ) : null}
      </CommandList>
    </CommandDialog>
  );
}

export { CommandPalette };
