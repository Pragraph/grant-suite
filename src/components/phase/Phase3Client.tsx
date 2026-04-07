"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  Check,
  ChevronDown,
  FlaskConical,
  Handshake,
  Search,
  Sparkles,
  Globe,
  Flag,
  BarChart3,
  UserCheck,
  ShieldCheck,
  Gauge,
  Plus,
  Trash2,
  ExternalLink,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { storage } from "@/lib/storage";
import { getProjectIdFromUrl } from "@/lib/utils";
import { useProjectStore } from "@/stores/project-store";
import { useProgressStore } from "@/stores/progress-store";
import { useDocumentStore } from "@/stores/document-store";
import { useUiStore } from "@/stores/ui-store";
import { PHASE_DEFINITIONS } from "@/lib/constants";
import type { StepStatus } from "@/lib/types";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PhaseIcon } from "@/components/ui/phase-icon";
import { Progress } from "@/components/ui/progress";
import { Switch } from "@/components/ui/switch";
import { StepExecutor } from "@/components/phase/StepExecutor";
import { PhaseCompleteCTA } from "@/components/shared/PhaseCompleteCTA";

// ─── Phase 3 definition ────────────────────────────────────────────────────

const PHASE_3 = PHASE_DEFINITIONS[2];

// ─── Types ─────────────────────────────────────────────────────────────────

interface Partner {
  id: string;
  name: string;
  institution: string;
  role: string;
  expertise: string;
  commitments: string;
}

interface ModuleConfig {
  id: string;
  group: "3A" | "3B" | "3C";
  label: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  step: number;
  templateId: string;
  outputName: string;
}

// ─── Module definitions ────────────────────────────────────────────────────

const MODULE_3C: ModuleConfig[] = [
  { id: "sdg", group: "3C", label: "SDG Alignment", description: "Map research to UN Sustainable Development Goals", icon: Globe, step: 12, templateId: "phase3.step12-sdg-alignment", outputName: "SDG_Alignment.md" },
  { id: "national", group: "3C", label: "National Agenda Alignment", description: "Align with national priorities and strategic agendas", icon: Flag, step: 13, templateId: "phase3.step13-national-alignment", outputName: "National_Alignment.md" },
  { id: "kpi", group: "3C", label: "KPI & Output Planning", description: "Design measurable KPIs, outputs, and outcomes", icon: BarChart3, step: 14, templateId: "phase3.step14-kpi-planning", outputName: "KPI_Plan.md" },
  { id: "profile", group: "3C", label: "Researcher Profile Optimizer", description: "Optimize your profile narrative for grant alignment", icon: UserCheck, step: 15, templateId: "phase3.step15-researcher-profile", outputName: "Researcher_Profile.md" },
  { id: "originality", group: "3C", label: "Plagiarism & Originality Check", description: "Assess originality and identify improvement areas", icon: ShieldCheck, step: 16, templateId: "phase3.step16-originality-check", outputName: "Originality_Check.md" },
  { id: "trl", group: "3C", label: "TRL Assessment", description: "Evaluate technology readiness level and maturation path", icon: Gauge, step: 17, templateId: "phase3.step17-trl-assessment", outputName: "TRL_Assessment.md" },
];

// ─── Scheme module guidance (two-tier: required vs recommended) ────────────

interface SchemeModuleGuidance {
  required: string[];
  recommended: string[];
}

const SCHEME_MODULE_GUIDANCE: Record<string, SchemeModuleGuidance> = {
  FRGS: {
    required: ["kpi", "originality"],
    recommended: ["patent", "national", "sdg", "profile"],
  },
  PRGS: {
    required: ["patent", "trl", "kpi"],
    recommended: ["national", "sdg", "profile"],
  },
  TRGS: {
    required: ["kpi"],
    recommended: ["national", "sdg", "profile", "partnership"],
  },
  LRGS: {
    required: ["kpi", "national"],
    recommended: ["sdg", "profile", "partnership"],
  },
  PPRN: {
    required: ["kpi"],
    recommended: ["national", "profile", "partnership"],
  },
};

function getModuleGuidance(scheme?: string): SchemeModuleGuidance {
  if (!scheme) return { required: [], recommended: [] };
  return SCHEME_MODULE_GUIDANCE[scheme] || { required: [], recommended: [] };
}

// ─── Status helpers ────────────────────────────────────────────────────────

const stepStatusLabels: Record<StepStatus, string> = {
  "not-started": "Not Started",
  "in-progress": "In Progress",
  "prompt-copied": "Prompt Copied",
  "output-pasted": "Output Pasted",
  complete: "Complete",
};

// ─── Animation variants ─────────────────────────────────────────────────────

const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] },
};

const expandVariants = {
  collapsed: { height: 0, opacity: 0, overflow: "hidden" as const },
  expanded: { height: "auto", opacity: 1, overflow: "visible" as const },
};

// ─── Storage key for module toggles ────────────────────────────────────────

function getModuleStorageKey(projectId: string) {
  return `grant-suite-phase3-modules-${projectId}`;
}

interface ModuleToggles {
  module3A: boolean;
  module3B: boolean;
  module3C: boolean;
  enabledMeritModules: string[];
}

function loadModuleToggles(projectId: string): ModuleToggles {
  try {
    const raw = localStorage.getItem(getModuleStorageKey(projectId));
    if (raw) return JSON.parse(raw);
  } catch { /* ignore */ }
  return { module3A: false, module3B: false, module3C: false, enabledMeritModules: [] };
}

function saveModuleToggles(projectId: string, toggles: ModuleToggles) {
  localStorage.setItem(getModuleStorageKey(projectId), JSON.stringify(toggles));
}

// ─── Partners storage ──────────────────────────────────────────────────────

function getPartnersStorageKey(projectId: string) {
  return `grant-suite-phase3-partners-${projectId}`;
}

function loadPartners(projectId: string): Partner[] {
  try {
    const raw = localStorage.getItem(getPartnersStorageKey(projectId));
    if (raw) return JSON.parse(raw);
  } catch { /* ignore */ }
  return [];
}

function savePartners(projectId: string, partners: Partner[]) {
  localStorage.setItem(getPartnersStorageKey(projectId), JSON.stringify(partners));
}

// ─── Patent sub-step tracking ──────────────────────────────────────────────

type PatentSubStep = "search" | "novelty";

// ─── Component ──────────────────────────────────────────────────────────────

export function Phase3Client({ projectId: _pid }: { projectId: string }) {
  void _pid; // extracted from URL instead
  const [projectId] = useState(() => getProjectIdFromUrl());
  const { setActiveProject, activeProject } = useProjectStore();
  const { progress, loadProgress } = useProgressStore();
  const { loadDocuments } = useDocumentStore();
  const { setBreadcrumbs } = useUiStore();

  const [moduleToggles, setModuleToggles] = useState<ModuleToggles>(() =>
    loadModuleToggles(projectId),
  );
  const [partners, setPartners] = useState<Partner[]>(() => loadPartners(projectId));
  const [activeSection, setActiveSection] = useState<string | null>("main");
  const [activePartnerLetter, setActivePartnerLetter] = useState<string | null>(null);
  const [patentSubStep, setPatentSubStep] = useState<PatentSubStep>("search");
  const [active3CModule, setActive3CModule] = useState<string | null>(null);

  // ── Initialize ────────────────────────────────────────────────────────────

  useEffect(() => {
    if (!projectId) return;
    const proj = storage.getProject(projectId);
    setActiveProject(projectId);
    loadProgress(projectId);
    loadDocuments(projectId);
    setBreadcrumbs([
      { label: "Projects", href: "/projects" },
      { label: proj?.title || "Project", href: `/projects/${projectId}` },
      { label: "Phase 3: Research Design & Optional Modules" },
    ]);
  }, [projectId, setActiveProject, loadProgress, loadDocuments, setBreadcrumbs]);

  // ── Persist toggles ──────────────────────────────────────────────────────

  useEffect(() => {
    saveModuleToggles(projectId, moduleToggles);
  }, [projectId, moduleToggles]);

  useEffect(() => {
    savePartners(projectId, partners);
  }, [projectId, partners]);

  // ── Save enabled modules to project metadata ────────────────────────────

  const { updateProject } = useProjectStore();

  useEffect(() => {
    const enabledModules: string[] = [];
    if (moduleToggles.module3A) enabledModules.push("3A");
    if (moduleToggles.module3B) enabledModules.push("3B");
    if (moduleToggles.module3C) {
      moduleToggles.enabledMeritModules.forEach((m) => enabledModules.push(`3C-${m}`));
    }
    updateProject(projectId, {
      metadata: { ...activeProject?.metadata, phase3EnabledModules: enabledModules },
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [moduleToggles]);

  // ── Helpers ──────────────────────────────────────────────────────────────

  const getStepStatus = useCallback(
    (stepNum: number): StepStatus => {
      return progress.phases[3]?.steps[stepNum] || "not-started";
    },
    [progress],
  );

  const mainStepComplete = getStepStatus(1) === "complete";

  const moduleGuidance = useMemo(
    () => getModuleGuidance(activeProject?.grantScheme),
    [activeProject?.grantScheme],
  );

  // ── Progress calculation (count main + enabled optional modules) ────────

  const totalSteps = useMemo(() => {
    let count = 1; // main step
    if (moduleToggles.module3A) count += 1; // partnership plan
    if (moduleToggles.module3B) count += 1; // patent analysis
    if (moduleToggles.module3C) count += moduleToggles.enabledMeritModules.length;
    return count;
  }, [moduleToggles]);

  const completedSteps = useMemo(() => {
    let count = 0;
    if (getStepStatus(1) === "complete") count++;
    if (moduleToggles.module3A && getStepStatus(10) === "complete") count++;
    if (moduleToggles.module3B && getStepStatus(11) === "complete") count++;
    if (moduleToggles.module3C) {
      for (const mod of MODULE_3C) {
        if (
          moduleToggles.enabledMeritModules.includes(mod.id) &&
          getStepStatus(mod.step) === "complete"
        ) {
          count++;
        }
      }
    }
    return count;
  }, [moduleToggles, getStepStatus]);

  const phaseCompletion = totalSteps > 0 ? Math.round((completedSteps / totalSteps) * 100) : 0;

  // ── Toggle handlers ──────────────────────────────────────────────────────

  const toggleModule = (key: "module3A" | "module3B" | "module3C") => {
    setModuleToggles((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const toggleMeritModule = (moduleId: string) => {
    setModuleToggles((prev) => {
      const enabled = prev.enabledMeritModules.includes(moduleId)
        ? prev.enabledMeritModules.filter((m) => m !== moduleId)
        : [...prev.enabledMeritModules, moduleId];
      return { ...prev, enabledMeritModules: enabled };
    });
  };

  // ── Partner management ───────────────────────────────────────────────────

  const addPartner = () => {
    setPartners((prev) => [
      ...prev,
      {
        id: crypto.randomUUID(),
        name: "",
        institution: "",
        role: "",
        expertise: "",
        commitments: "",
      },
    ]);
  };

  const updatePartner = (id: string, field: keyof Partner, value: string) => {
    setPartners((prev) =>
      prev.map((p) => (p.id === id ? { ...p, [field]: value } : p)),
    );
  };

  const removePartner = (id: string) => {
    setPartners((prev) => prev.filter((p) => p.id !== id));
    if (activePartnerLetter === id) setActivePartnerLetter(null);
  };

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <motion.div className="space-y-8" {...fadeInUp}>
      {/* ── Phase Header ───────────────────────────────────────────────── */}
      <div className="flex items-center gap-4">
        <PhaseIcon phase={3} size="lg" active />
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-gray-900">
            {PHASE_3.name}
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Design your research methodology and optionally enhance your proposal with partnership evidence, novelty analysis, and merit modules.
          </p>
        </div>
      </div>

      {/* ── Progress Bar ───────────────────────────────────────────────── */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-500 font-medium">Phase Progress</span>
          <span className="text-sm text-gray-400">
            {completedSteps} of {totalSteps} steps
          </span>
        </div>
        <Progress value={phaseCompletion} className="h-1.5" />
      </div>

      {/* ── MAIN STEP: Research Design Generator ───────────────────────── */}
      <div className="relative">
        {/* Timeline line */}
        <div
          className={cn(
            "absolute left-3.75 top-9 w-0.5 h-[calc(100%-20px)]",
            mainStepComplete ? "bg-phase-3" : "bg-gray-200",
          )}
        />

        {/* Step header */}
        <button
          onClick={() => setActiveSection(activeSection === "main" ? null : "main")}
          className="flex w-full items-center gap-3 py-3 text-left transition-colors hover:bg-gray-50 rounded-xl px-2 -mx-2"
        >
          <div
            className={cn(
              "flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 transition-all",
              mainStepComplete
                ? "border-phase-3 bg-phase-3 text-white"
                : getStepStatus(1) !== "not-started"
                  ? "border-phase-3 bg-transparent text-phase-3"
                  : "border-gray-200 bg-transparent text-gray-400",
            )}
          >
            {mainStepComplete ? (
              <Check className="h-4 w-4" />
            ) : (
              <span className="text-xs font-medium">1</span>
            )}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <p className={cn("text-sm font-semibold", mainStepComplete ? "text-gray-900" : "text-gray-900")}>
                Research Design Generator
              </p>
              <Badge variant="outline" className="text-[10px] border-phase-3/30 text-phase-3">
                Required
              </Badge>
            </div>
            {mainStepComplete && (
              <p className="text-xs text-gray-400 mt-0.5">
                Research_Design.md — Core research methodology defined
              </p>
            )}
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <FlaskConical className={cn("h-4 w-4", mainStepComplete ? "text-phase-3" : "text-gray-300")} />
            {getStepStatus(1) !== "not-started" && (
              <Badge variant={mainStepComplete ? "default" : "outline"} className="text-[10px]">
                {stepStatusLabels[getStepStatus(1)]}
              </Badge>
            )}
            <ChevronDown className={cn("h-4 w-4 text-gray-400 transition-transform", activeSection === "main" && "rotate-180")} />
          </div>
        </button>

        {/* Step content */}
        <AnimatePresence>
          {activeSection === "main" && (
            <motion.div
              initial="collapsed"
              animate="expanded"
              exit="collapsed"
              variants={expandVariants}
              transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
              className="ml-10 mb-4"
            >
              <div className="pt-2 space-y-4">
                <StepExecutor
                  templateId="phase3.step1-research-design"
                  projectId={projectId}
                  phase={3}
                  step={1}
                  title="Research Design Generator"
                  description="Generate a comprehensive research design framework aligned with your grant strategy and Proposal Blueprint."
                  additionalFields={[
                    {
                      name: "discipline",
                      label: "Discipline",
                      type: "text",
                      placeholder: "e.g., Computer Science",
                      defaultValue: activeProject?.discipline || undefined,
                      required: true,
                    },
                    {
                      name: "researchApproach",
                      label: "Research Approach Preference",
                      type: "select",
                      options: [
                        { label: "Quantitative", value: "quantitative" },
                        { label: "Qualitative", value: "qualitative" },
                        { label: "Mixed-Methods", value: "mixed-methods" },
                        { label: "Experimental", value: "experimental" },
                        { label: "Quasi-Experimental", value: "quasi-experimental" },
                      ],
                    },
                    {
                      name: "studyDuration",
                      label: "Study Duration",
                      type: "text",
                      placeholder: "e.g., 24 months",
                    },
                    {
                      name: "targetParticipants",
                      label: "Target Sample / Participants",
                      type: "textarea",
                      placeholder: "Describe your target population, sample size considerations, and recruitment approach...",
                    },
                  ]}
                  onComplete={() => {
                    loadDocuments(projectId);
                  }}
                />

                {/* Post-completion message */}
                {mainStepComplete && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="rounded-lg border border-phase-3/30 bg-phase-3/5 p-4"
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <Sparkles className="h-5 w-5 text-phase-3" />
                      <p className="text-sm font-medium text-gray-900">
                        Research Design Complete
                      </p>
                    </div>
                    <p className="text-xs text-gray-500">
                      You can now enable optional modules below to strengthen your proposal, or proceed to Phase 4.
                    </p>
                  </motion.div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ── OPTIONAL MODULES SECTION ───────────────────────────────────── */}
      {mainStepComplete && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="space-y-6"
        >
          <div className="flex items-center gap-3">
            <div className="h-px flex-1 bg-gray-200" />
            <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">
              Optional Enhancements
            </span>
            <div className="h-px flex-1 bg-gray-200" />
          </div>

          {/* ── Module Cards Grid ──────────────────────────────────────── */}
          <div className="grid gap-4 md:grid-cols-3">
            {/* ── Card 3A: Partnership & Support Evidence ──────────────── */}
            <ModuleCard
              title="Partnership & Support Evidence"
              badge="3A"
              description="Generate partnership plans and support letters for collaborators"
              icon={Handshake}
              enabled={moduleToggles.module3A}
              onToggle={() => toggleModule("module3A")}
              stepStatus={getStepStatus(10)}
              phaseColor="phase-3"
              guidanceBadge={
                moduleGuidance.required.includes("partnership")
                  ? "required"
                  : moduleGuidance.recommended.includes("partnership")
                    ? "recommended"
                    : undefined
              }
            />

            {/* ── Card 3B: Patent Search & Novelty ─────────────────────── */}
            <ModuleCard
              title="Patent Search & Novelty"
              badge="3B"
              description="Assess novelty and identify relevant patents or prior art"
              icon={Search}
              enabled={moduleToggles.module3B}
              onToggle={() => toggleModule("module3B")}
              stepStatus={getStepStatus(11)}
              phaseColor="phase-3"
              guidanceBadge={
                moduleGuidance.required.includes("patent")
                  ? "required"
                  : moduleGuidance.recommended.includes("patent")
                    ? "recommended"
                    : undefined
              }
            />

            {/* ── Card 3C: Merit Enhancement Modules ───────────────────── */}
            <ModuleCard
              title="Merit Enhancement Modules"
              badge="3C"
              description="Additional analyses to strengthen your proposal"
              icon={Sparkles}
              enabled={moduleToggles.module3C}
              onToggle={() => toggleModule("module3C")}
              stepStatus={
                moduleToggles.enabledMeritModules.length > 0 &&
                moduleToggles.enabledMeritModules.every((m) => {
                  const mod = MODULE_3C.find((mc) => mc.id === m);
                  return mod && getStepStatus(mod.step) === "complete";
                })
                  ? "complete"
                  : moduleToggles.enabledMeritModules.some((m) => {
                      const mod = MODULE_3C.find((mc) => mc.id === m);
                      return mod && getStepStatus(mod.step) !== "not-started";
                    })
                    ? "in-progress"
                    : "not-started"
              }
              phaseColor="phase-3"
              count={moduleToggles.enabledMeritModules.length}
            />
          </div>

          {/* ── Module 3A Expanded ─────────────────────────────────────── */}
          <AnimatePresence>
            {moduleToggles.module3A && (
              <motion.div
                initial="collapsed"
                animate="expanded"
                exit="collapsed"
                variants={expandVariants}
                transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
              >
                <Card className="border-phase-3/30">
                  <CardContent className="p-6 space-y-6">
                    <div className="flex items-center gap-2">
                      <Handshake className="h-5 w-5 text-phase-3" />
                      <h3 className="text-sm font-semibold text-gray-900">3A: Partnership & Support Evidence</h3>
                    </div>

                    {/* Sub-step a: Partnership Strategy */}
                    <div className="space-y-3">
                      <button
                        onClick={() => setActiveSection(activeSection === "3A-strategy" ? null : "3A-strategy")}
                        className="flex w-full items-center gap-3 text-left"
                      >
                        <div className={cn(
                          "flex h-6 w-6 shrink-0 items-center justify-center rounded-full border text-xs",
                          getStepStatus(10) === "complete" ? "border-phase-3 bg-phase-3 text-white" : "border-gray-200 text-gray-500",
                        )}>
                          {getStepStatus(10) === "complete" ? <Check className="h-3 w-3" /> : "a"}
                        </div>
                        <span className="text-sm font-medium text-gray-900 flex-1">Partnership Strategy</span>
                        <ChevronDown className={cn("h-4 w-4 text-gray-400 transition-transform", activeSection === "3A-strategy" && "rotate-180")} />
                      </button>

                      <AnimatePresence>
                        {activeSection === "3A-strategy" && (
                          <motion.div
                            initial="collapsed"
                            animate="expanded"
                            exit="collapsed"
                            variants={expandVariants}
                            transition={{ duration: 0.3 }}
                            className="ml-9"
                          >
                            <StepExecutor
                              templateId="phase3.step10-partnership-strategy"
                              projectId={projectId}
                              phase={3}
                              step={10}
                              title="Partnership Strategy"
                              description="Develop a strategic partnership and collaboration plan."
                              additionalFields={[
                                {
                                  name: "discipline",
                                  label: "Discipline",
                                  type: "text",
                                  placeholder: "e.g., Computer Science",
                                  defaultValue: activeProject?.discipline || undefined,
                                  required: true,
                                },
                                {
                                  name: "country",
                                  label: "Country",
                                  type: "text",
                                  placeholder: "e.g., Malaysia",
                                  defaultValue: activeProject?.country || undefined,
                                },
                                {
                                  name: "careerStage",
                                  label: "Career Stage",
                                  type: "text",
                                  placeholder: "e.g., Early Career Researcher",
                                  defaultValue: activeProject?.careerStage || undefined,
                                },
                              ]}
                              onComplete={() => loadDocuments(projectId)}
                            />
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>

                    {/* Sub-step b: Letter Generator */}
                    <div className="space-y-3">
                      <button
                        onClick={() => setActiveSection(activeSection === "3A-letters" ? null : "3A-letters")}
                        className="flex w-full items-center gap-3 text-left"
                      >
                        <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-gray-200 text-xs text-gray-500">
                          b
                        </div>
                        <span className="text-sm font-medium text-gray-900 flex-1">Support Letter Generator</span>
                        {partners.length > 0 && (
                          <Badge variant="outline" className="text-[10px]">{partners.length} partner{partners.length !== 1 ? "s" : ""}</Badge>
                        )}
                        <ChevronDown className={cn("h-4 w-4 text-gray-400 transition-transform", activeSection === "3A-letters" && "rotate-180")} />
                      </button>

                      <AnimatePresence>
                        {activeSection === "3A-letters" && (
                          <motion.div
                            initial="collapsed"
                            animate="expanded"
                            exit="collapsed"
                            variants={expandVariants}
                            transition={{ duration: 0.3 }}
                            className="ml-9 space-y-4"
                          >
                            <p className="text-xs text-gray-500">
                              Add your collaborators below. For each partner, a personalized support letter prompt will be generated.
                            </p>

                            {/* Partner list */}
                            {partners.map((partner, idx) => (
                              <Card key={partner.id} className="border-gray-200">
                                <CardContent className="p-4 space-y-3">
                                  <div className="flex items-center justify-between">
                                    <span className="text-xs font-medium text-gray-500">Partner {idx + 1}</span>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => removePartner(partner.id)}
                                      className="h-6 w-6 p-0 text-gray-400 hover:text-red-500"
                                    >
                                      <Trash2 className="h-3 w-3" />
                                    </Button>
                                  </div>

                                  <div className="grid gap-3 sm:grid-cols-3">
                                    <div>
                                      <Label className="text-xs">Name</Label>
                                      <Input
                                        value={partner.name}
                                        onChange={(e) => updatePartner(partner.id, "name", e.target.value)}
                                        placeholder="Dr. Jane Smith"
                                        className="h-8 text-xs"
                                      />
                                    </div>
                                    <div>
                                      <Label className="text-xs">Institution</Label>
                                      <Input
                                        value={partner.institution}
                                        onChange={(e) => updatePartner(partner.id, "institution", e.target.value)}
                                        placeholder="MIT"
                                        className="h-8 text-xs"
                                      />
                                    </div>
                                    <div>
                                      <Label className="text-xs">Role in Project</Label>
                                      <Input
                                        value={partner.role}
                                        onChange={(e) => updatePartner(partner.id, "role", e.target.value)}
                                        placeholder="Co-PI, Advisor, etc."
                                        className="h-8 text-xs"
                                      />
                                    </div>
                                  </div>

                                  <div className="grid gap-3 sm:grid-cols-2">
                                    <div>
                                      <Label className="text-xs">Expertise</Label>
                                      <Input
                                        value={partner.expertise}
                                        onChange={(e) => updatePartner(partner.id, "expertise", e.target.value)}
                                        placeholder="Machine learning, clinical trials..."
                                        className="h-8 text-xs"
                                      />
                                    </div>
                                    <div>
                                      <Label className="text-xs">Specific Commitments</Label>
                                      <Input
                                        value={partner.commitments}
                                        onChange={(e) => updatePartner(partner.id, "commitments", e.target.value)}
                                        placeholder="Lab access, 10% FTE, mentorship..."
                                        className="h-8 text-xs"
                                      />
                                    </div>
                                  </div>

                                  {/* Generate letter button */}
                                  {partner.name && partner.institution && partner.role && (
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() =>
                                        setActivePartnerLetter(
                                          activePartnerLetter === partner.id ? null : partner.id,
                                        )
                                      }
                                      className="text-xs border-phase-3/30 text-phase-3 hover:bg-phase-3/10"
                                    >
                                      {activePartnerLetter === partner.id ? "Hide Letter Generator" : "Generate Support Letter"}
                                    </Button>
                                  )}

                                  {/* Partner letter StepExecutor */}
                                  <AnimatePresence>
                                    {activePartnerLetter === partner.id && (
                                      <motion.div
                                        initial="collapsed"
                                        animate="expanded"
                                        exit="collapsed"
                                        variants={expandVariants}
                                        transition={{ duration: 0.3 }}
                                      >
                                        <StepExecutor
                                          templateId="phase3.step10-partner-letter"
                                          projectId={projectId}
                                          phase={3}
                                          step={10}
                                          title={`Support Letter — ${partner.name}`}
                                          description={`Generate a personalized support letter from ${partner.name} at ${partner.institution}.`}
                                          additionalFields={[
                                            {
                                              name: "discipline",
                                              label: "Discipline",
                                              type: "text",
                                              placeholder: "e.g., Computer Science",
                                              defaultValue: activeProject?.discipline || undefined,
                                              required: true,
                                            },
                                            {
                                              name: "partnerName",
                                              label: "Partner Name",
                                              type: "text",
                                              placeholder: partner.name,
                                              required: true,
                                            },
                                            {
                                              name: "partnerInstitution",
                                              label: "Partner Institution",
                                              type: "text",
                                              placeholder: partner.institution,
                                              required: true,
                                            },
                                            {
                                              name: "partnerRole",
                                              label: "Role in Project",
                                              type: "text",
                                              placeholder: partner.role,
                                              required: true,
                                            },
                                            {
                                              name: "partnerExpertise",
                                              label: "Expertise",
                                              type: "text",
                                              placeholder: partner.expertise,
                                            },
                                            {
                                              name: "specificCommitments",
                                              label: "Specific Commitments",
                                              type: "text",
                                              placeholder: partner.commitments,
                                            },
                                          ]}
                                          onComplete={() => loadDocuments(projectId)}
                                        />
                                      </motion.div>
                                    )}
                                  </AnimatePresence>
                                </CardContent>
                              </Card>
                            ))}

                            {/* Add partner button */}
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={addPartner}
                              className="w-full border-dashed border-gray-200 text-gray-500 hover:text-gray-900"
                            >
                              <Plus className="h-4 w-4 mr-2" />
                              Add Partner
                            </Button>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}
          </AnimatePresence>

          {/* ── Module 3B Expanded ─────────────────────────────────────── */}
          <AnimatePresence>
            {moduleToggles.module3B && (
              <motion.div
                initial="collapsed"
                animate="expanded"
                exit="collapsed"
                variants={expandVariants}
                transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
              >
                <Card className="border-phase-3/30">
                  <CardContent className="p-6 space-y-6">
                    <div className="flex items-center gap-2">
                      <Search className="h-5 w-5 text-phase-3" />
                      <h3 className="text-sm font-semibold text-gray-900">3B: Patent Search & Novelty Assessment</h3>
                    </div>

                    {/* Sub-step tabs */}
                    <div className="flex gap-2">
                      <button
                        onClick={() => setPatentSubStep("search")}
                        className={cn(
                          "rounded-md px-3 py-1.5 text-xs font-medium transition-colors",
                          patentSubStep === "search"
                            ? "bg-phase-3 text-white"
                            : "text-gray-500 hover:text-gray-900 hover:bg-gray-100",
                        )}
                      >
                        1. Patent Search Strategy
                      </button>
                      <button
                        onClick={() => setPatentSubStep("novelty")}
                        className={cn(
                          "rounded-md px-3 py-1.5 text-xs font-medium transition-colors",
                          patentSubStep === "novelty"
                            ? "bg-phase-3 text-white"
                            : "text-gray-500 hover:text-gray-900 hover:bg-gray-100",
                        )}
                      >
                        2. Novelty & TRL Analysis
                      </button>
                    </div>

                    {patentSubStep === "search" && (
                      <div className="space-y-4">
                        <StepExecutor
                          templateId="phase3.step11-patent-search"
                          projectId={projectId}
                          phase={3}
                          step={11}
                          title="Patent Search Strategy"
                          description="Generate targeted search queries for patent databases. Execute the searches and paste results in the next step."
                          additionalFields={[
                            {
                              name: "discipline",
                              label: "Discipline",
                              type: "text",
                              placeholder: "e.g., Computer Science",
                              defaultValue: activeProject?.discipline || undefined,
                              required: true,
                            },
                            {
                              name: "country",
                              label: "Country",
                              type: "text",
                              placeholder: "e.g., Malaysia",
                              defaultValue: activeProject?.country || undefined,
                            },
                          ]}
                          onComplete={() => {
                            loadDocuments(projectId);
                          }}
                        />

                        {/* External links for patent databases */}
                        <div className="flex flex-wrap gap-2">
                          <a
                            href="https://patents.google.com/"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 rounded-md border border-gray-200 px-3 py-1.5 text-xs text-gray-500 hover:text-gray-900 hover:border-phase-3/30 transition-colors"
                          >
                            <ExternalLink className="h-3 w-3" />
                            Google Patents
                          </a>
                          <a
                            href="https://worldwide.espacenet.com/"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 rounded-md border border-gray-200 px-3 py-1.5 text-xs text-gray-500 hover:text-gray-900 hover:border-phase-3/30 transition-colors"
                          >
                            <ExternalLink className="h-3 w-3" />
                            Espacenet
                          </a>
                        </div>
                      </div>
                    )}

                    {patentSubStep === "novelty" && (
                      <StepExecutor
                        templateId="phase3.step11-novelty-assessment"
                        projectId={projectId}
                        phase={3}
                        step={11}
                        title="Novelty & TRL Assessment"
                        description="Paste your patent search results below. The AI will analyze novelty, prior art overlap, and technology readiness."
                        additionalFields={[
                          {
                            name: "discipline",
                            label: "Discipline",
                            type: "text",
                            placeholder: "e.g., Computer Science",
                            defaultValue: activeProject?.discipline || undefined,
                            required: true,
                          },
                          {
                            name: "patentSearchResults",
                            label: "Patent Search Results",
                            type: "textarea",
                            placeholder: "Paste your patent search results from Google Patents, Espacenet, or academic databases here...",
                            required: true,
                          },
                        ]}
                        onComplete={() => loadDocuments(projectId)}
                      />
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            )}
          </AnimatePresence>

          {/* ── Module 3C Expanded ─────────────────────────────────────── */}
          <AnimatePresence>
            {moduleToggles.module3C && (
              <motion.div
                initial="collapsed"
                animate="expanded"
                exit="collapsed"
                variants={expandVariants}
                transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
              >
                <Card className="border-phase-3/30">
                  <CardContent className="p-6 space-y-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Sparkles className="h-5 w-5 text-phase-3" />
                      <h3 className="text-sm font-semibold text-gray-900">3C: Merit Enhancement Modules</h3>
                    </div>

                    {/* Scheme guidance hint */}
                    {(moduleGuidance.required.length > 0 || moduleGuidance.recommended.length > 0) && (
                      <div className="rounded-lg border border-phase-3/20 bg-phase-3/5 p-3 space-y-1">
                        {moduleGuidance.required.filter((id) => MODULE_3C.some((m) => m.id === id)).length > 0 && (
                          <p className="text-xs text-gray-500">
                            <span className="font-medium text-rose-600">Required for {activeProject?.grantScheme}:</span>{" "}
                            {moduleGuidance.required
                              .map((id) => MODULE_3C.find((m) => m.id === id)?.label)
                              .filter(Boolean)
                              .join(", ")}
                          </p>
                        )}
                        {moduleGuidance.recommended.filter((id) => MODULE_3C.some((m) => m.id === id)).length > 0 && (
                          <p className="text-xs text-gray-500">
                            <span className="font-medium text-amber-600">Recommended:</span>{" "}
                            {moduleGuidance.recommended
                              .map((id) => MODULE_3C.find((m) => m.id === id)?.label)
                              .filter(Boolean)
                              .join(", ")}
                          </p>
                        )}
                      </div>
                    )}

                    {/* Module toggles */}
                    <div className="grid gap-3 sm:grid-cols-2">
                      {MODULE_3C.map((mod) => {
                        const ModIcon = mod.icon;
                        const enabled = moduleToggles.enabledMeritModules.includes(mod.id);
                        const status = getStepStatus(mod.step);
                        const isRequired = moduleGuidance.required.includes(mod.id);
                        const isRecommended = !isRequired && moduleGuidance.recommended.includes(mod.id);

                        return (
                          <div key={mod.id} className="space-y-2">
                            <div
                              className={cn(
                                "flex items-center gap-3 rounded-lg border p-3 transition-colors",
                                enabled ? "border-phase-3/30 bg-phase-3/5" : "border-gray-200",
                              )}
                            >
                              <ModIcon className={cn("h-4 w-4 shrink-0", enabled ? "text-phase-3" : "text-gray-400")} />
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-1.5 flex-wrap">
                                  <p className={cn("text-xs font-medium", enabled ? "text-gray-900" : "text-gray-600")}>
                                    {mod.label}
                                  </p>
                                  {isRequired && (
                                    <Badge className="text-[9px] bg-rose-100 text-rose-600 border-rose-200 px-1">
                                      Required for {activeProject?.grantScheme}
                                    </Badge>
                                  )}
                                  {isRecommended && (
                                    <Badge className="text-[9px] bg-amber-100 text-amber-600 border-amber-200 px-1">
                                      Recommended
                                    </Badge>
                                  )}
                                  {status === "complete" && (
                                    <Check className="h-3 w-3 text-emerald-500" />
                                  )}
                                </div>
                                <p className="text-[11px] text-gray-400 truncate">{mod.description}</p>
                              </div>
                              <Switch
                                checked={enabled}
                                onCheckedChange={() => toggleMeritModule(mod.id)}
                              />
                            </div>

                            {/* Expanded module executor */}
                            {enabled && (
                              <div className="ml-2">
                                <button
                                  onClick={() => setActive3CModule(active3CModule === mod.id ? null : mod.id)}
                                  className="flex items-center gap-2 text-xs text-phase-3 hover:text-phase-3/80 transition-colors"
                                >
                                  <ChevronDown className={cn("h-3 w-3 transition-transform", active3CModule === mod.id && "rotate-180")} />
                                  {status === "complete" ? "View" : "Open"} {mod.label}
                                </button>

                                <AnimatePresence>
                                  {active3CModule === mod.id && (
                                    <motion.div
                                      initial="collapsed"
                                      animate="expanded"
                                      exit="collapsed"
                                      variants={expandVariants}
                                      transition={{ duration: 0.3 }}
                                      className="mt-2"
                                    >
                                      <StepExecutor
                                        templateId={mod.templateId}
                                        projectId={projectId}
                                        phase={3}
                                        step={mod.step}
                                        title={mod.label}
                                        description={mod.description}
                                        additionalFields={getModuleFields(mod.id, activeProject)}
                                        onComplete={() => loadDocuments(projectId)}
                                      />
                                    </motion.div>
                                  )}
                                </AnimatePresence>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      )}

      <PhaseCompleteCTA projectId={projectId} phase={3} phaseCompletion={phaseCompletion} />
    </motion.div>
  );
}

// ─── Module Card component ──────────────────────────────────────────────────

function ModuleCard({
  title,
  badge,
  description,
  icon: Icon,
  enabled,
  onToggle,
  stepStatus,
  phaseColor,
  count,
  guidanceBadge,
}: {
  title: string;
  badge: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  enabled: boolean;
  onToggle: () => void;
  stepStatus: StepStatus;
  phaseColor: string;
  count?: number;
  guidanceBadge?: "required" | "recommended";
}) {
  return (
    <Card
      className={cn(
        "transition-all",
        enabled ? `border-${phaseColor}/30 bg-${phaseColor}/5` : "border-gray-200",
      )}
    >
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-2">
            <Icon className={cn("h-5 w-5", enabled ? `text-${phaseColor}` : "text-gray-400")} />
            <Badge variant="outline" className={cn("text-[10px]", enabled && `border-${phaseColor}/30 text-${phaseColor}`)}>
              {badge}
            </Badge>
            {guidanceBadge === "required" && (
              <Badge className="text-[9px] bg-rose-100 text-rose-600 border-rose-200 px-1">Required</Badge>
            )}
            {guidanceBadge === "recommended" && (
              <Badge className="text-[9px] bg-amber-100 text-amber-600 border-amber-200 px-1">Recommended</Badge>
            )}
          </div>
          <Switch checked={enabled} onCheckedChange={onToggle} />
        </div>
        <h4 className={cn("text-sm font-medium mb-1", enabled ? "text-gray-900" : "text-gray-600")}>
          {title}
        </h4>
        <p className="text-xs text-gray-400">{description}</p>
        {enabled && (
          <div className="flex items-center gap-2 mt-3">
            {stepStatus === "complete" ? (
              <Badge className="text-[10px] bg-emerald-100 text-emerald-600">Complete</Badge>
            ) : stepStatus !== "not-started" ? (
              <Badge variant="outline" className="text-[10px]">In Progress</Badge>
            ) : (
              <Badge variant="outline" className="text-[10px] text-gray-500">Ready</Badge>
            )}
            {count !== undefined && count > 0 && (
              <Badge variant="outline" className="text-[10px]">{count} module{count !== 1 ? "s" : ""}</Badge>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ─── Module-specific additional fields ──────────────────────────────────────

function getModuleFields(
  moduleId: string,
  project: ReturnType<typeof useProjectStore.getState>["activeProject"],
) {
  const baseFields = [
    {
      name: "discipline",
      label: "Discipline",
      type: "text" as const,
      placeholder: "e.g., Computer Science",
      defaultValue: project?.discipline || undefined,
      required: true,
    },
  ];

  switch (moduleId) {
    case "sdg":
      return [
        ...baseFields,
        {
          name: "country",
          label: "Country",
          type: "text" as const,
          placeholder: "e.g., Malaysia",
          defaultValue: project?.country || undefined,
        },
      ];
    case "national":
      return [
        ...baseFields,
        {
          name: "country",
          label: "Country",
          type: "text" as const,
          placeholder: "e.g., Malaysia",
          defaultValue: project?.country || undefined,
          required: true,
        },
      ];
    case "kpi":
      return [
        ...baseFields,
        {
          name: "studyDuration",
          label: "Study Duration",
          type: "text" as const,
          placeholder: "e.g., 24 months",
        },
        {
          name: "country",
          label: "Country",
          type: "text" as const,
          placeholder: "e.g., Malaysia",
          defaultValue: project?.country || undefined,
        },
      ];
    case "profile":
      return [
        ...baseFields,
        {
          name: "cvSummary",
          label: "Your CV / Career Summary",
          type: "file-upload-text" as const,
          placeholder: "Upload your CV as PDF, or paste a summary — publications, grants, teaching, supervision, and relevant experience.",
          required: true,
        },
        {
          name: "careerStage",
          label: "Career Stage",
          type: "text" as const,
          placeholder: "e.g., Early Career Researcher",
          defaultValue: project?.careerStage || undefined,
        },
        {
          name: "country",
          label: "Country",
          type: "text" as const,
          placeholder: "e.g., Malaysia",
          defaultValue: project?.country || undefined,
        },
      ];
    case "originality":
      return [
        ...baseFields,
        {
          name: "proposalText",
          label: "Proposal Text to Review",
          type: "file-upload-text" as const,
          placeholder: "Upload your proposal as PDF, or paste the text you want to check for originality...",
          required: true,
        },
      ];
    case "trl":
      return [
        ...baseFields,
        {
          name: "country",
          label: "Country",
          type: "text" as const,
          placeholder: "e.g., Malaysia",
          defaultValue: project?.country || undefined,
        },
      ];
    default:
      return baseFields;
  }
}
