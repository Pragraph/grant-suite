"use client";

import { useState } from "react";

import { useProjectStore } from "@/stores/project-store";
import { MALAYSIAN_SCHEMES, INTERNATIONAL_SCHEMES, GRANT_SCHEME_MAP } from "@/lib/constants";
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

const CAREER_STAGES = [
  "Postgraduate (Masters)",
  "Postgraduate (PhD)",
  "Postdoctoral",
  "Senior Lecturer",
  "Associate Professor",
  "Professor",
] as const;

const BUDGET_RANGES_MYR = [
  "< RM 100,000",
  "RM 100,000 – RM 300,000",
  "RM 300,000 – RM 500,000",
  "RM 500,000 – RM 1,000,000",
  "RM 1,000,000 – RM 5,000,000",
  "> RM 5,000,000",
] as const;

const BUDGET_RANGES_USD = [
  "< USD 50,000",
  "USD 50,000 – USD 100,000",
  "USD 100,000 – USD 250,000",
  "USD 250,000 – USD 500,000",
  "USD 500,000 – USD 1M",
  "> USD 1M",
] as const;

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

interface CreateProjectDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CreateProjectDrawer({
  open,
  onOpenChange,
}: CreateProjectDrawerProps) {
  const createProject = useProjectStore((s) => s.createProject);

  const [grantScheme, setGrantScheme] = useState<GrantScheme | "">("");
  const [title, setTitle] = useState("");
  const [discipline, setDiscipline] = useState("");
  const [country, setCountry] = useState("");
  const [careerStage, setCareerStage] = useState("");
  const [targetFunder, setTargetFunder] = useState("");
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
    if (info.defaultBudgetRange) {
      setBudgetRange(info.defaultBudgetRange);
    }
  };

  const isMalaysianScheme = grantScheme
    ? GRANT_SCHEME_MAP[grantScheme]?.category === "malaysian"
    : false;

  const budgetRanges = isMalaysianScheme ? BUDGET_RANGES_MYR : BUDGET_RANGES_USD;

  const isValid = title.trim() && discipline.trim() && country;

  const handleSubmit = () => {
    if (!isValid) return;

    const project = createProject({
      title: title.trim(),
      discipline: discipline.trim(),
      country,
      careerStage,
      grantScheme: grantScheme || undefined,
      targetFunder: targetFunder.trim() || undefined,
      budgetRange: budgetRange || undefined,
    });

    // Reset form
    setGrantScheme("");
    setTitle("");
    setDiscipline("");
    setCountry("");
    setCareerStage("");
    setTargetFunder("");
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
            Set up a new grant proposal project. Select your grant scheme first — it will pre-fill relevant fields.
          </DrawerDescription>
        </DrawerHeader>

        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-5">
          {/* Grant Scheme */}
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

          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="title">
              Project Title <span className="text-error">*</span>
            </Label>
            <Input
              id="title"
              placeholder="e.g. Novel Approaches to Sustainable Aquaculture in Tropical Climates"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>

          {/* Discipline */}
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

          {/* Country */}
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

          {/* Career Stage */}
          <div className="space-y-2">
            <Label htmlFor="career-stage">Career Stage</Label>
            <Select value={careerStage} onValueChange={setCareerStage}>
              <SelectTrigger id="career-stage">
                <SelectValue placeholder="Select career stage" />
              </SelectTrigger>
              <SelectContent>
                {CAREER_STAGES.map((s) => (
                  <SelectItem key={s} value={s}>
                    {s}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Target Funder */}
          <div className="space-y-2">
            <Label htmlFor="funder">Target Funder</Label>
            <Input
              id="funder"
              placeholder={isMalaysianScheme ? "e.g. MOHE" : "e.g. NSF, ERC, Wellcome Trust"}
              value={targetFunder}
              onChange={(e) => setTargetFunder(e.target.value)}
            />
          </div>

          {/* Budget Range */}
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
