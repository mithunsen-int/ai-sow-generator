// src/services/aiProvider.ts
import Anthropic from "@anthropic-ai/sdk";
import { FinishReason, GoogleGenAI } from "@google/genai";
import OpenAI from "openai";
import type {
  AnalysisResult,
  AnalyzeParams,
  Clarification,
  ClarificationQuestion,
  GenerateSOWParams,
  GenerationResult,
  ProviderConfig,
  ProviderId,
} from "../types/sow";

export const PROVIDERS: Record<string, ProviderConfig> = {
  GEMINI: {
    id: "gemini",
    name: "Google Gemini",
    models: [
      { id: "gemini-2.5-flash", name: "Gemini 2.5 Flash (Fast & Recommended)" },
      { id: "gemini-1.5-pro", name: "Gemini 1.5 Pro (Deep Reasoning)" },
    ],
  },
  CLAUDE: {
    id: "claude",
    name: "Anthropic Claude",
    models: [
      {
        id: "claude-opus-5",
        name: "Claude Opus 5 (Best SOW Quality)",
        maxOutputTokens: 64000,
      },
      {
        id: "claude-sonnet-5",
        name: "Claude Sonnet 5 (Balanced)",
        maxOutputTokens: 64000,
      },
      {
        id: "claude-haiku-4-5",
        name: "Claude Haiku 4.5 (Fastest)",
        maxOutputTokens: 64000,
      },
    ],
  },
  OPENAI: {
    id: "openai",
    name: "OpenAI ChatGPT",
    models: [
      { id: "gpt-4o", name: "GPT-4o (High Intelligence)" },
      { id: "gpt-4o-mini", name: "GPT-4o Mini (Cost Effective)" },
    ],
  },
};

// Claude models that get server-side refusal fallbacks by default
const CLAUDE_FALLBACK_MODELS = new Set(["claude-opus-5"]);

export const SYSTEM_PROMPT = `
You are an uncompromising Spec-Driven Development (SDD) Principal Architect.
Your goal is to transform raw requirements into an exhaustive, production-grade Statement of Work (SOW) that can directly seed software specification files (spec.md) without human interpretation.

===============================================================================
CRITICAL RULE 1: STRICT ZERO-ASSUMPTION & BLOCKER ESCALATION PROTOCOL
===============================================================================
- NEVER ASSUME, GUESS, OR INVENT business logic, permissions, edge cases, integration methods, or compliance details when requirements are vague or incomplete.
- IF YOU ENCOUNTER ANY AMBIGUITY, MISSING REQUIREMENT, OR TECHNICAL BLOCKER:
  1. Prepend a prominent section at the VERY TOP of your response titled: "🚨 CRITICAL BLOCKERS & AMBIGUITIES DETECTED".
  2. Format each blocker clearly:
     - [BLOCKER-ID]: What is missing or ambiguous.
     - [IMPACT]: Why development cannot proceed deterministically without this.
     - [QUESTION FOR CLIENT]: Exact question that must be answered to clear the blocker.
  3. Underneath the blockers, generate the SOW with "[PENDING CLARIFICATION]" markers wherever the blocker impacts the spec.

===============================================================================
CRITICAL RULE 2: ULTRA-DEEP FEATURE SPECIFICATION REQUIREMENTS
===============================================================================
For EVERY single feature or module identified, you MUST detail:

1. Feature Overview & Boundary:
   - Purpose, exact scope, and explicit non-goals for this feature.

2. User Stories & Role-Based Permissions:
   - Role Matrix (e.g., Admin, Regular User, Guest) with explicit CRUD permission flags.

3. Granular Acceptance Criteria (Given-When-Then / Gherkin Format):
   - Include happy paths, edge cases (e.g., rate limits, invalid tokens, network drops), and validation failures.
   - Example:
     * Scenario: User attempts login with unverified email
     * Given a user with email "user@test.com" and status "UNVERIFIED"
     * When they submit valid credentials to POST /api/v1/auth/login
     * Then system returns HTTP 403 Forbidden with payload {"error": "EMAIL_NOT_VERIFIED"}

4. Exact Database Schema & Field Definitions:
   - Provide Markdown tables for entities/tables required:
     | Field Name | Data Type | Nullable | Primary/Foreign Key | Constraints / Defaults | Description |

5. API Contracts & Payload Definitions:
   - Endpoint URL, HTTP Method, Request Headers, Body JSON Schema, and HTTP Response Codes (200, 400, 401, 403, 404, 500).

6. Business Logic & Validation Rules:
   - Field validations (regex, min/max lengths, allowed enum values).
   - State machine transitions (e.g., Draft -> Pending Review -> Approved -> Archived).
`;

/**
 * Appends the optional SDD methodology to the system prompt so the model
 * shapes the SOW for the downstream SDD framework that will consume it.
 */
export const buildSystemPrompt = (
  basePrompt: string,
  methodology?: string,
): string => {
  const methodologyText = methodology?.trim();
  if (!methodologyText) return basePrompt;

  return `${basePrompt}

=== SDD METHODOLOGY (DOWNSTREAM CONSUMER OF THIS SOW) ===
${methodologyText}
=== END OF SDD METHODOLOGY ===

HOW TO APPLY THE METHODOLOGY:
1. The SOW you produce will be consumed by the SDD framework described above. Structure sections, requirement/acceptance-criteria IDs, naming, and traceability so that framework can parse and act on it directly.
2. Precedence: the SOW TEMPLATE controls section order and headings; the METHODOLOGY controls ID formats, naming conventions, and the required content within each section. If the template omits content the methodology requires, add it in the most relevant section.
3. Use the methodology only to shape the SOW. Do NOT restate, summarize, or quote the methodology itself in the output.`;
};

const ANALYSIS_SYSTEM_PROMPT = `You are a Senior Business Analyst and Principal Software Architect performing discovery for Specification-Driven Delivery (SDD).
You do NOT write the SOW. Your only job is to find every gap that would force an engineer or AI coding agent to guess while writing a feature spec: business rules, roles and permissions, data model, API contract, state transitions, edge cases, acceptance criteria, and non-functional targets.

RULES:
1. Identify the features in the inputs and give each a slug: kebab-case, 3–5 words, naming a thing (no verbs), unique. Use "project" for cross-cutting questions.
2. Raise a question for anything missing, ambiguous, conflicting, or left as an "X or Y" choice. Never answer your own questions and never assume a default.
3. Do not ask about anything the inputs already state, or anything answered in the CLARIFICATIONS section. If an answer opens a new gap, ask a follow-up question.
4. Template example values (vendors, numbers, dates) are placeholders, not requirements.
5. "blocking" is true when a feature's acceptance criteria, API contract, or data model cannot be finalised without the answer.
6. Make each question specific and answerable in one or two sentences. Provide "options" only when there are concrete, well-known alternatives; otherwise use an empty array.
7. IDs are "<slug>.Q01", "<slug>.Q02", … numbered per feature, and "project.Q01", … for cross-cutting questions. Reuse the ID of any previously asked question that is still open.

Return ONLY a JSON object — no prose and no code fence — in exactly this shape:
{
  "features": [{ "slug": "string", "name": "string" }],
  "questions": [
    {
      "id": "string",
      "feature": "feature slug or project",
      "question": "string",
      "whyItMatters": "string",
      "options": ["string"],
      "blocking": true
    }
  ]
}`;

export interface CallModelParams {
  provider: ProviderId;
  model: string;
  system: string;
  prompt: string;
  apiKeyOverride?: string;
  /** Ask the provider for a JSON response where it supports that natively. */
  json?: boolean;
  signal?: AbortSignal;
}

export interface ModelResponse {
  text: string;
  /** The response stopped at the model's output limit and is incomplete. */
  truncated: boolean;
}

/**
 * Single entry point to the three providers, shared by every generation pass
 */
export async function callModel({
  provider,
  model,
  system,
  prompt,
  apiKeyOverride,
  json = false,
  signal,
}: CallModelParams): Promise<ModelResponse> {
  // 1. Google Gemini Provider
  if (provider === "gemini") {
    const apiKey = apiKeyOverride || import.meta.env.VITE_GEMINI_API_KEY;
    if (!apiKey)
      throw new Error(
        "Missing Gemini API Key. Provide it in .env or via the API Key override input.",
      );

    const ai = new GoogleGenAI({ apiKey });
    const response = await ai.models.generateContent({
      model: model || "gemini-2.5-flash",
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      config: {
        systemInstruction: system,
        abortSignal: signal,
        ...(json && { responseMimeType: "application/json" }),
      },
    });

    return {
      text: response.text || "",
      truncated:
        response.candidates?.[0]?.finishReason === FinishReason.MAX_TOKENS,
    };
  }

  // 2. Anthropic Claude Provider
  if (provider === "claude") {
    const apiKey = apiKeyOverride || import.meta.env.VITE_ANTHROPIC_API_KEY;
    if (!apiKey)
      throw new Error(
        "Missing Anthropic API Key. Provide it in .env or via the API Key override input.",
      );

    const anthropic = new Anthropic({
      apiKey,
      dangerouslyAllowBrowser: true,
    });

    const claudeModel = model || "claude-opus-5";
    // Streamed so long SOW sections are not cut off by HTTP timeouts
    const stream = anthropic.beta.messages.stream(
      {
        model: claudeModel,
        max_tokens:
          PROVIDERS.CLAUDE.models.find((m) => m.id === claudeModel)
            ?.maxOutputTokens ?? 64000,
        system,
        messages: [{ role: "user", content: prompt }],
        ...(CLAUDE_FALLBACK_MODELS.has(claudeModel) && {
          betas: ["server-side-fallback-2026-07-01"],
          fallbacks: "default" as const,
        }),
      },
      { signal },
    );
    const message = await stream.finalMessage();

    if (message.stop_reason === "refusal") {
      const reason = message.stop_details?.explanation;
      throw new Error(
        `Claude declined this request${reason ? `: ${reason}` : "."}`,
      );
    }

    // Thinking blocks may precede the answer, so collect every text block
    const text = message.content
      .filter((block) => block.type === "text")
      .map((block) => block.text)
      .join("");

    return {
      text,
      truncated:
        message.stop_reason === "max_tokens" ||
        message.stop_reason === "model_context_window_exceeded",
    };
  }

  // 3. OpenAI ChatGPT Provider
  if (provider === "openai") {
    const apiKey = apiKeyOverride || import.meta.env.VITE_OPENAI_API_KEY;
    if (!apiKey)
      throw new Error(
        "Missing OpenAI API Key. Provide it in .env or via the API Key override input.",
      );

    const openai = new OpenAI({
      apiKey,
      dangerouslyAllowBrowser: true,
    });

    const response = await openai.chat.completions.create(
      {
        model: model || "gpt-4o",
        messages: [
          { role: "system", content: system },
          { role: "user", content: prompt },
        ],
        ...(json && { response_format: { type: "json_object" as const } }),
      },
      { signal },
    );

    const choice = response.choices[0];
    if (choice?.finish_reason === "content_filter") {
      throw new Error("OpenAI's content filter blocked this response.");
    }
    return {
      text: choice?.message?.content || "",
      truncated: choice?.finish_reason === "length",
    };
  }

  throw new Error(`Unsupported provider: ${provider}`);
}

/** Pulls the outermost JSON object out of a model response and parses it. */
export const extractJsonObject = (
  raw: string,
  label: string,
): Record<string, unknown> => {
  const start = raw.indexOf("{");
  const end = raw.lastIndexOf("}");
  if (start === -1 || end <= start) {
    throw new Error(`The model did not return any ${label}. Please try again.`);
  }
  try {
    const data: unknown = JSON.parse(raw.slice(start, end + 1));
    return (data ?? {}) as Record<string, unknown>;
  } catch {
    throw new Error(
      `The model returned malformed ${label} JSON. Please try again.`,
    );
  }
};

export const asString = (v: unknown): string =>
  typeof v === "string" ? v : "";

/**
 * Renders the user's answers so the model treats them as decisions, and keeps
 * unanswered or deferred questions visible as open items instead of guessing.
 */
const formatClarifications = (clarifications: Clarification[]): string =>
  clarifications
    .map((c) => {
      const header = `- [${c.id}] (${c.feature}, blocking: ${c.blocking ? "yes" : "no"}) ${c.question}`;
      const answer = c.answer.trim();
      return answer && !c.deferred
        ? `${header}\n  ANSWER: ${answer}`
        : `${header}\n  STATUS: OPEN — not answered`;
    })
    .join("\n");

export const buildInputsPrompt = ({
  template,
  requirements,
  additional,
  clarifications,
}: Pick<
  GenerateSOWParams,
  "template" | "requirements" | "additional" | "clarifications"
>): string => {
  const sections = [
    `=== SOW TEMPLATE / STRUCTURE ===\n${template || "Use standard Spec-Driven Development SOW structure."}`,
    `=== RAW PROJECT REQUIREMENTS ===\n${requirements}`,
    `=== ADDITIONAL CONSTRAINTS & TECH STACK ===\n${additional || "None provided."}`,
  ];

  if (clarifications?.length) {
    sections.push(`=== CLARIFICATIONS FROM STAKEHOLDERS ===
Answered questions are binding decisions: treat each ANSWER as stated input, cite it as "Clarification <ID>" where a source is shown, and do not list it as an open question.
Questions with STATUS OPEN are unresolved: keep them in the Open Questions register with the same ID and blocking flag, and mark every affected detail with ⚠️ <ID> instead of guessing.

${formatClarifications(clarifications)}`);
  }

  return sections.join("\n\n");
};

/** Extracts and validates the JSON object returned by the analysis pass. */
const parseAnalysis = (raw: string): AnalysisResult => {
  const obj = extractJsonObject(raw, "analysis");

  const features = (Array.isArray(obj.features) ? obj.features : [])
    .map((f: Record<string, unknown>) => ({
      slug: asString(f?.slug),
      name: asString(f?.name),
    }))
    .filter((f) => f.slug);

  const questions: ClarificationQuestion[] = (
    Array.isArray(obj.questions) ? obj.questions : []
  )
    .map((q: Record<string, unknown>) => ({
      id: asString(q?.id),
      feature: asString(q?.feature) || "project",
      question: asString(q?.question),
      whyItMatters: asString(q?.whyItMatters),
      options: Array.isArray(q?.options)
        ? q.options.filter((o): o is string => typeof o === "string")
        : [],
      blocking: q?.blocking === true,
    }))
    .filter((q) => q.id && q.question);

  return { features, questions };
};

/**
 * Analysis pass: finds gaps, ambiguities and blockers in the inputs and
 * returns them as questions, before any SOW is written.
 */
export async function analyzeRequirements({
  provider,
  model,
  template,
  requirements,
  additional,
  methodology,
  clarifications,
  apiKeyOverride,
  signal,
}: AnalyzeParams): Promise<AnalysisResult> {
  const { text, truncated } = await callModel({
    provider,
    model,
    system: buildSystemPrompt(ANALYSIS_SYSTEM_PROMPT, methodology),
    prompt: buildInputsPrompt({
      template,
      requirements,
      additional,
      clarifications,
    }),
    apiKeyOverride,
    json: true,
    signal,
  });

  if (truncated) {
    throw new Error(
      "The analysis hit the model's output limit before finishing. Try a model with a larger output limit.",
    );
  }
  return parseAnalysis(text);
}

/**
 * Single-pass SOW generation: the whole document in one request. Fine for
 * small projects; use generateSOWMultiPass for deep specs on larger ones.
 */
export async function generateSOW({
  provider,
  model,
  template,
  requirements,
  additional,
  methodology,
  systemPrompt,
  clarifications,
  apiKeyOverride,
  signal,
}: GenerateSOWParams): Promise<GenerationResult> {
  const { text, truncated } = await callModel({
    provider,
    model,
    system: buildSystemPrompt(
      systemPrompt?.trim() || SYSTEM_PROMPT,
      methodology,
    ),
    prompt: buildInputsPrompt({
      template,
      requirements,
      additional,
      clarifications,
    }),
    apiKeyOverride,
    signal,
  });

  return {
    markdown: text,
    warnings: truncated
      ? [
          "The SOW hit the model's output limit and is incomplete. Switch to multi-pass generation or a model with a larger output limit.",
        ]
      : [],
  };
}
