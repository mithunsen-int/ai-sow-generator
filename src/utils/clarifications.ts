// src/utils/clarifications.ts
import type { Clarification, ClarificationQuestion } from "../types/sow";

export const isAnswered = (c: Clarification): boolean =>
  !c.deferred && c.answer.trim().length > 0;

/** Blocking questions with neither an answer nor a decision to leave them open. */
export const countUnresolvedBlocking = (
  clarifications: Clarification[],
): number =>
  clarifications.filter((c) => c.blocking && !isAnswered(c) && !c.deferred)
    .length;

/**
 * Merges a fresh analysis into the existing clarifications:
 * - answered or deferred questions are kept exactly as the user left them;
 * - still-open questions take the latest wording from the new analysis;
 * - new questions are appended;
 * - open questions the new analysis no longer raises are dropped.
 */
export const mergeClarifications = (
  existing: Clarification[],
  incoming: ClarificationQuestion[],
): Clarification[] => {
  const kept = existing.filter((c) => isAnswered(c) || c.deferred);
  const keptIds = new Set(kept.map((c) => c.id));

  const refreshed = incoming
    .filter((q) => !keptIds.has(q.id))
    .map((q) => ({ ...q, answer: "", deferred: false }));

  return [...kept, ...refreshed];
};
