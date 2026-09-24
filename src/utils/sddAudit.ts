// src/utils/sddAudit.ts
// Heuristic checks that score how ready a SOW is for Spec-Driven Development.

export interface AuditMetric {
  title: string;
  description: string;
  passed: boolean;
  weight: number;
}

export interface AuditResult {
  score: number;
  metrics: AuditMetric[];
  summary: string;
  /** Open blocking questions remain, so the SOW cannot pass Gate 1. */
  blocked: boolean;
  /** Number of details marked "Blocked by <question>". */
  blockedCount: number;
}

// Subjective terms that make a criterion untestable
const VAGUE_TERMS = [
  "as fast as possible",
  "super flexible",
  "user-friendly",
  "user friendly",
  "seamless",
  "intuitive",
  "state-of-the-art",
  "best-in-class",
  "robust",
];

export const auditSow = (sow: string): AuditResult => {
  if (!sow)
    return {
      score: 0,
      metrics: [],
      summary: "No SOW generated yet.",
      blocked: false,
      blockedCount: 0,
    };

  const text = sow.toLowerCase();
  const blockedCount = (sow.match(/blocked by/gi) ?? []).length;
  const blocked = blockedCount > 0 || /draft\s*[—–-]\s*blocked/i.test(sow);

  const metrics: AuditMetric[] = [
    {
      title: "Explicit Scope & Non-Goals Section",
      description: "Contains clear out-of-scope items to prevent scope creep.",
      passed:
        text.includes("out-of-scope") ||
        text.includes("non-goals") ||
        text.includes("out of scope"),
      weight: 10,
    },
    {
      title: "Verifiable Acceptance Criteria Table",
      description:
        "Includes testable criteria in a structured tabular or Given-When-Then format.",
      passed:
        text.includes("|") &&
        (text.includes("acceptance criteria") || text.includes("given")),
      weight: 15,
    },
    {
      title: "Technical Specs & Endpoint Definitions",
      description: "Defines APIs, schemas, or protocols explicitly.",
      passed:
        text.includes("api") ||
        text.includes("endpoint") ||
        text.includes("schema") ||
        text.includes("http"),
      weight: 15,
    },
    {
      title: "Measurable SLAs & Performance Constraints",
      description:
        "Quantifiable benchmarks (e.g. latency, coverage, response times).",
      passed:
        /\d+\s*(ms|s|%|reqs)/.test(text) ||
        text.includes("sla") ||
        text.includes("latency"),
      weight: 10,
    },
    {
      title: "Definition of Ready / Done Checklist",
      description:
        "Explicit list of validation steps for specification completion.",
      passed:
        text.includes("[ ]") ||
        text.includes("[x]") ||
        text.includes("definition of done") ||
        text.includes("definition of ready"),
      weight: 10,
    },
    {
      title: "Absence of Vague Ambiguities",
      description:
        'Avoids subjective words like "flexible", "easy", or "user-friendly".',
      passed: !VAGUE_TERMS.some((term) => text.includes(term)),
      weight: 10,
    },
    {
      title: "Individually IDed Acceptance Criteria",
      description:
        "Each criterion carries a stable ID (e.g. <slug>.AC1) so tasks, tests and UAT can reference it.",
      passed: /\b[a-z0-9-]+\.ac\d+\b/.test(text) || /\bac-?\d+\b/.test(text),
      weight: 10,
    },
    {
      title: "Open Questions Register",
      description:
        "Gaps are listed as questions instead of being silently assumed.",
      passed:
        text.includes("open questions") ||
        text.includes("blockers") ||
        text.includes("ambiguities"),
      weight: 5,
    },
    {
      title: "No Unresolved Blocking Questions",
      description: blocked
        ? `${blockedCount || "Some"} detail(s) are blocked by open questions — answer them in Clarifications and regenerate.`
        : "No acceptance criteria or specs are blocked by open questions.",
      passed: !blocked,
      weight: 15,
    },
  ];

  const score = metrics.reduce((acc, m) => acc + (m.passed ? m.weight : 0), 0);

  return {
    score,
    metrics,
    summary: blocked
      ? "Blocked: the SOW is well structured where specified, but open blocking questions must be answered before Gate 1."
      : score >= 80
        ? "High SDD Compliance: SOW is ready for specification parsing and automated task breakdown."
        : "Medium/Low Compliance: Add more measurable constraints or explicit acceptance criteria.",
    blocked,
    blockedCount,
  };
};
