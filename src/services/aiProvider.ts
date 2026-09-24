// src/services/aiProvider.ts
import Anthropic from "@anthropic-ai/sdk";
import { GoogleGenAI } from "@google/genai";
import OpenAI from "openai";
import type { GenerateSOWParams, ProviderConfig } from "../types/sow";

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
        id: "claude-3-5-sonnet-20241022",
        name: "Claude 3.5 Sonnet (Best SOW Quality)",
      },
      { id: "claude-3-haiku-20240307", name: "Claude 3 Haiku (Fastest)" },
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

const SYSTEM_PROMPT = `
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
const buildSystemPrompt = (
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

/**
 * Universal SOW Generator function supporting Gemini, Claude, and OpenAI
 */
export async function generateSOW({
  provider,
  model,
  template,
  requirements,
  additional,
  methodology,
  systemPrompt,
  apiKeyOverride,
}: GenerateSOWParams): Promise<string> {
  const system = buildSystemPrompt(
    systemPrompt?.trim() || SYSTEM_PROMPT,
    methodology,
  );
  const prompt = `
=== SOW TEMPLATE / STRUCTURE ===
${template || "Use standard Spec-Driven Development SOW structure."}

=== RAW PROJECT REQUIREMENTS ===
${requirements}

=== ADDITIONAL CONSTRAINTS & TECH STACK ===
${additional || "None provided."}
  `;

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
      config: { systemInstruction: system },
    });

    return response.text || "";
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

    const response = await anthropic.messages.create({
      model: model || "claude-3-5-sonnet-20241022",
      max_tokens: 4000,
      system,
      messages: [{ role: "user", content: prompt }],
    });

    const firstBlock = response.content[0];
    if (firstBlock && firstBlock.type === "text") {
      return firstBlock.text;
    }
    return "";
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

    const response = await openai.chat.completions.create({
      model: model || "gpt-4o",
      messages: [
        { role: "system", content: system },
        { role: "user", content: prompt },
      ],
    });

    return response.choices[0]?.message?.content || "";
  }

  throw new Error(`Unsupported provider: ${provider}`);
}
