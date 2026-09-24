// src/App.tsx
import {
  AlertTriangle,
  Check,
  CheckCircle,
  CheckSquare,
  ChevronDown,
  ChevronUp,
  Code,
  Copy,
  Download,
  Eraser,
  Eye,
  FileText,
  ListChecks,
  RefreshCw,
  RotateCcw,
  SearchCheck,
  ShieldCheck,
  Sparkles,
  Terminal,
  X,
} from "lucide-react";
import React, { type ChangeEvent, useMemo, useRef, useState } from "react";
import ReactMarkdown, { type Components } from "react-markdown";
import remarkGfm from "remark-gfm";
import {
  DEFAULT_SDD_SYSTEM_PROMPT,
  DEMO_ADDITIONAL_CONSTRAINTS,
  DEMO_RAW_REQUIREMENTS,
  DEMO_SOW_TEMPLATE,
  buildDemoSowOutput,
} from "./data/sowDemoData";
import ClarificationsPanel from "./components/ClarificationsPanel";
import GenerationProgressPanel from "./components/GenerationProgressPanel";
import {
  PROVIDERS,
  analyzeRequirements,
  generateSOW,
} from "./services/aiProvider";
import { generateSOWMultiPass } from "./services/multiPass";
import type {
  Clarification,
  FeatureSummary,
  GenerationMode,
  GenerationProgress,
  InputMode,
  ProviderId,
} from "./types/sow";
import {
  countUnresolvedBlocking,
  mergeClarifications,
} from "./utils/clarifications";
import { unwrapMarkdownFence } from "./utils/markdown";
import { auditSow } from "./utils/sddAudit";

type OutputTab = "clarify" | "preview" | "code" | "audit";

// Tailwind styling for the rendered markdown (no typography plugin installed)
const markdownComponents: Components = {
  h1: ({ children }) => (
    <h1 className="text-2xl font-extrabold text-blue-400 border-b border-slate-700 pb-2 mb-4 mt-6 first:mt-0">
      {children}
    </h1>
  ),
  h2: ({ children }) => (
    <h2 className="text-xl font-bold text-slate-100 border-b border-slate-800 pb-1 mb-3 mt-5">
      {children}
    </h2>
  ),
  h3: ({ children }) => (
    <h3 className="text-lg font-semibold text-emerald-400 mb-2 mt-4">
      {children}
    </h3>
  ),
  h4: ({ children }) => (
    <h4 className="text-base font-semibold text-cyan-400 mb-2 mt-3">
      {children}
    </h4>
  ),
  h5: ({ children }) => (
    <h5 className="text-sm font-semibold uppercase tracking-wide text-slate-300 mb-2 mt-4">
      {children}
    </h5>
  ),
  h6: ({ children }) => (
    <h6 className="text-sm font-semibold text-blue-300 mb-1.5 mt-3">
      {children}
    </h6>
  ),
  p: ({ children }) => (
    <p className="my-1.5 text-sm leading-relaxed text-slate-300">{children}</p>
  ),
  ul: ({ children, className }) => (
    <ul
      className={`my-2 space-y-1 text-sm text-slate-300 ${className?.includes("contains-task-list") ? "list-none" : "ml-5 list-disc"}`}
    >
      {children}
    </ul>
  ),
  ol: ({ children }) => (
    <ol className="ml-5 my-2 list-decimal space-y-1 text-sm text-slate-300">
      {children}
    </ol>
  ),
  li: ({ children }) => <li className="leading-relaxed">{children}</li>,
  input: ({ checked }) => (
    <input
      type="checkbox"
      checked={checked}
      disabled
      readOnly
      className="mr-2 align-middle accent-blue-500"
    />
  ),
  strong: ({ children }) => (
    <strong className="font-semibold text-slate-100">{children}</strong>
  ),
  em: ({ children }) => <em className="italic text-slate-400">{children}</em>,
  code: ({ children }) => (
    <code className="px-1.5 py-0.5 rounded bg-slate-800 text-cyan-300 text-xs font-mono">
      {children}
    </code>
  ),
  pre: ({ children }) => (
    <pre className="my-3 p-4 rounded-lg bg-slate-950 border border-slate-800 overflow-x-auto text-xs">
      {children}
    </pre>
  ),
  blockquote: ({ children }) => (
    <blockquote className="border-l-4 border-blue-500 pl-4 py-1 my-3 bg-blue-950/20 italic rounded-r">
      {children}
    </blockquote>
  ),
  hr: () => <hr className="border-slate-800 my-6" />,
  a: ({ children, href }) => (
    <a href={href} className="text-blue-400 underline hover:text-blue-300">
      {children}
    </a>
  ),
  table: ({ children }) => (
    <div className="my-4 overflow-x-auto rounded-lg border border-slate-700 bg-slate-900/60">
      <table className="w-full text-left text-sm text-slate-300">
        {children}
      </table>
    </div>
  ),
  thead: ({ children }) => (
    <thead className="bg-slate-800 text-xs uppercase text-slate-400">
      {children}
    </thead>
  ),
  tbody: ({ children }) => (
    <tbody className="divide-y divide-slate-800">{children}</tbody>
  ),
  th: ({ children }) => (
    <th className="px-4 py-3 font-semibold border-b border-slate-700">
      {children}
    </th>
  ),
  td: ({ children }) => <td className="px-4 py-3 align-top">{children}</td>,
};

// Small per-field clear button; disabled when the field is already empty
function ClearButton({
  onClear,
  disabled,
  label,
}: {
  onClear: () => void;
  disabled: boolean;
  label: string;
}): React.JSX.Element {
  return (
    <button
      type="button"
      onClick={onClear}
      disabled={disabled}
      className="flex items-center gap-1 px-2 py-1 text-xs text-slate-400 hover:text-slate-200 bg-slate-800 hover:bg-slate-700 disabled:opacity-40 disabled:hover:bg-slate-800 disabled:hover:text-slate-400 rounded transition-colors"
      title={`Clear ${label}`}
      aria-label={`Clear ${label}`}
    >
      <X className="w-3 h-3" />
      <span>Clear</span>
    </button>
  );
}

export default function AiSowGenerator(): React.JSX.Element {
  // Config & State
  const [selectedProvider, setSelectedProvider] =
    useState<ProviderId>("openai");
  const [selectedModel, setSelectedModel] = useState<string>("gpt-4o");
  const [customApiKey, setCustomApiKey] = useState<string>("");
  const [generationMode, setGenerationMode] = useState<GenerationMode>("multi");

  // Input States (pre-filled with demo data to show the expected format)
  const [template, setTemplate] = useState<string>(DEMO_SOW_TEMPLATE);
  const [requirements, setRequirements] = useState<string>(
    DEMO_RAW_REQUIREMENTS,
  );
  const [additional, setAdditional] = useState<string>(
    DEMO_ADDITIONAL_CONSTRAINTS,
  );

  // Optional SDD methodology describing how the SOW is consumed downstream
  const [methodology, setMethodology] = useState<string>("");
  const [methodologyMode, setMethodologyMode] = useState<InputMode>("text");

  // SDD System Prompt Config
  const [systemPrompt, setSystemPrompt] = useState<string>(
    DEFAULT_SDD_SYSTEM_PROMPT,
  );
  const [showPromptConfig, setShowPromptConfig] = useState<boolean>(false);

  // Input Mode Toggles
  const [templateMode, setTemplateMode] = useState<InputMode>("text");
  const [requirementsMode, setRequirementsMode] = useState<InputMode>("text");
  const [additionalMode, setAdditionalMode] = useState<InputMode>("text");

  // Outputs
  const [sowOutput, setSowOutput] = useState<string>(() =>
    buildDemoSowOutput(),
  );
  const [activeTab, setActiveTab] = useState<OutputTab>("preview");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [progress, setProgress] = useState<GenerationProgress | null>(null);
  const [warnings, setWarnings] = useState<string[]>([]);
  // Aborts the in-flight analysis or generation request(s)
  const abortRef = useRef<AbortController | null>(null);

  // Clarifications (Analyze -> answer -> Generate loop)
  const [clarifications, setClarifications] = useState<Clarification[]>([]);
  const [features, setFeatures] = useState<FeatureSummary[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  // Snapshot of the inputs at the last analysis, to flag stale questions
  const [analyzedInputs, setAnalyzedInputs] = useState<string>("");
  const [copied, setCopied] = useState<boolean>(false);
  const [error, setError] = useState<string>("");

  const auditResults = useMemo(() => auditSow(sowOutput), [sowOutput]);
  const auditPassed = !auditResults.blocked && auditResults.score >= 80;
  const auditTone = auditPassed
    ? "emerald"
    : auditResults.blocked
      ? "red"
      : "amber";

  const currentInputs = [template, requirements, additional, methodology].join(
    "\u0000",
  );
  const unresolvedBlocking = countUnresolvedBlocking(clarifications);
  const isBusy = isLoading || isAnalyzing;

  const errorMessage = (err: unknown, fallback: string): string =>
    err instanceof Error ? err.message : fallback;

  const startRequest = (): AbortSignal => {
    abortRef.current?.abort();
    abortRef.current = new AbortController();
    return abortRef.current.signal;
  };

  const handleCancel = (): void => {
    abortRef.current?.abort();
  };

  // Handle Provider switching
  const handleProviderChange = (e: ChangeEvent<HTMLSelectElement>): void => {
    const providerId = e.target.value as ProviderId;
    setSelectedProvider(providerId);

    const providerKey = Object.keys(PROVIDERS).find(
      (key) => PROVIDERS[key].id === providerId,
    );
    if (providerKey) {
      setSelectedModel(PROVIDERS[providerKey].models[0].id);
    }
  };

  // Utility to read uploaded text files
  const handleFileUpload = (
    e: ChangeEvent<HTMLInputElement>,
    setter: React.Dispatch<React.SetStateAction<string>>,
  ): void => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) setter(content);
    };
    reader.readAsText(file);
  };

  // Generate Action
  const handleGenerate = async (): Promise<void> => {
    if (!requirements.trim()) {
      setError("Please provide project requirements before generating.");
      return;
    }

    const signal = startRequest();
    setIsLoading(true);
    setError("");
    setWarnings([]);
    setProgress(null);
    setActiveTab("preview");

    const params = {
      provider: selectedProvider,
      model: selectedModel,
      template,
      requirements,
      additional,
      methodology,
      systemPrompt,
      clarifications,
      apiKeyOverride: customApiKey.trim() || undefined,
      signal,
    };

    try {
      const result =
        generationMode === "multi"
          ? await generateSOWMultiPass(params, features, setProgress)
          : await generateSOW(params);
      setSowOutput(unwrapMarkdownFence(result.markdown));
      setWarnings(result.warnings);
    } catch (err: unknown) {
      setError(
        signal.aborted
          ? "Generation cancelled. The previous SOW was kept."
          : errorMessage(
              err,
              "An unexpected error occurred while generating the SOW.",
            ),
      );
    } finally {
      setIsLoading(false);
      setProgress(null);
    }
  };

  // Analyze Action: find gaps and blockers before writing the SOW
  const handleAnalyze = async (): Promise<void> => {
    if (!requirements.trim()) {
      setError("Please provide project requirements before analyzing.");
      return;
    }

    const signal = startRequest();
    setIsAnalyzing(true);
    setError("");
    setActiveTab("clarify");

    try {
      const result = await analyzeRequirements({
        provider: selectedProvider,
        model: selectedModel,
        template,
        requirements,
        additional,
        methodology,
        clarifications,
        apiKeyOverride: customApiKey.trim() || undefined,
        signal,
      });
      setClarifications((prev) => mergeClarifications(prev, result.questions));
      setFeatures(result.features);
      setAnalyzedInputs(currentInputs);
    } catch (err: unknown) {
      setError(
        signal.aborted
          ? "Analysis cancelled."
          : errorMessage(
              err,
              "An unexpected error occurred while analyzing inputs.",
            ),
      );
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleUpdateClarification = (
    id: string,
    patch: Partial<Clarification>,
  ): void => {
    setClarifications((prev) =>
      prev.map((c) => (c.id === id ? { ...c, ...patch } : c)),
    );
  };

  const handleClearAnswers = (): void => {
    setClarifications((prev) =>
      prev.map((c) => ({ ...c, answer: "", deferred: false })),
    );
  };

  const resetClarifications = (): void => {
    setClarifications([]);
    setFeatures([]);
    setAnalyzedInputs("");
  };

  // Download Markdown file
  const handleDownload = (): void => {
    if (!sowOutput) return;
    const blob = new Blob([sowOutput], {
      type: "text/markdown;charset=utf-8;",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", "STATEMENT_OF_WORK_SDD.md");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Restore demo inputs and sample output
  const handleLoadDemo = (): void => {
    setTemplate(DEMO_SOW_TEMPLATE);
    setRequirements(DEMO_RAW_REQUIREMENTS);
    setAdditional(DEMO_ADDITIONAL_CONSTRAINTS);
    setSystemPrompt(DEFAULT_SDD_SYSTEM_PROMPT);
    setSowOutput(buildDemoSowOutput());
    setWarnings([]);
    resetClarifications();
    setError("");
  };

  // Clear all inputs and output to start from scratch
  const handleClearAll = (): void => {
    setTemplate("");
    setRequirements("");
    setAdditional("");
    setMethodology("");
    setSowOutput("");
    setWarnings([]);
    resetClarifications();
    setError("");
  };

  // Copy to clipboard
  const handleCopy = (): void => {
    if (!sowOutput) return;
    navigator.clipboard.writeText(sowOutput);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex h-screen w-full bg-slate-950 text-slate-100 overflow-hidden">
      {/* LEFT COLUMN: CONTROLS & INPUTS */}
      <div className="w-2/5 flex flex-col h-full border-r border-slate-800 bg-slate-900/50">
        <header className="p-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-blue-400" />
            <h1 className="font-bold text-slate-100">SDD SOW Generator</h1>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleLoadDemo}
              className="flex items-center gap-1 px-2.5 py-1 text-xs text-slate-300 bg-slate-800 hover:bg-slate-700 rounded-lg border border-slate-700 transition-colors"
              title="Restore demo inputs and sample output"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Load Demo</span>
            </button>
            <button
              onClick={handleClearAll}
              className="flex items-center gap-1 px-2.5 py-1 text-xs text-slate-300 bg-slate-800 hover:bg-slate-700 rounded-lg border border-slate-700 transition-colors"
              title="Clear all inputs and output"
            >
              <Eraser className="w-3.5 h-3.5" />
              <span>Clear</span>
            </button>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* AI MODEL CONFIGURATION */}
          <div className="p-4 bg-slate-900 rounded-xl border border-slate-800 space-y-4">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              AI Engine Settings
            </h2>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-slate-400 mb-1">
                  Provider
                </label>
                <select
                  value={selectedProvider}
                  onChange={handleProviderChange}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {Object.values(PROVIDERS).map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs text-slate-400 mb-1">
                  Model
                </label>
                <select
                  value={selectedModel}
                  onChange={(e) => setSelectedModel(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {Object.values(PROVIDERS)
                    .find((p) => p.id === selectedProvider)
                    ?.models.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.name}
                      </option>
                    ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs text-slate-400 mb-1">
                Generation Mode
              </label>
              <select
                value={generationMode}
                onChange={(e) =>
                  setGenerationMode(e.target.value as GenerationMode)
                }
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="multi">
                  Multi-pass — deep spec per feature (recommended)
                </option>
                <option value="single">
                  Single pass — one request, faster and cheaper
                </option>
              </select>
              <p className="text-[11px] text-slate-500 mt-1">
                {generationMode === "multi"
                  ? "Outline, then one request per feature, then assembly. Stays within output limits on large projects; costs more requests."
                  : "Best for small projects. Large SOWs may hit the model's output limit."}
              </p>
            </div>

            <div>
              <label className="block text-xs text-slate-400 mb-1">
                Custom API Key{" "}
                <span className="text-slate-500">(Optional override)</span>
              </label>
              <div className="relative">
                <input
                  type="password"
                  placeholder={`Enter custom ${selectedProvider} API key...`}
                  value={customApiKey}
                  onChange={(e) => setCustomApiKey(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg pl-3 pr-8 py-1.5 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                {customApiKey && (
                  <button
                    type="button"
                    onClick={() => setCustomApiKey("")}
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-0.5 text-slate-400 hover:text-slate-200 rounded"
                    title="Clear API key"
                    aria-label="Clear API key"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* SOW TEMPLATE INPUT */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-slate-300">
                SOW Template
              </label>
              <div className="flex items-center gap-2">
                <ClearButton
                  onClear={() => setTemplate("")}
                  disabled={!template}
                  label="SOW template"
                />
                <div className="flex bg-slate-800 rounded p-0.5 text-xs">
                  <button
                    onClick={() => setTemplateMode("text")}
                    className={`px-2 py-1 rounded ${templateMode === "text" ? "bg-blue-600 text-white" : "text-slate-400"}`}
                  >
                    Text
                  </button>
                  <button
                    onClick={() => setTemplateMode("file")}
                    className={`px-2 py-1 rounded ${templateMode === "file" ? "bg-blue-600 text-white" : "text-slate-400"}`}
                  >
                    File
                  </button>
                </div>
              </div>
            </div>
            {templateMode === "text" ? (
              <textarea
                rows={8}
                value={template}
                onChange={(e) => setTemplate(e.target.value)}
                placeholder="Paste preferred SOW structure or layout specifications..."
                className="w-full bg-slate-900 border border-slate-800 rounded-lg p-3 text-xs font-mono text-slate-300 focus:outline-none focus:border-blue-500 resize-y"
              />
            ) : (
              <input
                type="file"
                accept=".txt,.md,.json"
                onChange={(e) => handleFileUpload(e, setTemplate)}
                className="w-full text-xs text-slate-400 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-slate-800 file:text-slate-200 hover:file:bg-slate-700"
              />
            )}
          </div>

          {/* RAW PROJECT REQUIREMENTS */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-slate-300">
                Raw Project Requirements{" "}
                <span className="text-blue-400">*</span>
              </label>
              <div className="flex items-center gap-2">
                <ClearButton
                  onClear={() => setRequirements("")}
                  disabled={!requirements}
                  label="project requirements"
                />
                <div className="flex bg-slate-800 rounded p-0.5 text-xs">
                  <button
                    onClick={() => setRequirementsMode("text")}
                    className={`px-2 py-1 rounded ${requirementsMode === "text" ? "bg-blue-600 text-white" : "text-slate-400"}`}
                  >
                    Text
                  </button>
                  <button
                    onClick={() => setRequirementsMode("file")}
                    className={`px-2 py-1 rounded ${requirementsMode === "file" ? "bg-blue-600 text-white" : "text-slate-400"}`}
                  >
                    File
                  </button>
                </div>
              </div>
            </div>
            {requirementsMode === "text" ? (
              <textarea
                rows={8}
                value={requirements}
                onChange={(e) => setRequirements(e.target.value)}
                placeholder="Paste full project details, scope, user stories, feature requests..."
                className="w-full bg-slate-900 border border-slate-800 rounded-lg p-3 text-xs font-mono text-slate-300 focus:outline-none focus:border-blue-500 resize-y"
              />
            ) : (
              <input
                type="file"
                accept=".txt,.md,.json"
                onChange={(e) => handleFileUpload(e, setRequirements)}
                className="w-full text-xs text-slate-400 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-slate-800 file:text-slate-200 hover:file:bg-slate-700"
              />
            )}
          </div>

          {/* ADDITIONAL REQUIREMENTS */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-slate-300">
                Additional Constraints
              </label>
              <div className="flex items-center gap-2">
                <ClearButton
                  onClear={() => setAdditional("")}
                  disabled={!additional}
                  label="additional constraints"
                />
                <div className="flex bg-slate-800 rounded p-0.5 text-xs">
                  <button
                    onClick={() => setAdditionalMode("text")}
                    className={`px-2 py-1 rounded ${additionalMode === "text" ? "bg-blue-600 text-white" : "text-slate-400"}`}
                  >
                    Text
                  </button>
                  <button
                    onClick={() => setAdditionalMode("file")}
                    className={`px-2 py-1 rounded ${additionalMode === "file" ? "bg-blue-600 text-white" : "text-slate-400"}`}
                  >
                    File
                  </button>
                </div>
              </div>
            </div>
            {additionalMode === "text" ? (
              <textarea
                rows={8}
                value={additional}
                onChange={(e) => setAdditional(e.target.value)}
                placeholder="Deadlines, tech stack bounds, security standard compliance, budget rules..."
                className="w-full bg-slate-900 border border-slate-800 rounded-lg p-3 text-xs font-mono text-slate-300 focus:outline-none focus:border-blue-500 resize-y"
              />
            ) : (
              <input
                type="file"
                accept=".txt,.md,.json"
                onChange={(e) => handleFileUpload(e, setAdditional)}
                className="w-full text-xs text-slate-400 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-slate-800 file:text-slate-200 hover:file:bg-slate-700"
              />
            )}
          </div>

          {/* SDD METHODOLOGY (OPTIONAL) */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-slate-300">
                SDD Methodology{" "}
                <span className="text-slate-500">(Optional)</span>
              </label>
              <div className="flex items-center gap-2">
                <ClearButton
                  onClear={() => setMethodology("")}
                  disabled={!methodology}
                  label="SDD methodology"
                />
                <div className="flex bg-slate-800 rounded p-0.5 text-xs">
                  <button
                    onClick={() => setMethodologyMode("text")}
                    className={`px-2 py-1 rounded ${methodologyMode === "text" ? "bg-blue-600 text-white" : "text-slate-400"}`}
                  >
                    Text
                  </button>
                  <button
                    onClick={() => setMethodologyMode("file")}
                    className={`px-2 py-1 rounded ${methodologyMode === "file" ? "bg-blue-600 text-white" : "text-slate-400"}`}
                  >
                    File
                  </button>
                </div>
              </div>
            </div>
            <p className="text-xs text-slate-500">
              Describe how the generated SOW is consumed by your SDD framework
              (required sections, ID formats, traceability). It is injected into
              the system prompt.
            </p>
            {methodologyMode === "text" ? (
              <textarea
                rows={6}
                value={methodology}
                onChange={(e) => setMethodology(e.target.value)}
                placeholder="Paste your SDD methodology document..."
                className="w-full bg-slate-900 border border-slate-800 rounded-lg p-3 text-xs font-mono text-slate-300 focus:outline-none focus:border-blue-500 resize-y"
              />
            ) : (
              <input
                type="file"
                accept=".txt,.md,.json"
                onChange={(e) => handleFileUpload(e, setMethodology)}
                className="w-full text-xs text-slate-400 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-slate-800 file:text-slate-200 hover:file:bg-slate-700"
              />
            )}
            {methodology && (
              <p className="text-xs text-slate-500 text-right">
                {methodology.length.toLocaleString()} characters (~
                {Math.ceil(methodology.length / 4).toLocaleString()} tokens)
                added to each request
              </p>
            )}
          </div>

          {/* SDD SYSTEM PROMPT CONFIG (ADVANCED) */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
            <button
              onClick={() => setShowPromptConfig(!showPromptConfig)}
              className="w-full px-4 py-3 flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-slate-400 hover:text-slate-200 hover:bg-slate-800/50 transition-colors"
            >
              <div className="flex items-center gap-2">
                <Terminal className="w-4 h-4 text-purple-400" />
                <span>SDD System Prompt Config (Advanced)</span>
              </div>
              {showPromptConfig ? (
                <ChevronUp className="w-4 h-4" />
              ) : (
                <ChevronDown className="w-4 h-4" />
              )}
            </button>

            {showPromptConfig && (
              <div className="p-4 border-t border-slate-800 bg-slate-950/60 space-y-2">
                <div className="flex items-start justify-between gap-3">
                  <p className="text-xs text-slate-400">
                    This system instruction enforces zero ambiguity and formats
                    output strictly for SDD pipelines. Leave empty to use the
                    provider's built-in prompt.
                  </p>
                  <button
                    onClick={() => setSystemPrompt(DEFAULT_SDD_SYSTEM_PROMPT)}
                    disabled={systemPrompt === DEFAULT_SDD_SYSTEM_PROMPT}
                    className="shrink-0 flex items-center gap-1 px-2 py-1 text-xs text-slate-300 bg-slate-800 hover:bg-slate-700 disabled:opacity-40 rounded border border-slate-700 transition-colors"
                    title="Restore the default SDD system prompt"
                  >
                    <RotateCcw className="w-3 h-3" />
                    <span>Reset</span>
                  </button>
                </div>
                <textarea
                  rows={8}
                  value={systemPrompt}
                  onChange={(e) => setSystemPrompt(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-xs font-mono text-purple-300 focus:outline-none focus:border-purple-500 resize-y"
                />
              </div>
            )}
          </div>

          {/* ERROR ALERT */}
          {error && (
            <div className="p-3 bg-red-950/50 border border-red-800 text-red-300 text-sm rounded-lg">
              {error}
            </div>
          )}
        </div>

        {/* ANALYZE & GENERATE BUTTONS */}
        <div className="p-4 border-t border-slate-800 bg-slate-900 space-y-2">
          <div className="flex gap-2">
            <button
              onClick={handleAnalyze}
              disabled={isBusy}
              className="flex-1 py-3 px-4 bg-slate-800 hover:bg-slate-700 border border-slate-700 disabled:opacity-50 text-slate-100 font-semibold rounded-lg flex items-center justify-center gap-2 transition-colors"
              title="Find missing details, ambiguities and blockers before writing the SOW"
            >
              {isAnalyzing ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Analyzing...</span>
                </>
              ) : (
                <>
                  <SearchCheck className="w-4 h-4 text-cyan-300" />
                  <span>1. Analyze Inputs</span>
                </>
              )}
            </button>
            <button
              onClick={handleGenerate}
              disabled={isBusy}
              className="flex-1 py-3 px-4 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-semibold rounded-lg shadow-lg flex items-center justify-center gap-2 transition-colors"
            >
              {isLoading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>
                    Generating with {selectedProvider.toUpperCase()}...
                  </span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>2. Create SOW</span>
                </>
              )}
            </button>
          </div>
          {isBusy && (
            <button
              onClick={handleCancel}
              className="w-full py-1.5 text-xs text-slate-300 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg transition-colors"
            >
              Cancel {isAnalyzing ? "analysis" : "generation"}
            </button>
          )}
          <p className="text-[11px] text-slate-500 text-center">
            {clarifications.length > 0
              ? `${clarifications.length} clarification question(s) will be sent with the SOW request${unresolvedBlocking ? ` — ${unresolvedBlocking} blocking still unanswered` : ""}.`
              : "Analyze first to answer open questions, or create the SOW directly."}
          </p>
        </div>
      </div>

      {/* RIGHT COLUMN: OUTPUT PREVIEW */}
      <div className="w-3/5 flex flex-col h-full bg-slate-950">
        <header className="p-4 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3 bg-slate-900/50">
          <div className="flex flex-wrap gap-1 bg-slate-800 p-1 rounded-lg border border-slate-700 text-xs font-medium">
            <button
              onClick={() => setActiveTab("clarify")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md transition-colors ${activeTab === "clarify" ? "bg-blue-600 text-white" : "text-slate-400 hover:text-slate-200"}`}
            >
              <ListChecks className="w-3.5 h-3.5 text-cyan-300" />
              <span>Clarifications</span>
              {clarifications.length > 0 && (
                <span
                  className={`px-1.5 rounded-full text-[10px] font-bold ${unresolvedBlocking ? "bg-red-500/20 text-red-300" : "bg-emerald-500/20 text-emerald-300"}`}
                  title={
                    unresolvedBlocking
                      ? `${unresolvedBlocking} blocking question(s) unanswered`
                      : "No unanswered blocking questions"
                  }
                >
                  {unresolvedBlocking || clarifications.length}
                </span>
              )}
            </button>
            <button
              onClick={() => setActiveTab("preview")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md transition-colors ${activeTab === "preview" ? "bg-blue-600 text-white" : "text-slate-400 hover:text-slate-200"}`}
            >
              <Eye className="w-3.5 h-3.5" />
              <span>Rendered Preview</span>
            </button>
            <button
              onClick={() => setActiveTab("code")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md transition-colors ${activeTab === "code" ? "bg-blue-600 text-white" : "text-slate-400 hover:text-slate-200"}`}
            >
              <Code className="w-3.5 h-3.5" />
              <span>Raw Markdown</span>
            </button>
            <button
              onClick={() => setActiveTab("audit")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md transition-colors ${activeTab === "audit" ? "bg-blue-600 text-white" : "text-slate-400 hover:text-slate-200"}`}
            >
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>SDD Audit</span>
              <span
                className={`px-1.5 rounded-full text-[10px] font-bold ${
                  auditTone === "emerald"
                    ? "bg-emerald-500/20 text-emerald-300"
                    : auditTone === "red"
                      ? "bg-red-500/20 text-red-300"
                      : "bg-amber-500/20 text-amber-300"
                }`}
              >
                {auditResults.score}%
              </span>
            </button>
          </div>

          {/* ACTION BUTTONS */}
          <div className="flex items-center gap-2">
            <button
              onClick={handleCopy}
              disabled={!sowOutput}
              className="p-2 text-slate-400 hover:text-slate-200 bg-slate-800 hover:bg-slate-700 disabled:opacity-40 rounded-lg transition-colors flex items-center gap-1.5 text-xs"
              title="Copy Markdown"
            >
              {copied ? (
                <Check className="w-4 h-4 text-green-400" />
              ) : (
                <Copy className="w-4 h-4" />
              )}
              <span>{copied ? "Copied" : "Copy"}</span>
            </button>

            <button
              onClick={handleDownload}
              disabled={!sowOutput}
              className="px-3 py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-40 text-white rounded-lg transition-colors flex items-center gap-1.5 text-xs font-medium"
            >
              <Download className="w-4 h-4" />
              <span>Download .md</span>
            </button>
          </div>
        </header>

        {/* TAB CONTENTS */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* TAB 0: CLARIFICATIONS */}
          {activeTab === "clarify" && (
            <ClarificationsPanel
              clarifications={clarifications}
              features={features}
              isAnalyzing={isAnalyzing}
              isGenerating={isLoading}
              inputsChanged={
                clarifications.length > 0 && analyzedInputs !== currentInputs
              }
              onUpdate={handleUpdateClarification}
              onReanalyze={handleAnalyze}
              onGenerate={handleGenerate}
              onClearAnswers={handleClearAnswers}
            />
          )}

          {/* TAB 1: RENDERED PREVIEW */}
          {activeTab === "preview" && isLoading && (
            <GenerationProgressPanel
              progress={progress}
              onCancel={handleCancel}
            />
          )}
          {activeTab === "preview" && !isLoading && warnings.length > 0 && (
            <div className="max-w-4xl mx-auto mb-4 p-3 bg-amber-950/40 border border-amber-800/60 rounded-lg text-xs text-amber-200 space-y-1">
              {warnings.map((w) => (
                <p key={w} className="flex items-start gap-1.5">
                  <span aria-hidden>⚠️</span>
                  <span>{w}</span>
                </p>
              ))}
            </div>
          )}
          {activeTab === "preview" &&
            !isLoading &&
            (sowOutput ? (
              <div className="max-w-4xl mx-auto bg-slate-900/80 border border-slate-800 p-8 rounded-xl shadow-inner">
                <ReactMarkdown
                  remarkPlugins={[remarkGfm]}
                  components={markdownComponents}
                >
                  {sowOutput}
                </ReactMarkdown>
              </div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-slate-600 space-y-3">
                <FileText className="w-12 h-12 opacity-30" />
                <p className="text-sm">
                  Provide inputs and click "Create SOW" to preview result...
                </p>
              </div>
            ))}

          {/* TAB 2: RAW MARKDOWN EDITOR */}
          {activeTab === "code" && (
            <div className="h-full flex flex-col gap-2">
              <div className="text-xs text-slate-400 flex items-center justify-between px-1">
                <span>Directly edit raw markdown if needed before export:</span>
                <span>{sowOutput.length} characters</span>
              </div>
              <textarea
                value={sowOutput}
                onChange={(e) => setSowOutput(e.target.value)}
                placeholder="Generated markdown will appear here..."
                className="flex-1 w-full bg-slate-900 border border-slate-800 rounded-xl p-5 text-xs font-mono text-slate-200 leading-relaxed focus:outline-none focus:border-blue-500 resize-none"
              />
            </div>
          )}

          {/* TAB 3: SDD READINESS AUDIT */}
          {activeTab === "audit" && (
            <div className="max-w-3xl mx-auto space-y-6">
              {/* Score Summary */}
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 flex flex-col md:flex-row items-center justify-between gap-6">
                <div className="flex items-center gap-4">
                  <div
                    className={`w-20 h-20 shrink-0 rounded-full flex items-center justify-center border-4 font-black text-xl ${
                      auditTone === "emerald"
                        ? "border-emerald-500 bg-emerald-950/40 text-emerald-400"
                        : auditTone === "red"
                          ? "border-red-500 bg-red-950/40 text-red-400"
                          : "border-amber-500 bg-amber-950/40 text-amber-400"
                    }`}
                  >
                    {auditResults.score}%
                  </div>
                  <div>
                    <h3 className="font-bold text-lg text-white">
                      Spec-Driven Readiness Index
                    </h3>
                    <p className="text-xs text-slate-400 mt-1 max-w-md">
                      {auditResults.summary}
                    </p>
                  </div>
                </div>
                <div className="text-right border-t md:border-t-0 md:border-l border-slate-800 pt-4 md:pt-0 md:pl-6 w-full md:w-auto">
                  <span className="text-xs text-slate-400 block uppercase font-medium">
                    Status
                  </span>
                  <span
                    className={`text-sm font-bold ${
                      auditTone === "emerald"
                        ? "text-emerald-400"
                        : auditTone === "red"
                          ? "text-red-400"
                          : "text-amber-400"
                    }`}
                  >
                    {auditPassed
                      ? "PASSED FOR SDD"
                      : auditResults.blocked
                        ? "BLOCKED — OPEN QUESTIONS"
                        : "NEEDS SPEC REFINEMENT"}
                  </span>
                </div>
              </div>

              {/* Checklist */}
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
                <h4 className="text-sm font-bold text-slate-200 uppercase tracking-wider mb-2 flex items-center gap-2">
                  <CheckSquare className="w-4 h-4 text-blue-400" />
                  <span>Compliance Verification Checklist</span>
                </h4>
                {auditResults.metrics.length === 0 ? (
                  <p className="text-xs text-slate-500 py-3">
                    Generate a SOW to run the audit.
                  </p>
                ) : (
                  <div className="divide-y divide-slate-800">
                    {auditResults.metrics.map((item) => (
                      <div
                        key={item.title}
                        className="py-3.5 flex items-start justify-between gap-4"
                      >
                        <div className="flex items-start gap-3">
                          {item.passed ? (
                            <CheckCircle className="w-5 h-5 text-emerald-400 mt-0.5 shrink-0" />
                          ) : (
                            <AlertTriangle className="w-5 h-5 text-amber-400 mt-0.5 shrink-0" />
                          )}
                          <div>
                            <p className="text-sm font-semibold text-slate-200">
                              {item.title}
                            </p>
                            <p className="text-xs text-slate-400 mt-0.5">
                              {item.description}
                            </p>
                          </div>
                        </div>
                        <span
                          className={`shrink-0 text-xs font-semibold px-2.5 py-1 rounded-full border ${
                            item.passed
                              ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                              : "bg-amber-500/10 text-amber-400 border-amber-500/20"
                          }`}
                        >
                          {item.passed ? `+${item.weight} PTS` : "0 PTS"}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Guidance */}
              <div className="bg-blue-950/30 border border-blue-800/40 rounded-2xl p-5 text-xs space-y-2">
                <span className="font-bold text-blue-300 block">
                  Why SDD Spec Quality Matters:
                </span>
                <p className="text-slate-300 leading-relaxed">
                  In Spec-Driven Development, code generation tools and
                  automated agents ingest this SOW directly to produce API
                  interfaces, backend routes, and database migrations. Any
                  unstated assumption leads to architectural drift. Ensure all
                  out-of-scope items and latency targets are explicitly
                  declared.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
