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
}

export const auditSow = (sow: string): AuditResult => {
  if (!sow) return { score: 0, metrics: [], summary: "No SOW generated yet." };

  const text = sow.toLowerCase();

  const metrics: AuditMetric[] = [
    {
      title: "Explicit Scope & Non-Goals Section",
      description: "Contains clear out-of-scope items to prevent scope creep.",
      passed:
        text.includes("out-of-scope") ||
        text.includes("non-goals") ||
        text.includes("out of scope"),
      weight: 15,
    },
    {
      title: "Verifiable Acceptance Criteria Table",
      description:
        "Includes testable criteria in a structured tabular or Given-When-Then format.",
      passed:
        text.includes("|") &&
        (text.includes("acceptance criteria") || text.includes("given")),
      weight: 20,
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
      weight: 15,
    },
    {
      title: "Definition of Done (DoD) Checklist",
      description:
        "Explicit list of validation steps for specification completion.",
      passed:
        text.includes("[ ]") ||
        text.includes("[x]") ||
        text.includes("definition of done"),
      weight: 15,
    },
    {
      title: "Absence of Vague Ambiguities",
      description:
        'Avoids subjective words like "flexible", "easy", or "user-friendly".',
      passed:
        !text.includes("as fast as possible") &&
        !text.includes("super flexible"),
      weight: 20,
    },
  ];

  const score = metrics.reduce((acc, m) => acc + (m.passed ? m.weight : 0), 0);

  return {
    score,
    metrics,
    summary:
      score >= 80
        ? "High SDD Compliance: SOW is ready for specification parsing and automated task breakdown."
        : "Medium/Low Compliance: Add more measurable constraints or explicit acceptance criteria.",
  };
};
