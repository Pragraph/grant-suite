"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  CheckCircle2,
  Copy,
  Download,
  ExternalLink,
  FileDown,
  FileText,
  Loader2,
  Lock,
  PackageOpen,
  Send,
  Trash2,
  Upload,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { storage } from "@/lib/storage";
import { useProgressStore } from "@/stores/progress-store";
import {
  EXTERNAL_DRAFTING_PROMPT,
  downloadProjectBundle,
  saveCompletedDraft,
  listCompletedDrafts,
  deleteCompletedDraft,
  getCompletedDraftBlob,
  deriveKindFromFilename,
  type CompletedDraftKind,
  type CompletedDraftMetadata,
} from "@/lib/external-drafting";
import { PHASE_DEFINITIONS } from "@/lib/constants";

interface Phase5ExternalDraftingPanelProps {
  projectId: string;
  unlocked: boolean;
}

const PHASE_5_STEPS = PHASE_DEFINITIONS.find((p) => p.phase === 5)?.steps ?? [];
const PROMPT_PREVIEW_LENGTH = 240;

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

function formatTimestamp(iso: string): string {
  try {
    const date = new Date(iso);
    return date.toLocaleString();
  } catch {
    return iso;
  }
}

export function Phase5ExternalDraftingPanel({
  projectId,
  unlocked,
}: Phase5ExternalDraftingPanelProps) {
  const [expanded, setExpanded] = useState(false);
  const [bundleBuilding, setBundleBuilding] = useState(false);
  const [drafts, setDrafts] = useState<CompletedDraftMetadata[]>([]);
  const [draftsLoading, setDraftsLoading] = useState(false);
  const [uploadingKind, setUploadingKind] = useState<CompletedDraftKind | null>(null);
  const [promptExpanded, setPromptExpanded] = useState(false);
  const [whyExpanded, setWhyExpanded] = useState(false);
  const [completing, setCompleting] = useState(false);
  const docxInputRef = useRef<HTMLInputElement | null>(null);
  const mdInputRef = useRef<HTMLInputElement | null>(null);

  const updateStepStatus = useProgressStore((s) => s.updateStepStatus);
  const updateGateStatus = useProgressStore((s) => s.updateGateStatus);

  const refreshDrafts = useCallback(async () => {
    if (!projectId) return;
    const list = await listCompletedDrafts(projectId);
    setDrafts(list);
    setDraftsLoading(false);
  }, [projectId]);

  useEffect(() => {
    if (!projectId) return;
    let cancelled = false;
    async function load() {
      const list = await listCompletedDrafts(projectId);
      if (cancelled) return;
      setDrafts(list);
      setDraftsLoading(false);
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, [projectId]);

  const hasCompletedDraft = drafts.length > 0;

  const promptPreview = useMemo(() => {
    if (promptExpanded) return EXTERNAL_DRAFTING_PROMPT;
    return `${EXTERNAL_DRAFTING_PROMPT.slice(0, PROMPT_PREVIEW_LENGTH)}…`;
  }, [promptExpanded]);

  const handleCopyPrompt = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(EXTERNAL_DRAFTING_PROMPT);
      toast.success("Prompt copied", {
        description: "Paste it into your LLM chat alongside the form and bundle.",
      });
    } catch {
      toast.error("Failed to copy prompt");
    }
  }, []);

  const handleDownloadBundle = useCallback(async () => {
    if (!projectId) return;
    setBundleBuilding(true);
    try {
      const summary = await downloadProjectBundle(projectId);
      if (summary.documentCount === 0) {
        toast.warning("Bundle downloaded, but it's empty", {
          description:
            "Complete some upstream phases first so the bundle has content for the LLM.",
        });
      } else {
        toast.success("Bundle downloaded", {
          description: `${summary.documentCount} markdown file${
            summary.documentCount === 1 ? "" : "s"
          } across Phase ${summary.phases.join(", ")}.`,
        });
      }
    } catch (err) {
      toast.error("Bundle download failed", {
        description: err instanceof Error ? err.message : "Unknown error",
      });
    } finally {
      setBundleBuilding(false);
    }
  }, [projectId]);

  const handleUpload = useCallback(
    async (file: File, kind: CompletedDraftKind) => {
      if (!projectId) return;
      const inferred = deriveKindFromFilename(file.name);
      if (inferred && inferred !== kind) {
        toast.error(`Wrong file type for ${kind.toUpperCase()} slot`, {
          description: `Expected a .${kind} file, received "${file.name}".`,
        });
        return;
      }
      setUploadingKind(kind);
      try {
        const meta = await saveCompletedDraft(projectId, file, kind);
        toast.success(`Saved draft v${meta.version}`, {
          description: `${file.name} (${formatBytes(file.size)})`,
        });
        await refreshDrafts();
      } catch (err) {
        toast.error("Upload failed", {
          description: err instanceof Error ? err.message : "Unknown error",
        });
      } finally {
        setUploadingKind(null);
      }
    },
    [projectId, refreshDrafts],
  );

  const handleDelete = useCallback(
    async (draftId: string) => {
      if (!projectId) return;
      try {
        await deleteCompletedDraft(projectId, draftId);
        await refreshDrafts();
        toast.success("Draft removed");
      } catch (err) {
        toast.error("Could not delete draft", {
          description: err instanceof Error ? err.message : "Unknown error",
        });
      }
    },
    [projectId, refreshDrafts],
  );

  const handleDownloadDraft = useCallback(
    async (draft: CompletedDraftMetadata) => {
      if (!projectId) return;
      try {
        const record = await getCompletedDraftBlob(projectId, draft.id);
        if (!record) {
          toast.error("Draft content is missing");
          return;
        }
        const url = URL.createObjectURL(record.blob);
        const anchor = document.createElement("a");
        anchor.href = url;
        anchor.download = `v${draft.version}_${draft.filename}`;
        anchor.click();
        URL.revokeObjectURL(url);
      } catch (err) {
        toast.error("Download failed", {
          description: err instanceof Error ? err.message : "Unknown error",
        });
      }
    },
    [projectId],
  );

  const handleMarkComplete = useCallback(async () => {
    if (!projectId) return;
    if (!hasCompletedDraft) {
      toast.error("Upload at least one completed draft first", {
        description: "Drop in the DOCX (and optional .md) produced by your external LLM session.",
      });
      return;
    }
    setCompleting(true);
    try {
      for (const stepDef of PHASE_5_STEPS) {
        updateStepStatus(projectId, 5, stepDef.step, "complete");
      }
      updateGateStatus(projectId, 5, "passed");
      const proj = storage.getProject(projectId);
      if (proj) {
        storage.saveProject({ ...proj, currentPhase: 6, currentStep: 1 });
      }
      toast.success("Phase 5 marked complete", {
        description: "Continuing to Phase 6.",
      });
      setTimeout(() => {
        window.location.assign(`/projects/${projectId}/phase/6`);
      }, 300);
    } catch (err) {
      toast.error("Could not mark Phase 5 complete", {
        description: err instanceof Error ? err.message : "Unknown error",
      });
    } finally {
      setCompleting(false);
    }
  }, [hasCompletedDraft, projectId, updateGateStatus, updateStepStatus]);

  return (
    <Card
      id="phase5-external-drafting"
      className={cn(
        "border-phase-5/30 bg-phase-5/5",
        !unlocked && "opacity-70",
      )}
    >
      <CardContent className="p-5 space-y-4">
        <div className="flex items-start gap-3">
          <div
            className={cn(
              "flex h-9 w-9 shrink-0 items-center justify-center rounded-full border-2",
              unlocked
                ? "border-phase-5 bg-phase-5/10 text-phase-5"
                : "border-border bg-transparent text-muted-foreground",
            )}
          >
            <Send className="h-4 w-4" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-base font-semibold text-foreground">
                External Drafting Bundle
              </h3>
              <Badge variant="outline" className="text-[10px] border-phase-5/40 text-phase-5">
                Recommended
              </Badge>
              {!unlocked && (
                <Badge variant="outline" className="text-[10px] border-border text-muted-foreground">
                  <Lock className="h-2.5 w-2.5 mr-0.5" />
                  Locked
                </Badge>
              )}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Compile your project data, draft the proposal sections in any frontier LLM
              (ChatGPT 5.5 Thinking or Claude Opus 4.7), then upload the generated draft back here.
            </p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setExpanded((prev) => !prev)}
            className="shrink-0"
          >
            {expanded ? "Hide" : "Open"}
          </Button>
        </div>

        {!unlocked && (
          <p className="text-xs text-muted-foreground italic">
            Complete &quot;Data Compilation&quot; (Step 1) first so the bundle has compiled
            proposal data for the LLM.
          </p>
        )}

        {expanded && unlocked && (
          <div className="space-y-5 pt-2">
            {/* ── Section A: Download bundle ─────────────────────────── */}
            <section className="space-y-2">
              <div className="flex items-center gap-2">
                <PackageOpen className="h-4 w-4 text-phase-5" />
                <h4 className="text-sm font-medium text-foreground">
                  1. Download project bundle
                </h4>
              </div>
              <p className="text-xs text-muted-foreground">
                ZIP of every project markdown file produced so far (Phases 1–5). Upload this to
                your LLM along with the grant form file.
              </p>
              <Button
                onClick={handleDownloadBundle}
                disabled={bundleBuilding}
                size="sm"
                className="bg-phase-5 hover:bg-phase-5/90 text-white"
              >
                {bundleBuilding ? (
                  <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
                ) : (
                  <Download className="h-3.5 w-3.5 mr-1.5" />
                )}
                Download bundle (.zip)
              </Button>
            </section>

            {/* ── Section B: External drafting prompt ────────────────── */}
            <section className="space-y-2">
              <div className="flex items-center gap-2">
                <ExternalLink className="h-4 w-4 text-phase-5" />
                <h4 className="text-sm font-medium text-foreground">
                  2. Draft externally
                </h4>
              </div>
              <p className="text-xs text-muted-foreground">
                Open ChatGPT 5.5 Thinking or Claude Opus 4.7 in a new tab. Attach your grant form
                (PDF or DOCX) <strong>and</strong> the bundle you just downloaded. Paste the prompt
                below. Follow the section-by-section drafting workflow.
              </p>
              <div className="flex flex-wrap items-center gap-2">
                <Button onClick={handleCopyPrompt} size="sm" variant="secondary">
                  <Copy className="h-3.5 w-3.5 mr-1.5" />
                  Copy prompt
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setPromptExpanded((p) => !p)}
                >
                  {promptExpanded ? "Collapse preview" : "Expand full prompt"}
                </Button>
              </div>
              <Textarea
                readOnly
                value={promptPreview}
                className="text-[11px] font-mono leading-relaxed"
                rows={promptExpanded ? 24 : 6}
              />
              <button
                type="button"
                onClick={() => setWhyExpanded((p) => !p)}
                className="text-[11px] text-phase-5 hover:underline"
              >
                {whyExpanded ? "Hide" : "Why external drafting?"}
              </button>
              {whyExpanded && (
                <p className="text-[11px] text-muted-foreground leading-relaxed">
                  Grant forms have dozens of bespoke fields, instructions in multiple languages,
                  and idiosyncratic structures. Frontier LLMs read those forms accurately when
                  given the file directly. Drafting externally avoids building a fragile
                  form-extraction pipeline in-app while keeping your project data as the
                  authoritative source. Once drafted, you upload the result back here so it lives
                  with the rest of the project.
                </p>
              )}
            </section>

            {/* ── Section C: Upload completed draft ──────────────────── */}
            <section className="space-y-2">
              <div className="flex items-center gap-2">
                <Upload className="h-4 w-4 text-phase-5" />
                <h4 className="text-sm font-medium text-foreground">
                  3. Upload completed draft
                </h4>
              </div>
              <p className="text-xs text-muted-foreground">
                Drop the DOCX exported from your LLM session. Add the markdown copy too if you
                have it. Re-uploading creates a new version — older versions stay accessible.
              </p>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-2 rounded-lg border border-border bg-background p-3">
                  <div className="flex items-center gap-2">
                    <FileText className="h-3.5 w-3.5 text-phase-5" />
                    <p className="text-xs font-medium text-foreground">DOCX</p>
                  </div>
                  <p className="text-[11px] text-muted-foreground">
                    Primary submission-ready file.
                  </p>
                  <input
                    ref={docxInputRef}
                    type="file"
                    aria-label="Upload completed draft DOCX"
                    accept=".docx,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                    className="hidden"
                    onChange={(event) => {
                      const file = event.target.files?.[0];
                      if (file) void handleUpload(file, "docx");
                      event.target.value = "";
                    }}
                  />
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => docxInputRef.current?.click()}
                    disabled={uploadingKind !== null}
                    className="w-full"
                  >
                    {uploadingKind === "docx" ? (
                      <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
                    ) : (
                      <Upload className="h-3.5 w-3.5 mr-1.5" />
                    )}
                    Upload DOCX
                  </Button>
                </div>
                <div className="space-y-2 rounded-lg border border-border bg-background p-3">
                  <div className="flex items-center gap-2">
                    <FileText className="h-3.5 w-3.5 text-phase-5/60" />
                    <p className="text-xs font-medium text-foreground">Markdown (optional)</p>
                  </div>
                  <p className="text-[11px] text-muted-foreground">
                    For diffing, re-runs, or downstream tooling.
                  </p>
                  <input
                    ref={mdInputRef}
                    type="file"
                    aria-label="Upload completed draft markdown"
                    accept=".md,.markdown,text/markdown"
                    className="hidden"
                    onChange={(event) => {
                      const file = event.target.files?.[0];
                      if (file) void handleUpload(file, "md");
                      event.target.value = "";
                    }}
                  />
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => mdInputRef.current?.click()}
                    disabled={uploadingKind !== null}
                    className="w-full"
                  >
                    {uploadingKind === "md" ? (
                      <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
                    ) : (
                      <Upload className="h-3.5 w-3.5 mr-1.5" />
                    )}
                    Upload markdown
                  </Button>
                </div>
              </div>

              <div className="space-y-1.5">
                <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
                  Uploaded drafts
                </p>
                {draftsLoading ? (
                  <p className="text-xs text-muted-foreground italic">Loading…</p>
                ) : drafts.length === 0 ? (
                  <p className="text-xs text-muted-foreground italic">
                    No drafts uploaded yet.
                  </p>
                ) : (
                  <ul className="space-y-1.5">
                    {drafts.map((draft) => (
                      <li
                        key={draft.id}
                        className="flex items-center gap-3 rounded-md border border-border bg-background px-3 py-2 text-xs"
                      >
                        <Badge variant="outline" className="uppercase text-[9px]">
                          {draft.kind}
                        </Badge>
                        <span className="font-mono text-foreground flex-1 truncate">
                          v{draft.version} · {draft.filename}
                        </span>
                        <span className="text-muted-foreground shrink-0">
                          {formatBytes(draft.size)} · {formatTimestamp(draft.uploadedAt)}
                        </span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => void handleDownloadDraft(draft)}
                          className="h-7 px-2 text-muted-foreground hover:text-foreground"
                          aria-label="Download draft"
                        >
                          <FileDown className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => void handleDelete(draft.id)}
                          className="h-7 px-2 text-red-500 hover:text-red-600 hover:bg-red-50"
                          aria-label="Delete draft"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </section>

            {/* ── Section D: Mark complete ────────────────────────────── */}
            <section className="space-y-2 pt-2 border-t border-phase-5/15">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-phase-5" />
                <h4 className="text-sm font-medium text-foreground">
                  4. Mark Phase 5 complete
                </h4>
              </div>
              <p className="text-xs text-muted-foreground">
                Marks all Phase 5 steps complete and moves you to Phase 6. Requires at least one
                uploaded completed draft.
              </p>
              <Button
                onClick={handleMarkComplete}
                disabled={!hasCompletedDraft || completing}
                size="sm"
                className="bg-phase-5 hover:bg-phase-5/90 text-white"
              >
                {completing ? (
                  <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
                ) : (
                  <CheckCircle2 className="h-3.5 w-3.5 mr-1.5" />
                )}
                Mark Phase 5 complete
              </Button>
            </section>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
