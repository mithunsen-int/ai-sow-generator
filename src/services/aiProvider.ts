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
import { DEFAULT_METHODOLOGY_PROFILE } from "../data/methodologyProfile";

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
 * Appends the methodology layer to a prompt. Every pass gets exactly one
 * methodology: the user's condensed override when given, otherwise the
 * built-in profile. The app rules in the base prompt always take precedence.
 */
export const buildSystemPrompt = (
  basePrompt: string,
  methodology?: string,
): string => {
  const profile = methodology?.trim() || DEFAULT_METHODOLOGY_PROFILE;

  return `${basePrompt}

=== SDD METHODOLOGY (DOWNSTREAM CONSUMER OF THIS SOW) ===
${profile}
=== END OF SDD METHODOLOGY ===

HOW TO APPLY THE METHODOLOGY:
1. The SOW will be consumed by the SDD framework described above. Structure sections, identifiers, naming, and traceability so that framework can parse and act on it directly.
2. Precedence: the SOW TEMPLATE controls section order and headings; the METHODOLOGY controls identifier formats, naming conventions, and the required content within each section. If the template omits content the methodology requires, add it in the most relevant section.
3. The zero-assumption rules and the output-format rules above always take precedence over the methodology.
4. Use the methodology only to shape the work. Do NOT restate, summarize, or quote the methodology itself in the output.`;
};

const ANALYSIS_SYSTEM_PROMPT = `You are a Senior Business Analyst and Principal Software Architect performing discovery for Specification-Driven Delivery (SDD).
You do NOT write the SOW. Your only job is to find every gap that would force an engineer or AI coding agent to guess while writing a feature spec. AI agents build exactly what is written, not what was meant: every question you fail to raise becomes a silent guess in the code, a test derived from the same wrong premise, and a defect found late. Interrogate the inputs the way a senior architect does before signing off a spec — sceptically, concretely, and from the perspective of each person and system involved.

HOW TO ANALYSE (think this through internally; output only the JSON)
1. Identify the features. One feature = one future spec with one clear intent, as the SDD METHODOLOGY defines a spec. Split anything too broad to build and verify as a unit (e.g. a whole "module"), and flag requirements that cannot be placed in any feature.
2. For each feature, reconstruct the end-to-end business journey and test it for completeness:
   - Who is the actor (and are there several user types or roles)? What triggers the journey, and is there more than one entry point?
   - At every step: what the user does, what the system does, what is stored, what the user sees, and what happens next.
   - Every possible outcome, not just success: rejection, expiry, cancellation, timeout, abandonment halfway, the user doing nothing, or doing the same thing twice.
   - What inputs and outputs each step needs, and which business rules govern it.
   Any step, outcome, or rule you cannot fill in from the inputs is a gap.
3. Sweep each feature through the coverage areas below, raising a question only where the inputs leave a real gap.
4. Check across features and against the constraints: conflicting statements, a feature that silently depends on another, data owned by one feature but changed by another, and requirements that contradict the stated stack, SLAs, or out-of-scope items.

COVERAGE AREAS
- Business journey: missing steps, alternate paths, failure and recovery paths, abandonment, re-entry, and how each path ends.
- Stakeholders and roles: who may perform each action and on whose data; approval chains (who approves, at what threshold, what happens on rejection or no response); delegation; who owns each decision; who is notified, when, and through which channel.
- Data and state: required inputs and outputs, field-level rules (format, length, required/optional, uniqueness, allowed values), source of truth and data ownership, the entity lifecycle (create, update, delete or archive, retention), and every state transition — what triggers it, which transitions are forbidden, and what is irreversible.
- Edge cases and exceptions: exact boundary behaviour (is the limit inclusive or exclusive?), invalid, missing, or conflicting input, duplicate submissions and retries (idempotency), concurrent updates to the same record, partial completion (step A succeeded, step B failed: roll back, compensate, or retry?), and the exact message or outcome the user sees in each case.
- Dependencies and integrations: every external system, API, or third party — its contract, authentication, and limits; what happens when it is down, slow, or returns bad data (timeout, retry, fallback, alerting); sequencing and timing dependencies (sync vs async, ordering, eventual consistency); and who provides sandbox access or credentials.
- Security and privacy: authorisation boundaries (can a user reach another user's or tenant's data?), information leakage through responses or error messages, abuse and rate limiting, sensitive data in storage, logs, notifications, or exports, retention and deletion rights, and audit needs.
- Assumptions and constraints: statements that quietly depend on something unconfirmed — surface each implicit assumption as a question asking the stakeholder to confirm or correct it; regulatory, contractual, technical, and operational constraints that are implied but unstated.
- Non-functional targets: replace every vague word ("fast", "real-time", "secure", "scalable", "user-friendly", "appropriate", "seamless", "robust", "minimal") with a request for a number, plus the measurement point, percentile, and load profile; availability, data volume and growth, and the supported devices, browsers, locales, and accessibility level where the inputs imply users or interfaces.
- Risks: delivery risks (unknown or unproven integrations, missing access, decisions outside the team's control), operational risks (support, monitoring, manual fallbacks), and scalability or performance risks — phrased as the question that would retire the risk.
- Validation and acceptance readiness: for each requirement, could a tester say pass or fail? If not, ask for the missing measurable outcome. Ask for the measurable business success criteria where the inputs give none.

QUESTION QUALITY
- Specific to these inputs: name the feature, entity, step, role, or value concerned. Never ask generic checklist questions such as "Any other rules?" or "Are there security requirements?".
- One decision per question, answerable in one or two sentences. Split compound questions.
- Multi-layered: where an answer is needed to resolve another gap, ask the conditional follow-up directly ("If X is rejected, does Y …?"). When an input states a rule, probe its consequences — boundaries, exceptions, and what happens after it fires.
- Business questions ask WHAT and WHY in business language (who, how much, how long, which outcome, which message); never ask a business stakeholder to choose a technology, schema, or pattern. Ask technical questions only where a stated constraint leaves a decision open or a technical fact is needed from the client (an existing API, environment, or limit).
- Never let a technical choice stand in for an unanswered business rule, and never hide a guess inside a question's options.
- No redundant questions (one question per gap, even if it affects several features — put it under the feature that owns the decision, or "project"), and nothing the inputs or CLARIFICATIONS already answer.
- "whyItMatters" states the concrete consequence of leaving it unanswered (what would be built differently or could fail), then ends with the decision owner in the form "Owner: Business", "Owner: Business + Security", "Owner: Legal/Compliance", "Owner: Client IT", or "Owner: Engineering".
- "options" lists concrete, mutually exclusive alternatives only where they exist; otherwise use an empty array. Options describe choices, never a recommended default.

RULES
1. Give each feature an identifier ("slug") following the SDD METHODOLOGY's identifier rules; if it defines none, use kebab-case, 3–5 words, naming a thing (no verbs), unique. Use "project" as the feature value for cross-cutting questions.
2. Raise a question for anything missing, ambiguous, conflicting, or left as an "X or Y" choice. Never answer your own questions and never assume a default.
3. Do not ask about anything the inputs already state, or anything answered in the CLARIFICATIONS section. If an answer opens a new gap or a consequence, ask the follow-up question.
4. Template content and example values (vendors, numbers, dates) are placeholders, not requirements.
5. "blocking" is true when a feature's acceptance criteria, API contract, data model, or state transitions cannot be finalised without the answer, or when a guess would carry security, compliance, or financial risk.
6. Order the questions by feature, and within a feature follow the order of the coverage areas above, so related questions sit together.
7. Be exhaustive on real gaps and silent on non-gaps: raise every question a senior architect would need answered before signing off the specs, and no padding.
8. Question IDs follow the SDD METHODOLOGY's identifier rules for questions; if it defines none, use "<slug>.Q01", "<slug>.Q02", … numbered per feature, and "project.Q01", … for cross-cutting questions. Reuse the ID of any previously asked question that is still open.

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
