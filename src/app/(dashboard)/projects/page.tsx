"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  Plus,
  FolderOpen,
  MoreHorizontal,
  Archive,
  Trash2,
  Download,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";

import { useProjectStore } from "@/stores/project-store";
import { useUiStore } from "@/stores/ui-store";
import { storage } from "@/lib/storage";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { EmptyState } from "@/components/ui/empty-state";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";

import { CreateProjectDrawer } from "@/components/shared/CreateProjectDrawer";

// Phase color classes for the top strip
const phaseStripColors: Record<number, string> = {
  1: "bg-phase-1",
  2: "bg-phase-2",
  3: "bg-phase-3",
  4: "bg-phase-4",
  5: "bg-phase-5",
  6: "bg-phase-6",
  7: "bg-phase-7",
};

export default function ProjectsPage() {
  const router = useRouter();
  const { projects, loadProjects, deleteProject, updateProject } =
    useProjectStore();
  const { setBreadcrumbs, setActions } = useUiStore();

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [projectToDelete, setProjectToDelete] = useState<string | null>(null);

  useEffect(() => {
    loadProjects();
    setBreadcrumbs([{ label: "Projects" }]);
    setActions([]);
  }, [loadProjects, setBreadcrumbs, setActions]);

  const handleDelete = (id: string) => {
    setProjectToDelete(id);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (projectToDelete) {
      deleteProject(projectToDelete);
    }
    setDeleteDialogOpen(false);
    setProjectToDelete(null);
  };

  const handleArchive = (id: string) => {
    updateProject(id, { status: "archived" });
  };

  const handleExport = async (id: string) => {
    const project = projects.find((p) => p.id === id);
    if (!project) return;
    const docs = await storage.getDocuments(id);
    const progress = storage.getProgress(id);
    const data = JSON.stringify({ project, documents: docs, progress }, null, 2);
    const blob = new Blob([data], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${project.title.replace(/\s+/g, "-").toLowerCase()}-export.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const activeProjects = projects.filter((p) => p.status !== "archived");

  return (
    <>
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-heading font-bold text-foreground">
          Projects
        </h1>
        <Button onClick={() => setDrawerOpen(true)}>
          <Plus className="h-4 w-4" />
          New Project
        </Button>
      </div>

      {/* Grid or Empty State */}
      {activeProjects.length === 0 ? (
        <div className="mt-16">
          <EmptyState
            icon={FolderOpen}
            title="No projects yet"
            description="Create your first grant proposal project to get started"
            action={{
              label: "Create Project",
              onClick: () => setDrawerOpen(true),
            }}
          />
        </div>
      ) : (
        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {activeProjects.map((project, i) => {
            const phaseCompletion = Math.round(
              ((project.currentPhase - 1) / 7) * 100
            );

            return (
              <motion.div
                key={project.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: i * 0.05 }}
              >
                <Card
                  className="group cursor-pointer hover:shadow-card-hover hover:border-border transition-all duration-normal"
                  onClick={() =>
                    router.push(`/projects/${project.id}`)
                  }
                >
                  {/* Phase color strip */}
                  <div
                    className={`h-0.75 ${phaseStripColors[project.currentPhase] ?? "bg-accent-500"}`}
                  />

                  <CardContent className="pt-4">
                    {/* Title */}
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="font-heading text-lg font-semibold text-foreground line-clamp-2">
                        {project.title}
                      </h3>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent
                          align="end"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <DropdownMenuItem
                            onClick={() => handleExport(project.id)}
                          >
                            <Download className="h-4 w-4" />
                            Export
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleArchive(project.id)}
                          >
                            <Archive className="h-4 w-4" />
                            Archive
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            className="text-error focus:text-error"
                            onClick={() => handleDelete(project.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>

                    {/* Funder badge */}
                    {project.targetFunder && (
                      <Badge className="mt-2">{project.targetFunder}</Badge>
                    )}

                    {/* Progress */}
                    <div className="mt-3">
                      <div className="flex items-center justify-between text-xs text-muted-foreground mb-1.5">
                        <span>
                          Phase {project.currentPhase} of 7
                        </span>
                        <span>{phaseCompletion}%</span>
                      </div>
                      <Progress value={phaseCompletion} />
                    </div>

                    {/* Meta */}
                    <div className="mt-3 flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">
                        {project.discipline}
                        {project.country ? ` · ${project.country}` : ""}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(project.updatedAt), {
                          addSuffix: true,
                        })}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Create Project Drawer */}
      <CreateProjectDrawer
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
      />

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Project</DialogTitle>
            <DialogDescription>
              This action cannot be undone. All project data, documents, and
              progress will be permanently deleted.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="secondary"
              onClick={() => setDeleteDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button variant="destructive" onClick={confirmDelete}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
