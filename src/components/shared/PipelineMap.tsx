"use client";

import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Check, Lock, FileText } from "lucide-react";


import { useProgressStore } from "@/stores/progress-store";
import { useDocumentStore } from "@/stores/document-store";
import { useProjectStore } from "@/stores/project-store";
import { PHASE_DEFINITIONS } from "@/lib/constants";
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
  TooltipProvider,
} from "@/components/ui/tooltip";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/components/ui/popover";

// ─── Types ──────────────────────────────────────────────────────────────────

type PhaseStatus = "not-started" | "in-progress" | "complete" | "blocked";

interface PhaseNode {
  phase: number;
  name: string;
  color: string;
  status: PhaseStatus;
  completedSteps: number;
  totalSteps: number;
  documents: string[];
}

// ─── Key document flows between phases ──────────────────────────────────────

const DOCUMENT_FLOWS: { doc: string; from: number; to: number[] }[] = [
  { doc: "Grant_Intelligence.md", from: 1, to: [2, 3, 4, 5] },
  { doc: "Proposal_Blueprint.md", from: 2, to: [3, 4, 5] },
  { doc: "Research_Design.md", from: 3, to: [4, 5] },
  { doc: "Complete_Proposal.md", from: 5, to: [6, 7] },
];

// ─── Phase color map (CSS variable names) ───────────────────────────────────

const PHASE_COLORS: Record<number, string> = {
  1: "var(--phase-1)",
  2: "var(--phase-2)",
  3: "var(--phase-3)",
  4: "var(--phase-4)",
  5: "var(--phase-5)",
  6: "var(--phase-6)",
  7: "var(--phase-7)",
};

const PHASE_MUTED_COLORS: Record<number, string> = {
  1: "var(--phase-1-muted)",
  2: "var(--phase-2-muted)",
  3: "var(--phase-3-muted)",
  4: "var(--phase-4-muted)",
  5: "var(--phase-5-muted)",
  6: "var(--phase-6-muted)",
  7: "var(--phase-7-muted)",
};

// ─── Helper: derive phase status ────────────────────────────────────────────

function derivePhaseStatus(
  phase: number,
  progress: ReturnType<typeof useProgressStore.getState>["progress"],
  canAccess: (p: number) => boolean
): PhaseStatus {
  if (!canAccess(phase)) return "blocked";

  const phaseProgress = progress.phases[phase];
  if (!phaseProgress) return "not-started";

  const steps = Object.values(phaseProgress.steps);
  if (steps.length === 0) return "not-started";

  const allComplete = steps.every((s) => s === "complete");
  if (allComplete && steps.length > 0) {
    // Check if phase has the right count of completed steps
    const def = PHASE_DEFINITIONS.find((p) => p.phase === phase);
    if (def) {
      const requiredSteps = def.steps.filter((s) => !s.isOptional).length;
      const completedCount = steps.filter((s) => s === "complete").length;
      if (completedCount >= requiredSteps) return "complete";
    }
    return "complete";
  }

  const hasProgress = steps.some((s) => s !== "not-started");
  if (hasProgress) return "in-progress";

  return "not-started";
}

function getCompletedStepCount(
  phase: number,
  progress: ReturnType<typeof useProgressStore.getState>["progress"]
): number {
  const phaseProgress = progress.phases[phase];
  if (!phaseProgress) return 0;
  return Object.values(phaseProgress.steps).filter(
    (s) => s === "complete"
  ).length;
}

// ─── SVG Layout Constants ───────────────────────────────────────────────────

const NODE_RADIUS = 24;
const SVG_PADDING_X = 40;
const SVG_PADDING_Y = 36;
const NODE_Y = SVG_PADDING_Y + NODE_RADIUS;
const LABEL_Y = NODE_Y + NODE_RADIUS + 18;
const MAIN_SVG_HEIGHT = LABEL_Y + 16;

// ─── Component ──────────────────────────────────────────────────────────────

export function PipelineMap() {
  const { activeProject } = useProjectStore();
  const { progress, canAccessPhase } = useProgressStore();
  const { documents } = useDocumentStore();
  const [popoverPhase, setPopoverPhase] = useState<number | null>(null);

  const currentDocs = useMemo(
    () => documents.filter((d) => d.isCurrent),
    [documents]
  );

  const currentDocNames = useMemo(
    () => new Set(currentDocs.map((d) => d.canonicalName)),
    [currentDocs]
  );

  const nodes: PhaseNode[] = useMemo(() => {
    return PHASE_DEFINITIONS.map((def) => {
      const status = derivePhaseStatus(def.phase, progress, canAccessPhase);
      const totalSteps = def.steps.filter((s) => !s.isOptional).length;
      const completedSteps = getCompletedStepCount(def.phase, progress);
      const phaseDocs = currentDocs
        .filter((d) => d.phase === def.phase)
        .map((d) => d.canonicalName);

      return {
        phase: def.phase,
        name: def.name,
        color: def.color,
        status,
        completedSteps,
        totalSteps,
        documents: phaseDocs,
      };
    });
  }, [progress, canAccessPhase, currentDocs]);

  // Visible document flows (only for docs that exist)
  const visibleFlows = useMemo(() => {
    return DOCUMENT_FLOWS.filter((flow) => currentDocNames.has(flow.doc));
  }, [currentDocNames]);

  const handleNodeClick = (node: PhaseNode) => {
    if (!activeProject) return;
    if (node.status === "blocked") return;

    if (node.status === "complete" && node.documents.length > 0) {
      setPopoverPhase(node.phase === popoverPhase ? null : node.phase);
      return;
    }

    window.location.href = `/projects/${activeProject.id}?phase=${node.phase}`;
  };

  // ─── Desktop/Tablet: Horizontal SVG ─────────────────────────────────────

  return (
    <TooltipProvider delayDuration={200}>
      <div className="w-full">
        {/* Desktop/Tablet horizontal layout */}
        <div className="hidden sm:block">
          <HorizontalPipeline
            nodes={nodes}
            visibleFlows={visibleFlows}
            popoverPhase={popoverPhase}
            setPopoverPhase={setPopoverPhase}
            onNodeClick={handleNodeClick}
            currentDocs={currentDocs}
          />
        </div>

        {/* Mobile vertical layout */}
        <div className="block sm:hidden">
          <VerticalPipeline
            nodes={nodes}
            popoverPhase={popoverPhase}
            setPopoverPhase={setPopoverPhase}
            onNodeClick={handleNodeClick}
            currentDocs={currentDocs}
          />
        </div>
      </div>
    </TooltipProvider>
  );
}

// ─── Horizontal Pipeline (Desktop/Tablet) ───────────────────────────────────

function HorizontalPipeline({
  nodes,
  visibleFlows,
  popoverPhase,
  setPopoverPhase,
  onNodeClick,
  currentDocs,
}: {
  nodes: PhaseNode[];
  visibleFlows: typeof DOCUMENT_FLOWS;
  popoverPhase: number | null;
  setPopoverPhase: (p: number | null) => void;
  onNodeClick: (n: PhaseNode) => void;
  currentDocs: { phase: number; canonicalName: string; name: string }[];
}) {
  const DOC_FLOW_HEIGHT = visibleFlows.length > 0 ? 52 : 0;
  const totalHeight = MAIN_SVG_HEIGHT + DOC_FLOW_HEIGHT;

  return (
    <svg
      viewBox={`0 0 700 ${totalHeight}`}
      className="w-full"
      style={{ maxHeight: totalHeight + "px" }}
    >
      <defs>
        {/* Pulsing ring filter */}
        {nodes.map((node) => (
          <radialGradient
            key={`grad-${node.phase}`}
            id={`phase-grad-${node.phase}`}
          >
            <stop offset="0%" stopColor={PHASE_COLORS[node.phase]} stopOpacity="0.15" />
            <stop offset="100%" stopColor={PHASE_COLORS[node.phase]} stopOpacity="0" />
          </radialGradient>
        ))}
      </defs>

      {/* Connection lines between nodes */}
      {nodes.slice(0, -1).map((node, i) => {
        const x1 = getNodeX(i, 7) + NODE_RADIUS;
        const x2 = getNodeX(i + 1, 7) - NODE_RADIUS;
        const nextNode = nodes[i + 1];
        const isCompleted = node.status === "complete";
        const isInProgress =
          node.status === "in-progress" || nextNode.status === "in-progress";

        return (
          <motion.line
            key={`conn-${i}`}
            x1={x1}
            y1={NODE_Y}
            x2={x2}
            y2={NODE_Y}
            stroke={
              isCompleted
                ? PHASE_COLORS[node.phase]
                : "var(--muted-foreground)"
            }
            strokeWidth={2}
            strokeDasharray={isCompleted ? "none" : "6 4"}
            strokeOpacity={isCompleted ? 0.6 : 0.3}
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 0.4, delay: i * 0.05 + 0.2 }}
          >
            {isInProgress && !isCompleted && (
              <animate
                attributeName="stroke-dashoffset"
                values="0;-20"
                dur="1.5s"
                repeatCount="indefinite"
              />
            )}
          </motion.line>
        );
      })}

      {/* Phase nodes */}
      {nodes.map((node, i) => (
        <PhaseNodeSVG
          key={node.phase}
          node={node}
          cx={getNodeX(i, 7)}
          cy={NODE_Y}
          index={i}
          popoverPhase={popoverPhase}
          setPopoverPhase={setPopoverPhase}
          onNodeClick={onNodeClick}
          currentDocs={currentDocs}
        />
      ))}

      {/* Phase labels */}
      {nodes.map((node, i) => (
        <motion.text
          key={`label-${node.phase}`}
          x={getNodeX(i, 7)}
          y={LABEL_Y}
          textAnchor="middle"
          className="text-[10px] font-medium"
          fill={
            node.status === "blocked"
              ? "var(--muted-foreground)"
              : "var(--foreground)"
          }
          fillOpacity={node.status === "blocked" ? 0.5 : 0.8}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3, delay: i * 0.05 + 0.1 }}
        >
          {truncateLabel(node.name, 14)}
        </motion.text>
      ))}

      {/* Document flow lines */}
      {visibleFlows.length > 0 && (
        <g transform={`translate(0, ${MAIN_SVG_HEIGHT})`}>
          {visibleFlows.map((flow, fi) => {
            const fromX = getNodeX(flow.from - 1, 7);
            const yOffset = 10 + fi * 10;

            return flow.to.map((toPhase) => {
              const toX = getNodeX(toPhase - 1, 7);
              const pathId = `flow-${flow.doc}-${toPhase}`;

              return (
                <g key={pathId}>
                  {/* Flow line */}
                  <motion.path
                    d={`M ${fromX} ${yOffset} C ${fromX + 30} ${yOffset}, ${toX - 30} ${yOffset}, ${toX} ${yOffset}`}
                    fill="none"
                    stroke={PHASE_COLORS[flow.from]}
                    strokeWidth={1}
                    strokeOpacity={0.25}
                    strokeDasharray="4 3"
                    initial={{ pathLength: 0 }}
                    animate={{ pathLength: 1 }}
                    transition={{ duration: 0.6, delay: 0.5 + fi * 0.1 }}
                  />
                  {/* Animated dot */}
                  <circle r={2} fill={PHASE_COLORS[flow.from]} opacity={0.6}>
                    <animateMotion
                      dur={`${3 + fi}s`}
                      repeatCount="indefinite"
                      path={`M ${fromX} ${yOffset} C ${fromX + 30} ${yOffset}, ${toX - 30} ${yOffset}, ${toX} ${yOffset}`}
                    />
                  </circle>
                </g>
              );
            });
          })}
          {/* Flow labels */}
          {visibleFlows.map((flow, fi) => (
            <text
              key={`flow-label-${fi}`}
              x={getNodeX(flow.from - 1, 7) - NODE_RADIUS - 2}
              y={10 + fi * 10 + 3}
              textAnchor="end"
              className="text-[8px]"
              fill={PHASE_COLORS[flow.from]}
              fillOpacity={0.5}
            >
              {flow.doc.replace(".md", "").replace(/_/g, " ")}
            </text>
          ))}
        </g>
      )}
    </svg>
  );
}

// ─── Phase Node SVG (with tooltip/popover via foreignObject) ────────────────

function PhaseNodeSVG({
  node,
  cx,
  cy,
  index,
  popoverPhase,
  setPopoverPhase,
  onNodeClick,
  currentDocs,
}: {
  node: PhaseNode;
  cx: number;
  cy: number;
  index: number;
  popoverPhase: number | null;
  setPopoverPhase: (p: number | null) => void;
  onNodeClick: (n: PhaseNode) => void;
  currentDocs: { phase: number; canonicalName: string; name: string }[];
}) {
  const phaseColor = PHASE_COLORS[node.phase];
  const mutedColor = PHASE_MUTED_COLORS[node.phase];
  const isComplete = node.status === "complete";
  const isInProgress = node.status === "in-progress";
  const isBlocked = node.status === "blocked";
  const isNotStarted = node.status === "not-started";

  const phaseDocs = currentDocs.filter((d) => d.phase === node.phase);

  // Background fill
  const fill = isComplete
    ? phaseColor
    : isInProgress
      ? mutedColor
      : isBlocked
        ? "var(--muted)"
        : "var(--muted)";

  // Border
  const stroke = isComplete
    ? phaseColor
    : isInProgress
      ? phaseColor
      : isBlocked
        ? "var(--muted-foreground)"
        : "var(--border)";

  const strokeDasharray = isBlocked ? "4 3" : "none";
  const strokeOpacity = isBlocked ? 0.5 : isNotStarted ? 0.4 : 0.8;

  // Text color
  const textFill = isComplete
    ? "white"
    : isBlocked
      ? "var(--muted-foreground)"
      : "var(--foreground)";

  const textOpacity = isBlocked ? 0.5 : isNotStarted ? 0.6 : 1;

  const tooltipContent = (
    <div className="space-y-1.5 max-w-48">
      <div className="font-semibold text-xs">
        Phase {node.phase}: {node.name}
      </div>
      <div className="text-[10px] text-muted-foreground">
        {node.completedSteps} of {node.totalSteps} steps complete
      </div>
      {phaseDocs.length > 0 && (
        <div className="text-[10px] text-muted-foreground">
          {phaseDocs.length} document{phaseDocs.length !== 1 ? "s" : ""}{" "}
          produced
        </div>
      )}
      {isComplete && phaseDocs.length > 0 && (
        <div className="text-[10px] text-accent-400">
          Click to view documents
        </div>
      )}
      {isBlocked && (
        <div className="text-[10px] text-warning">
          Complete previous phase gate to unlock
        </div>
      )}
    </div>
  );

  const nodeElement = (
    <motion.g
      style={{ cursor: isBlocked ? "not-allowed" : "pointer" }}
      initial={{ opacity: 0, scale: 0.5 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{
        type: "spring",
        stiffness: 300,
        damping: 20,
        delay: index * 0.05,
      }}
      onClick={() => onNodeClick(node)}
    >
      {/* Pulsing ring for in-progress */}
      {isInProgress && (
        <motion.circle
          cx={cx}
          cy={cy}
          r={NODE_RADIUS + 6}
          fill="none"
          stroke={phaseColor}
          strokeWidth={1.5}
          strokeOpacity={0.4}
          animate={{
            r: [NODE_RADIUS + 4, NODE_RADIUS + 10, NODE_RADIUS + 4],
            strokeOpacity: [0.4, 0.1, 0.4],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      )}

      {/* Main circle */}
      <motion.circle
        cx={cx}
        cy={cy}
        r={NODE_RADIUS}
        fill={fill}
        stroke={stroke}
        strokeWidth={isInProgress ? 2 : 1.5}
        strokeDasharray={strokeDasharray}
        strokeOpacity={strokeOpacity}
        whileHover={
          !isBlocked ? { scale: 1.1, transition: { duration: 0.15 } } : {}
        }
      />

      {/* Phase number or icon */}
      {isComplete ? (
        <Check
          x={cx - 8}
          y={cy - 8}
          width={16}
          height={16}
          stroke="white"
          strokeWidth={2.5}
        />
      ) : isBlocked ? (
        <Lock
          x={cx - 7}
          y={cy - 7}
          width={14}
          height={14}
          stroke={textFill}
          strokeWidth={1.5}
          opacity={textOpacity}
        />
      ) : (
        <text
          x={cx}
          y={cy}
          textAnchor="middle"
          dominantBaseline="central"
          fill={textFill}
          fillOpacity={textOpacity}
          className="text-sm font-bold"
          style={{ fontFamily: "var(--font-heading)" }}
        >
          {node.phase}
        </text>
      )}
    </motion.g>
  );

  // Completed nodes with documents get a popover
  if (isComplete && phaseDocs.length > 0) {
    return (
      <Popover
        open={popoverPhase === node.phase}
        onOpenChange={(open) => setPopoverPhase(open ? node.phase : null)}
      >
        <PopoverTrigger asChild>
          <g>
            {/* Invisible foreignObject to anchor the popover */}
            <foreignObject
              x={cx - NODE_RADIUS}
              y={cy - NODE_RADIUS}
              width={NODE_RADIUS * 2}
              height={NODE_RADIUS * 2}
              style={{ overflow: "visible" }}
            >
              <div className="w-full h-full" />
            </foreignObject>
            <Tooltip>
              <TooltipTrigger asChild>{nodeElement}</TooltipTrigger>
              <TooltipContent side="top">{tooltipContent}</TooltipContent>
            </Tooltip>
          </g>
        </PopoverTrigger>
        <PopoverContent side="bottom" className="w-64 p-3">
          <div className="space-y-2">
            <div className="text-xs font-semibold text-foreground">
              Phase {node.phase} Documents
            </div>
            <div className="space-y-1">
              {phaseDocs.map((doc) => (
                <div
                  key={doc.canonicalName}
                  className="flex items-center gap-2 text-xs text-muted-foreground"
                >
                  <FileText className="h-3 w-3 shrink-0" />
                  <span className="truncate">
                    {doc.name || doc.canonicalName.replace(".md", "").replace(/_/g, " ")}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </PopoverContent>
      </Popover>
    );
  }

  // All other nodes get a tooltip
  return (
    <Tooltip>
      <TooltipTrigger asChild>{nodeElement}</TooltipTrigger>
      <TooltipContent side="top">{tooltipContent}</TooltipContent>
    </Tooltip>
  );
}

// ─── Vertical Pipeline (Mobile) ─────────────────────────────────────────────

function VerticalPipeline({
  nodes,
  popoverPhase,
  setPopoverPhase,
  onNodeClick,
  currentDocs,
}: {
  nodes: PhaseNode[];
  popoverPhase: number | null;
  setPopoverPhase: (p: number | null) => void;
  onNodeClick: (n: PhaseNode) => void;
  currentDocs: { phase: number; canonicalName: string; name: string }[];
}) {
  return (
    <div className="flex flex-col items-center gap-1">
      {nodes.map((node, i) => {
        const phaseColor = PHASE_COLORS[node.phase];
        const isComplete = node.status === "complete";
        const isInProgress = node.status === "in-progress";
        const isBlocked = node.status === "blocked";
        const phaseDocs = currentDocs.filter((d) => d.phase === node.phase);

        return (
          <div key={node.phase}>
            {/* Connection line */}
            {i > 0 && (
              <div className="flex justify-center">
                <div
                  className="w-0.5 h-4"
                  style={{
                    backgroundColor:
                      nodes[i - 1].status === "complete"
                        ? PHASE_COLORS[nodes[i - 1].phase]
                        : "var(--muted-foreground)",
                    opacity: nodes[i - 1].status === "complete" ? 0.6 : 0.2,
                  }}
                />
              </div>
            )}

            {/* Node row */}
            <motion.button
              type="button"
              className="flex items-center gap-3 w-full rounded-lg px-3 py-2 transition-colors hover:bg-muted/30"
              style={{ cursor: isBlocked ? "not-allowed" : "pointer" }}
              initial={{ opacity: 0, x: -12 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.25, delay: i * 0.05 }}
              onClick={() => {
                if (isComplete && phaseDocs.length > 0) {
                  setPopoverPhase(
                    node.phase === popoverPhase ? null : node.phase
                  );
                } else {
                  onNodeClick(node);
                }
              }}
              disabled={isBlocked}
            >
              {/* Circle indicator */}
              <div
                className="relative shrink-0 flex items-center justify-center rounded-full"
                style={{
                  width: 36,
                  height: 36,
                  backgroundColor: isComplete
                    ? phaseColor
                    : isInProgress
                      ? PHASE_MUTED_COLORS[node.phase]
                      : "var(--muted)",
                  border: `1.5px ${isBlocked ? "dashed" : "solid"} ${
                    isComplete || isInProgress
                      ? phaseColor
                      : isBlocked
                        ? "var(--muted-foreground)"
                        : "var(--border)"
                  }`,
                  borderColor:
                    isComplete || isInProgress
                      ? phaseColor
                      : isBlocked
                        ? "var(--muted-foreground)"
                        : "var(--border)",
                  opacity: isBlocked ? 0.5 : 1,
                }}
              >
                {isInProgress && (
                  <motion.div
                    className="absolute inset-0 rounded-full"
                    style={{ border: `1.5px solid ${phaseColor}` }}
                    animate={{
                      scale: [1, 1.3, 1],
                      opacity: [0.4, 0, 0.4],
                    }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                      ease: "easeInOut",
                    }}
                  />
                )}
                {isComplete ? (
                  <Check className="h-4 w-4 text-white" strokeWidth={2.5} />
                ) : isBlocked ? (
                  <Lock className="h-3.5 w-3.5 text-muted-foreground" />
                ) : (
                  <span
                    className="text-xs font-bold"
                    style={{
                      color: isInProgress
                        ? "var(--foreground)"
                        : "var(--muted-foreground)",
                    }}
                  >
                    {node.phase}
                  </span>
                )}
              </div>

              {/* Label & progress */}
              <div className="flex-1 min-w-0 text-left">
                <div
                  className="text-sm font-medium truncate"
                  style={{
                    color: isBlocked
                      ? "var(--muted-foreground)"
                      : "var(--foreground)",
                    opacity: isBlocked ? 0.5 : 1,
                  }}
                >
                  {node.name}
                </div>
                <div className="text-[11px] text-muted-foreground">
                  {node.completedSteps}/{node.totalSteps} steps
                  {phaseDocs.length > 0 &&
                    ` · ${phaseDocs.length} doc${phaseDocs.length !== 1 ? "s" : ""}`}
                </div>
              </div>
            </motion.button>

            {/* Mobile popover for completed nodes */}
            {popoverPhase === node.phase && phaseDocs.length > 0 && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                className="ml-12 mb-1 rounded-lg border border-border/50 bg-secondary p-3"
              >
                <div className="text-xs font-semibold text-foreground mb-1.5">
                  Documents
                </div>
                <div className="space-y-1">
                  {phaseDocs.map((doc) => (
                    <div
                      key={doc.canonicalName}
                      className="flex items-center gap-2 text-xs text-muted-foreground"
                    >
                      <FileText className="h-3 w-3 shrink-0" />
                      <span className="truncate">
                        {doc.name ||
                          doc.canonicalName
                            .replace(".md", "")
                            .replace(/_/g, " ")}
                      </span>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ─── Utilities ──────────────────────────────────────────────────────────────

function getNodeX(index: number, total: number): number {
  const usableWidth = 700 - SVG_PADDING_X * 2;
  const spacing = usableWidth / (total - 1);
  return SVG_PADDING_X + index * spacing;
}

function truncateLabel(text: string, maxLen: number): string {
  if (text.length <= maxLen) return text;
  return text.slice(0, maxLen - 1) + "…";
}
