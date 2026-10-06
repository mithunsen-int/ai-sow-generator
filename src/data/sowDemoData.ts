// src/data/sowDemoData.ts
// Default system prompt (app rules only; the methodology layer lives in
// methodologyProfile.ts) plus demo template and constraints, so users can see
// the expected input format.

export const DEFAULT_SDD_SYSTEM_PROMPT = `You are a Principal Software Architect and Senior Business Analyst preparing a Statement of Work (SOW) for Specification-Driven Delivery (SDD).
The SDD METHODOLOGY section appended below defines how this SOW is consumed downstream: identifiers, the content every feature spec must contain, project-wide content, statuses, and decision ownership. Follow it for every feature and section.

ZERO-ASSUMPTION RULES (HIGHEST PRIORITY — OVERRIDE EVERYTHING ELSE, INCLUDING THE METHODOLOGY)
1. Never invent requirements, business rules, values, limits, vendors, formats, permissions, or behaviours. Every detail must be either STATED in the inputs or strictly DERIVED (logically required by something stated). Anything else is OPEN.
2. When information is missing, ambiguous, or conflicting — including "X or Y" choices left open in the inputs — do NOT pick one. Raise a question with an ID that follows the METHODOLOGY's identifier rules, mark the point of use inline as ⚠️ \`<question-id>\`, and add it to the Open Questions & Blockers register.
3. A question is Blocking = Yes when a feature's acceptance criteria, API contract, or data model cannot be finalised without the answer. A feature with any blocking question has Status "Draft — Blocked (<question IDs>)". An acceptance criterion that depends on an open question is written as "⚠️ Blocked by <question-id>" instead of a guessed outcome. Document status is "Draft", or "Draft — Blocked (N blocking questions)" if any exist.
4. Template content in [brackets] and example values in the template (technologies, vendors, integrations, SLAs, coverage targets, timelines, payment splits) are placeholders. Replace them from the inputs; where the inputs are silent, raise a question — never copy the example. Generic contractual clauses without project-specific values (review windows, change-management steps, signature blocks) may be kept as written.

DEPTH
- Write the full per-feature spec content the METHODOLOGY requires for every in-scope feature. Go deep: every business rule, permission, data field, endpoint, error case, state transition, edge case (including failure, concurrency, and partial failure), acceptance criterion, and test the feature needs.
- Use measurable values; never adjectives such as "fast", "secure", "robust", or "user-friendly".

OUTPUT RULES
- Follow the template's section order and headings, and add the traceability matrix and the open questions register it asks for.
- In the document header, state the methodology used as "**Methodology:** <name and version from the METHODOLOGY header line>".
- Return ONLY the Markdown SOW — no intro or outro text, and no code fence around the whole document.`;

export const DEMO_SOW_TEMPLATE = `# Statement of Work (SOW)

**Project Name:** [Project Name]  
**Document ID:** SOW-[YYYYMMDD]-[001]  
**Effective Date:** [MM/DD/YYYY]  
**Client Name:** [Client Company Name]  
**Provider Name:** [Your Company/Agency Name]  
**Document Status:** [Draft | Draft — Blocked (N blocking questions)]  
**Methodology:** [Methodology name and version]  

---

## 1. Executive Summary & Core Intent

### 1.1 Project Mission
[High-level summary of what is being built, why it is being built, and the core outcome desired.]

### 1.2 Spec-Driven Development (SDD) Protocol Statement
> **Notice:** This project strictly follows Spec-Driven Development (SDD) principles. All requirements detailed in this SOW represent the ground-truth baseline. No feature execution shall commence until the corresponding technical specification file (\`spec.md\`) is compiled, verified against this SOW, and approved by both parties.

### 1.3 Business Need & Discovery Status
- **Business Need:** [The problem being solved and for whom — not just the requested features.]
- **Measurable Outcome:** [Success metric with a number, or a question ID if not provided.]
- **Decided:** [Decisions already fixed by the inputs — stack, integrations, constraints.]
- **Open at Discovery:** [Count of open questions, with blocking ones listed — see Section 6.]

---

## 2. Project Scope & Functional Deliverables

### 2.1 Feature Index

| # | Spec ID (slug) | Feature | Status | Blocking Questions |
| :---: | :--- | :--- | :--- | :--- |
| 1 | \`[feature-slug]\` | [Feature name] | Draft / Draft — Blocked | [Question IDs or —] |

### 2.2 Feature Specifications

*Repeat the block below for every feature in the Feature Index. Each block becomes \`.ai-context/specs/<slug>.spec.md\`.*

#### Feature 1: [Feature Name]
- **Spec ID:** \`[feature-slug]\`
- **Status:** [Draft | Draft — Blocked (question IDs)]
- **Intent:** [One unambiguous paragraph: what changes, for whom, under what condition.]
- **Core User Stories:**
  - *As a* [User Role], *I want to* [Action], *so that* [Benefit].

##### Business Rules
| ID | Rule | Source |
| :--- | :--- | :--- |
| \`[slug].BR01\` | System MUST [specific behaviour]. | [Requirements / Constraints / SDD rules / Derived] |

##### Roles & Permissions
| Action | [Role 1] | [Role 2] | [Role 3] |
| :--- | :---: | :---: | :---: |
| [Action] | [Allowed / Denied / ⚠️ question ID] | | |

##### Data Model (proposed — input to \`[slug].plan.md\`)
**Collection / Table:** \`[name]\`

| Field | Type | Required | Default | Constraints / Index | Source |
| :--- | :--- | :---: | :--- | :--- | :--- |
| [field] | [type] | [Yes/No] | [value or —] | [PK / FK / unique / index / enum] | [Requirements / Derived / ⚠️ question ID] |

##### API Contract
###### \`[slug].API01\` — [METHOD] [/path]
- **Auth / Role:** [mechanism and roles]
- **Request payload:**
\`\`\`json
{ "field": "type" }
\`\`\`
- **Success response ([status code]):**
\`\`\`json
{ "field": "type" }
\`\`\`
- **Exceptions:**

| Status | Error Code | Condition |
| :---: | :--- | :--- |
| [4xx] | [ERROR_CODE] | [condition] |

##### State Transitions & Side Effects
- [State A → State B on event; events, WebSocket messages, webhooks emitted]

##### Validation Rules & Edge Cases
- [Rule or edge case, including failure, concurrency and partial-failure paths]

##### Acceptance Criteria (Given / When / Then)
1. \`[slug].AC1\` — **Given** [initial state], **When** [action], **Then** [measurable outcome].
2. \`[slug].AC2\` — **Given** [state], **When** [action], **Then** ⚠️ Blocked by [question ID] *(when it depends on an open question)*.

##### Unit Test Cases (spec-derived)
| Test ID | Maps to AC | Scenario | Expected |
| :--- | :--- | :--- | :--- |
| \`[slug].UT01\` | AC1 | [scenario] | [expected result] |

##### Feature Out of Scope
- [Item]

##### Non-Functional Constraints
- [Metric with number] — *Source: [Constraints / Requirements]*

---

## 3. Explicit Non-Goals & Out-of-Scope (Zero-Ambiguity Guardrail)

To prevent scope creep and ambiguity during spec generation, the following items are **EXPLICITLY OUT OF SCOPE**:

* \`OUT-1\`: Mobile native applications (iOS/Android) — *Web responsive layout only.*
* \`OUT-2\`: Legacy data migration prior to [Specific Date].
* \`OUT-3\`: Custom AI model training — *Third-party API integration only.*
* \`OUT-4\`: Third-party payment providers other than Stripe.

---

## 4. Technical Architecture & Constraints

### 4.1 Technology Stack

| Dimension | Specification Standard |
| :--- | :--- |
| **Frontend Framework** | React 18+ / Next.js (App Router), TypeScript |
| **Backend Framework** | Node.js / Express or Python / FastAPI |
| **Database** | PostgreSQL (Relational) + Redis (Caching) |
| **Authentication** | OAuth 2.0 / Auth0 / Supabase Auth |
| **Hosting & Cloud** | AWS / Vercel / Cloudflare |
| **CI/CD Pipeline** | GitHub Actions with automated linting & test suites |
| **API Architecture** | RESTful with OpenAPI 3.0 / Swagger schema |

### 4.2 Project Constitution Inputs
*Project-wide non-negotiables that every feature spec inherits (seed for \`.ai-context/constitution.md\`).*

- **Testing Discipline:** [frameworks, coverage floor, test-first scope]
- **Security Posture:** [auth baseline, PII/logging rules, secret management]
- **Architectural Constraints:** [approved datastores and integration patterns; no new ones without an ADR]
- **Non-Functional Baselines:** [latency, availability, RPO/RTO — with numbers]
- **Versioning Rules:** [API versioning, breaking-change and deprecation policy]

---

## 5. System Interoperability & Integration Endpoints

| Third-Party System | Purpose | Auth Protocol | Rate/Cost Limit |
| :--- | :--- | :--- | :--- |
| **Stripe Billing** | Payment Processing | Webhook / API Key | Client Tier Limit |
| **SendGrid** | Transactional Emails | API Key | 10,000 / month |
| **OpenAI / Claude API**| LLM Reasoning Engine | Bearer Token | Usage Capped |

---

## 6. Open Questions, Blockers & Decisions

> **Zero-assumption rule:** anything not stated in the inputs is listed here instead of being guessed. A feature cannot pass Gate 1 while it has an open blocking question.

### 6.1 Open Questions Register

| ID | Feature | Question | Why It Matters | Options (if known) | Blocking |
| :--- | :--- | :--- | :--- | :--- | :---: |
| \`[slug].Q01\` | \`[slug]\` | [Precise question] | [What cannot be specified without it] | [Option A / Option B] | [Yes / No] |

### 6.2 Decisions Already Made
- [Decision] — *Source: [Requirements / Constraints]*

---

## 7. Traceability Matrix

| Spec ID | Business Rules | API Endpoints | Acceptance Criteria | Unit Tests | Blocking Questions |
| :--- | :--- | :--- | :--- | :--- | :--- |
| \`[slug]\` | BR01–BRnn | API01–APInn | AC1–ACn | UT01–UTnn | [IDs or —] |

---

## 8. Milestones, Deliverables & Timeline

| Milestone ID | Phase Name | Key Deliverables | Estimated Completion | Payment % |
| :---: | :--- | :--- | :---: | :---: |
| **M1** | **Discovery & Spec Sign-off** | All blocking questions closed; Approved Architecture Diagram, System Schemas, one Gate 1–approved \`<slug>.spec.md\` per feature | Week 2 | 20% |
| **M2** | **Core Backend & APIs** | Database Schemas, Auth System, API Endpoints & Tests | Week 5 | 30% |
| **M3** | **Frontend & Integrations** | Responsive UI, Third-party integrations, E2E flows | Week 8 | 30% |
| **M4** | **UAT & Launch** | Security audit fixes, Staging deployment, Final Go-Live | Week 10 | 20% |

---

## 9. Acceptance Criteria & Quality Gates

A milestone deliverable is considered **Complete & Accepted** only when:

1. **Automated Test Coverage:** Minimum **80%** unit and integration test coverage across core modules.
2. **Zero Critical Bugs:** Zero \`P1\` (blocker/crash) or \`P2\` (major functionality broken) issues remaining in UAT.
3. **Performance Metric:** Core API response times strictly < 200ms at 95th percentile under standard load.
4. **SDD Validation:** All generated code mirrors the agreed \`spec.md\` contracts without unapproved deviations.

### 9.1 Definition of Ready (per feature spec, before development)
- [ ] Intent fits in one unambiguous paragraph.
- [ ] Every acceptance criterion is Given / When / Then and individually IDed (\`<slug>.AC#\`).
- [ ] API Contract is complete (payload, success shape, exception table) where the feature has an API surface.
- [ ] Data model fields, types and constraints are listed.
- [ ] Explicit out-of-scope items are named.
- [ ] Non-functional constraints have numbers and a source.
- [ ] No open blocking questions remain for the feature.
- [ ] Gate 1 reviewer assigned (not the author) and status set to Approved.

---

## 10. Client Responsibilities & Dependencies

The project timeline depends on the Client providing the following dependencies:

* **Single Point of Contact (SPOC):** Appointment of a Product Owner with decision-making authority within 48 hours of request.
* **Clarifications:** Answers to every blocking question in Section 6 before M1 sign-off.
* **Credentials & Access:** Provisioning of API keys, domain access, and cloud console permissions by **[Date]**.
* **UAT Review Window:** Turnaround time for milestone testing and feedback within **3 business days** of release.

---

## 11. Change Management Procedure

Any request to modify the scope, technical architecture, or deliverables outlined in this SOW must follow the formal **Change Order Process**:

1. **Impact Analysis:** Provider evaluates time, cost, and spec complexity impact.
2. **Written Sign-off:** Both parties must sign a formal **Change Request Form (CRF)** before execution begins.
3. **Spec Alignment:** Relevant \`spec.md\` files are updated to reflect the new scope prior to coding.

---

## 12. Authorization & Signatures

IN WITNESS WHEREOF, the parties hereto have executed this Statement of Work as of the Effective Date.

**Client:** [Client Company Name]  
**Signature:** ___________________________  
**Name:** [Client Representative Name]  
**Title:** [Title]  
**Date:** _______________  

<br/>

**Provider:** [Provider Company Name]  
**Signature:** ___________________________  
**Name:** [Provider Representative Name]  
**Title:** [Title]  
**Date:** _______________`;

export const DEMO_ADDITIONAL_CONSTRAINTS = `Technical Stack Rules:
- Frontend: Next.js 14 (App Router), React 18, Tailwind CSS, Zustand, Lucide React.
- Backend: Node.js / TypeScript.
- Database: MongoDB (sole datastore) + Mongoose (ODM) — schema validation via Mongoose schemas.
- Testing: Jest + React Testing Library for unit and integration tests.
- Auth: JWT bearer-token authentication with refresh token mechanism.

Performance SLAs:
- API p95 latency < 150ms.

Zero-Ambiguity Rules for Spec-Driven Development:
- No vague descriptions like "fast", "user-friendly", or "scalable". Replace with concrete numbers.
- Provide full OpenAPI route definitions for stock mutations.
- Out-of-scope: Direct payment gateway processing, third-party logistics (3PL) driver tracking apps.`;
