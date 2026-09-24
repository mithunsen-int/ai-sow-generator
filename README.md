# SDD SOW Generator

A browser-based tool that turns raw project requirements into a zero-ambiguity **Statement of Work (SOW)** in Markdown, written for **Spec-Driven Development (SDD)**. You supply a SOW template, the raw requirements and any extra constraints. An LLM (OpenAI, Anthropic Claude or Google Gemini) then writes a structured SOW with measurable SLAs, explicit non-goals and verifiable acceptance criteria.

## Features

- **Multiple AI providers:** OpenAI ChatGPT (the default, with GPT-4o), Anthropic Claude and Google Gemini, each with a choice of models.
- **Three inputs, each accepting typed text or an uploaded file (`.txt`, `.md`, `.json`):**
  1. **SOW Template:** the section structure the output must follow.
  2. **Raw Project Requirements** (required): features, workflows and user stories.
  3. **Additional Constraints:** tech stack, SLAs, security rules and out-of-scope items.
  4. **SDD Methodology** (optional): describes how your downstream SDD framework consumes the SOW. It is added to the system prompt; the template controls section order, and the methodology controls ID formats, naming and the required content within sections.
- **Demo data:** the inputs load pre-filled with a sample project (a multi-tenant inventory dashboard), together with a sample generated SOW, so you can see the expected format straight away.
- **Per-field Clear buttons**, plus **Load Demo** and **Clear** (all fields) in the header.
- **SDD System Prompt Config (Advanced):** a collapsible editor for the system prompt sent to the model, with a Reset button. If you leave it empty, the provider's built-in prompt is used.
- **Output tabs:**
  - **Rendered Preview:** GitHub-flavoured Markdown rendering, including tables and checklists.
  - **Raw Markdown:** an editable source view; your edits carry through to the preview and the export.
  - **SDD Audit:** a heuristic readiness score (0–100%) with a pass/fail checklist covering non-goals, acceptance criteria, API specs, measurable SLAs, the Definition of Done and vague language.
- **Export:** copy to the clipboard, or download as `STATEMENT_OF_WORK_SDD.md`.
- **Fence cleanup:** if the model wraps its reply in a ```` ```markdown ```` code fence, the fence is stripped automatically so the preview renders properly.

## Tech Stack

- React 19 + TypeScript 6
- Vite 8 with Tailwind CSS 4 (`@tailwindcss/vite`)
- `react-markdown` + `remark-gfm` for rendering
- `lucide-react` icons
- Official SDKs: `openai`, `@anthropic-ai/sdk`, `@google/genai`
- Oxlint for linting

## Getting Started

### Prerequisites

- Node.js 20+
- An API key for at least one provider

### Install

```bash
npm install
```

### Configure API keys

Create a `.env` file in the project root:

```env
VITE_OPENAI_API_KEY=your-openai-key
VITE_ANTHROPIC_API_KEY=your-anthropic-key
VITE_GEMINI_API_KEY=your-gemini-key
```

You only need the key for the provider you plan to use. A key typed into the **Custom API Key** field in the UI overrides the `.env` value for that session.

### Run

```bash
npm run dev       # start the dev server
npm run build     # type-check (tsc -b) and build for production
npm run preview   # serve the production build locally
npm run lint      # run oxlint
```

## Usage

1. Choose a **Provider** and **Model** under *AI Engine Settings*.
2. Fill in or upload the **SOW Template**, **Raw Project Requirements** and **Additional Constraints**. Click **Load Demo** at any time to see example inputs.
3. Optionally, paste or upload your **SDD Methodology**, and open **SDD System Prompt Config** to adjust the instructions sent to the model.
4. Click **Create SOW**.
5. Review the result in **Rendered Preview**, make small fixes in **Raw Markdown**, and check the **SDD Audit** score.
6. Use **Copy** or **Download .md** to export.

## Project Structure

```
src/
├── App.tsx                      # Mounts the generator
├── ai-sow-generator.tsx         # Main UI: inputs, settings, output tabs
├── ai-sow-generator-gemini.tsx  # Earlier single-provider (Gemini) prototype, kept for reference; not mounted
├── services/
│   └── aiProvider.ts            # Provider/model list, system prompt + methodology assembly, generateSOW()
├── data/
│   └── sowDemoData.ts           # Demo template, requirements, constraints, sample output, default system prompt
├── utils/
│   ├── sddAudit.ts              # SDD readiness scoring heuristics
│   └── markdown.ts              # Strips an outer ```markdown fence from model output
└── types/
    └── sow.ts                   # Shared TypeScript types
```

## Customising

- **Add or change models:** edit `PROVIDERS` in `src/services/aiProvider.ts`.
- **Change the demo content or the default system prompt:** edit `src/data/sowDemoData.ts`.
- **Adjust the audit rules or weights:** edit `src/utils/sddAudit.ts`.

## Security Note

This is a client-only app. API keys, whether from `.env` (`VITE_*` variables) or the Custom API Key field, are sent to the provider **directly from the browser** and are included in the built JavaScript bundle. The OpenAI and Anthropic SDKs run with `dangerouslyAllowBrowser: true`.

Use it only for local development or internal use. Before deploying it publicly, move the provider calls behind a backend or proxy so the keys stay on the server. Never commit your `.env` file.
