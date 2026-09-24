// src/components/GenerationProgressPanel.tsx
import {
  AlertTriangle,
  CheckCircle,
  Circle,
  RefreshCw,
  XCircle,
} from "lucide-react";
import React from "react";
import type { FeaturePassStatus, GenerationProgress } from "../types/sow";

interface GenerationProgressPanelProps {
  progress: GenerationProgress | null;
  onCancel: () => void;
}

type StepState = "pending" | "running" | "done";

const STAGE_ORDER: GenerationProgress["stage"][] = [
  "outline",
  "features",
  "assembly",
  "done",
];

function StepIcon({
  state,
}: {
  state: StepState | FeaturePassStatus;
}): React.JSX.Element {
  switch (state) {
    case "running":
      return <RefreshCw className="w-4 h-4 text-blue-400 animate-spin" />;
    case "done":
      return <CheckCircle className="w-4 h-4 text-emerald-400" />;
    case "truncated":
      return <AlertTriangle className="w-4 h-4 text-amber-400" />;
    case "failed":
      return <XCircle className="w-4 h-4 text-red-400" />;
    default:
      return <Circle className="w-4 h-4 text-slate-600" />;
  }
}

export default function GenerationProgressPanel({
  progress,
  onCancel,
}: GenerationProgressPanelProps): React.JSX.Element {
  // Single-pass generation has no stages to report
  if (!progress) {
    return (
      <div className="h-full flex flex-col items-center justify-center gap-4 text-slate-400">
        <RefreshCw className="w-8 h-8 animate-spin text-blue-400" />
        <p className="text-sm">Generating the SOW in a single pass...</p>
        <button
          onClick={onCancel}
          className="px-3 py-1.5 text-xs text-slate-300 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg"
        >
          Cancel
        </button>
      </div>
    );
  }

  const current = STAGE_ORDER.indexOf(progress.stage);
  const stepState = (stage: GenerationProgress["stage"]): StepState => {
    const index = STAGE_ORDER.indexOf(stage);
    return index < current ? "done" : index === current ? "running" : "pending";
  };
  const doneCount = progress.features.filter(
    (f) => f.status !== "pending" && f.status !== "running",
  ).length;

  return (
    <div className="max-w-xl mx-auto bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-5">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h3 className="font-semibold text-slate-100">
            Multi-pass SOW generation
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Outline, then one deep spec per feature, then the remaining SOW
            sections.
          </p>
        </div>
        <button
          onClick={onCancel}
          className="shrink-0 px-3 py-1.5 text-xs text-slate-300 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg"
        >
          Cancel
        </button>
      </div>

      <ol className="space-y-3 text-sm">
        <li className="flex items-center gap-2.5">
          <StepIcon state={stepState("outline")} />
          <span className="text-slate-200">
            1. Outline — features and shared data entities
          </span>
        </li>

        <li className="space-y-2">
          <div className="flex items-center gap-2.5">
            <StepIcon state={stepState("features")} />
            <span className="text-slate-200">
              2. Feature specifications
              {progress.features.length > 0 && (
                <span className="text-slate-400">
                  {" "}
                  ({doneCount}/{progress.features.length})
                </span>
              )}
            </span>
          </div>
          {progress.features.length > 0 && (
            <ul className="ml-6 space-y-1.5 border-l border-slate-800 pl-4">
              {progress.features.map((f) => (
                <li
                  key={f.slug}
                  className="flex items-center gap-2 text-xs text-slate-300"
                >
                  <StepIcon state={f.status} />
                  <span>{f.name}</span>
                  <code className="text-cyan-400/70 font-mono">{f.slug}</code>
                  {f.status === "truncated" && (
                    <span className="text-amber-400">(hit output limit)</span>
                  )}
                  {f.status === "failed" && (
                    <span className="text-red-400">(failed)</span>
                  )}
                </li>
              ))}
            </ul>
          )}
        </li>

        <li className="flex items-center gap-2.5">
          <StepIcon state={stepState("assembly")} />
          <span className="text-slate-200">
            3. Assembly — index, register, traceability, commercial sections
          </span>
        </li>
      </ol>
    </div>
  );
}
