"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import {
  Sparkles,
  ArrowRight,
  ChevronDown,
  Zap,
  Brain,
  FileOutput,
  ClipboardCopy,
  MessageSquare,
  FileCheck,
  ExternalLink,
  FileText,
  Search,
  PenTool,
  FlaskConical,
  BarChart3,
  Layers,
  CheckCircle2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PhaseIcon } from "@/components/ui/phase-icon";
import { PHASES } from "@/lib/types";
import type { Phase } from "@/components/ui/phase-icon";

// ─── Animation variants ──────────────────────────────────────────────────────

const fadeInUp = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0 },
};

const stagger = {
  visible: { transition: { staggerChildren: 0.1 } },
};

const viewportOpts = { once: true, margin: "-80px" as const };

// ─── Phase key documents ─────────────────────────────────────────────────────

const phaseDocuments = [
  "strategic-positioning.md",
  "conceptual-framework.md",
  "proposal-narrative.md",
  "work-plan-timeline.md",
  "budget-justification.md",
  "full-draft-assembly.md",
  "final-export-package.md",
];

const phaseIcons = [Search, PenTool, FileText, FlaskConical, BarChart3, Layers, CheckCircle2];

// ─── Nav ─────────────────────────────────────────────────────────────────────

function Nav() {
  return (
    <nav className="fixed top-0 z-50 w-full border-b border-border/50 bg-background/80 backdrop-blur-md">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-6">
        <Link href="/" className="flex items-center gap-2 text-foreground">
          <Sparkles className="h-5 w-5 text-accent-500" />
          <span className="font-heading text-sm font-semibold tracking-tight">
            Grant Suite
          </span>
        </Link>

        <div className="hidden items-center gap-6 md:flex">
          <a
            href="#features"
            className="text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            Features
          </a>
          <a
            href="#how-it-works"
            className="text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            How It Works
          </a>
          <Button asChild size="sm">
            <Link href="/projects">Start Now</Link>
          </Button>
        </div>
      </div>
    </nav>
  );
}

// ─── Hero ────────────────────────────────────────────────────────────────────

function Hero() {
  return (
    <section className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden px-6 pt-14">
      {/* Radial gradient background */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 70% 50% at 50% 40%, oklch(0.22 0.08 275 / 40%) 0%, transparent 100%)",
        }}
      />

      <motion.div
        className="relative z-10 flex max-w-3xl flex-col items-center text-center"
        initial="hidden"
        animate="visible"
        variants={stagger}
      >
        <motion.div variants={fadeInUp} transition={{ duration: 0.5 }}>
          <Badge className="mb-6">Open source &middot; Free forever</Badge>
        </motion.div>

        <motion.h1
          className="font-display text-4xl leading-tight tracking-tight sm:text-5xl md:text-6xl"
          variants={fadeInUp}
          transition={{ duration: 0.5 }}
        >
          Write winning grant proposals with{" "}
          <span className="text-gradient">AI-guided precision</span>
        </motion.h1>

        <motion.p
          className="mt-6 max-w-xl text-lg text-muted-foreground"
          variants={fadeInUp}
          transition={{ duration: 0.5 }}
        >
          7-phase system that transforms your research idea into a
          competition-ready proposal. From discovery to submission.
        </motion.p>

        <motion.div
          className="mt-8 flex flex-wrap items-center justify-center gap-4"
          variants={fadeInUp}
          transition={{ duration: 0.5 }}
        >
          <Button asChild size="lg">
            <Link href="/projects">
              Get Started
              <ArrowRight className="ml-1 h-4 w-4" />
            </Link>
          </Button>
          <Button asChild variant="ghost" size="lg">
            <a href="#phases">
              See How It Works
              <ChevronDown className="ml-1 h-4 w-4" />
            </a>
          </Button>
        </motion.div>

        {/* App mockup */}
        <motion.div
          className="mt-16 w-full max-w-2xl"
          variants={fadeInUp}
          transition={{ duration: 0.6, delay: 0.3 }}
        >
          <HeroMockup />
        </motion.div>
      </motion.div>
    </section>
  );
}

function HeroMockup() {
  const mockPhases = [
    { phase: 1 as Phase, name: "Discovery", progress: 100, status: "complete" },
    { phase: 2 as Phase, name: "Framework", progress: 100, status: "complete" },
    { phase: 3 as Phase, name: "Narrative", progress: 65, status: "active" },
    { phase: 4 as Phase, name: "Technical", progress: 0, status: "pending" },
    { phase: 5 as Phase, name: "Impact", progress: 0, status: "pending" },
  ];

  return (
    <Card className="border-border/30 bg-card/80 shadow-glow-sm backdrop-blur">
      <div className="flex items-center gap-2 border-b border-border/30 px-4 py-3">
        <div className="flex gap-1.5">
          <div className="h-2.5 w-2.5 rounded-full bg-error/60" />
          <div className="h-2.5 w-2.5 rounded-full bg-warning/60" />
          <div className="h-2.5 w-2.5 rounded-full bg-success/60" />
        </div>
        <span className="ml-2 font-mono text-xs text-muted-foreground">
          grant-suite — My Research Proposal
        </span>
      </div>
      <CardContent className="p-4">
        <div className="flex items-center gap-3 overflow-hidden">
          {mockPhases.map((p) => (
            <div
              key={p.phase}
              className="flex min-w-0 flex-1 flex-col items-center gap-2"
            >
              <PhaseIcon
                phase={p.phase}
                size="sm"
                active={p.status === "active"}
              />
              <span className="truncate text-[10px] text-muted-foreground">
                {p.name}
              </span>
              <div className="h-1 w-full rounded-full bg-muted">
                <div
                  className="h-full rounded-full transition-all"
                  style={{
                    width: `${p.progress}%`,
                    backgroundColor:
                      p.status === "complete"
                        ? "oklch(0.68 0.17 152)"
                        : p.status === "active"
                          ? "oklch(0.59 0.24 275)"
                          : "transparent",
                  }}
                />
              </div>
            </div>
          ))}
        </div>

        <div className="mt-4 grid grid-cols-2 gap-2">
          <div className="rounded-md border border-border/30 bg-muted/50 p-3">
            <div className="mb-1 text-[10px] font-medium text-accent-400">
              Current Step
            </div>
            <div className="text-xs text-foreground">Literature Review</div>
            <div className="mt-1 text-[10px] text-muted-foreground">
              Phase 3 &middot; Step 3 of 5
            </div>
          </div>
          <div className="rounded-md border border-border/30 bg-muted/50 p-3">
            <div className="mb-1 text-[10px] font-medium text-success">
              Documents
            </div>
            <div className="text-xs text-foreground">12 generated</div>
            <div className="mt-1 text-[10px] text-muted-foreground">
              4 pending review
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Phase Overview ──────────────────────────────────────────────────────────

function PhaseOverview() {
  return (
    <section id="phases" className="px-6 py-32">
      <div className="mx-auto max-w-6xl">
        <motion.div
          className="mb-12 text-center"
          initial="hidden"
          whileInView="visible"
          viewport={viewportOpts}
          variants={fadeInUp}
          transition={{ duration: 0.5 }}
        >
          <h2 className="font-display text-3xl tracking-tight sm:text-4xl">
            Seven phases. One complete system.
          </h2>
          <p className="mt-3 text-muted-foreground">
            Each phase builds on the last — no gaps, no guesswork.
          </p>
        </motion.div>

        <motion.div
          className="flex gap-4 overflow-x-auto pb-4 md:grid md:grid-cols-7 md:overflow-visible"
          initial="hidden"
          whileInView="visible"
          viewport={viewportOpts}
          variants={stagger}
        >
          {PHASES.map((phase, i) => {
            const Icon = phaseIcons[i];
            return (
              <motion.div
                key={phase.id}
                variants={fadeInUp}
                transition={{ duration: 0.4 }}
                className="min-w-50 md:min-w-0"
              >
                <Card className="h-full border-t-2 bg-card/60" style={{ borderTopColor: `var(--phase-${phase.id})` }}>
                  <CardContent className="flex flex-col gap-3 p-4">
                    <div className="flex items-center gap-2">
                      <PhaseIcon phase={phase.id as Phase} size="sm" active />
                      <Icon
                        className="h-4 w-4"
                        style={{ color: `var(--phase-${phase.id})` }}
                      />
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-foreground">
                        {phase.name}
                      </div>
                      <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                        {phase.description}
                      </p>
                    </div>
                    <div className="mt-auto font-mono text-[10px] text-accent-400">
                      {phaseDocuments[i]}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </motion.div>
      </div>
    </section>
  );
}

// ─── Key Features ────────────────────────────────────────────────────────────

const features = [
  {
    icon: Zap,
    title: "Smart Prompt Compilation",
    description:
      "Your project details are automatically injected into expert-crafted prompts. Copy, paste into any AI tool, get precision results.",
  },
  {
    icon: Brain,
    title: "Evaluator Psychology Engine",
    description:
      "16 evidence-based psychological triggers mapped to your proposal. Not just writing — strategic persuasion.",
  },
  {
    icon: FileOutput,
    title: "Document Pipeline",
    description:
      "Every output feeds the next phase. Track progress, version documents, export when ready. Zero manual copying between phases.",
  },
];

function Features() {
  return (
    <section id="features" className="px-6 py-32">
      <div className="mx-auto max-w-4xl">
        <motion.div
          className="mb-12 text-center"
          initial="hidden"
          whileInView="visible"
          viewport={viewportOpts}
          variants={fadeInUp}
          transition={{ duration: 0.5 }}
        >
          <h2 className="font-display text-3xl tracking-tight sm:text-4xl">
            Built different
          </h2>
          <p className="mt-3 text-muted-foreground">
            Not another AI wrapper. A systematic proposal-building engine.
          </p>
        </motion.div>

        <motion.div
          className="grid gap-6 sm:grid-cols-3"
          initial="hidden"
          whileInView="visible"
          viewport={viewportOpts}
          variants={stagger}
        >
          {features.map((f) => (
            <motion.div
              key={f.title}
              variants={fadeInUp}
              transition={{ duration: 0.4 }}
            >
              <Card className="h-full bg-card/60">
                <CardContent className="flex flex-col gap-4 p-6">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent-500/10">
                    <f.icon className="h-5 w-5 text-accent-400" />
                  </div>
                  <div className="font-heading text-sm font-semibold text-foreground">
                    {f.title}
                  </div>
                  <p className="text-sm leading-relaxed text-muted-foreground">
                    {f.description}
                  </p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}

// ─── How It Works ────────────────────────────────────────────────────────────

const steps = [
  {
    icon: ClipboardCopy,
    title: "Fill in your project details",
    description: "Discipline, country, funder, career stage — the app tailors everything to your context.",
  },
  {
    icon: MessageSquare,
    title: "Copy compiled prompts to your AI tool",
    description: "ChatGPT, Claude, Gemini — your choice. Prompts are pre-loaded with your project data.",
  },
  {
    icon: FileCheck,
    title: "Paste outputs back and build your proposal",
    description: "The app tracks everything, enforces quality gates, and assembles your final document.",
  },
];

function HowItWorks() {
  return (
    <section id="how-it-works" className="px-6 py-32">
      <div className="mx-auto max-w-4xl">
        <motion.div
          className="mb-16 text-center"
          initial="hidden"
          whileInView="visible"
          viewport={viewportOpts}
          variants={fadeInUp}
          transition={{ duration: 0.5 }}
        >
          <h2 className="font-display text-3xl tracking-tight sm:text-4xl">
            Three steps. That&apos;s it.
          </h2>
        </motion.div>

        <motion.div
          className="relative grid gap-8 sm:grid-cols-3 sm:gap-6"
          initial="hidden"
          whileInView="visible"
          viewport={viewportOpts}
          variants={stagger}
        >
          {/* Connecting line (desktop) */}
          <div className="pointer-events-none absolute top-10 right-[calc(33.33%+12px)] left-[calc(33.33%-12px)] hidden h-px bg-border/60 sm:block" />

          {steps.map((s, i) => (
            <motion.div
              key={s.title}
              className="flex flex-col items-center text-center"
              variants={fadeInUp}
              transition={{ duration: 0.4 }}
            >
              <div className="relative z-10 mb-6 flex h-10 w-10 items-center justify-center rounded-full border border-accent-500/30 bg-accent-500/10 font-heading text-sm font-semibold text-accent-400">
                {i + 1}
              </div>
              <s.icon className="mb-3 h-5 w-5 text-muted-foreground" />
              <div className="font-heading text-sm font-semibold text-foreground">
                {s.title}
              </div>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                {s.description}
              </p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}

// ─── Stats ───────────────────────────────────────────────────────────────────

const stats = [
  { value: "46", label: "AI prompt templates" },
  { value: "7", label: "Systematic phases" },
  { value: "16", label: "Evaluator psychology triggers" },
];

function Stats() {
  return (
    <section className="px-6 py-32">
      <div className="mx-auto max-w-4xl">
        <motion.div
          className="text-center"
          initial="hidden"
          whileInView="visible"
          viewport={viewportOpts}
          variants={fadeInUp}
          transition={{ duration: 0.5 }}
        >
          <h2 className="font-display text-3xl tracking-tight sm:text-4xl">
            Built for researchers, by researchers
          </h2>
        </motion.div>

        <motion.div
          className="mt-12 grid gap-6 sm:grid-cols-3"
          initial="hidden"
          whileInView="visible"
          viewport={viewportOpts}
          variants={stagger}
        >
          {stats.map((s) => (
            <motion.div
              key={s.label}
              variants={fadeInUp}
              transition={{ duration: 0.4 }}
            >
              <Card className="bg-card/60 text-center">
                <CardContent className="py-8">
                  <div className="text-gradient font-display text-4xl">
                    {s.value}
                  </div>
                  <div className="mt-2 text-sm text-muted-foreground">
                    {s.label}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}

// ─── CTA ─────────────────────────────────────────────────────────────────────

function CtaSection() {
  return (
    <section className="px-6 py-32">
      <motion.div
        className="mx-auto max-w-2xl text-center"
        initial="hidden"
        whileInView="visible"
        viewport={viewportOpts}
        variants={fadeInUp}
        transition={{ duration: 0.5 }}
      >
        <h2 className="font-display text-3xl tracking-tight sm:text-4xl">
          Start building your proposal today
        </h2>
        <p className="mt-4 text-muted-foreground">
          Free to use. No account needed. No API keys required.
        </p>
        <div className="mt-8">
          <Button asChild size="lg">
            <Link href="/projects">
              Start Now
              <ArrowRight className="ml-1 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </motion.div>
    </section>
  );
}

// ─── Footer ──────────────────────────────────────────────────────────────────

function Footer() {
  return (
    <footer className="border-t border-border/50 px-6 py-8">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 sm:flex-row">
        <div className="flex items-center gap-2 text-muted-foreground">
          <Sparkles className="h-4 w-4 text-accent-500" />
          <span className="text-sm">
            &copy; {new Date().getFullYear()} Grant Suite
          </span>
        </div>
        <div className="flex items-center gap-6">
          <a
            href="https://github.com/Pragraph/grant-suite"
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-muted-foreground transition-colors hover:text-foreground"
            title="GitHub"
          >
            <ExternalLink className="h-4 w-4" />
            <span className="sr-only">GitHub</span>
          </a>
          <a
            href="#"
            className="text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            Docs
          </a>
          <a
            href="#"
            className="text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            Privacy
          </a>
        </div>
      </div>
    </footer>
  );
}

// ─── Page ────────────────────────────────────────────────────────────────────

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background text-foreground" style={{ scrollBehavior: "smooth" }}>
      <Nav />
      <Hero />
      <PhaseOverview />
      <Features />
      <HowItWorks />
      <Stats />
      <CtaSection />
      <Footer />
    </div>
  );
}
