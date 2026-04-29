"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  ArrowRight,
  ChevronDown,
  Zap,
  Brain,
  FileOutput,
  PlayCircle,
  Search,
  PenTool,
  FileText,
  FlaskConical,
  BarChart3,
  Layers,
  CheckCircle2,
} from "lucide-react";
import { PHASE_DEFINITIONS } from "@/lib/constants";

// ─── Scroll helper ──────────────────────────────────────────────────────────

const scrollToSection = (id: string) => {
  document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
};

// ─── Phase data ─────────────────────────────────────────────────────────────

// Landing page uses simplified, accessible descriptions (overrides PHASES.description)
const phaseDescriptions = [
  "Find your research direction and match it with the right grant opportunity.",
  "Build a winning strategy based on what evaluators actually look for.",
  "Design your methodology, timeline, and feasibility plan.",
  "Assemble your team and build a justified, line-by-line budget.",
  "Write every section of your proposal with AI-assisted precision.",
  "Stress-test your draft with a simulated panel review and compliance check.",
  "Analyse feedback, plan revisions, and prepare your resubmission.",
];

const phaseIcons = [Search, PenTool, FileText, FlaskConical, BarChart3, Layers, CheckCircle2];

const phaseColors = ["#3B82F6", "#7C3AED", "#DB2777", "#E11D48", "#EA580C", "#059669", "#0891B2"];

// ─── Feature data ───────────────────────────────────────────────────────────

const features = [
  {
    icon: Zap,
    title: "Smart Prompt Compilation",
    description:
      "Your project details are automatically woven into expert-crafted AI prompts. Copy them into any AI tool — ChatGPT, Claude, Gemini — and get structured, grant-ready output every time.",
  },
  {
    icon: Brain,
    title: "Evaluator Psychology Engine",
    description:
      "16 evidence-based persuasion strategies are embedded into your proposal. Each section is engineered to score higher with real grant reviewers — not just sound impressive.",
  },
  {
    icon: FileOutput,
    title: "Document Pipeline",
    description:
      "Every phase produces a document that feeds the next. Track your progress, version your outputs, and export a complete proposal package when you are ready to submit.",
  },
];

// ─── University data ────────────────────────────────────────────────────────

const universities = [
  { name: "Universiti Malaya", logo: "https://upload.wikimedia.org/wikipedia/en/thumb/8/8f/University_of_Malaya_logo.svg/1280px-University_of_Malaya_logo.svg.png" },
  { name: "UKM", logo: "https://www.ukm.my/pendaftar/wp-content/uploads/2021/08/ukm-logo-CB9D755C75-seeklogo.com_.png" },
  { name: "USM", logo: "https://dsxi.perdanauniversity.edu.my/wp-content/uploads/2017/01/logo-usm-baru-transparent.png" },
  { name: "UTM", logo: "https://upload.wikimedia.org/wikipedia/commons/thumb/c/cb/UTM-LOGO-FULL.png/1280px-UTM-LOGO-FULL.png" },
  { name: "UPM", logo: "https://uc.searca.org/templates/yootheme/cache/bb/UPM-revised%20logo-bbcf002e.png" },
  { name: "UiTM", logo: "https://korporat.uitm.edu.my/images/download/2019/LogoUiTM.png" },
  { name: "UNIMAS", logo: "https://www.unimas.my/images/logo/glow2.png" },
  { name: "IIUM", logo: "https://office.iium.edu.my/ocap/wp-content/uploads/sites/2/2023/08/logo-IIUM-ori-768x225-1.png" },
  { name: "UniSZA", logo: "https://www.unisza.edu.my/images/logo/logo-unisza.png" },
  { name: "UMS", logo: "https://www.ums.edu.my/v5/images/logo-ums.png" },
];

// ─── Stats data ─────────────────────────────────────────────────────────────

const stats = [
  { value: "45", label: "AI prompt templates" },
  { value: "7", label: "Systematic phases" },
  { value: "5+", label: "Malaysian grant schemes supported" },
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
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo.png" alt="Research Grant Suite" className="h-8 object-contain" />
            <span className="text-gray-900 font-bold text-lg ml-2">Research Grant Suite</span>
          </div>

          {/* Right: Attribution (always) + CTA (desktop) */}
          <div className="flex items-center gap-4 md:gap-6">
            {/* CTA — desktop only, appears on scroll */}
            <div className="hidden md:flex items-center">
              {scrolled && (
                <Link
                  href="/projects"
                  className="px-4 py-2 bg-[#2B49C7] text-white rounded-lg text-sm font-medium hover:bg-[#1E3494] transition-colors"
                >
                  Start Now
                </Link>
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
        style={{ background: "linear-gradient(180deg, #EAEDFA 0%, #E8EDF8 100%)" }}
      >
        {/* Decorative sparkles */}
        <div className="absolute left-[15%] top-1/3 text-blue-200 opacity-40 text-2xl select-none pointer-events-none">
          ✦
        </div>
        <div className="absolute right-[15%] top-1/3 text-blue-200 opacity-40 text-2xl select-none pointer-events-none">
          ✦
        </div>

        <div className="relative z-10 max-w-3xl mx-auto px-4 sm:px-6 text-center">
          <span className="section-badge mb-6">🤖 AI-Powered Research Grant Proposal Builder</span>

          <h1
            className="text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 tracking-tight leading-tight mb-5"
            style={{ fontFamily: "'Playfair Display', serif" }}
          >
            Win research grants with{" "}
            <br />
            <span
  className="text-gradient-blue"
  style={{ background: "linear-gradient(135deg, #2B49C7, #5A7CEB)", WebkitBackgroundClip: "text", backgroundClip: "text" }}
>AI-guided precision</span>
          </h1>

          <p className="text-lg text-gray-500 max-w-2xl mx-auto leading-relaxed mb-8">
            An easy-to-follow 7-phase system — from topic discovery to submission
            preparation and resubmission. No guesswork, no blank pages.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/projects"
              className="w-full sm:w-auto px-8 py-3.5 bg-[#2B49C7] text-white rounded-xl text-lg font-semibold hover:bg-[#1E3494] hover:scale-105 transition-all flex items-center justify-center gap-2"
            >
              Get Started <ArrowRight className="w-5 h-5" />
            </Link>
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
            Trusted by researchers across Malaysia&apos;s top universities
          </p>

          <div className="overflow-hidden py-8">
            <div className="logo-track">
              {[...universities, ...universities].map((uni, i) => (
                /* eslint-disable-next-line @next/next/no-img-element */
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
            How Research Grant Suite Works
          </h2>
          <p className="text-gray-500 max-w-2xl mx-auto">
            Watch how Research Grant Suite guides you from research idea to submission-ready proposal.
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
          <p className="text-gray-500 max-w-xl mx-auto">
            Guiding you to complete your research grant proposal — from topic
            discovery to submission preparation.
          </p>

          <div className="max-w-5xl mx-auto mt-14 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 [&>*:last-child]:sm:col-start-1 [&>*:last-child]:lg:col-start-2">
            {PHASE_DEFINITIONS.map((phase, i) => {
              const Icon = phaseIcons[i];
              return (
                <div
                  key={phase.phase}
                  className="group relative bg-white rounded-2xl border border-gray-200/80 p-7 hover:shadow-lg hover:border-gray-300 transition-all duration-300 text-left"
                  style={{ borderTopColor: phaseColors[i], borderTopWidth: "3px" }}
                >
                  {/* Phase number + icon */}
                  <div className="flex items-center gap-3 mb-4">
                    <span
                      className="w-10 h-10 rounded-xl flex items-center justify-center text-white text-sm font-bold shadow-sm"
                      style={{ backgroundColor: phaseColors[i] }}
                    >
                      {phase.phase}
                    </span>
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center"
                      style={{ backgroundColor: `${phaseColors[i]}12` }}
                    >
                      <Icon className="w-5 h-5" style={{ color: phaseColors[i] }} />
                    </div>
                  </div>

                  {/* Title */}
                  <h3 className="text-base font-bold text-gray-900 mb-2">{phase.name}</h3>

                  {/* Accessible description */}
                  <p className="text-sm text-gray-500 leading-relaxed">{phaseDescriptions[i]}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── SECTION 6: Built Different ─────────────────────────────────────── */}
      <section className="bg-white py-20">
        <div className="max-w-6xl mx-auto px-6 text-center">
          <span className="section-badge">✦ Why Research Grant Suite</span>
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mt-4 mb-3">
            Built different
          </h2>
          <p className="text-gray-500 max-w-2xl mx-auto">
            Not another AI wrapper. A systematic, research-backed proposal-building engine.
          </p>

          <div className="max-w-5xl mx-auto mt-14 grid grid-cols-1 md:grid-cols-3 gap-6">
            {features.map((f) => (
              <div
                key={f.title}
                className="group bg-white rounded-2xl p-8 border border-gray-200/80 hover:shadow-lg hover:border-gray-300 transition-all duration-300 text-left"
              >
                <div className="w-14 h-14 rounded-2xl bg-[#EAEDFA] flex items-center justify-center mb-5 group-hover:bg-[#2B49C7] transition-colors duration-300">
                  <f.icon className="w-7 h-7 text-[#2B49C7] group-hover:text-white transition-colors duration-300" />
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-3">{f.title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{f.description}</p>
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
            Free to use. No account needed. No API keys required. Your data never leaves your browser.
          </p>
          <Link
            href="/projects"
            className="px-8 py-3.5 bg-[#2B49C7] text-white rounded-xl text-lg font-semibold hover:bg-[#1E3494] hover:scale-105 transition-all inline-flex items-center gap-2"
          >
            Start Now <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </section>

      {/* ── SECTION 10: Footer ─────────────────────────────────────────────── */}
      <footer className="bg-[#111827] text-white py-12">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="flex flex-col gap-8 md:flex-row md:items-center md:justify-between">
            {/* Left: Logo + Attribution */}
            <div>
              <div className="flex items-center gap-2">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/logo_footer.png"
                  alt="Research Grant Suite"
                  className="h-7 object-contain"
                />
                <span className="text-white font-bold">Research Grant Suite</span>
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
              <a
                href="https://github.com/Pragraph/grant-suite"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-400 hover:text-white transition-colors text-sm no-underline"
              >
                Docs
              </a>
              <a
                href="https://www.workcyte.com/privacy"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-400 hover:text-white transition-colors text-sm no-underline"
              >
                Privacy
              </a>
              <a
                href="https://www.workcyte.com/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-400 hover:text-white transition-colors text-sm no-underline"
              >
                Buy Access
              </a>
            </div>

            {/* Right: Privacy note */}
            <p className="text-gray-400 text-sm max-w-xs">
              Research Grant Suite runs entirely in your browser. Your proposals, grant data, and research details never leave your device — nothing is stored on any server.
            </p>
          </div>

          {/* Bottom */}
          <div className="border-t border-gray-800 mt-8 pt-4">
            <p className="text-gray-500 text-xs text-center">
              © {new Date().getFullYear()} Research Grant Suite. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
