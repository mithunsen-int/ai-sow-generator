// src/types/sow.ts

export type ProviderId = "gemini" | "claude" | "openai";

export interface ModelOption {
  id: string;
  name: string;
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
  apiKeyOverride?: string;
}

export type InputMode = "text" | "file";

export interface FileInputState {
  templateFile: File | null;
  requirementsFile: File | null;
  additionalFile: File | null;
}
