"use client";

import { useEffect, useState } from "react";

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

export default function ProjectsPage() {
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
        <h1 className="text-3xl font-heading font-bold text-gray-900">
          Projects
        </h1>
        <Button onClick={() => setDrawerOpen(true)} className="bg-[#4F7DF3] hover:bg-[#3B63D4] text-white rounded-lg px-5 py-2.5 font-semibold">
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
                <a href={`/projects/${project.id}`} className="no-underline text-inherit block">
                  <Card
                    className="group bg-white rounded-xl border border-gray-200 hover:shadow-md transition-shadow cursor-pointer"
                  >
                    {/* Phase color strip */}
                    <div
                      className="h-0.5 bg-[#4F7DF3]"
                    />

                    <CardContent className="pt-4 p-6">
                      {/* Title */}
                      <div className="flex items-start justify-between gap-2">
                        <h3 className="font-heading text-lg font-semibold text-gray-900 line-clamp-2">
                          {project.title}
                        </h3>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
                              onClick={(e) => e.preventDefault()}
                            >
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent
                            align="end"
                            onClick={(e) => e.preventDefault()}
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

                      {/* Grant scheme & funder badges */}
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        {project.grantScheme && (
                          <Badge className="bg-[#F0F4FF] text-[#4F7DF3] rounded-full px-3 py-1 text-xs font-semibold">
                            {project.grantScheme}
                          </Badge>
                        )}
                        {project.targetFunder && !project.grantScheme && (
                          <Badge className="bg-[#F0F4FF] text-[#4F7DF3] rounded-full px-3 py-1 text-xs font-semibold">
                            {project.targetFunder}
                          </Badge>
                        )}
                      </div>

                      {/* Progress */}
                      <div className="mt-3">
                        <div className="flex items-center justify-between text-xs mb-1.5">
                          <span className="text-sm text-gray-500">
                            Phase {project.currentPhase} of 7
                          </span>
                          <span className="text-sm text-gray-400">{phaseCompletion}%</span>
                        </div>
                        <Progress value={phaseCompletion} />
                      </div>

                      {/* Meta */}
                      <div className="mt-3 flex items-center justify-between">
                        <span className="text-sm text-gray-500">
                          {project.discipline}
                          {project.country ? ` · ${project.country}` : ""}
                        </span>
                        <span className="text-sm text-gray-400">
                          {formatDistanceToNow(new Date(project.updatedAt), {
                            addSuffix: true,
                          })}
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                </a>
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
