// src/utils/markdown.ts

// Matches an opening fence line such as ```markdown, ```md or a bare ```
const OPENING_FENCE = /^[ \t]*(`{3,}|~{3,})[ \t]*(markdown|md)?[ \t]*$/im;

/**
 * LLMs often wrap the whole document in a ```markdown ... ``` code fence
 * (sometimes with a short intro line before it). ReactMarkdown then renders
 * the entire SOW as a single code block, so unwrap it back to plain markdown.
 * Inner code blocks (e.g. ```json examples) are preserved.
 */
export const unwrapMarkdownFence = (text: string): string => {
  const trimmed = text.trim();
  const match = OPENING_FENCE.exec(trimmed);
  if (!match) return trimmed;

  const fence = match[1];
  const isLabelled = Boolean(match[2]);
  const before = trimmed.slice(0, match.index).trim();

  // Only unwrap a bare ``` fence when it opens the response; a labelled
  // ```markdown fence may follow a short conversational preamble.
  if (!isLabelled && before) return trimmed;
  if (before.split("\n").length > 3) return trimmed;

  const body = trimmed.slice(match.index + match[0].length);
  const closingIdx = body.lastIndexOf(fence);
  if (closingIdx === -1) return body.trim();

  // Anything after the closing fence must be trivial (e.g. an outro line)
  const after = body.slice(closingIdx + fence.length).trim();
  if (after.split("\n").length > 3) return trimmed;

  return body.slice(0, closingIdx).trim();
};
