// src/services/multiPass.ts
// Multi-pass SOW generation: outline -> one deep spec per feature -> assembly.
// Splitting the work keeps every response well inside the model's output
// limit and stops spec depth from fading out on later features.

import type {
  FeatureSummary,
  GenerateSOWParams,
  GenerationProgress,
  GenerationResult,
} from "../types/sow";
import { unwrapMarkdownFence } from "../utils/markdown";
import {
  SYSTEM_PROMPT,
  asString,
  buildInputsPrompt,
  buildSystemPrompt,
  callModel,
  extractJsonObject,
} from "./aiProvider";

const FEATURE_PLACEHOLDER = "{{FEATURE_SPECIFICATIONS}}";
// Feature passes run in parallel, but capped to stay clear of rate limits
const FEATURE_CONCURRENCY = 3;

const OUTLINE_SYSTEM_PROMPT = `You are a Principal Software Architect planning a Statement of Work (SOW) for Specification-Driven Delivery (SDD).
Produce ONLY the outline that later passes will expand: the list of features and the shared data entities. Do not write specs.

RULES:
1. One feature = one future spec, as the SDD METHODOLOGY defines a spec. Give each an identifier ("slug") following the methodology's identifier rules; if it defines none, use kebab-case, 3–5 words, naming a thing (no verbs), unique.
2. If a KNOWN FEATURES list is provided, reuse those slugs and names exactly; add a feature only if the inputs clearly require one that is missing.
3. Never invent features, entities, or behaviour that the inputs do not state or strictly require.
4. "intent" is one sentence built only from the inputs. "dependsOn" lists slugs of features this one relies on.
5. "sharedEntities" lists every data collection/table the features need, with the single feature that owns (defines) it. Use names consistent with the approved datastore in the constraints.

Return ONLY a JSON object — no prose and no code fence — in exactly this shape:
{
  "features": [{ "slug": "string", "name": "string", "intent": "string", "dependsOn": ["string"] }],
  "sharedEntities": [{ "name": "string", "ownerFeature": "slug", "purpose": "string" }]
}`;

interface OutlineFeature extends FeatureSummary {
  intent: string;
  dependsOn: string[];
}

interface Outline {
  features: OutlineFeature[];
  sharedEntities: { name: string; ownerFeature: string; purpose: string }[];
}

type ProgressCallback = (progress: GenerationProgress) => void;

const parseOutline = (raw: string): Outline => {
  const obj = extractJsonObject(raw, "outline");
  const list = (v: unknown): Record<string, unknown>[] =>
    Array.isArray(v) ? v : [];

  const features = list(obj.features)
    .map((f) => ({
      slug: asString(f.slug),
      name: asString(f.name) || asString(f.slug),
      intent: asString(f.intent),
      dependsOn: Array.isArray(f.dependsOn)
        ? f.dependsOn.filter((d): d is string => typeof d === "string")
        : [],
    }))
    .filter((f) => f.slug);

  if (features.length === 0) {
    throw new Error(
      "The outline pass found no features in the requirements. Check the inputs and try again.",
    );
  }

  const sharedEntities = list(obj.sharedEntities)
    .map((e) => ({
      name: asString(e.name),
      ownerFeature: asString(e.ownerFeature),
      purpose: asString(e.purpose),
    }))
    .filter((e) => e.name);

  return { features, sharedEntities };
};

const featureTask = (
  feature: OutlineFeature,
  index: number,
  total: number,
): string => `=== TASK: FEATURE SPECIFICATION PASS (${index} of ${total}) ===
Write ONLY the complete feature specification block for Feature ${index}: "${feature.name}" (slug: ${feature.slug}), following the per-feature block structure in section 2.2 of the SOW TEMPLATE. Start with the heading "#### Feature ${index}: ${feature.name}".
- Go deep: every business rule, role permission, data field, endpoint, error case, state transition, edge case, acceptance criterion, and unit test this feature needs.
- For collections/tables in the OUTLINE: define the full fields only for entities this feature owns; reference other entities by name and owner slug.
- Reference other features only by slug and ID.
- Apply every zero-assumption rule. Mark each gap inline with ⚠️ <question-id>, using question IDs that follow the SDD METHODOLOGY's identifier rules for this feature (e.g. ${feature.slug}.Q01) or the existing clarification IDs.
- End the block with a sub-section "##### Open Questions" containing a table with columns | ID | Question | Why It Matters | Options (if known) | Blocking | listing every open question this feature raises or depends on. Omit questions answered in CLARIFICATIONS. If there are none, write "None."
- Output only this block: no other SOW sections, no intro or outro, and no code fence around it.`;

const assemblyTask = (): string => `=== TASK: ASSEMBLY PASS ===
Write the COMPLETE SOW following the SOW TEMPLATE, EXCEPT the individual feature blocks of section 2.2 (Feature Specifications). Under the 2.2 heading, output exactly this line on its own and nothing else for that section:
${FEATURE_PLACEHOLDER}
The generated feature blocks above will be inserted there verbatim.
- Build the Feature Index (2.1) from the OUTLINE, taking each feature's status and blocking questions from its generated block.
- Build the Open Questions register by consolidating every feature block's "Open Questions" table plus any project-wide questions (project.Q01, …). Keep IDs unchanged and do not list answered questions.
- Build the traceability matrix only from IDs that actually appear in the generated feature blocks.
- Set the document status using the zero-assumption rules, counting the blocking questions in the register.
- Output only the Markdown SOW with the placeholder line: no intro or outro, and no code fence around it.`;

/** Runs tasks with a concurrency cap, preserving result order. */
const runPool = async <T>(
  count: number,
  limit: number,
  task: (index: number) => Promise<T>,
): Promise<T[]> => {
  const results = new Array<T>(count);
  let next = 0;
  const worker = async () => {
    while (next < count) {
      const index = next++;
      results[index] = await task(index);
    }
  };
  await Promise.all(Array.from({ length: Math.min(limit, count) }, worker));
  return results;
};

/** Inserts the feature blocks at the placeholder, with fallbacks if the model moved it. */
const spliceFeatures = (assembled: string, featureBlocks: string): string => {
  if (assembled.includes(FEATURE_PLACEHOLDER)) {
    return assembled.replace(FEATURE_PLACEHOLDER, featureBlocks);
  }
  const heading = /^###\s+2\.2\b.*$/m.exec(assembled);
  if (heading) {
    const at = heading.index + heading[0].length;
    return `${assembled.slice(0, at)}\n\n${featureBlocks}\n${assembled.slice(at)}`;
  }
  const nextSection = /^##\s+3\b.*$/m.exec(assembled);
  if (nextSection) {
    return `${assembled.slice(0, nextSection.index)}### 2.2 Feature Specifications\n\n${featureBlocks}\n\n---\n\n${assembled.slice(nextSection.index)}`;
  }
  return `${assembled}\n\n### 2.2 Feature Specifications\n\n${featureBlocks}`;
};

const isAbort = (err: unknown): boolean =>
  err instanceof Error &&
  (err.name === "AbortError" || /abort/i.test(err.message));

/**
 * Multi-pass SOW generation. Every call shares the same system prompt and
 * input prefix, with the pass-specific task last, so providers with prompt
 * caching can reuse the prefix across calls.
 */
export async function generateSOWMultiPass(
  params: GenerateSOWParams,
  knownFeatures: FeatureSummary[],
  onProgress: ProgressCallback,
): Promise<GenerationResult> {
  const {
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
  } = params;
  const call = { provider, model, apiKeyOverride, signal };
  const inputs = buildInputsPrompt({
    template,
    requirements,
    additional,
    clarifications,
  });
  const sddSystem = buildSystemPrompt(
    systemPrompt?.trim() || SYSTEM_PROMPT,
    methodology,
  );
  const warnings: string[] = [];

  // Pass 1: outline
  onProgress({ stage: "outline", features: [] });
  const known = knownFeatures.length
    ? `\n\n=== KNOWN FEATURES (reuse these slugs) ===\n${knownFeatures.map((f) => `- ${f.slug}: ${f.name}`).join("\n")}`
    : "";
  const outlineResponse = await callModel({
    ...call,
    system: buildSystemPrompt(OUTLINE_SYSTEM_PROMPT, methodology),
    prompt: inputs + known,
    json: true,
  });
  if (outlineResponse.truncated) {
    throw new Error(
      "The outline pass hit the model's output limit. Try a model with a larger output limit.",
    );
  }
  const outline = parseOutline(outlineResponse.text);
  const outlineText = `=== OUTLINE (features and shared entities for this SOW) ===\n${JSON.stringify(outline, null, 2)}`;

  // Pass 2: one deep spec per feature
  const statuses = outline.features.map((f) => ({
    slug: f.slug,
    name: f.name,
    status: "pending" as GenerationProgress["features"][number]["status"],
  }));
  const report = (stage: GenerationProgress["stage"]) =>
    onProgress({ stage, features: statuses.map((s) => ({ ...s })) });
  report("features");

  const total = outline.features.length;
  const blocks = await runPool(total, FEATURE_CONCURRENCY, async (i) => {
    const feature = outline.features[i];
    statuses[i].status = "running";
    report("features");

    const prompt = `${inputs}\n\n${outlineText}\n\n${featureTask(feature, i + 1, total)}`;
    // One retry covers transient network/API errors; aborts are not retried
    let lastError: unknown;
    for (let attempt = 1; attempt <= 2; attempt++) {
      try {
        const { text, truncated } = await callModel({
          ...call,
          system: sddSystem,
          prompt,
        });
        statuses[i].status = truncated ? "truncated" : "done";
        if (truncated) {
          warnings.push(
            `Feature "${feature.name}" hit the model's output limit and may be incomplete.`,
          );
        }
        report("features");
        return unwrapMarkdownFence(text);
      } catch (err) {
        if (isAbort(err)) throw err;
        lastError = err;
      }
    }

    // Keep going with the other features; this one is flagged in the SOW
    statuses[i].status = "failed";
    report("features");
    const reason =
      lastError instanceof Error ? lastError.message : "unknown error";
    warnings.push(`Feature "${feature.name}" failed: ${reason}`);
    return `#### Feature ${i + 1}: ${feature.name}\n- **Spec ID:** \`${feature.slug}\`\n\n> ⚠️ **Generation failed for this feature** (${reason}). Regenerate the SOW to fill in this spec.`;
  });

  const featureBlocks = blocks.join("\n\n---\n\n");

  // Pass 3: assembly of every non-feature section
  report("assembly");
  const assembly = await callModel({
    ...call,
    system: sddSystem,
    prompt: `${inputs}\n\n${outlineText}\n\n=== GENERATED FEATURE SPECIFICATIONS (already final — do not rewrite) ===\n${featureBlocks}\n\n${assemblyTask()}`,
  });
  if (assembly.truncated) {
    warnings.push(
      "The assembly pass hit the model's output limit; later SOW sections may be incomplete.",
    );
  }

  report("done");
  return {
    markdown: spliceFeatures(unwrapMarkdownFence(assembly.text), featureBlocks),
    warnings,
  };
}
