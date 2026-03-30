"use client";

import { useState } from "react";

import { useProjectStore } from "@/stores/project-store";
import { MALAYSIAN_SCHEMES, INTERNATIONAL_SCHEMES, GRANT_SCHEME_MAP, CURRENCIES } from "@/lib/constants";
import type { GrantScheme } from "@/lib/types";

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

  const [discipline, setDiscipline] = useState("");
  const [title, setTitle] = useState("");
  const [country, setCountry] = useState("");
  const [grantScheme, setGrantScheme] = useState<GrantScheme | "">("");
  const [targetFunder, setTargetFunder] = useState("");
  const [currency, setCurrency] = useState("");
  const [budgetRange, setBudgetRange] = useState("");

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

  const handleSubmit = () => {
    if (!isValid) return;

    const project = createProject({
      title: title.trim() || "Untitled Project",
      discipline: discipline.trim(),
      country,
      careerStage: "",
      currency: currency || undefined,
      grantScheme: grantScheme || undefined,
      targetFunder: targetFunder.trim() || undefined,
      budgetRange: budgetRange || undefined,
    });

    // Reset form
    setDiscipline("");
    setTitle("");
    setCountry("");
    setGrantScheme("");
    setTargetFunder("");
    setCurrency("");
    setBudgetRange("");
    onOpenChange(false);

    window.location.href = `/projects/${project.id}`;
  };

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="w-[480px]">
        <DrawerHeader>
          <DrawerTitle>New Project</DrawerTitle>
          <DrawerDescription>
            Set up a new grant proposal project. Select a grant scheme to auto-fill funder, currency, and budget options.
          </DrawerDescription>
        </DrawerHeader>

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

          {/* 2. Title (optional) */}
          <div className="space-y-2">
            <Label htmlFor="title">Project Title</Label>
            <Input
              id="title"
              placeholder="e.g. Novel Approaches to Sustainable Aquaculture in Tropical Climates"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
            <p className="text-xs text-gray-400">
              Optional — you can name your project later after topic discovery.
            </p>
          </div>

          {/* 3. Country */}
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

          {/* 4. Grant Scheme */}
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

          {/* 5. Target Funder */}
          <div className="space-y-2">
            <Label htmlFor="funder">Target Funder</Label>
            <Input
              id="funder"
              placeholder={isMalaysianScheme ? "e.g. MOHE" : "e.g. NSF, ERC, Wellcome Trust"}
              value={targetFunder}
              onChange={(e) => setTargetFunder(e.target.value)}
            />
          </div>

          {/* 6. Currency */}
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

          {/* 7. Budget Range */}
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

        <DrawerFooter>
          <Button
            className="w-full"
            disabled={!isValid}
            onClick={handleSubmit}
          >
            Create Project
          </Button>
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
