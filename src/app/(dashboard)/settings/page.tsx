"use client";

import { useEffect, useState, useCallback, startTransition } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  Settings,
  Sun,
  Moon,
  Monitor,
  PanelLeftClose,
  PanelLeft,
  Download,
  Upload,
  Trash2,
  HardDrive,
  FileText,
  AlertTriangle,
} from "lucide-react";

import { useUiStore } from "@/stores/ui-store";
import { useProjectStore } from "@/stores/project-store";
import { useTheme } from "@/components/providers/theme-provider";
import { storage } from "@/lib/storage";
import type { AppSettings, Project, Document } from "@/lib/types";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";

// ─── Storage size helpers ──────────────────────────────────────────────────

function getLocalStorageSize(): number {
  let total = 0;
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key?.startsWith("grant-suite-")) {
      total += (localStorage.getItem(key) ?? "").length * 2; // UTF-16
    }
  }
  return total;
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

// ─── Project info with doc count + size ────────────────────────────────────

interface ProjectInfo {
  project: Project;
  docCount: number;
  estimatedSize: number;
}

// ─── Main Component ────────────────────────────────────────────────────────

export default function SettingsPage() {
  const router = useRouter();
  const { setBreadcrumbs, setActions, setSidebarMode } = useUiStore();
  const { projects, loadProjects } = useProjectStore();
  const { setTheme: applyTheme } = useTheme();

  // ── Settings state ───────────────────────────────────────────────────────
  const [settings, setSettings] = useState<AppSettings>(storage.getSettings());

  // ── Data management state ────────────────────────────────────────────────
  const [storageUsed, setStorageUsed] = useState(0);
  const [projectInfos, setProjectInfos] = useState<ProjectInfo[]>([]);

  // ── Dialog state ─────────────────────────────────────────────────────────
  const [deleteProjectId, setDeleteProjectId] = useState<string | null>(null);
  const [importPreview, setImportPreview] = useState<{
    json: string;
    projectCount: number;
    documentCount: number;
  } | null>(null);
  const [importMode, setImportMode] = useState<"merge" | "replace">("merge");
  const [clearStep, setClearStep] = useState<0 | 1 | 2>(0);
  const [clearConfirmText, setClearConfirmText] = useState("");

  // ── Init ─────────────────────────────────────────────────────────────────

  useEffect(() => {
    setBreadcrumbs([{ label: "Settings" }]);
    setActions([]);
    loadProjects();
  }, [setBreadcrumbs, setActions, loadProjects]);

  // ── Compute storage usage ────────────────────────────────────────────────

  const refreshStorageInfo = useCallback(async () => {
    const size = getLocalStorageSize();
    const allProjects = storage.getProjects();
    const infos: ProjectInfo[] = [];
    for (const project of allProjects) {
      const docs = await storage.getDocuments(project.id);
      const progressStr = JSON.stringify(storage.getProgress(project.id));
      const docSize = docs.reduce(
        (acc, d) => acc + (d.content?.length ?? 0) * 2,
        0
      );
      infos.push({
        project,
        docCount: docs.length,
        estimatedSize: docSize + progressStr.length * 2,
      });
    }
    // Batch both updates in a transition to avoid cascading-render warning
    startTransition(() => {
      setStorageUsed(size);
      setProjectInfos(infos);
    });
  }, []);

  useEffect(() => {
    void refreshStorageInfo();
  }, [refreshStorageInfo, projects]);

  // ── Settings persistence ─────────────────────────────────────────────────

  const updateSetting = <K extends keyof AppSettings>(
    key: K,
    value: AppSettings[K]
  ) => {
    const next = { ...settings, [key]: value };
    setSettings(next);
    storage.saveSettings(next);

    // Apply side effects immediately
    if (key === "theme") {
      const themeValue = value as AppSettings["theme"];
      if (themeValue === "system") {
        const prefersDark = window.matchMedia(
          "(prefers-color-scheme: dark)"
        ).matches;
        applyTheme(prefersDark ? "dark" : "light");
      } else {
        applyTheme(themeValue);
      }
    }
    if (key === "sidebarCollapsed") {
      setSidebarMode(value ? "collapsed" : "expanded");
    }
  };

  // ── Export single project ────────────────────────────────────────────────

  const exportProject = async (projectId: string) => {
    const project = storage.getProject(projectId);
    if (!project) return;
    const docs = await storage.getDocuments(projectId);
    const progress = storage.getProgress(projectId);
    const data = JSON.stringify(
      {
        version: 1,
        exportedAt: new Date().toISOString(),
        project,
        documents: docs,
        progress,
      },
      null,
      2
    );
    downloadJSON(
      data,
      `${project.title.replace(/\s+/g, "-").toLowerCase()}-backup.json`
    );
  };

  // ── Delete single project ───────────────────────────────────────────────

  const confirmDeleteProject = () => {
    if (deleteProjectId) {
      storage.deleteProject(deleteProjectId);
      loadProjects();
      refreshStorageInfo();
    }
    setDeleteProjectId(null);
  };

  // ── Export all data ──────────────────────────────────────────────────────

  const exportAll = async () => {
    const data = await storage.exportAllData();
    const date = new Date().toISOString().slice(0, 10);
    downloadJSON(data, `grant-suite-backup-${date}.json`);
  };

  // ── Import data ──────────────────────────────────────────────────────────

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const json = reader.result as string;
        const parsed = JSON.parse(json);
        const projectCount =
          parsed.projects?.length ?? (parsed.project ? 1 : 0);
        const documentCount = parsed.documents
          ? Object.values(
              parsed.documents as Record<string, Document[]>
            ).reduce(
              (sum: number, docs: unknown) =>
                sum + (Array.isArray(docs) ? docs.length : 0),
              0
            )
          : 0;
        setImportPreview({ json, projectCount, documentCount });
        setImportMode("merge");
      } catch {
        alert("Invalid JSON file. Please select a valid backup file.");
      }
    };
    reader.readAsText(file);
    e.target.value = "";
  };

  const confirmImport = async () => {
    if (!importPreview) return;
    if (importMode === "replace") {
      storage.clearAllData();
    }
    await storage.importData(importPreview.json);
    loadProjects();
    refreshStorageInfo();
    setImportPreview(null);
  };

  // ── Clear all data ──────────────────────────────────────────────────────

  const confirmClearAll = () => {
    storage.clearAllData();
    setClearStep(0);
    setClearConfirmText("");
    router.push("/projects");
  };

  // ── Download helper ──────────────────────────────────────────────────────

  function downloadJSON(data: string, filename: string) {
    const blob = new Blob([data], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }

  // ── Derived values ──────────────────────────────────────────────────────

  const maxStorage = 5 * 1024 * 1024; // 5 MB
  const usagePercent = Math.min((storageUsed / maxStorage) * 100, 100);

  // ── Render ──────────────────────────────────────────────────────────────

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        {/* Page header */}
        <div className="flex items-center gap-3">
          <Settings className="h-6 w-6 text-muted-foreground" />
          <h1 className="text-2xl font-heading font-bold text-foreground">
            Settings
          </h1>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="preferences" className="mt-6">
          <TabsList>
            <TabsTrigger value="preferences">Preferences</TabsTrigger>
            <TabsTrigger value="data">Data Management</TabsTrigger>
          </TabsList>

          {/* ━━━ PREFERENCES TAB ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
          <TabsContent value="preferences">
            <div className="space-y-6">
              {/* Theme */}
              <Card>
                <CardHeader>
                  <CardTitle>Theme</CardTitle>
                  <CardDescription>
                    Choose your preferred color scheme
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex gap-2">
                    {(
                      [
                        { value: "dark", icon: Moon, label: "Dark" },
                        { value: "light", icon: Sun, label: "Light" },
                        { value: "system", icon: Monitor, label: "System" },
                      ] as const
                    ).map(({ value, icon: Icon, label }) => (
                      <Button
                        key={value}
                        variant={
                          settings.theme === value ? "default" : "secondary"
                        }
                        size="sm"
                        onClick={() => updateSetting("theme", value)}
                        className="gap-2"
                      >
                        <Icon className="h-4 w-4" />
                        {label}
                      </Button>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Sidebar default */}
              <Card>
                <CardHeader>
                  <CardTitle>Sidebar</CardTitle>
                  <CardDescription>
                    Set the default sidebar state
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex gap-2">
                    <Button
                      variant={
                        !settings.sidebarCollapsed ? "default" : "secondary"
                      }
                      size="sm"
                      onClick={() => updateSetting("sidebarCollapsed", false)}
                      className="gap-2"
                    >
                      <PanelLeft className="h-4 w-4" />
                      Expanded
                    </Button>
                    <Button
                      variant={
                        settings.sidebarCollapsed ? "default" : "secondary"
                      }
                      size="sm"
                      onClick={() => updateSetting("sidebarCollapsed", true)}
                      className="gap-2"
                    >
                      <PanelLeftClose className="h-4 w-4" />
                      Collapsed
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Export format */}
              <Card>
                <CardHeader>
                  <CardTitle>Default Export Format</CardTitle>
                  <CardDescription>
                    File format used when exporting documents
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="w-48">
                    <Select
                      value={settings.defaultExportFormat}
                      onValueChange={(v) =>
                        updateSetting(
                          "defaultExportFormat",
                          v as "md" | "docx"
                        )
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="md">Markdown (.md)</SelectItem>
                        <SelectItem value="docx">Word (.docx)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* ━━━ DATA MANAGEMENT TAB ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
          <TabsContent value="data">
            <div className="space-y-6">
              {/* Storage usage */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <HardDrive className="h-4 w-4" />
                    Storage Usage
                  </CardTitle>
                  <CardDescription>
                    Using {formatBytes(storageUsed)} of ~5 MB browser storage
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <Progress value={usagePercent} />
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>{formatBytes(storageUsed)}</span>
                      <span>5 MB limit</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Per-project data */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    Projects
                  </CardTitle>
                  <CardDescription>
                    Manage data for individual projects
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {projectInfos.length === 0 ? (
                    <p className="text-sm text-muted-foreground">
                      No projects yet.
                    </p>
                  ) : (
                    <div className="space-y-3">
                      {projectInfos.map(
                        ({ project, docCount, estimatedSize }) => (
                          <div
                            key={project.id}
                            className="flex items-center justify-between rounded-lg border border-border p-3"
                          >
                            <div className="min-w-0 flex-1">
                              <p className="text-sm font-medium text-foreground truncate">
                                {project.title}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {docCount} document
                                {docCount !== 1 ? "s" : ""} ·{" "}
                                {formatBytes(estimatedSize)}
                              </p>
                            </div>
                            <div className="flex items-center gap-2 ml-4 shrink-0">
                              <Button
                                variant="secondary"
                                size="sm"
                                onClick={() => exportProject(project.id)}
                              >
                                <Download className="h-3.5 w-3.5" />
                                Export
                              </Button>
                              <Button
                                variant="destructive"
                                size="sm"
                                onClick={() => setDeleteProjectId(project.id)}
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                                Delete
                              </Button>
                            </div>
                          </div>
                        )
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Global actions */}
              <Card>
                <CardHeader>
                  <CardTitle>Import & Export</CardTitle>
                  <CardDescription>
                    Back up or restore all your data
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex flex-wrap gap-3">
                  <Button variant="secondary" onClick={exportAll}>
                    <Download className="h-4 w-4" />
                    Export All Data
                  </Button>
                  <Label
                    htmlFor="import-file"
                    className="inline-flex cursor-pointer"
                  >
                    <Button variant="secondary" asChild>
                      <span>
                        <Upload className="h-4 w-4" />
                        Import Data
                      </span>
                    </Button>
                    <input
                      id="import-file"
                      type="file"
                      accept=".json"
                      className="sr-only"
                      title="Select a JSON backup file to import"
                      onChange={handleFileSelect}
                    />
                  </Label>
                </CardContent>
              </Card>

              {/* Danger zone */}
              <Card className="border-error/30">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-error">
                    <AlertTriangle className="h-4 w-4" />
                    Danger Zone
                  </CardTitle>
                  <CardDescription>
                    Irreversible actions — proceed with caution
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between rounded-lg border border-error/20 p-4">
                    <div>
                      <p className="text-sm font-medium text-foreground">
                        Clear All Data
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Permanently delete all projects, documents, and settings
                      </p>
                    </div>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => setClearStep(1)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      Clear All Data
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </motion.div>

      {/* ━━━ DIALOGS ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}

      {/* Delete project confirmation */}
      <Dialog
        open={deleteProjectId !== null}
        onOpenChange={(open) => !open && setDeleteProjectId(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Project</DialogTitle>
            <DialogDescription>
              This will permanently delete this project and all its documents
              and progress. This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="secondary"
              onClick={() => setDeleteProjectId(null)}
            >
              Cancel
            </Button>
            <Button variant="destructive" onClick={confirmDeleteProject}>
              Delete Project
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Import preview dialog */}
      <Dialog
        open={importPreview !== null}
        onOpenChange={(open) => !open && setImportPreview(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Import Data</DialogTitle>
            <DialogDescription>
              The backup file contains:
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div className="rounded-lg border border-border p-3 text-sm space-y-1">
              <p className="text-foreground">
                <span className="font-medium">
                  {importPreview?.projectCount ?? 0}
                </span>{" "}
                project
                {(importPreview?.projectCount ?? 0) !== 1 ? "s" : ""}
              </p>
              <p className="text-foreground">
                <span className="font-medium">
                  {importPreview?.documentCount ?? 0}
                </span>{" "}
                document
                {(importPreview?.documentCount ?? 0) !== 1 ? "s" : ""}
              </p>
            </div>
            <div className="space-y-2">
              <Label className="text-sm text-muted-foreground">
                Import mode
              </Label>
              <div className="flex gap-2">
                <Button
                  variant={importMode === "merge" ? "default" : "secondary"}
                  size="sm"
                  onClick={() => setImportMode("merge")}
                >
                  Merge
                </Button>
                <Button
                  variant={
                    importMode === "replace" ? "destructive" : "secondary"
                  }
                  size="sm"
                  onClick={() => setImportMode("replace")}
                >
                  Replace All
                </Button>
              </div>
              {importMode === "replace" && (
                <p className="text-xs text-error">
                  Warning: This will delete all existing data before importing.
                </p>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="secondary"
              onClick={() => setImportPreview(null)}
            >
              Cancel
            </Button>
            <Button
              variant={importMode === "replace" ? "destructive" : "default"}
              onClick={confirmImport}
            >
              {importMode === "replace" ? "Replace & Import" : "Import"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Clear all — step 1 */}
      <Dialog
        open={clearStep === 1}
        onOpenChange={(open) => !open && setClearStep(0)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-error">
              <AlertTriangle className="h-5 w-5" />
              Clear All Data
            </DialogTitle>
            <DialogDescription>
              This will permanently delete all projects, documents, progress,
              and settings. This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="secondary" onClick={() => setClearStep(0)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={() => setClearStep(2)}>
              Continue
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Clear all — step 2: type DELETE */}
      <Dialog
        open={clearStep === 2}
        onOpenChange={(open) => {
          if (!open) {
            setClearStep(0);
            setClearConfirmText("");
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-error">
              Final Confirmation
            </DialogTitle>
            <DialogDescription>
              Type{" "}
              <span className="font-mono font-bold text-foreground">
                DELETE
              </span>{" "}
              below to confirm you want to erase all data.
            </DialogDescription>
          </DialogHeader>
          <div className="py-2">
            <Input
              placeholder="Type DELETE to confirm"
              value={clearConfirmText}
              onChange={(e) => setClearConfirmText(e.target.value)}
              autoFocus
            />
          </div>
          <DialogFooter>
            <Button
              variant="secondary"
              onClick={() => {
                setClearStep(0);
                setClearConfirmText("");
              }}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              disabled={clearConfirmText !== "DELETE"}
              onClick={confirmClearAll}
            >
              Erase Everything
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
