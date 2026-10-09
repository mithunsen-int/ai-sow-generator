# SDD SOW Generator

A browser-based tool that turns raw project requirements into a zero-ambiguity **Statement of Work (SOW)** in Markdown, written for **Spec-Driven Development (SDD)**. You supply a SOW template, the raw requirements and any extra constraints. An LLM (OpenAI, Anthropic Claude or Google Gemini) then writes a structured SOW with measurable SLAs, explicit non-goals and verifiable acceptance criteria.

## Features

- **Multiple AI providers:** OpenAI ChatGPT (the default, with GPT-4o), Anthropic Claude (Opus 5, Sonnet 5, Haiku 4.5) and Google Gemini, each with a choice of models.
- **Multi-pass generation (default):** an outline pass lists the features and shared data entities, then each feature gets its own request for a full-depth spec (run three at a time), and an assembly pass writes the remaining sections (feature index, consolidated questions register, traceability matrix, commercial sections) around them. This keeps each response within the model's output limit on large projects. A progress view shows each pass, a failed feature is retried once and otherwise flagged in the SOW, and any run can be cancelled. **Single pass** is available for small projects.
- **Three inputs, each accepting typed text or an uploaded file (`.txt`, `.md`, `.json`):**
  1. **SOW Template:** the section structure the output must follow.
  2. **Raw Project Requirements** (required): features, workflows and user stories.
  3. **Additional Constraints:** tech stack, SLAs, security rules and out-of-scope items.
- **SDD methodology (built-in, with overrides):** a built-in SDD methodology profile (identifiers, required spec content, project-wide content, status and review rules, decision ownership) is applied to every analysis and generation request. To use a different methodology version, paste or upload it under **SDD Methodology Overrides**: it **replaces** the built-in profile entirely. Before first use, the override is **condensed** once into a compact profile with the same structure (one extra request, roughly 1k tokens instead of the full document on every call); you can review and edit the condensed profile, and it is re-condensed only when the override text changes. The template controls section order; the methodology controls identifier formats, naming and the required content within sections. Project-specific rules belong in Additional Constraints.
- **Demo data:** the SOW Template and Additional Constraints load pre-filled with example content, so you can see the expected format straight away. Raw Project Requirements start empty.
- **Per-field Clear buttons**, plus **Load Demo** and **Clear** (all fields) in the header.
- **SDD System Prompt Config (Advanced):** a collapsible editor for the system prompt sent to the model, with a Reset button. If you leave it empty, the provider's built-in prompt is used.
- **Analyze → Clarify → Generate:** before writing anything, **Analyze Inputs** asks the model to list every gap, ambiguity and blocker as structured questions, instead of assuming. Answer them (or pick a suggested option) in the **Clarifications** tab, mark any you want to keep open, and generate. Answers are treated as binding decisions, and unanswered questions stay in the SOW's Open Questions register as blockers. **Re-analyze with answers** catches follow-up questions.
- **Deep, SDD-ready feature specs:** the default prompt and template produce, for every feature, a slug (`<slug>.AC1`, `.API01`, `.UT01`, `.Q01` IDs), business rules with sources, roles and permissions, a proposed data model (fields, types, constraints), an API contract with a full exception table, Given/When/Then acceptance criteria, and spec-derived unit tests, plus a traceability matrix.
- **Token usage:** a bar under the output header shows the tokens used by the current action (Analysis, Create SOW or Condense methodology), updating as each request completes, and the session total. **Details** lists every request in the current action (pass, model, input, cached input, output); **Reset totals** clears the counts. Figures come from each provider's response; thinking/reasoning tokens count as output.
- **Output tabs:**
  - **Rendered Preview:** GitHub-flavoured Markdown rendering, including tables and checklists.
  - **Raw Markdown:** an editable source view; your edits carry through to the preview and the export.
  - **SDD Audit:** a heuristic readiness score (0–100%) with a pass/fail checklist covering non-goals, acceptance criteria and their IDs, API specs, measurable SLAs, the Definition of Ready/Done, vague language, the open questions register, and unresolved blockers. A SOW with open blocking questions is reported as **BLOCKED**, never as passed.
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
2. Fill in or upload the **SOW Template**, **Raw Project Requirements** and **Additional Constraints**. Click **Load Demo** at any time to restore the example template, constraints and system prompt (your requirements and output are left untouched).
3. Optionally, open **SDD Methodology Overrides** to replace the built-in methodology with a new version, and **SDD System Prompt Config** to adjust the app instructions sent to the model.
4. Click **1. Analyze Inputs**, then answer the questions in the **Clarifications** tab. Use **Re-analyze with answers** to catch follow-ups. (You can also skip straight to step 5.)
5. Click **2. Create SOW** (or **Generate SOW with answers** in the Clarifications tab).
6. Review the result in **Rendered Preview**, make small fixes in **Raw Markdown**, and check the **SDD Audit** score.
7. Use **Copy** or **Download .md** to export.

## Project Structure

```
src/
├── App.tsx                      # Mounts the generator
├── ai-sow-generator.tsx         # Main UI: inputs, settings, output tabs
├── components/
│   ├── ClarificationsPanel.tsx  # Analysis questions, answers and the regenerate loop
│   ├── GenerationProgressPanel.tsx # Live progress of a multi-pass run
│   └── TokenUsageBar.tsx        # Running and session token usage
├── ai-sow-generator-gemini.tsx  # Earlier single-provider (Gemini) prototype, kept for reference; not mounted
├── services/
│   ├── aiProvider.ts            # Provider/model list, callModel(), prompt assembly, analysis, single-pass generation
│   ├── methodology.ts           # Condenses a methodology override into a compact profile
│   └── multiPass.ts             # Outline → per-feature → assembly generation pipeline
├── data/
│   ├── methodologyProfile.ts    # Built-in SDD methodology profile (replaced by a condensed override)
│   └── sowDemoData.ts           # Demo template and constraints, default system prompt (app rules)
├── utils/
│   ├── sddAudit.ts              # SDD readiness scoring heuristics
│   ├── clarifications.ts        # Answer status helpers and re-analysis merge
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
