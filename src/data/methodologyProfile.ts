// src/data/methodologyProfile.ts
// The built-in SDD methodology profile. It is the methodology layer appended
// to every analysis and generation prompt, unless the user supplies an
// override, which replaces it entirely.
//
// Overrides are condensed into this same structure (numbered headings below),
// so update the headings in CONDENSE_SYSTEM_PROMPT if they change here.

export const BUILT_IN_METHODOLOGY_LABEL = "Built-in SDD methodology (v1.0)";

export const DEFAULT_METHODOLOGY_PROFILE = `METHODOLOGY: ${BUILT_IN_METHODOLOGY_LABEL}

1. PURPOSE OF THE SOW
The SOW is the discovery output that feeds the SDD artefact chain: BRD entry → Spec → Plan → Tasks. Each feature section becomes a spec file (.ai-context/specs/<slug>.spec.md) that a peer reviews at Gate 1 before any plan or code exists. AI coding agents then generate tests and code from it literally: whatever is vague, they will guess. Write so that two competent engineers could not build materially different things.

2. IDENTIFIERS
- One feature = one spec, identified by a slug: kebab-case, 3–5 words, names a thing (no verbs), unique for the project — e.g. stock-adjustment-audit-log.
- IDs are scoped under the slug: <slug>.BR01 (business rules), <slug>.API01 (endpoints), <slug>.AC1 (acceptance criteria), <slug>.UT01 (unit test cases), <slug>.Q01 (questions). Cross-cutting questions use project.Q01.

3. REQUIRED CONTENT PER FEATURE SPEC
- Intent: one unambiguous paragraph — what changes, for whom, under what condition.
- Business rules table with a Source column (Requirements / Constraints / SDD rules / Derived).
- Roles & permissions for the feature's actions.
- Proposed data model for the approved datastore (collections or tables): one table per entity with Field, Type, Required, Default, Constraints / Index, and Source. Label it as input to <slug>.plan.md, subject to plan review.
- API contract whenever the feature exposes or consumes an API: method and path, auth and role, request JSON, success JSON with status code, and an exhaustive exception table (status code, error code, condition) — not just the happy path plus one error.
- State transitions and side effects (events, WebSocket messages, webhooks).
- Validation rules and edge cases, including failure, concurrency, and partial-failure paths.
- Acceptance criteria as numbered Given / When / Then statements covering the happy path, negative paths, permission boundaries, and edge cases.
- Spec-derived unit test cases table, each row mapped to an AC ID.
- Feature-specific out-of-scope items, and non-functional constraints with numbers and their source.

4. PROJECT-WIDE CONTENT
- Constitution inputs: rules that apply to every feature — testing discipline, security posture, architectural constraints, non-functional baselines, and versioning rules — each specific enough that a reviewer can check a plan against it.
- Explicit out-of-scope items.
- Traceability from every feature's business rules and acceptance criteria to its unit tests.

5. STATUS AND REVIEW
- Specs start as Draft. Never mark the SOW or any spec as Approved; approval happens at Gate 1 by a named human reviewer who is not the author.

6. DECISION OWNERSHIP
- Business decisions (who, what, how much, how long, which outcome or message, scope, approval rules, retention and privacy policy) belong to the business owner. Technical decisions (tools, frameworks, schemas, patterns) belong to engineering. Never settle an open business decision with a technical choice.

7. SECURITY AND DATA
- Never include secrets, credentials, or real personal data. Use placeholders, and reference credentials by a secret-store reference field rather than storing them.

8. OUTSIDE THE SOW
- Do not write implementation plans or task lists; sequencing belongs to later SDD artefacts.`;

/** Reads the "METHODOLOGY: <name> (<version>)" header line of a profile. */
export const methodologyLabel = (profile: string): string => {
  const match = /^\s*METHODOLOGY:\s*(.+)$/m.exec(profile);
  return match?.[1]?.trim() || "Custom methodology";
};
