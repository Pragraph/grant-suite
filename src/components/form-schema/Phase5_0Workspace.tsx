"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import {
  AlertTriangle,
  Clipboard,
  Download,
  FileText,
  FilePlus,
  FileUp,
  Globe,
  Loader2,
  Pencil,
  RefreshCw,
  Trash2,
  Upload,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  buildTier1Prompt,
  buildTier2Prompt,
  parseSchemaPaste,
  validateFormSchema,
  saveFormSchema,
  loadFormSchema,
  deleteFormSchema,
  saveFormFile,
  loadFormFiles,
  deleteFormFile,
  type FormSchema,
  type StoredFormFile,
  type ValidationError,
} from "@/lib/form-schema";
import { cn } from "@/lib/utils";

import { SchemaEditor } from "./SchemaEditor";

interface Phase5_0WorkspaceProps {
  projectId: string;
}

type Mode = "select" | "tier-1" | "tier-2";

const ACCEPT = ".pdf,.png,.jpg,.jpeg,.webp";

export function Phase5_0Workspace({ projectId }: Phase5_0WorkspaceProps) {
  const [schema, setSchema] = useState<FormSchema | null>(null);
  const [loading, setLoading] = useState(true);
  const [mode, setMode] = useState<Mode>("select");
  const [files, setFiles] = useState<StoredFormFile[]>([]);

  // Tier 2 inputs
  const [schemeName, setSchemeName] = useState("");
  const [funder, setFunder] = useState("");
  const [year, setYear] = useState<string>(new Date().getFullYear().toString());
  const [url, setUrl] = useState("");

  // Paste-back UI
  const [pasteRaw, setPasteRaw] = useState("");
  const [pasteError, setPasteError] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<ValidationError[]>([]);
  const [validating, setValidating] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      const [loadedSchema, loadedFiles] = await Promise.all([
        loadFormSchema(projectId),
        loadFormFiles(projectId),
      ]);
      if (cancelled) return;
      setSchema(loadedSchema);
      setFiles(loadedFiles);
      setLoading(false);
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [projectId]);

  const refreshFiles = useCallback(async () => {
    const next = await loadFormFiles(projectId);
    setFiles(next);
  }, [projectId]);

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const list = event.target.files;
    if (!list) return;
    for (const f of Array.from(list)) {
      await saveFormFile(projectId, f);
    }
    await refreshFiles();
    event.target.value = "";
    toast.success(`Uploaded ${list.length} file${list.length === 1 ? "" : "s"}.`);
  };

  const handleDeleteFile = async (filename: string) => {
    await deleteFormFile(projectId, filename);
    await refreshFiles();
  };

  const handleDownloadFile = (file: StoredFormFile) => {
    const objectUrl = URL.createObjectURL(file.blob);
    const a = document.createElement("a");
    a.href = objectUrl;
    a.download = file.filename;
    a.click();
    URL.revokeObjectURL(objectUrl);
  };

  const copyTier1Prompt = async () => {
    try {
      await navigator.clipboard.writeText(buildTier1Prompt());
      toast.success("Prompt copied — paste into your LLM and attach the form file(s) you uploaded.");
    } catch {
      toast.error("Clipboard access denied. Copy the prompt manually from the preview below.");
    }
  };

  const copyTier2Prompt = async () => {
    if (!schemeName.trim() || !funder.trim()) {
      toast.error("Scheme name and funder are required.");
      return;
    }
    const parsedYear = parseInt(year, 10);
    if (!Number.isInteger(parsedYear) || parsedYear < 1900 || parsedYear > 2100) {
      toast.error("Enter a valid year between 1900 and 2100.");
      return;
    }
    try {
      await navigator.clipboard.writeText(
        buildTier2Prompt({
          schemeName: schemeName.trim(),
          funder: funder.trim(),
          year: parsedYear,
          url: url.trim() || undefined,
        }),
      );
      toast.success("Prompt copied — paste into your LLM with web search enabled.");
    } catch {
      toast.error("Clipboard access denied. Copy the prompt manually.");
    }
  };

  const handleValidateAndLoad = async () => {
    setPasteError(null);
    setValidationErrors([]);
    setValidating(true);
    try {
      const parsed = parseSchemaPaste(pasteRaw);
      if (parsed.error) {
        setPasteError(parsed.error + (parsed.errorPosition ? ` (position ${parsed.errorPosition})` : ""));
        return;
      }
      const validation = validateFormSchema(parsed.schema);
      if (!validation.valid) {
        setValidationErrors(validation.errors);
        return;
      }
      const next = parsed.schema as FormSchema;
      await saveFormSchema(projectId, next);
      setSchema(next);
      setPasteRaw("");
      setMode("select");
      toast.success("Schema loaded — review fields below.");
    } finally {
      setValidating(false);
    }
  };

  const handleResetSchema = async () => {
    if (!schema) return;
    const confirmed = window.confirm(
      "Delete this Form Schema for the current project? Uploaded form files remain stored.",
    );
    if (!confirmed) return;
    await deleteFormSchema(projectId);
    setSchema(null);
    setMode("select");
  };

  const sourceType = schema?.form_metadata.source.type;

  const tier1Preview = useMemo(() => buildTier1Prompt().slice(0, 280) + "…", []);

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground py-12 justify-center">
        <Loader2 className="h-4 w-4 animate-spin" /> Loading Phase 5-0…
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <header className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <p className="text-xs uppercase tracking-wider text-muted-foreground">Phase 5-0</p>
          <h1 className="text-xl font-semibold text-foreground">Form Schema</h1>
          <p className="text-sm text-muted-foreground max-w-2xl">
            Produce a structured <code className="text-[11px] bg-muted px-1 py-0.5 rounded">Form_Schema.json</code>{" "}
            describing the funder&apos;s actual application form. Choose an input path below — all three produce the
            same schema shape.
          </p>
        </div>
        {schema && (
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => setMode(sourceType === "web-reconstructed" ? "tier-2" : "tier-1")}>
              <RefreshCw className="h-3.5 w-3.5" />
              Re-extract
            </Button>
            <Button variant="ghost" size="sm" onClick={handleResetSchema}>
              <Trash2 className="h-3.5 w-3.5" />
              Reset
            </Button>
          </div>
        )}
      </header>

      {!schema && mode === "select" && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <TierCard
            tier={1}
            title="I have the form file"
            description="Upload the PDF or screenshots of the application form. Generate an extraction prompt, paste your LLM's JSON output back."
            Icon={FileUp}
            onSelect={() => setMode("tier-1")}
          />
          <TierCard
            tier={2}
            title="Reconstruct from web"
            description="No form file? Provide the scheme name, funder, year, and optional URL. Your LLM (with web search) reconstructs the form from public documentation."
            Icon={Globe}
            onSelect={() => setMode("tier-2")}
          />
          <TierCard
            tier={3}
            title="Build manually"
            description="Hand-build the schema field by field in the editor. Best when documentation is incomplete."
            Icon={Pencil}
            disabled
            note="Coming in v21-R2"
          />
        </div>
      )}

      {!schema && mode === "tier-1" && (
        <Card>
          <CardContent className="p-5 space-y-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs uppercase tracking-wider text-muted-foreground">Tier 1</p>
                <h2 className="text-base font-semibold text-foreground">Upload the form, then paste the schema</h2>
              </div>
              <Button variant="ghost" size="sm" onClick={() => setMode("select")}>
                Back
              </Button>
            </div>

            <div className="space-y-2">
              <Label className="text-xs">Form files (PDF, PNG, JPG, WEBP)</Label>
              <div className="flex items-center gap-2">
                <Button type="button" variant="outline" size="sm" onClick={() => fileInputRef.current?.click()}>
                  <Upload className="h-3.5 w-3.5" />
                  Upload form file(s)
                </Button>
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept={ACCEPT}
                  className="hidden"
                  onChange={handleFileSelect}
                />
                <span className="text-xs text-muted-foreground">{files.length} file{files.length === 1 ? "" : "s"} stored</span>
              </div>
              {files.length > 0 && (
                <ul className="space-y-1">
                  {files.map((f) => (
                    <li
                      key={f.filename}
                      className="flex items-center gap-2 rounded border border-border px-3 py-1.5 text-xs"
                    >
                      <FileText className="h-3.5 w-3.5 text-muted-foreground" />
                      <span className="flex-1 truncate text-foreground">{f.filename}</span>
                      <span className="text-muted-foreground">{(f.size / 1024).toFixed(0)} KB</span>
                      <Button type="button" variant="ghost" size="sm" onClick={() => handleDownloadFile(f)}>
                        <Download className="h-3 w-3" />
                      </Button>
                      <Button type="button" variant="ghost" size="sm" onClick={() => handleDeleteFile(f.filename)}>
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="space-y-2 border-t border-border pt-4">
              <Label className="text-xs">Step 1 — copy the extraction prompt</Label>
              <p className="text-xs text-muted-foreground">
                Paste the prompt into ChatGPT 5.5 Thinking, Claude with web access, or a similar LLM. Attach the form
                file(s) you uploaded. The LLM returns a JSON schema.
              </p>
              <div className="flex items-center gap-2">
                <Button type="button" variant="default" size="sm" onClick={copyTier1Prompt}>
                  <Clipboard className="h-3.5 w-3.5" />
                  Copy extraction prompt
                </Button>
              </div>
              <pre className="rounded border border-dashed border-border bg-muted px-3 py-2 text-[11px] text-muted-foreground whitespace-pre-wrap line-clamp-4 overflow-hidden">
                {tier1Preview}
              </pre>
            </div>

            <PasteBackPanel
              pasteRaw={pasteRaw}
              setPasteRaw={setPasteRaw}
              pasteError={pasteError}
              validationErrors={validationErrors}
              validating={validating}
              onValidate={handleValidateAndLoad}
            />
          </CardContent>
        </Card>
      )}

      {!schema && mode === "tier-2" && (
        <Card>
          <CardContent className="p-5 space-y-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs uppercase tracking-wider text-muted-foreground">Tier 2</p>
                <h2 className="text-base font-semibold text-foreground">Reconstruct from web documentation</h2>
              </div>
              <Button variant="ghost" size="sm" onClick={() => setMode("select")}>
                Back
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label htmlFor="t2-scheme">Scheme name</Label>
                <Input
                  id="t2-scheme"
                  value={schemeName}
                  onChange={(e) => setSchemeName(e.target.value)}
                  placeholder="e.g., Horizon Europe MSCA Staff Exchanges"
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="t2-funder">Funder</Label>
                <Input
                  id="t2-funder"
                  value={funder}
                  onChange={(e) => setFunder(e.target.value)}
                  placeholder="e.g., European Research Executive Agency"
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="t2-year">Year</Label>
                <Input
                  id="t2-year"
                  type="number"
                  min={1900}
                  max={2100}
                  value={year}
                  onChange={(e) => setYear(e.target.value)}
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="t2-url">URL (optional)</Label>
                <Input
                  id="t2-url"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="https://funder.example.org/call-text"
                />
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button type="button" variant="default" size="sm" onClick={copyTier2Prompt}>
                <Clipboard className="h-3.5 w-3.5" />
                Copy extraction prompt
              </Button>
              <p className="text-xs text-muted-foreground">
                Paste into an LLM with web search enabled (Claude, ChatGPT browse, Gemini Advanced, Perplexity Pro).
              </p>
            </div>

            <PasteBackPanel
              pasteRaw={pasteRaw}
              setPasteRaw={setPasteRaw}
              pasteError={pasteError}
              validationErrors={validationErrors}
              validating={validating}
              onValidate={handleValidateAndLoad}
            />
          </CardContent>
        </Card>
      )}

      {schema && mode === "select" && <SchemaEditor schema={schema} />}

      {schema && mode !== "select" && (
        <Card>
          <CardContent className="p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <RefreshCw className="h-4 w-4 text-muted-foreground" />
                <h2 className="text-base font-semibold text-foreground">Re-extract schema</h2>
              </div>
              <Button variant="ghost" size="sm" onClick={() => setMode("select")}>
                Cancel
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Pasting a new schema replaces the current one. Existing per-field outputs (added in v21-R2) for stable
              field IDs will carry over.
            </p>
            <PasteBackPanel
              pasteRaw={pasteRaw}
              setPasteRaw={setPasteRaw}
              pasteError={pasteError}
              validationErrors={validationErrors}
              validating={validating}
              onValidate={handleValidateAndLoad}
            />
          </CardContent>
        </Card>
      )}
    </div>
  );
}

interface TierCardProps {
  tier: 1 | 2 | 3;
  title: string;
  description: string;
  Icon: React.ComponentType<{ className?: string }>;
  onSelect?: () => void;
  disabled?: boolean;
  note?: string;
}

function TierCard({ tier, title, description, Icon, onSelect, disabled, note }: TierCardProps) {
  return (
    <Card
      className={cn(
        "transition-all",
        disabled ? "opacity-60" : "hover:border-[#4F7DF3] hover:shadow-md cursor-pointer",
      )}
      onClick={disabled ? undefined : onSelect}
    >
      <CardContent className="p-5 space-y-3">
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center justify-center rounded-full bg-[#F0F4FF] text-[#4F7DF3] h-8 w-8 text-xs font-bold">
            {tier}
          </span>
          <Icon className="h-4 w-4 text-muted-foreground" />
        </div>
        <div>
          <h3 className="text-sm font-semibold text-foreground">{title}</h3>
          <p className="text-xs text-muted-foreground mt-1">{description}</p>
        </div>
        {note && <p className="text-[11px] text-muted-foreground italic">{note}</p>}
        {!disabled && (
          <Button type="button" variant="outline" size="sm" className="w-full" onClick={onSelect}>
            <FilePlus className="h-3.5 w-3.5" />
            Start Tier {tier}
          </Button>
        )}
      </CardContent>
    </Card>
  );
}

interface PasteBackPanelProps {
  pasteRaw: string;
  setPasteRaw: (v: string) => void;
  pasteError: string | null;
  validationErrors: ValidationError[];
  validating: boolean;
  onValidate: () => void;
}

function PasteBackPanel({
  pasteRaw,
  setPasteRaw,
  pasteError,
  validationErrors,
  validating,
  onValidate,
}: PasteBackPanelProps) {
  return (
    <div className="space-y-2 border-t border-border pt-4">
      <Label className="text-xs" htmlFor="paste-schema">
        Paste schema JSON here
      </Label>
      <Textarea
        id="paste-schema"
        value={pasteRaw}
        onChange={(e) => setPasteRaw(e.target.value)}
        placeholder='{"schema_version":"1.0", "form_metadata": ..., "sections": [...]}'
        className="min-h-[180px] font-mono text-xs"
      />
      {pasteError && (
        <div className="flex items-start gap-2 rounded-md border border-red-300/60 bg-red-50 dark:bg-red-950/30 p-3 text-xs">
          <AlertTriangle className="h-3.5 w-3.5 text-red-600 mt-0.5 shrink-0" />
          <span>
            <strong>JSON parse error:</strong> {pasteError}
          </span>
        </div>
      )}
      {validationErrors.length > 0 && (
        <div className="rounded-md border border-amber-300/60 bg-amber-50 dark:bg-amber-950/30 p-3 text-xs space-y-1">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-3.5 w-3.5 text-amber-600" />
            <strong>Schema validation failed ({validationErrors.length} error{validationErrors.length === 1 ? "" : "s"}):</strong>
          </div>
          <ul className="space-y-1 max-h-48 overflow-auto pl-5 list-disc">
            {validationErrors.slice(0, 12).map((e, i) => (
              <li key={i}>
                <span className="font-mono">{e.path || "(root)"}</span> — {e.message}
              </li>
            ))}
            {validationErrors.length > 12 && (
              <li className="italic">…and {validationErrors.length - 12} more</li>
            )}
          </ul>
        </div>
      )}
      <Button type="button" variant="default" size="sm" onClick={onValidate} disabled={validating || !pasteRaw.trim()}>
        {validating ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <FilePlus className="h-3.5 w-3.5" />}
        Validate and Load
      </Button>
    </div>
  );
}
