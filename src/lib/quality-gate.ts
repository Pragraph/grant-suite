import { useDocumentStore } from "@/stores/document-store";
import type { Document } from "./types";

// ─── Types ───────────────────────────────────────────────────────────────────

export interface GateCheck {
  id: string;
  label: string;
  description: string;
  status: "pass" | "fail" | "warn";
  detail?: string;
}

export interface GateResult {
  phase: number;
  passed: boolean;
  checks: GateCheck[];
  canOverride: boolean;
  timestamp: string;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function getDocument(canonicalName: string): Document | undefined {
  const { documents } = useDocumentStore.getState();
  return documents.find((d) => d.isCurrent && d.canonicalName === canonicalName);
}

function hasSection(content: string, sectionName: string): boolean {
  return content.includes(`## ${sectionName}`);
}

function countOccurrences(content: string, needle: string): number {
  let count = 0;
  let idx = 0;
  while ((idx = content.indexOf(needle, idx)) !== -1) {
    count++;
    idx += needle.length;
  }
  return count;
}

// ─── Gate Definitions ────────────────────────────────────────────────────────

const GATE_1_SECTIONS = [
  "Grant Program Overview",
  "Eligibility Requirements",
  "Evaluation Criteria",
  "Funding Parameters",
  "Strategic Priorities",
  "Application Requirements",
  "Timeline & Deadlines",
  "Intelligence Gaps",
];

function checkGate1(): GateCheck[] {
  const checks: GateCheck[] = [];
  const doc = getDocument("Grant_Intelligence.md");

  // Check 1: Document exists and is non-empty
  if (!doc || !doc.content.trim()) {
    checks.push({
      id: "g1-exists",
      label: "Grant Intelligence document",
      description: "Grant_Intelligence.md must exist and contain content",
      status: "fail",
      detail: "Document is missing. Complete Phase 1, Step 3 to generate it.",
    });
    return checks;
  }

  checks.push({
    id: "g1-exists",
    label: "Grant Intelligence document",
    description: "Grant_Intelligence.md exists and contains content",
    status: "pass",
  });

  // Check 2: All 8 sections present
  const missingSections = GATE_1_SECTIONS.filter(
    (s) => !hasSection(doc.content, s)
  );

  if (missingSections.length > 0) {
    checks.push({
      id: "g1-sections",
      label: "Intelligence sections completeness",
      description: `All ${GATE_1_SECTIONS.length} sections should be present`,
      status: "warn",
      detail: `Missing sections: ${missingSections.join(", ")}`,
    });
  } else {
    checks.push({
      id: "g1-sections",
      label: "Intelligence sections completeness",
      description: `All ${GATE_1_SECTIONS.length} sections present`,
      status: "pass",
    });
  }

  // Check 3: No CRITICAL gaps
  const gapsSection = doc.content.split("## Intelligence Gaps")[1] ?? "";
  const hasCritical =
    gapsSection.toLowerCase().includes("critical") ||
    gapsSection.toLowerCase().includes("🔴");

  if (hasCritical) {
    checks.push({
      id: "g1-gaps",
      label: "Critical intelligence gaps",
      description: "Intelligence Gaps section should not have CRITICAL items",
      status: "warn",
      detail:
        "Critical gaps detected in the Intelligence Gaps section. Consider addressing these before proceeding.",
    });
  } else {
    checks.push({
      id: "g1-gaps",
      label: "Critical intelligence gaps",
      description: "No critical gaps detected",
      status: "pass",
    });
  }

  return checks;
}

function checkGate2(): GateCheck[] {
  const checks: GateCheck[] = [];
  const blueprint = getDocument("Proposal_Blueprint.md");
  const intelligence = getDocument("Grant_Intelligence.md");

  // Check 1: Blueprint exists
  if (!blueprint || !blueprint.content.trim()) {
    checks.push({
      id: "g2-exists",
      label: "Proposal Blueprint document",
      description: "Proposal_Blueprint.md must exist and contain content",
      status: "fail",
      detail: "Document is missing. Complete Phase 2, Step 5 to generate it.",
    });
    return checks;
  }

  checks.push({
    id: "g2-exists",
    label: "Proposal Blueprint document",
    description: "Proposal_Blueprint.md exists and contains content",
    status: "pass",
  });

  // Check 2: Blueprint covers evaluation criteria from Grant Intelligence
  if (intelligence?.content) {
    const criteriaSection =
      intelligence.content.split("## Evaluation Criteria")[1]?.split("##")[0] ?? "";
    const criteriaLines = criteriaSection
      .split("\n")
      .filter((l) => l.trim().startsWith("-") || l.trim().startsWith("*"))
      .map((l) => l.replace(/^[\s\-*]+/, "").trim().toLowerCase())
      .filter((l) => l.length > 3);

    if (criteriaLines.length > 0) {
      const blueprintLower = blueprint.content.toLowerCase();
      const coveredCount = criteriaLines.filter((c) =>
        blueprintLower.includes(c.slice(0, 20))
      ).length;

      if (coveredCount < criteriaLines.length * 0.5) {
        checks.push({
          id: "g2-criteria",
          label: "Evaluation criteria coverage",
          description: "Blueprint should address evaluation criteria from Grant Intelligence",
          status: "warn",
          detail: `Only ${coveredCount} of ${criteriaLines.length} identified criteria appear referenced in the blueprint.`,
        });
      } else {
        checks.push({
          id: "g2-criteria",
          label: "Evaluation criteria coverage",
          description: "Blueprint addresses evaluation criteria",
          status: "pass",
        });
      }
    }
  }

  // Check 3: EP Deployment Map present
  const hasEPMap =
    blueprint.content.includes("EP Deployment") ||
    blueprint.content.includes("Evaluator Psychology") ||
    blueprint.content.includes("## Deployment Map");

  if (!hasEPMap) {
    checks.push({
      id: "g2-epmap",
      label: "EP Deployment Map",
      description: "Evaluator Psychology Deployment Map should be present",
      status: "warn",
      detail:
        "EP Deployment Map not detected in the blueprint. This may reduce strategic alignment.",
    });
  } else {
    checks.push({
      id: "g2-epmap",
      label: "EP Deployment Map",
      description: "EP Deployment Map present in blueprint",
      status: "pass",
    });
  }

  return checks;
}

function checkGate3(): GateCheck[] {
  const checks: GateCheck[] = [];
  const doc = getDocument("Research_Design.md");

  // Check 1: Document exists
  if (!doc || !doc.content.trim()) {
    checks.push({
      id: "g3-exists",
      label: "Research Design document",
      description: "Research_Design.md must exist and contain content",
      status: "fail",
      detail: "Document is missing. Complete Phase 3, Step 1 to generate it.",
    });
    return checks;
  }

  checks.push({
    id: "g3-exists",
    label: "Research Design document",
    description: "Research_Design.md exists and contains content",
    status: "pass",
  });

  // Check 2: Required sections
  const requiredSections = [
    { name: "Methodology", keywords: ["methodology", "method", "approach"] },
    { name: "Timeline", keywords: ["timeline", "schedule", "milestones", "work plan"] },
    { name: "Sample", keywords: ["sample", "participants", "population", "data collection"] },
  ];

  const contentLower = doc.content.toLowerCase();
  const missingSections: string[] = [];

  for (const section of requiredSections) {
    const found = section.keywords.some(
      (kw) =>
        contentLower.includes(`## ${kw}`) ||
        contentLower.includes(`### ${kw}`) ||
        contentLower.includes(kw)
    );
    if (!found) missingSections.push(section.name);
  }

  if (missingSections.length > 0) {
    checks.push({
      id: "g3-sections",
      label: "Research design completeness",
      description: "Should include methodology, timeline, and sample sections",
      status: "warn",
      detail: `Missing or unclear sections: ${missingSections.join(", ")}`,
    });
  } else {
    checks.push({
      id: "g3-sections",
      label: "Research design completeness",
      description: "Methodology, timeline, and sample sections present",
      status: "pass",
    });
  }

  return checks;
}

function checkGate4(): GateCheck[] {
  const checks: GateCheck[] = [];
  const doc = getDocument("Budget_Team_Plan.md");

  // Check 1: Document exists
  if (!doc || !doc.content.trim()) {
    checks.push({
      id: "g4-exists",
      label: "Budget Justification document",
      description: "Budget_Team_Plan.md must exist and contain content",
      status: "fail",
      detail: "Document is missing. Complete Phase 4, Step 3 to generate it.",
    });
    return checks;
  }

  checks.push({
    id: "g4-exists",
    label: "Budget Justification document",
    description: "Budget_Team_Plan.md exists and contains content",
    status: "pass",
  });

  // Check 2: Budget totals vs grant limits
  const intelligence = getDocument("Grant_Intelligence.md");
  if (intelligence?.content) {
    // Try to extract budget limit from Grant Intelligence
    const fundingSection =
      intelligence.content.split("## Funding Parameters")[1]?.split("##")[0] ?? "";

    const limitMatch = fundingSection.match(
      /(?:maximum|up to|max|limit)[:\s]*\$?([\d,]+(?:\.\d+)?)\s*(?:k|K|thousand|million|M)?/i
    );

    if (limitMatch) {
      // Try to extract total from budget document
      const budgetContent = doc.content;
      const totalMatch = budgetContent.match(
        /(?:total|grand total|total budget)[:\s]*\$?([\d,]+(?:\.\d+)?)/i
      );

      if (totalMatch) {
        const limit = parseFloat(limitMatch[1].replace(/,/g, ""));
        const total = parseFloat(totalMatch[1].replace(/,/g, ""));

        if (total > limit) {
          checks.push({
            id: "g4-budget",
            label: "Budget within grant limits",
            description: "Budget total should not exceed the grant funding limit",
            status: "warn",
            detail: `Budget total ($${total.toLocaleString()}) may exceed the grant limit ($${limit.toLocaleString()}). Verify and adjust if needed.`,
          });
        } else {
          checks.push({
            id: "g4-budget",
            label: "Budget within grant limits",
            description: "Budget total is within grant funding limits",
            status: "pass",
          });
        }
      }
    }
  }

  return checks;
}

function checkGate5(): GateCheck[] {
  const checks: GateCheck[] = [];
  const doc = getDocument("Complete_Proposal.md");

  // Check 1: Document exists
  if (!doc || !doc.content.trim()) {
    checks.push({
      id: "g5-exists",
      label: "Complete Proposal document",
      description: "Complete_Proposal.md must exist and contain content",
      status: "fail",
      detail: "Document is missing. Complete Phase 5, Step 8 to generate it.",
    });
    return checks;
  }

  checks.push({
    id: "g5-exists",
    label: "Complete Proposal document",
    description: "Complete_Proposal.md exists and contains content",
    status: "pass",
  });

  // Check 2: [CITATION NEEDED] count
  const citationCount = countOccurrences(doc.content, "[CITATION NEEDED]");
  if (citationCount > 0) {
    checks.push({
      id: "g5-citations",
      label: "Citation placeholders",
      description: "All [CITATION NEEDED] markers should be resolved",
      status: "warn",
      detail: `Found ${citationCount} unresolved [CITATION NEEDED] marker${citationCount > 1 ? "s" : ""}. Consider adding proper citations before review.`,
    });
  } else {
    checks.push({
      id: "g5-citations",
      label: "Citation placeholders",
      description: "No unresolved citation placeholders",
      status: "pass",
    });
  }

  // Check 3: [USER INPUT NEEDED] count
  const userInputCount = countOccurrences(doc.content, "[USER INPUT NEEDED]");
  if (userInputCount > 0) {
    checks.push({
      id: "g5-userinput",
      label: "User input placeholders",
      description: "All [USER INPUT NEEDED] markers must be resolved before proceeding",
      status: "fail",
      detail: `Found ${userInputCount} unresolved [USER INPUT NEEDED] marker${userInputCount > 1 ? "s" : ""}. These MUST be filled in before the proposal can be reviewed.`,
    });
  } else {
    checks.push({
      id: "g5-userinput",
      label: "User input placeholders",
      description: "No unresolved user input placeholders",
      status: "pass",
    });
  }

  // Check 4: Word count vs grant limit
  const intelligence = getDocument("Grant_Intelligence.md");
  if (intelligence?.content) {
    const reqSection =
      intelligence.content.split("## Application Requirements")[1]?.split("##")[0] ?? "";

    const wordLimitMatch = reqSection.match(
      /(?:word limit|word count|maximum.*words|page limit)[:\s]*(\d[\d,]*)/i
    );

    if (wordLimitMatch) {
      const limit = parseInt(wordLimitMatch[1].replace(/,/g, ""), 10);
      const wordCount = doc.content.split(/\s+/).filter(Boolean).length;

      if (wordCount > limit) {
        checks.push({
          id: "g5-wordcount",
          label: "Word count within limits",
          description: "Proposal word count should not exceed the grant word limit",
          status: "warn",
          detail: `Current word count (${wordCount.toLocaleString()}) exceeds the limit (${limit.toLocaleString()} words). Consider trimming before submission.`,
        });
      } else {
        checks.push({
          id: "g5-wordcount",
          label: "Word count within limits",
          description: `Word count (${wordCount.toLocaleString()}) is within the limit`,
          status: "pass",
        });
      }
    }
  }

  return checks;
}

// ─── Quality Gate Service ────────────────────────────────────────────────────

const GATE_CHECKERS: Record<number, () => GateCheck[]> = {
  1: checkGate1,
  2: checkGate2,
  3: checkGate3,
  4: checkGate4,
  5: checkGate5,
};

class QualityGateService {
  checkGate(phase: number): GateResult {
    const checker = GATE_CHECKERS[phase];

    if (!checker) {
      return {
        phase,
        passed: true,
        checks: [],
        canOverride: false,
        timestamp: new Date().toISOString(),
      };
    }

    const checks = checker();
    const hasFails = checks.some((c) => c.status === "fail");
    const hasWarns = checks.some((c) => c.status === "warn");

    return {
      phase,
      passed: !hasFails && !hasWarns,
      checks,
      canOverride: !hasFails && hasWarns,
      timestamp: new Date().toISOString(),
    };
  }
}

export const qualityGateService = new QualityGateService();
