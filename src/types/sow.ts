// src/types/sow.ts

export type ProviderId = "gemini" | "claude" | "openai";

export interface ModelOption {
  id: string;
  name: string;
  /** Upper bound on generated tokens, where the API requires one (Claude). */
  maxOutputTokens?: number;
}

export interface ProviderConfig {
  id: ProviderId;
  name: string;
  models: ModelOption[];
}

export interface GenerateSOWParams {
  provider: ProviderId;
  model: string;
  template: string;
  requirements: string;
  additional: string;
  methodology?: string;
  systemPrompt?: string;
  clarifications?: Clarification[];
  apiKeyOverride?: string;
  signal?: AbortSignal;
}

export type GenerationMode = "multi" | "single";

export interface GenerationResult {
  markdown: string;
  /** Non-fatal problems, e.g. a truncated or failed feature pass. */
  warnings: string[];
}

export type FeaturePassStatus =
  "pending" | "running" | "done" | "truncated" | "failed";

/** Live progress of a multi-pass generation, for the UI. */
export interface GenerationProgress {
  stage: "outline" | "features" | "assembly" | "done";
  features: (FeatureSummary & { status: FeaturePassStatus })[];
}

export type AnalyzeParams = Omit<GenerateSOWParams, "systemPrompt">;

/** A gap found by the analysis pass that must be answered, not assumed. */
export interface ClarificationQuestion {
  id: string;
  /** Feature slug the question belongs to, or "project" for cross-cutting. */
  feature: string;
  question: string;
  whyItMatters: string;
  options: string[];
  blocking: boolean;
}

/** A question plus the user's response to it. */
export interface Clarification extends ClarificationQuestion {
  answer: string;
  /** User chose to keep it open; it stays in the SOW's questions register. */
  deferred: boolean;
}

export interface FeatureSummary {
  slug: string;
  name: string;
}

export interface AnalysisResult {
  features: FeatureSummary[];
  questions: ClarificationQuestion[];
}

export type InputMode = "text" | "file";

export interface FileInputState {
  templateFile: File | null;
  requirementsFile: File | null;
  additionalFile: File | null;
}
