// src/components/ClarificationsPanel.tsx
import {
  AlertTriangle,
  CheckCircle,
  HelpCircle,
  RefreshCw,
  SearchCheck,
  Sparkles,
} from "lucide-react";
import React, { useMemo, useState } from "react";
import type { Clarification, FeatureSummary } from "../types/sow";
import { countUnresolvedBlocking, isAnswered } from "../utils/clarifications";

type Filter = "all" | "unanswered" | "blocking";

interface ClarificationsPanelProps {
  clarifications: Clarification[];
  features: FeatureSummary[];
  isAnalyzing: boolean;
  isGenerating: boolean;
  inputsChanged: boolean;
  onUpdate: (id: string, patch: Partial<Clarification>) => void;
  onReanalyze: () => void;
  onGenerate: () => void;
  onClearAnswers: () => void;
}

export default function ClarificationsPanel({
  clarifications,
  features,
  isAnalyzing,
  isGenerating,
  inputsChanged,
  onUpdate,
  onReanalyze,
  onGenerate,
  onClearAnswers,
}: ClarificationsPanelProps): React.JSX.Element {
  const [filter, setFilter] = useState<Filter>("all");

  const stats = useMemo(
    () => ({
      total: clarifications.length,
      answered: clarifications.filter(isAnswered).length,
      deferred: clarifications.filter((c) => c.deferred).length,
      blockingOpen: clarifications.filter((c) => c.blocking && !isAnswered(c))
        .length,
      unresolvedBlocking: countUnresolvedBlocking(clarifications),
    }),
    [clarifications],
  );

  // Group visible questions by feature, keeping the analysis order
  const groups = useMemo(() => {
    const visible = clarifications.filter((c) =>
      filter === "unanswered"
        ? !isAnswered(c) && !c.deferred
        : filter === "blocking"
          ? c.blocking
          : true,
    );
    const featureName = (slug: string) =>
      slug === "project"
        ? "Project-wide"
        : (features.find((f) => f.slug === slug)?.name ?? slug);

    const map = new Map<string, Clarification[]>();
    visible.forEach((c) => {
      map.set(c.feature, [...(map.get(c.feature) ?? []), c]);
    });
    return [...map.entries()].map(([slug, items]) => ({
      slug,
      name: featureName(slug),
      items,
    }));
  }, [clarifications, features, filter]);

  if (isAnalyzing && clarifications.length === 0) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-slate-400 gap-3">
        <RefreshCw className="w-8 h-8 animate-spin text-blue-400" />
        <p className="text-sm">
          Analyzing inputs for gaps, ambiguities and blockers...
        </p>
      </div>
    );
  }

  if (clarifications.length === 0) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-slate-500 gap-3 text-center px-6">
        <SearchCheck className="w-12 h-12 opacity-40" />
        <p className="text-sm max-w-md">
          Click{" "}
          <span className="text-slate-300 font-medium">Analyze Inputs</span> to
          find missing details, ambiguities and blockers before writing the SOW.
          Answer the questions here, then generate — the SOW will use your
          answers instead of assumptions.
        </p>
      </div>
    );
  }

  const filterButton = (value: Filter, label: string) => (
    <button
      onClick={() => setFilter(value)}
      className={`px-2.5 py-1 rounded-md transition-colors ${filter === value ? "bg-blue-600 text-white" : "text-slate-400 hover:text-slate-200"}`}
    >
      {label}
    </button>
  );

  return (
    <div className="max-w-4xl mx-auto space-y-5">
      {/* SUMMARY */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap gap-4 text-xs">
            <span className="text-slate-300">
              <span className="font-bold text-white">{stats.total}</span>{" "}
              questions
            </span>
            <span className="text-red-300">
              <span className="font-bold">{stats.blockingOpen}</span> blocking
              unanswered
            </span>
            <span className="text-emerald-300">
              <span className="font-bold">{stats.answered}</span> answered
            </span>
            <span className="text-amber-300">
              <span className="font-bold">{stats.deferred}</span> left open
            </span>
          </div>
          <div className="flex bg-slate-800 p-0.5 rounded-lg border border-slate-700 text-xs">
            {filterButton("all", "All")}
            {filterButton("unanswered", "Needs answer")}
            {filterButton("blocking", "Blocking")}
          </div>
        </div>

        {inputsChanged && (
          <p className="text-xs text-amber-300 flex items-center gap-1.5">
            <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
            Inputs changed since the last analysis — re-analyze to refresh the
            questions.
          </p>
        )}
      </div>

      {/* QUESTIONS, GROUPED BY FEATURE */}
      {groups.length === 0 && (
        <p className="text-center text-sm text-slate-500 py-8">
          No questions match this filter.
        </p>
      )}
      {groups.map((group) => (
        <section key={group.slug} className="space-y-3">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-2">
            <span>{group.name}</span>
            {group.slug !== "project" && (
              <code className="normal-case tracking-normal font-mono text-cyan-400/80">
                {group.slug}
              </code>
            )}
          </h3>

          {group.items.map((c) => {
            const answered = isAnswered(c);
            return (
              <div
                key={c.id}
                className={`bg-slate-900 border rounded-xl p-4 space-y-3 ${
                  answered
                    ? "border-emerald-800/60"
                    : c.deferred
                      ? "border-amber-800/60"
                      : c.blocking
                        ? "border-red-900/70"
                        : "border-slate-800"
                }`}
              >
                <div className="flex flex-wrap items-center gap-2 text-[11px]">
                  <code className="px-1.5 py-0.5 rounded bg-slate-800 text-cyan-300 font-mono">
                    {c.id}
                  </code>
                  <span
                    className={`px-2 py-0.5 rounded-full border font-semibold ${
                      c.blocking
                        ? "bg-red-500/10 text-red-300 border-red-500/30"
                        : "bg-slate-800 text-slate-400 border-slate-700"
                    }`}
                  >
                    {c.blocking ? "Blocking" : "Non-blocking"}
                  </span>
                  {answered && (
                    <span className="flex items-center gap-1 text-emerald-400">
                      <CheckCircle className="w-3.5 h-3.5" /> Answered
                    </span>
                  )}
                  {c.deferred && (
                    <span className="flex items-center gap-1 text-amber-400">
                      <HelpCircle className="w-3.5 h-3.5" /> Left open
                    </span>
                  )}
                </div>

                <div>
                  <p className="text-sm text-slate-100">{c.question}</p>
                  {c.whyItMatters && (
                    <p className="text-xs text-slate-400 mt-1">
                      <span className="text-slate-500">Why it matters:</span>{" "}
                      {c.whyItMatters}
                    </p>
                  )}
                </div>

                {c.options.length > 0 && !c.deferred && (
                  <div className="flex flex-wrap gap-1.5">
                    {c.options.map((option) => (
                      <button
                        key={option}
                        type="button"
                        onClick={() => onUpdate(c.id, { answer: option })}
                        className={`px-2 py-1 text-xs rounded-md border transition-colors ${
                          c.answer === option
                            ? "bg-blue-600 border-blue-500 text-white"
                            : "bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700"
                        }`}
                      >
                        {option}
                      </button>
                    ))}
                  </div>
                )}

                <textarea
                  rows={2}
                  value={c.answer}
                  disabled={c.deferred}
                  onChange={(e) => onUpdate(c.id, { answer: e.target.value })}
                  placeholder={
                    c.deferred
                      ? "Left open — will appear in the SOW's Open Questions register."
                      : "Type the answer, or pick an option above..."
                  }
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs text-slate-200 focus:outline-none focus:border-blue-500 resize-y disabled:opacity-50"
                />

                <label className="flex items-center gap-2 text-xs text-slate-400 cursor-pointer w-fit">
                  <input
                    type="checkbox"
                    checked={c.deferred}
                    onChange={(e) =>
                      onUpdate(c.id, { deferred: e.target.checked })
                    }
                    className="accent-amber-500"
                  />
                  <span>Leave open (keep in the SOW as an open question)</span>
                </label>
              </div>
            );
          })}
        </section>
      ))}

      {/* ACTIONS */}
      <div className="sticky bottom-0 bg-slate-950/95 backdrop-blur border-t border-slate-800 -mx-6 px-6 py-4 space-y-3">
        {stats.unresolvedBlocking > 0 && (
          <p className="text-xs text-red-300 flex items-center gap-1.5">
            <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
            {stats.unresolvedBlocking} blocking question
            {stats.unresolvedBlocking === 1 ? " has" : "s have"} no answer. You
            can still generate — they will be kept as blockers in the SOW.
          </p>
        )}
        <div className="flex flex-wrap items-center justify-end gap-2">
          <button
            onClick={onClearAnswers}
            disabled={stats.answered + stats.deferred === 0}
            className="px-3 py-2 text-xs text-slate-400 hover:text-slate-200 bg-slate-800 hover:bg-slate-700 disabled:opacity-40 rounded-lg transition-colors"
          >
            Clear answers
          </button>
          <button
            onClick={onReanalyze}
            disabled={isAnalyzing || isGenerating}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-200 bg-slate-800 hover:bg-slate-700 border border-slate-700 disabled:opacity-40 rounded-lg transition-colors"
            title="Run the analysis again with your answers, to catch follow-up questions"
          >
            <RefreshCw
              className={`w-3.5 h-3.5 ${isAnalyzing ? "animate-spin" : ""}`}
            />
            <span>
              {isAnalyzing ? "Re-analyzing..." : "Re-analyze with answers"}
            </span>
          </button>
          <button
            onClick={onGenerate}
            disabled={isAnalyzing || isGenerating}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-500 disabled:opacity-40 rounded-lg transition-colors"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>
              {isGenerating ? "Generating..." : "Generate SOW with answers"}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}
