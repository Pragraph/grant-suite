"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  CheckCircle2,
  Copy,
  Download,
  FileDown,
  FileText,
  HelpCircle,
  Loader2,
  Lock,
  Trash2,
  Upload,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { storage } from "@/lib/storage";
import { useProgressStore } from "@/stores/progress-store";
import {
  buildExternalDraftingPrompt,
  downloadProjectBundle,
  saveCompletedDraft,
  listCompletedDrafts,
  deleteCompletedDraft,
  getCompletedDraftBlob,
  deriveKindFromFilename,
  getProjectOutputLanguage,
  setProjectOutputLanguage,
  SUPPORTED_OUTPUT_LANGUAGES,
  DEFAULT_OUTPUT_LANGUAGE,
  type CompletedDraftKind,
  type CompletedDraftMetadata,
  type SupportedOutputLanguage,
} from "@/lib/external-drafting";
import { PHASE_DEFINITIONS } from "@/lib/constants";

interface Phase5ExternalDraftingPanelProps {
  projectId: string;
  unlocked: boolean;
}

const PHASE_5_STEPS = PHASE_DEFINITIONS.find((p) => p.phase === 5)?.steps ?? [];

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

function downloadTextFile(content: string, filename: string, mime: string): void {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

export function Phase5ExternalDraftingPanel({
  projectId,
  unlocked,
}: Phase5ExternalDraftingPanelProps) {
  const [bundleBuilding, setBundleBuilding] = useState(false);
  const [pdfConverting, setPdfConverting] = useState(false);
  const [drafts, setDrafts] = useState<CompletedDraftMetadata[]>([]);
  const [draftsLoading, setDraftsLoading] = useState(true);
  const [uploadingKind, setUploadingKind] = useState<CompletedDraftKind | null>(null);
  const [promptExpanded, setPromptExpanded] = useState(false);
  const [completing, setCompleting] = useState(false);
  const [outputLanguage, setOutputLanguageState] = useState<SupportedOutputLanguage>(() => {
    if (typeof window === "undefined" || !projectId) return DEFAULT_OUTPUT_LANGUAGE;
    return getProjectOutputLanguage(projectId);
  });
  const docxInputRef = useRef<HTMLInputElement | null>(null);
  const mdInputRef = useRef<HTMLInputElement | null>(null);
  const pdfInputRef = useRef<HTMLInputElement | null>(null);

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

  const builtPrompt = useMemo(
    () => buildExternalDraftingPrompt(outputLanguage),
    [outputLanguage],
  );

  const handleLanguageChange = useCallback(
    (value: string) => {
      const next = SUPPORTED_OUTPUT_LANGUAGES.find((l) => l.value === value)?.value;
      if (!next) return;
      setOutputLanguageState(next);
      if (projectId) setProjectOutputLanguage(projectId, next);
    },
    [projectId],
  );

  const handleCopyPrompt = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(builtPrompt);
      toast.success("Prompt copied", {
        description: `Output language: ${outputLanguage}. Paste it into your LLM alongside the form and bundle.`,
      });
    } catch {
      toast.error("Failed to copy prompt");
    }
  }, [builtPrompt, outputLanguage]);

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

  const handleConvertPdf = useCallback(async (file: File) => {
    if (!file) return;
    if (file.type && file.type !== "application/pdf" && !file.name.toLowerCase().endsWith(".pdf")) {
      toast.error("Pick a PDF file", {
        description: `Received ${file.name}.`,
      });
      return;
    }
    setPdfConverting(true);
    try {
      const { convertPdfToMarkdown } = await import(
        "@/lib/external-drafting/pdf-to-markdown"
      );
      const result = await convertPdfToMarkdown(file);
      if (result.markdown.trim().length === 0) {
        toast.error("Couldn't extract text from this PDF", {
          description:
            result.warnings[0] ??
            "The PDF may be image-based. Try attaching it to your LLM directly instead.",
        });
        return;
      }
      const baseName = file.name.replace(/\.pdf$/i, "");
      downloadTextFile(result.markdown, `${baseName}.md`, "text/markdown");
      if (result.warnings.length > 0) {
        toast.success(`Converted ${result.pageCount} pages`, {
          description: `${result.warnings.length} page(s) had no extractable text. Downloaded ${baseName}.md.`,
        });
      } else {
        toast.success(`Converted ${result.pageCount} pages`, {
          description: `Downloaded ${baseName}.md.`,
        });
      }
    } catch (err) {
      toast.error("PDF conversion failed", {
        description: err instanceof Error ? err.message : "Unknown error",
      });
    } finally {
      setPdfConverting(false);
    }
  }, []);

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
      <CardContent className="p-5 space-y-5">
        {/* ── Header ─────────────────────────────────────────────────────── */}
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
          <Popover>
            <PopoverTrigger asChild>
              <button
                type="button"
                aria-label="Why external drafting?"
                className="ml-auto text-muted-foreground hover:text-foreground transition-colors"
              >
                <HelpCircle className="h-4 w-4" />
              </button>
            </PopoverTrigger>
            <PopoverContent align="end" className="w-80 text-xs leading-relaxed">
              <p className="font-medium text-foreground mb-1">Why external drafting?</p>
              <p className="text-muted-foreground">
                Grant Suite prepares your project context; the LLM does the form-specific drafting.
                This lets you use whichever LLM you prefer and keeps Grant Suite focused on what it
                does best.
              </p>
            </PopoverContent>
          </Popover>
        </div>

        {!unlocked && (
          <p className="text-xs text-muted-foreground italic">
            Complete &quot;Data Compilation&quot; (Step 1) first so the bundle has compiled
            proposal data for the LLM.
          </p>
        )}

        {unlocked && (
          <div className="space-y-5">
            {/* ── 1. Download bundle ─────────────────────────────────────── */}
            <section className="space-y-1.5">
              <h4 className="text-sm font-medium text-foreground">
                1. Download project bundle
              </h4>
              <p className="text-xs text-muted-foreground">
                ZIP of every project markdown produced so far. Upload alongside the grant form.
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

            {/* ── 2. (Optional) Convert PDF to markdown ──────────────────── */}
            <section className="space-y-1.5">
              <h4 className="text-sm font-medium text-foreground">
                2. (Optional) Convert grant form PDF to markdown
              </h4>
              <p className="text-xs text-muted-foreground">
                Better quality for some LLMs. Skip if your LLM reads PDFs natively.
              </p>
              <input
                ref={pdfInputRef}
                type="file"
                aria-label="Pick a PDF to convert to markdown"
                accept=".pdf,application/pdf"
                className="hidden"
                onChange={(event) => {
                  const file = event.target.files?.[0];
                  if (file) void handleConvertPdf(file);
                  event.target.value = "";
                }}
              />
              <Button
                onClick={() => pdfInputRef.current?.click()}
                disabled={pdfConverting}
                size="sm"
                variant="outline"
              >
                {pdfConverting ? (
                  <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
                ) : (
                  <Download className="h-3.5 w-3.5 mr-1.5" />
                )}
                Convert PDF to markdown
              </Button>
            </section>

            {/* ── 3. Open LLM + paste prompt ─────────────────────────────── */}
            <section className="space-y-2">
              <h4 className="text-sm font-medium text-foreground">
                3. Open ChatGPT or Claude, attach files, paste prompt
              </h4>
              <p className="text-xs text-muted-foreground">
                The prompt walks the LLM through outlining, drafting, and exporting.
              </p>
              <div className="flex flex-wrap items-center gap-3">
                <div className="flex items-center gap-2">
                  <label
                    htmlFor="external-drafting-language"
                    className="text-xs text-muted-foreground"
                  >
                    Output language:
                  </label>
                  <Select value={outputLanguage} onValueChange={handleLanguageChange}>
                    <SelectTrigger
                      id="external-drafting-language"
                      className="h-8 w-45 text-xs"
                    >
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {SUPPORTED_OUTPUT_LANGUAGES.map((lang) => (
                        <SelectItem key={lang.value} value={lang.value} className="text-xs">
                          {lang.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-center gap-2 ml-auto">
                  <Button onClick={handleCopyPrompt} size="sm" variant="secondary">
                    <Copy className="h-3.5 w-3.5 mr-1.5" />
                    Copy prompt
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setPromptExpanded((p) => !p)}
                  >
                    {promptExpanded ? "Collapse" : "Expand full prompt"}
                  </Button>
                </div>
              </div>
              {promptExpanded && (
                <Textarea
                  readOnly
                  value={builtPrompt}
                  className="text-[11px] font-mono leading-relaxed"
                  rows={24}
                />
              )}
            </section>

            {/* ── 4. Upload completed draft ──────────────────────────────── */}
            <section className="space-y-2">
              <h4 className="text-sm font-medium text-foreground">
                4. Upload your finished draft
              </h4>
              <p className="text-xs text-muted-foreground">
                Re-uploading creates a new version — older versions stay accessible.
              </p>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-2 rounded-lg border border-border bg-background p-3">
                  <div className="flex items-center gap-2">
                    <FileText className="h-3.5 w-3.5 text-phase-5" />
                    <p className="text-xs font-medium text-foreground">DOCX</p>
                  </div>
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
                    Choose DOCX
                  </Button>
                </div>
                <div className="space-y-2 rounded-lg border border-border bg-background p-3">
                  <div className="flex items-center gap-2">
                    <FileText className="h-3.5 w-3.5 text-phase-5/60" />
                    <p className="text-xs font-medium text-foreground">
                      Markdown (optional)
                    </p>
                  </div>
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
                    Choose markdown
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

            {/* ── Footer: Mark complete ──────────────────────────────────── */}
            <div className="pt-3 border-t border-phase-5/15">
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
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
