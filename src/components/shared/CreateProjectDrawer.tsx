"use client";

import { useState } from "react";

import { useProjectStore } from "@/stores/project-store";

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
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const CAREER_STAGES = [
  "Student",
  "Early Career",
  "Mid Career",
  "Senior",
] as const;

const BUDGET_RANGES = [
  "< $50,000",
  "$50,000 – $100,000",
  "$100,000 – $250,000",
  "$250,000 – $500,000",
  "$500,000 – $1M",
  "> $1M",
] as const;

const COUNTRIES = [
  "United States",
  "United Kingdom",
  "Canada",
  "Australia",
  "Germany",
  "France",
  "Netherlands",
  "Switzerland",
  "Sweden",
  "Japan",
  "South Korea",
  "China",
  "India",
  "Brazil",
  "South Africa",
  "Nigeria",
  "Kenya",
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

  const [title, setTitle] = useState("");
  const [discipline, setDiscipline] = useState("");
  const [country, setCountry] = useState("");
  const [careerStage, setCareerStage] = useState("");
  const [targetFunder, setTargetFunder] = useState("");
  const [budgetRange, setBudgetRange] = useState("");

  const isValid = title.trim() && discipline.trim() && country;

  const handleSubmit = () => {
    if (!isValid) return;

    const project = createProject({
      title: title.trim(),
      discipline: discipline.trim(),
      country,
      careerStage,
      targetFunder: targetFunder.trim() || undefined,
      budgetRange: budgetRange || undefined,
    });

    // Reset form
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
            Set up a new grant proposal project
          </DrawerDescription>
        </DrawerHeader>

        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-5">
          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="title">
              Project Title <span className="text-error">*</span>
            </Label>
            <Input
              id="title"
              placeholder="e.g. Novel Approaches to Climate Resilience"
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
              placeholder="e.g. Environmental Science, Public Health"
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
            <Label htmlFor="funder">Target Funder (optional)</Label>
            <Input
              id="funder"
              placeholder="e.g. NSF, NIH, ERC, Wellcome Trust"
              value={targetFunder}
              onChange={(e) => setTargetFunder(e.target.value)}
            />
          </div>

          {/* Budget Range */}
          <div className="space-y-2">
            <Label htmlFor="budget">Budget Range (optional)</Label>
            <Select value={budgetRange} onValueChange={setBudgetRange}>
              <SelectTrigger id="budget">
                <SelectValue placeholder="Select budget range" />
              </SelectTrigger>
              <SelectContent>
                {BUDGET_RANGES.map((b) => (
                  <SelectItem key={b} value={b}>
                    {b}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
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
