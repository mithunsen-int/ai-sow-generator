// src/components/TokenUsageBar.tsx
import { ChevronDown, ChevronUp, Coins, RefreshCw } from "lucide-react";
import React, { useMemo, useState } from "react";
import type { LoggedUsage, TokenUsage } from "../types/sow";

interface TokenUsageBarProps {
  log: LoggedUsage[];
  currentRunId: number;
  currentRunName: string;
  isRunning: boolean;
  onReset: () => void;
}

const sum = (events: TokenUsage[]): TokenUsage =>
  events.reduce(
    (acc, e) => ({
      inputTokens: acc.inputTokens + e.inputTokens,
      cachedInputTokens: acc.cachedInputTokens + e.cachedInputTokens,
      outputTokens: acc.outputTokens + e.outputTokens,
    }),
    { inputTokens: 0, cachedInputTokens: 0, outputTokens: 0 },
  );

const compact = (n: number): string =>
  n >= 1_000_000
    ? `${(n / 1_000_000).toFixed(2)}M`
    : n >= 1_000
      ? `${(n / 1_000).toFixed(1)}k`
      : String(n);

export default function TokenUsageBar({
  log,
  currentRunId,
  currentRunName,
  isRunning,
  onReset,
}: TokenUsageBarProps): React.JSX.Element {
  const [expanded, setExpanded] = useState<boolean>(false);

  const runEvents = useMemo(
    () => log.filter((e) => e.runId === currentRunId),
    [log, currentRunId],
  );
  const run = useMemo(() => sum(runEvents), [runEvents]);
  const session = useMemo(() => sum(log), [log]);

  return (
    <div className="border-b border-slate-800 bg-slate-900/30 text-xs">
      <div className="px-4 py-2 flex flex-wrap items-center justify-between gap-x-4 gap-y-1">
        <div className="flex items-center gap-1.5 text-slate-300">
          <Coins className="w-3.5 h-3.5 text-amber-400" />
          {currentRunName ? (
            <>
              <span className="text-slate-400">{currentRunName}:</span>
              <span className="font-semibold text-slate-100">
                {compact(run.inputTokens + run.outputTokens)}
              </span>
              <span className="text-slate-500">
                (in {compact(run.inputTokens)} · out {compact(run.outputTokens)}{" "}
                · {runEvents.length} request
                {runEvents.length === 1 ? "" : "s"})
              </span>
              {isRunning && (
                <RefreshCw className="w-3 h-3 text-blue-400 animate-spin" />
              )}
            </>
          ) : (
            <span className="text-slate-500">No requests yet</span>
          )}
        </div>

        <div className="flex items-center gap-3 text-slate-400">
          <span>
            Session total:{" "}
            <span className="font-semibold text-slate-200">
              {compact(session.inputTokens + session.outputTokens)}
            </span>{" "}
            <span className="text-slate-500">({log.length} requests)</span>
          </span>
          <button
            onClick={() => setExpanded(!expanded)}
            disabled={log.length === 0}
            className="flex items-center gap-0.5 text-cyan-400 hover:text-cyan-300 disabled:opacity-40 disabled:hover:text-cyan-400"
          >
            Details
            {expanded ? (
              <ChevronUp className="w-3.5 h-3.5" />
            ) : (
              <ChevronDown className="w-3.5 h-3.5" />
            )}
          </button>
        </div>
      </div>

      {expanded && log.length > 0 && (
        <div className="px-4 pb-3 space-y-2">
          <div className="max-h-56 overflow-auto rounded-lg border border-slate-800">
            <table className="w-full text-left text-[11px] text-slate-300">
              <thead className="bg-slate-800/80 text-slate-400 sticky top-0">
                <tr>
                  <th className="px-3 py-1.5 font-medium">
                    {currentRunName || "Run"} — request
                  </th>
                  <th className="px-3 py-1.5 font-medium">Model</th>
                  <th className="px-3 py-1.5 font-medium text-right">Input</th>
                  <th className="px-3 py-1.5 font-medium text-right">
                    of which cached
                  </th>
                  <th className="px-3 py-1.5 font-medium text-right">Output</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {runEvents.map((e, i) => (
                  <tr key={i}>
                    <td className="px-3 py-1.5">{e.label}</td>
                    <td className="px-3 py-1.5 text-slate-500 font-mono">
                      {e.model}
                    </td>
                    <td className="px-3 py-1.5 text-right">
                      {e.inputTokens.toLocaleString()}
                    </td>
                    <td className="px-3 py-1.5 text-right text-slate-500">
                      {e.cachedInputTokens.toLocaleString()}
                    </td>
                    <td className="px-3 py-1.5 text-right">
                      {e.outputTokens.toLocaleString()}
                    </td>
                  </tr>
                ))}
                {runEvents.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-3 py-2 text-slate-500">
                      No completed requests in this run yet.
                    </td>
                  </tr>
                )}
              </tbody>
              <tfoot className="bg-slate-900 text-slate-200 font-semibold">
                <tr>
                  <td className="px-3 py-1.5">This run</td>
                  <td />
                  <td className="px-3 py-1.5 text-right">
                    {run.inputTokens.toLocaleString()}
                  </td>
                  <td className="px-3 py-1.5 text-right text-slate-400">
                    {run.cachedInputTokens.toLocaleString()}
                  </td>
                  <td className="px-3 py-1.5 text-right">
                    {run.outputTokens.toLocaleString()}
                  </td>
                </tr>
                <tr>
                  <td className="px-3 py-1.5">Session total</td>
                  <td />
                  <td className="px-3 py-1.5 text-right">
                    {session.inputTokens.toLocaleString()}
                  </td>
                  <td className="px-3 py-1.5 text-right text-slate-400">
                    {session.cachedInputTokens.toLocaleString()}
                  </td>
                  <td className="px-3 py-1.5 text-right">
                    {session.outputTokens.toLocaleString()}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
          <div className="flex items-center justify-between gap-3 text-[11px] text-slate-500">
            <span>
              Counts come from each provider's response and update as each
              request completes. Failed or cancelled requests report nothing.
            </span>
            <button
              onClick={onReset}
              disabled={isRunning}
              className="shrink-0 px-2 py-1 text-slate-300 bg-slate-800 hover:bg-slate-700 disabled:opacity-40 rounded"
            >
              Reset totals
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
