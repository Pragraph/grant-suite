"use client";

import { useState } from "react";

import { useProjectStore } from "@/stores/project-store";
import { useProgressStore } from "@/stores/progress-store";
import { MALAYSIAN_SCHEMES, INTERNATIONAL_SCHEMES, GRANT_SCHEME_MAP, CURRENCIES, JOURNEY_MODES } from "@/lib/constants";
import type { GrantScheme, JourneyMode } from "@/lib/types";
import {
  Compass,
  Target,
  FileText,
  CheckSquare,
  RotateCcw,
} from "lucide-react";
import { cn } from "@/lib/utils";

import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
  DrawerFooter,
  DrawerClose,
} from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const COUNTRIES = [
  "Malaysia",
  "Indonesia",
  "Thailand",
  "Philippines",
  "Singapore",
  "Vietnam",
  "Brunei",
  "Cambodia",
  "Myanmar",
  "Laos",
  "United Kingdom",
  "United States",
  "Australia",
  "Japan",
  "South Korea",
  "Germany",
  "Netherlands",
  "Canada",
  "India",
  "China",
  "Other",
] as const;

// ── Dynamic budget range helper ──────────────────────────────────────────────

function getBudgetRangesForScheme(
  scheme: GrantScheme | "",
  currencyCode: string,
): string[] {
  const info = scheme ? GRANT_SCHEME_MAP[scheme] : null;
  const max = info?.maxBudget;
  const sym = CURRENCIES.find(c => c.code === currencyCode)?.symbol || currencyCode;

  // If no scheme selected or no max budget, return generic ranges for the currency
  if (!max) {
    if (currencyCode === "MYR") {
      return [
        "< RM 100,000",
        "RM 100,000 – RM 300,000",
        "RM 300,000 – RM 500,000",
        "RM 500,000 – RM 1,000,000",
        "RM 1,000,000 – RM 5,000,000",
        "> RM 5,000,000",
      ];
    }
    return [
      `< ${sym} 50,000`,
      `${sym} 50,000 – ${sym} 100,000`,
      `${sym} 100,000 – ${sym} 250,000`,
      `${sym} 250,000 – ${sym} 500,000`,
      `${sym} 500,000 – ${sym} 1,000,000`,
      `> ${sym} 1,000,000`,
    ];
  }

  // Generate ranges up to the scheme's max budget
  const ranges: string[] = [];
  const thresholds = [50000, 100000, 150000, 200000, 250000, 300000, 350000, 500000, 1000000, 2000000, 5000000];
  const relevantThresholds = thresholds.filter(t => t <= max);

  // First range
  if (relevantThresholds.length > 0 && relevantThresholds[0] > 0) {
    ranges.push(`< ${sym} ${relevantThresholds[0].toLocaleString()}`);
  }

  // Middle ranges
  for (let i = 0; i < relevantThresholds.length - 1; i++) {
    const low = relevantThresholds[i];
    const high = relevantThresholds[i + 1];
    if (high <= max) {
      ranges.push(`${sym} ${low.toLocaleString()} – ${sym} ${high.toLocaleString()}`);
    }
  }

  // Final range capped at max
  const lastThreshold = relevantThresholds[relevantThresholds.length - 1];
  if (lastThreshold && lastThreshold < max) {
    ranges.push(`${sym} ${lastThreshold.toLocaleString()} – ${sym} ${max.toLocaleString()}`);
  } else if (lastThreshold === max && !ranges.some(r => r.includes(max.toLocaleString()))) {
    ranges.push(`Up to ${sym} ${max.toLocaleString()}`);
  }

  return ranges.length > 0 ? ranges : [`Up to ${sym} ${max.toLocaleString()}`];
}

// ── Component ────────────────────────────────────────────────────────────────

interface CreateProjectDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CreateProjectDrawer({
  open,
  onOpenChange,
}: CreateProjectDrawerProps) {
  const createProject = useProjectStore((s) => s.createProject);
  const bypassPhases = useProgressStore((s) => s.bypassPhases);

  const [discipline, setDiscipline] = useState("");
  const [areaOfInterest, setAreaOfInterest] = useState("");
  const [title, setTitle] = useState("");
  const [country, setCountry] = useState("");
  const [grantScheme, setGrantScheme] = useState<GrantScheme | "">("");
  const [targetFunder, setTargetFunder] = useState("");
  const [currency, setCurrency] = useState("");
  const [budgetRange, setBudgetRange] = useState("");
  const [drawerStep, setDrawerStep] = useState<"info" | "journey">("info");
  const [journeyMode, setJourneyMode] = useState<JourneyMode | null>(null);

  const journeyIcons: Record<string, React.ComponentType<{ className?: string }>> = {
    Compass,
    Target,
    FileText,
    CheckSquare,
    RotateCcw,
  };

  // ── Auto-fill when grant scheme changes ──────────────────────────────────

  const handleGrantSchemeChange = (value: string) => {
    const scheme = value as GrantScheme;
    setGrantScheme(scheme);

    const info = GRANT_SCHEME_MAP[scheme];
    if (!info) return;

    if (info.country) {
      setCountry(info.country === "International" ? "" : info.country);
    }
    if (info.funder) {
      setTargetFunder(info.funder);
    }
    if (info.defaultCurrency) {
      setCurrency(info.defaultCurrency);
    }
    setBudgetRange(""); // Reset since ranges change per scheme
  };

  const isMalaysianScheme = grantScheme
    ? GRANT_SCHEME_MAP[grantScheme]?.category === "malaysian"
    : false;

  const budgetRanges = getBudgetRangesForScheme(
    grantScheme as GrantScheme | "",
    currency || (isMalaysianScheme ? "MYR" : "USD"),
  );

  const isValid = discipline.trim() && country;

  const generateDraftTitle = (): string => {
    const schemeInfo = grantScheme ? GRANT_SCHEME_MAP[grantScheme] : null;
    const schemePart =
      grantScheme && grantScheme !== "Undecided" && grantScheme !== "Other"
        ? schemeInfo?.name || grantScheme
        : "Untitled";

    const areaWords = areaOfInterest.trim().split(/\s+/);
    const areaPart =
      areaWords.length >= 2
        ? `${areaWords[0]} ${areaWords[1]}`
        : areaWords[0] || "Untitled";

    const yearPart = new Date().getFullYear();

    return `${schemePart}_${areaPart}_${yearPart}`;
  };

  const handleSubmit = (selectedMode: JourneyMode) => {
    if (!isValid) return;

    const modeInfo = JOURNEY_MODES.find((m) => m.id === selectedMode);
    const startPhase = modeInfo?.startingPhase ?? 1;

    const project = createProject({
      title: title.trim() || generateDraftTitle(),
      discipline: discipline.trim(),
      areaOfInterest: areaOfInterest.trim() || undefined,
      country,
      careerStage: "",
      currency: currency || undefined,
      grantScheme: grantScheme || undefined,
      targetFunder: targetFunder.trim() || undefined,
      budgetRange: budgetRange || undefined,
      journeyMode: selectedMode,
      startingPhase: startPhase,
      currentPhase: startPhase,
    });

    // Bypass skipped phases
    if (modeInfo && modeInfo.bypassedPhases.length > 0) {
      bypassPhases(project.id, modeInfo.bypassedPhases);
    }

    // Reset form
    setDiscipline("");
    setAreaOfInterest("");
    setTitle("");
    setCountry("");
    setGrantScheme("");
    setTargetFunder("");
    setCurrency("");
    setBudgetRange("");
    setDrawerStep("info");
    setJourneyMode(null);
    onOpenChange(false);

    window.location.assign(`/projects/${project.id}`);
  };

  return (
    <Drawer open={open} onOpenChange={(isOpen) => {
        if (!isOpen) setDrawerStep("info");
        onOpenChange(isOpen);
      }}>
      <DrawerContent className="w-[480px]">
        <DrawerHeader>
          <DrawerTitle>New Project</DrawerTitle>
          <DrawerDescription>
            Set up a new grant proposal project. Select a grant scheme to auto-fill funder, currency, and budget options.
          </DrawerDescription>
        </DrawerHeader>

        {drawerStep === "journey" && (
          <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
            <div>
              <h3 className="text-base font-semibold text-foreground">
                Where are you in your grant journey?
              </h3>
              <p className="text-sm text-muted-foreground mt-1">
                This determines your starting point. You can always go back to earlier phases later.
              </p>
            </div>

            <div className="space-y-3">
              {JOURNEY_MODES.map((mode) => {
                const Icon = journeyIcons[mode.icon];
                const isSelected = journeyMode === mode.id;

                return (
                  <button
                    key={mode.id}
                    onClick={() => handleSubmit(mode.id)}
                    className={cn(
                      "flex w-full items-start gap-3 rounded-xl border p-4 text-left transition-all",
                      "hover:border-[#4F7DF3]/40 hover:shadow-sm hover:bg-muted/30",
                      isSelected
                        ? "border-[#4F7DF3] bg-[#F0F4FF]"
                        : "border-border bg-card"
                    )}
                  >
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#F0F4FF] text-[#4F7DF3]">
                      {Icon && <Icon className="h-5 w-5" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-foreground">
                        {mode.label}
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {mode.description}
                      </p>
                      {mode.bypassedPhases.length > 0 && (
                        <p className="text-[10px] text-muted-foreground/70 mt-1">
                          Starts at Phase {mode.startingPhase} · Phases{" "}
                          {mode.bypassedPhases.join(", ")} available later
                        </p>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {drawerStep === "info" && (
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-5">
          {/* 1. Discipline */}
          <div className="space-y-2">
            <Label htmlFor="discipline">
              Discipline / Field <span className="text-error">*</span>
            </Label>
            <Input
              id="discipline"
              placeholder="e.g. Environmental Science, Sports Science, Computer Science"
              value={discipline}
              onChange={(e) => setDiscipline(e.target.value)}
            />
          </div>

          {/* 2. Area of Interest (optional) */}
          <div className="space-y-2">
            <Label htmlFor="areaOfInterest">Area of Interest</Label>
            <Input
              id="areaOfInterest"
              placeholder="e.g., AI in disability sports, Student motivation in online learning"
              value={areaOfInterest}
              onChange={(e) => setAreaOfInterest(e.target.value)}
            />
            <p className="text-xs text-gray-500">
              Optional — helps pre-fill research context in later steps.
            </p>
          </div>

          {/* 3. Title (optional) */}
          <div className="space-y-2">
            <Label htmlFor="title">Project Title</Label>
            <Input
              id="title"
              placeholder="e.g. Novel Approaches to Sustainable Aquaculture in Tropical Climates"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
            <p className="text-xs text-gray-500">
              Optional — a draft title will be generated automatically if left empty.
            </p>
          </div>

          {/* 4. Country */}
          <div className="space-y-2">
            <Label htmlFor="country">
              Country <span className="text-error">*</span>
            </Label>
            <Select value={country} onValueChange={setCountry}>
              <SelectTrigger id="country">
                <SelectValue placeholder="Select country" />
              </SelectTrigger>
              <SelectContent>
                {COUNTRIES.map((c) => (
                  <SelectItem key={c} value={c}>
                    {c}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* 5. Grant Scheme */}
          <div className="space-y-2">
            <Label htmlFor="grant-scheme">Grant Scheme</Label>
            <Select value={grantScheme} onValueChange={handleGrantSchemeChange}>
              <SelectTrigger id="grant-scheme">
                <SelectValue placeholder="Select grant scheme (optional)" />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectLabel>Malaysian MOHE Grants</SelectLabel>
                  {MALAYSIAN_SCHEMES.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.name} — {s.fullName}
                    </SelectItem>
                  ))}
                </SelectGroup>
                <SelectGroup>
                  <SelectLabel>International Grants</SelectLabel>
                  {INTERNATIONAL_SCHEMES.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.name} — {s.fullName}
                    </SelectItem>
                  ))}
                </SelectGroup>
                <SelectGroup>
                  <SelectLabel>Other</SelectLabel>
                  <SelectItem value="Undecided">Undecided — I need grant matching help</SelectItem>
                  <SelectItem value="Other">Other / Not listed</SelectItem>
                </SelectGroup>
              </SelectContent>
            </Select>
            {grantScheme && GRANT_SCHEME_MAP[grantScheme] && (
              <p className="text-xs text-gray-500">
                {GRANT_SCHEME_MAP[grantScheme].description}
              </p>
            )}
          </div>

          {/* 6. Target Funder */}
          <div className="space-y-2">
            <Label htmlFor="funder">Target Funder</Label>
            <Input
              id="funder"
              placeholder={isMalaysianScheme ? "e.g. MOHE" : "e.g. NSF, ERC, Wellcome Trust"}
              value={targetFunder}
              onChange={(e) => setTargetFunder(e.target.value)}
            />
          </div>

          {/* 7. Currency */}
          <div className="space-y-2">
            <Label htmlFor="currency">Currency</Label>
            <Select value={currency} onValueChange={setCurrency}>
              <SelectTrigger id="currency">
                <SelectValue placeholder="Select currency" />
              </SelectTrigger>
              <SelectContent>
                {CURRENCIES.map((c) => (
                  <SelectItem key={c.code} value={c.code}>
                    {c.symbol} — {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* 8. Budget Range */}
          <div className="space-y-2">
            <Label htmlFor="budget">Budget Range</Label>
            <Select value={budgetRange} onValueChange={setBudgetRange}>
              <SelectTrigger id="budget">
                <SelectValue placeholder="Select budget range" />
              </SelectTrigger>
              <SelectContent>
                {budgetRanges.map((b) => (
                  <SelectItem key={b} value={b}>
                    {b}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Malaysian scheme info banner */}
          {isMalaysianScheme && (
            <div className="rounded-lg border border-blue-200 bg-blue-50 p-3">
              <p className="text-xs font-medium text-blue-700 mb-1">
                MyGRANTS Submission
              </p>
              <p className="text-xs text-blue-600">
                This scheme is submitted via the MyGRANTS portal. Grant Suite will tailor prompts
                to match MyGRANTS requirements including evaluation criteria, required attachments,
                and formatting.
              </p>
            </div>
          )}
        </div>
        )}

        <DrawerFooter>
          {drawerStep === "info" ? (
            <Button
              className="w-full"
              disabled={!isValid}
              onClick={() => setDrawerStep("journey")}
            >
              Next
            </Button>
          ) : (
            <Button
              variant="secondary"
              className="w-full"
              onClick={() => setDrawerStep("info")}
            >
              Back
            </Button>
          )}
          <DrawerClose asChild>
            <Button variant="secondary" className="w-full">
              Cancel
            </Button>
          </DrawerClose>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}
