# Grant Suite

A structured, 7-phase grant proposal writing system powered by your own LLM.

<!-- TODO: Add screenshot -->

## What is this?

Grant Suite guides you through writing a complete grant proposal across seven phases — from needs assessment to final submission. Each phase has structured documents, quality gates, and AI-assisted drafting via a compile-and-paste workflow.

**The 7 phases:**

1. **Discovery** — Needs assessment, stakeholder analysis, funding landscape
2. **Planning** — Logic model, project design, timeline, budget framework
3. **Drafting** — Narrative sections, methodology, evaluation plan
4. **Budget** — Detailed budget, justification, cost-sharing
5. **Review** — Internal review, compliance check, quality scoring
6. **Revision** — Feedback integration, final edits, polish
7. **Submission** — Final assembly, formatting, submission checklist

## How it works

Grant Suite is a **local-first** writing tool. No API keys, no accounts, no subscriptions.

1. **Compile** a prompt from your project data and the current document template
2. **Copy** the prompt to your preferred LLM (ChatGPT, Claude, Gemini, etc.)
3. **Paste** the AI-generated draft back into Grant Suite
4. **Refine** with follow-up prompts or manual editing
5. **Export** finished documents as Markdown, DOCX, or ZIP

Your data never leaves your browser. Everything is stored in localStorage and IndexedDB.

## Tech stack

![Next.js](https://img.shields.io/badge/Next.js-15-black?logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?logo=typescript)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-4-38bdf8?logo=tailwindcss)
![React](https://img.shields.io/badge/React-19-61dafb?logo=react)

- **Framework:** Next.js 15 (static export, App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS v4, shadcn/ui (customized)
- **State:** Zustand (localStorage persistence)
- **Storage:** IndexedDB via idb-keyval
- **Animation:** Framer Motion
- **Testing:** Vitest + Playwright
- **Deployment:** Netlify (static)

## Getting started

### Prerequisites

- Node.js 20+
- pnpm

### Setup

```bash
git clone https://github.com/Pragraph/grant-suite.git
cd grant-suite
pnpm install
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000).

No database, no environment variables, no API keys needed.

### Scripts

| Command              | Description              |
| -------------------- | ------------------------ |
| `pnpm dev`           | Start dev server         |
| `pnpm build`         | Production static build  |
| `pnpm lint`          | Run ESLint               |
| `pnpm test`          | Run tests (watch mode)   |
| `pnpm test:run`      | Run tests (single pass)  |
| `pnpm test:coverage` | Run tests with coverage  |

## Project structure

```
src/
├── app/                  # Next.js App Router pages
│   ├── (dashboard)/      # Main app layout
│   │   ├── projects/     # Project list & detail views
│   │   └── settings/     # User preferences
│   ├── layout.tsx        # Root layout
│   └── page.tsx          # Landing / home
├── components/           # Reusable UI components
├── lib/                  # Core logic, stores, utilities
└── types/                # TypeScript type definitions
```

## Deployment

Grant Suite deploys as a fully static site on **Netlify**.

The included `netlify.toml` handles build configuration and SPA routing. Connect your GitHub repo to Netlify and it will auto-deploy on push to `main`.

## Privacy

**All your data stays in your browser.** Grant Suite has no backend, no database, no analytics, and no telemetry. Nothing is ever sent to any server. You can verify this — the app is deployed as static HTML/CSS/JS with zero server-side code.

## License

[MIT](LICENSE)
