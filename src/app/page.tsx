"use client";

import { useState, useEffect } from "react";
import {
  ArrowRight,
  ChevronDown,
  Zap,
  Brain,
  FileOutput,
  ClipboardCopy,
  MessageSquare,
  FileCheck,
  PlayCircle,
  Search,
  PenTool,
  FileText,
  FlaskConical,
  BarChart3,
  Layers,
  CheckCircle2,
} from "lucide-react";
import { PHASES } from "@/lib/types";

// ─── Scroll helper ──────────────────────────────────────────────────────────

const scrollToSection = (id: string) => {
  document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
};

// ─── Phase data ─────────────────────────────────────────────────────────────

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

const phaseColors = ["#3B82F6", "#7C3AED", "#DB2777", "#E11D48", "#EA580C", "#059669", "#0891B2"];

// ─── Feature data ───────────────────────────────────────────────────────────

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

// ─── Steps data ─────────────────────────────────────────────────────────────

const steps = [
  {
    number: 1,
    icon: ClipboardCopy,
    title: "Fill in your project details",
    description:
      "Discipline, country, funder, career stage — the app tailors everything to your context.",
  },
  {
    number: 2,
    icon: MessageSquare,
    title: "Copy compiled prompts to your AI tool",
    description:
      "ChatGPT, Claude, Gemini — your choice. Prompts are pre-loaded with your project data.",
  },
  {
    number: 3,
    icon: FileCheck,
    title: "Paste outputs back and build your proposal",
    description:
      "The app tracks everything, enforces quality gates, and assembles your final document.",
  },
];

// ─── University data ────────────────────────────────────────────────────────

const universities = [
  { name: "Universiti Malaya", logo: "https://upload.wikimedia.org/wikipedia/en/thumb/8/8f/University_of_Malaya_logo.svg/1280px-University_of_Malaya_logo.svg.png" },
  { name: "UKM", logo: "https://www.ukm.my/pendaftar/wp-content/uploads/2021/08/ukm-logo-CB9D755C75-seeklogo.com_.png" },
  { name: "USM", logo: "https://dsxi.perdanauniversity.edu.my/wp-content/uploads/2017/01/logo-usm-baru-transparent.png" },
  { name: "UTM", logo: "https://upload.wikimedia.org/wikipedia/commons/thumb/c/cb/UTM-LOGO-FULL.png/1280px-UTM-LOGO-FULL.png" },
  { name: "UPM", logo: "https://uc.searca.org/templates/yootheme/cache/bb/UPM-revised%20logo-bbcf002e.png" },
  { name: "IIUM", logo: "https://office.iium.edu.my/ocap/wp-content/uploads/sites/2/2023/08/logo-IIUM-ori-768x225-1.png" },
  { name: "UNIMAS", logo: "https://www.unimas.my/images/logo/glow2.png" },
  { name: "UiTM", logo: "https://korporat.uitm.edu.my/images/download/2019/LogoUiTM.png" },
  { name: "Universiti Tenaga Nasional", logo: "https://vectorise.net/logo/wp-content/uploads/2019/08/Logo-Universiti-Tenaga-Nasional-UNITEN.png" },
  { name: "Taylor's University", logo: "https://klt.edu.my/wp-content/uploads/2021/08/taylor-uni-logo.png" },
];

// ─── Stats data ─────────────────────────────────────────────────────────────

const stats = [
  { value: "46", label: "AI prompt templates" },
  { value: "7", label: "Systematic phases" },
  { value: "16", label: "Evaluator psychology triggers" },
];

// ═════════════════════════════════════════════════════════════════════════════
// LANDING PAGE
// ═════════════════════════════════════════════════════════════════════════════

export default function LandingPage() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 80);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <div className="min-h-screen bg-white text-gray-900" style={{ scrollBehavior: "smooth" }}>
      {/* ── SECTION 1: Navbar ──────────────────────────────────────────────── */}
      <nav
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          scrolled
            ? "bg-white/95 backdrop-blur-md shadow-sm"
            : "bg-transparent"
        }`}
      >
        <div className="max-w-6xl mx-auto px-4 sm:px-6 flex items-center justify-between h-16">
          {/* Left: Logo */}
          <div className="flex items-center">
            <img src="/logo.png" alt="Grant Suite" className="h-8 object-contain" />
            <span className="text-gray-900 font-bold text-lg ml-2">Grant Suite</span>
          </div>

          {/* Right: Attribution (always) + Nav links (desktop) */}
          <div className="flex items-center gap-4 md:gap-6">
            {/* Nav links — desktop only */}
            <div className="hidden md:flex items-center gap-6">
              <button
                onClick={() => scrollToSection("features")}
                className="text-gray-600 hover:text-gray-900 text-sm font-medium bg-transparent border-none cursor-pointer"
              >
                Features
              </button>
              <button
                onClick={() => scrollToSection("how-it-works")}
                className="text-gray-600 hover:text-gray-900 text-sm font-medium bg-transparent border-none cursor-pointer"
              >
                How It Works
              </button>

              {scrolled && (
                <button
                  onClick={() => window.location.assign("/projects")}
                  className="px-4 py-2 bg-[#4F7DF3] text-white rounded-lg text-sm font-medium hover:bg-[#3B63D4] transition-colors"
                >
                  Start Now
                </button>
              )}
            </div>

            {/* Attribution — always visible */}
            <div className="text-right">
              <p className="text-xs text-gray-500 font-extrabold leading-tight">
                Powered by <span className="animate-bounce-gentle">🎓</span> BelajarAI
              </p>
              <p className="text-[10px] text-gray-400 font-bold leading-tight">
                by Adam Linoby
              </p>
            </div>
          </div>
        </div>
      </nav>

      {/* ── SECTION 2: Hero ────────────────────────────────────────────────── */}
      <section
        className="relative overflow-hidden pt-24 pb-20 md:pt-32 md:pb-28"
        style={{ background: "linear-gradient(180deg, #F0F4FF 0%, #E8EDF8 100%)" }}
      >
        {/* Decorative sparkles */}
        <div className="absolute left-[15%] top-1/3 text-blue-200 opacity-40 text-2xl select-none pointer-events-none">
          ✦
        </div>
        <div className="absolute right-[15%] top-1/3 text-blue-200 opacity-40 text-2xl select-none pointer-events-none">
          ✦
        </div>

        <div className="relative z-10 max-w-3xl mx-auto px-4 sm:px-6 text-center">
          <span className="section-badge mb-6">Open-source · Free forever</span>

          <h1
            className="text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 tracking-tight leading-tight mb-5"
            style={{ fontFamily: "'Playfair Display', serif" }}
          >
            Write winning grant proposals with{" "}
            <br />
            <span className="text-gradient-blue">AI-guided precision</span>
          </h1>

          <p className="text-lg text-gray-500 max-w-2xl mx-auto leading-relaxed mb-8">
            7-phase system that transforms your research idea into a
            competition-ready proposal. From discovery to submission.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <button
              onClick={() => window.location.assign("/projects")}
              className="w-full sm:w-auto px-8 py-3.5 bg-[#4F7DF3] text-white rounded-xl text-lg font-semibold hover:bg-[#3B63D4] hover:scale-105 transition-all flex items-center justify-center gap-2"
            >
              Get Started <ArrowRight className="w-5 h-5" />
            </button>
            <button
              onClick={() => scrollToSection("how-it-works")}
              className="w-full sm:w-auto px-8 py-3.5 border border-gray-300 text-gray-700 rounded-xl text-lg font-medium hover:bg-white/80 transition-all flex items-center justify-center gap-2"
            >
              See How It Works <ChevronDown className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Bottom fade */}
        <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-b from-transparent to-white" />
      </section>

      {/* ── SECTION 3: Trusted by Scholars ─────────────────────────────────── */}
      <section className="bg-white py-10">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <p className="text-center text-sm font-medium text-gray-500 uppercase tracking-wider mb-8">
            Trusted by scholars in top universities in Malaysia
          </p>

          <div className="overflow-hidden py-8">
            <div className="logo-track">
              {[...universities, ...universities].map((uni, i) => (
                <img
                  key={`${uni.name}-${i}`}
                  src={uni.logo}
                  alt={uni.name}
                  title={uni.name}
                  className="h-12 max-w-[160px] object-contain opacity-60 grayscale hover:opacity-100 hover:grayscale-0 transition-all duration-300 flex-shrink-0"
                  loading="lazy"
                />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── SECTION 4: See It In Action ────────────────────────────────────── */}
      <section id="how-it-works" className="bg-white py-20">
        <div className="max-w-6xl mx-auto px-6 text-center">
          <span className="section-badge">✦ See It In Action</span>
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mt-4 mb-3">
            How Grant Suite Works
          </h2>
          <p className="text-gray-500 max-w-2xl mx-auto">
            Watch how Grant Suite guides you from research idea to submission-ready proposal.
          </p>

          <div className="max-w-4xl mx-auto mt-12 rounded-2xl overflow-hidden shadow-2xl border border-gray-200 aspect-video bg-gray-100 flex items-center justify-center">
            <div className="text-center text-gray-400">
              <PlayCircle className="w-16 h-16 mx-auto mb-3 opacity-40" />
              <p className="text-sm font-medium">Video walkthrough coming soon</p>
            </div>
          </div>
        </div>
      </section>

      {/* ── SECTION 5: Seven Phases ────────────────────────────────────────── */}
      <section id="features" className="bg-[#F9FAFB] py-20">
        <div className="max-w-6xl mx-auto px-6 text-center">
          <span className="section-badge">✦ The Pipeline</span>
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mt-4 mb-3">
            Seven phases. One complete system.
          </h2>
          <p className="text-gray-500">
            Each phase builds on the last — no gaps, no guesswork.
          </p>

          <div className="max-w-6xl mx-auto mt-12 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {PHASES.map((phase, i) => {
              const Icon = phaseIcons[i];
              return (
                <div
                  key={phase.id}
                  className="bg-white rounded-xl border border-gray-100 p-5 hover:shadow-md transition-shadow text-left"
                >
                  <div className="flex items-center gap-2 mb-3">
                    <span
                      className="w-7 h-7 rounded-lg flex items-center justify-center text-white text-xs font-bold"
                      style={{ backgroundColor: phaseColors[i] }}
                    >
                      {phase.id}
                    </span>
                    <Icon className="w-4 h-4 text-gray-400" />
                  </div>
                  <h3 className="text-sm font-semibold text-gray-900 mb-1">{phase.name}</h3>
                  <p className="text-xs text-gray-500 mb-3">{phase.description}</p>
                  <p className="font-mono text-[10px] text-gray-400">{phaseDocuments[i]}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── SECTION 6: Built Different ─────────────────────────────────────── */}
      <section className="bg-white py-20">
        <div className="max-w-6xl mx-auto px-6 text-center">
          <span className="section-badge">✦ Why Grant Suite</span>
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mt-4 mb-3">
            Built different
          </h2>
          <p className="text-gray-500">
            Not another AI wrapper. A systematic proposal-building engine.
          </p>

          <div className="max-w-4xl mx-auto mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
            {features.map((f) => (
              <div
                key={f.title}
                className="bg-[#F9FAFB] rounded-xl p-6 border border-gray-100 text-left"
              >
                <div className="w-10 h-10 rounded-lg bg-[#F0F4FF] flex items-center justify-center mb-4">
                  <f.icon className="w-5 h-5 text-[#4F7DF3]" />
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">{f.title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{f.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── SECTION 7: Three Steps ─────────────────────────────────────────── */}
      <section className="bg-[#F9FAFB] py-20">
        <div className="max-w-6xl mx-auto px-6 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-3">
            Three steps. That&apos;s it.
          </h2>

          <div className="max-w-4xl mx-auto mt-12 grid grid-cols-1 md:grid-cols-3 gap-8">
            {steps.map((step) => (
              <div key={step.number} className="text-center">
                <span className="inline-flex w-10 h-10 rounded-full bg-[#4F7DF3] text-white font-bold items-center justify-center mb-4">
                  {step.number}
                </span>
                <div className="w-10 h-10 rounded-lg bg-[#F0F4FF] flex items-center justify-center mx-auto mb-3">
                  <step.icon className="w-5 h-5 text-[#4F7DF3]" />
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">{step.title}</h3>
                <p className="text-sm text-gray-500">{step.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── SECTION 8: Stats Banner ────────────────────────────────────────── */}
      <section className="bg-[#111827] py-12">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <div className="flex flex-col md:flex-row items-center justify-center gap-12 md:gap-24">
            {stats.map((s) => (
              <div key={s.label} className="text-center">
                <span className="text-5xl font-extrabold text-[#7B9AF8]">{s.value}</span>
                <p className="text-gray-400 text-sm mt-1">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── SECTION 9: Final CTA ───────────────────────────────────────────── */}
      <section className="bg-white py-20">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Start building your proposal today
          </h2>
          <p className="text-gray-500 mb-8">
            Free to use. No account needed. No API keys required.
          </p>
          <button
            onClick={() => window.location.assign("/projects")}
            className="px-8 py-3.5 bg-[#4F7DF3] text-white rounded-xl text-lg font-semibold hover:bg-[#3B63D4] hover:scale-105 transition-all inline-flex items-center gap-2"
          >
            Start Now <ArrowRight className="w-5 h-5" />
          </button>
        </div>
      </section>

      {/* ── SECTION 10: Footer ─────────────────────────────────────────────── */}
      <footer className="bg-[#111827] text-white py-12">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="flex flex-col gap-8 md:flex-row md:items-center md:justify-between">
            {/* Left: Logo + Attribution */}
            <div>
              <div className="flex items-center gap-2">
                <img
                  src="/logo.png"
                  alt="Grant Suite"
                  className="h-7 object-contain brightness-0 invert"
                />
                <span className="text-white font-bold">Grant Suite</span>
              </div>
              <p className="text-gray-400 text-sm mt-2">
                Powered by <span className="animate-bounce-gentle">🎓</span> BelajarAI
              </p>
              <p className="text-gray-500 text-xs">by Adam Linoby</p>
            </div>

            {/* Center: Links */}
            <div className="flex flex-wrap items-center gap-4 md:gap-6">
              <button
                onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
                className="text-gray-400 hover:text-white transition-colors text-sm bg-transparent border-none cursor-pointer"
              >
                Home
              </button>
              <button
                onClick={() => scrollToSection("features")}
                className="text-gray-400 hover:text-white transition-colors text-sm bg-transparent border-none cursor-pointer"
              >
                Features
              </button>
              <a
                href="https://github.com/Pragraph/grant-suite"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-400 hover:text-white transition-colors text-sm no-underline"
              >
                Docs
              </a>
              <button className="text-gray-400 hover:text-white transition-colors text-sm bg-transparent border-none cursor-pointer">
                Privacy
              </button>
            </div>

            {/* Right: Privacy note */}
            <p className="text-gray-400 text-sm max-w-xs">
              Grant Suite runs entirely in your browser. No data leaves your device.
            </p>
          </div>

          {/* Bottom */}
          <div className="border-t border-gray-800 mt-8 pt-4">
            <p className="text-gray-500 text-xs text-center">
              © {new Date().getFullYear()} Grant Suite. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
