// src/data/sowDemoData.ts
// Demo inputs and a sample output so users can see the expected input format
// and what a generated SDD-compliant SOW looks like.

export const DEFAULT_SDD_SYSTEM_PROMPT = `You are a Principal Software Architect and Senior Business Analyst preparing a Statement of Work (SOW) for Specification-Driven Delivery (SDD).

HOW THIS SOW IS USED
The SOW is the discovery output that feeds the SDD artefact chain: BRD entry → Spec → Plan → Tasks. Each feature section becomes a spec file (.ai-context/specs/<slug>.spec.md) that a peer reviews at Gate 1 before any plan or code exists. AI coding agents then generate tests and code from it literally: whatever is vague, they will guess. Write so that two competent engineers could not build materially different things.

ZERO-ASSUMPTION RULES (HIGHEST PRIORITY — OVERRIDE EVERYTHING ELSE)
1. Never invent requirements, business rules, values, limits, vendors, formats, permissions, or behaviours. Every detail must be either STATED in the inputs or strictly DERIVED (logically required by something stated). Anything else is OPEN.
2. When information is missing, ambiguous, or conflicting — including "X or Y" choices left open in the inputs — do NOT pick one. Raise a question with an ID, mark the point of use inline as ⚠️ \`<question-id>\`, and add it to the Open Questions & Blockers register.
3. A question is Blocking = Yes when a feature's acceptance criteria, API contract, or data model cannot be finalised without the answer. A feature with any blocking question has Status "Draft — Blocked (<question IDs>)". An acceptance criterion that depends on an open question is written as "⚠️ Blocked by <question-id>" instead of a guessed outcome.
4. Template content in [brackets] and example values in the template (technologies, vendors, integrations, SLAs, coverage targets, timelines, payment splits) are placeholders. Replace them from the inputs; where the inputs are silent, raise a question — never copy the example. Generic contractual clauses without project-specific values (review windows, change-management steps, signature blocks) may be kept as written.
5. Never mark the SOW or any spec as Approved; approval happens at Gate 1 by a human reviewer. Document status is "Draft", or "Draft — Blocked (N blocking questions)" if any exist.

FEATURE DEPTH (REPEAT FOR EVERY IN-SCOPE FEATURE)
- One feature = one spec, identified by a slug: kebab-case, 3–5 words, names a thing (no verbs), unique for the project — e.g. stock-adjustment-audit-log.
- IDs are scoped under the slug: <slug>.BR01 (business rules), <slug>.API01 (endpoints), <slug>.AC1 (acceptance criteria), <slug>.UT01 (unit test cases), <slug>.Q01 (questions). Cross-cutting questions use project.Q01.
- Intent: one unambiguous paragraph — what changes, for whom, under what condition.
- Business rules table with a Source column (Requirements / Constraints / SDD rules / Derived).
- Roles & permissions for the feature's actions.
- Proposed data model for the approved datastore (collections or tables): one table per entity with Field, Type, Required, Default, Constraints / Index, and Source. Label it as input to <slug>.plan.md, subject to plan review.
- API contract whenever the feature exposes or consumes an API: method and path, auth and role, request JSON, success JSON with status code, and an exhaustive exception table (status code, error code, condition) — not just the happy path plus one error.
- State transitions and side effects (events, WebSocket messages, webhooks).
- Validation rules and edge cases, including failure, concurrency, and partial-failure paths.
- Acceptance criteria as numbered Given / When / Then statements covering the happy path, negative paths, permission boundaries, and edge cases. Use measurable values; never adjectives such as "fast", "secure", "robust", or "user-friendly".
- Spec-derived unit test cases table, each row mapped to an AC ID.
- Feature-specific out-of-scope items, and non-functional constraints with numbers and their source.

GENERAL RULES
- Never include secrets, credentials, or real personal data. Use placeholders, and reference credentials by a secret-store reference field rather than storing them.
- Do not write implementation plans or task lists; sequencing belongs to later SDD artefacts.
- Follow the template's section order and headings, and add the traceability matrix and the open questions register it asks for.
- Return ONLY the Markdown SOW — no intro or outro text, and no code fence around the whole document.`;

export const DEMO_SOW_TEMPLATE = `# Statement of Work (SOW)

**Project Name:** [Project Name]  
**Document ID:** SOW-[YYYYMMDD]-[001]  
**Effective Date:** [MM/DD/YYYY]  
**Client Name:** [Client Company Name]  
**Provider Name:** [Your Company/Agency Name]  
**Document Status:** [Draft | Draft — Blocked (N blocking questions)]

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

export const DEMO_RAW_REQUIREMENTS = `Project: Multi-Tenant Inventory & Real-Time Stock Management Dashboard

We need a modern web-based inventory management dashboard for modern warehouses.
Key requirements:
- Multi-tenancy support (Organizations with multiple warehouses and roles: Admin, Warehouse Manager, Picker).
- Real-time stock level updates using WebSockets when orders or transfers occur.
- Low-latency search (<100ms) across 50,000+ SKU items.
- Barcode scanning integration (via mobile browser camera).
- Automated low-stock reorder triggers sending webhooks to external ERPs (SAP/NetSuite).
- Audit logs for every stock adjustment showing timestamp, user ID, and reason.
- Offline-first capabilities for handheld scanners with local IndexedDB sync when reconnected.`;

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

export const buildDemoSowOutput = (
  date: string = new Date().toISOString().split("T")[0],
): string => `# Statement of Work (SOW)

**Project Name:** Multi-Tenant Inventory & Real-Time Stock Management Dashboard  
**Document ID:** SOW-${date.replaceAll("-", "")}-001  
**Effective Date:** Not provided — ⚠️ \`project.Q01\`  
**Client Name:** Not provided — ⚠️ \`project.Q01\`  
**Provider Name:** Not provided — ⚠️ \`project.Q01\`  
**Document Status:** Draft — Blocked (16 blocking questions)

> **Sample output** generated from the demo inputs. For brevity, this sample expands 2 of the 7 features in full; a real generation expands every feature. Click "Create SOW" to generate your own.

---

## 1. Executive Summary & Core Intent

### 1.1 Project Mission
Build a web-based, multi-tenant inventory management dashboard for warehouses. Organisations manage multiple warehouses; stock levels update in real time as orders and transfers occur; users find SKUs by search or barcode scan; low stock triggers reorder webhooks to the organisation's ERP; every stock adjustment is audited; and handheld scanners keep working offline and sync when reconnected.

### 1.2 Spec-Driven Development (SDD) Protocol Statement
> **Notice:** This project strictly follows Spec-Driven Development (SDD) principles. All requirements detailed in this SOW represent the ground-truth baseline. No feature execution shall commence until the corresponding technical specification file (\`spec.md\`) is compiled, verified against this SOW, and approved by both parties.

### 1.3 Business Need & Discovery Status
- **Business Need:** Warehouses need accurate, real-time stock visibility across multiple locations per organisation, with traceable adjustments and automated reordering.
- **Measurable Outcome:** Not provided — ⚠️ \`project.Q02\`
- **Decided:** Next.js 14 / React 18 frontend; Node.js / TypeScript backend; MongoDB as the sole datastore via Mongoose; JWT bearer auth with refresh tokens; Jest + React Testing Library; API p95 < 150 ms; roles Admin, Warehouse Manager, Picker.
- **Open at Discovery:** 23 questions, 16 of them blocking — see Section 6.

---

## 2. Project Scope & Functional Deliverables

### 2.1 Feature Index

| # | Spec ID (slug) | Feature | Status | Blocking Questions |
| :---: | :--- | :--- | :--- | :--- |
| 1 | \`tenant-role-access\` | Organisations, warehouses & role permissions | Draft — Blocked | Q01, Q02 |
| 2 | \`realtime-stock-updates\` | WebSocket stock-level broadcasts | Draft — Blocked | Q01 |
| 3 | \`sku-search-index\` | SKU search across 50,000+ items | Draft — Blocked | Q01, Q02 |
| 4 | \`barcode-camera-scan\` | Barcode scanning via mobile browser camera | Draft — Blocked | Q01 |
| 5 | \`stock-adjustment-audit-log\` | Audit log for every stock adjustment | Draft — Blocked | Q01, Q02, Q03 |
| 6 | \`low-stock-erp-webhook\` | Low-stock reorder webhooks to SAP / NetSuite | Draft — Blocked | Q01–Q05 |
| 7 | \`offline-scanner-sync\` | Offline-first scanners with IndexedDB sync | Draft — Blocked | Q01 |

### 2.2 Feature Specifications

#### Feature 5: Stock Adjustment Audit Log
- **Spec ID:** \`stock-adjustment-audit-log\`
- **Status:** Draft — Blocked (\`stock-adjustment-audit-log.Q01\`, \`.Q02\`, \`.Q03\`)
- **Intent:** Every change to a SKU's on-hand quantity in a warehouse — manual adjustment, order, or transfer — records exactly one audit entry with the timestamp, the acting user's ID, and the reason, so that each stock change is traceable to a person, a time, and a cause within the owning organisation.
- **Core User Stories:**
  - *As a* user permitted to adjust stock (⚠️ \`tenant-role-access.Q01\`), *I want to* record an adjustment with a reason, *so that* the change is traceable.
  - *As a* user permitted to view audits (⚠️ \`tenant-role-access.Q01\`), *I want to* see a SKU's adjustment history, *so that* I can explain discrepancies.

##### Business Rules
| ID | Rule | Source |
| :--- | :--- | :--- |
| \`stock-adjustment-audit-log.BR01\` | Every change to on-hand quantity MUST create exactly one audit entry. | Requirements |
| \`stock-adjustment-audit-log.BR02\` | Each entry MUST store timestamp, user ID, and reason. | Requirements |
| \`stock-adjustment-audit-log.BR03\` | The quantity change and its audit entry MUST be written in one MongoDB transaction; if either write fails, neither persists. | Derived from BR01 ("every") |
| \`stock-adjustment-audit-log.BR04\` | Entries MUST carry \`tenantId\`, and reads MUST be filtered by the tenant in the caller's JWT. | Requirements (multi-tenancy) |
| \`stock-adjustment-audit-log.BR05\` | Whether entries are immutable, and how long they are retained. | ⚠️ \`stock-adjustment-audit-log.Q01\` |

##### Roles & Permissions
| Action | Admin | Warehouse Manager | Picker |
| :--- | :---: | :---: | :---: |
| Create manual adjustment | ⚠️ \`tenant-role-access.Q01\` | ⚠️ \`tenant-role-access.Q01\` | ⚠️ \`tenant-role-access.Q01\` |
| View audit history | ⚠️ \`tenant-role-access.Q01\` | ⚠️ \`tenant-role-access.Q01\` | ⚠️ \`tenant-role-access.Q01\` |

##### Data Model (proposed — input to \`stock-adjustment-audit-log.plan.md\`)
**Collection:** \`stock_adjustments\` (MongoDB via Mongoose — *Constraints*)

| Field | Type | Required | Default | Constraints / Index | Source |
| :--- | :--- | :---: | :--- | :--- | :--- |
| \`_id\` | ObjectId | Yes | auto | Primary key | Derived |
| \`tenantId\` | ObjectId → \`organizations\` | Yes | — | Compound index (see below) | Requirements |
| \`warehouseId\` | ObjectId → \`warehouses\` | Yes | — | — | Requirements |
| \`skuId\` | ObjectId → \`skus\` | Yes | — | Compound index | Derived |
| \`source\` | String enum: \`manual\`, \`order\`, \`transfer\` | Yes | — | Enum | Requirements |
| \`delta\` | Integer, ≠ 0 | Yes | — | Validator: non-zero | Derived |
| \`quantityBefore\` | Integer | Yes | — | Lower bound ⚠️ \`.Q02\` | Derived |
| \`quantityAfter\` | Integer | Yes | — | Lower bound ⚠️ \`.Q02\` | Derived |
| \`reason\` | ⚠️ Free text or predefined code | Yes | — | ⚠️ \`.Q03\` | Requirements |
| \`userId\` | ObjectId → \`users\` | Yes | — | — | Requirements |
| \`createdAt\` | Date (UTC, server-assigned) | Yes | server time | Compound index | Requirements |
| \`clientEventId\` | String (UUID) | No | — | Unique per tenant, sparse | Derived from \`offline-scanner-sync\` ⚠️ \`offline-scanner-sync.Q01\` |

**Index:** \`{ tenantId: 1, skuId: 1, createdAt: -1 }\` — Derived from the \`.API02\` filter and sort.

##### API Contract
###### \`stock-adjustment-audit-log.API01\` — POST /api/v1/stock-adjustments
- **Auth / Role:** JWT bearer token (*Constraints*); roles ⚠️ \`tenant-role-access.Q01\`
- **Request payload:**
\`\`\`json
{
  "warehouseId": "string (ObjectId)",
  "skuId": "string (ObjectId)",
  "delta": "integer, non-zero",
  "reason": "string (format: see Q03)",
  "clientEventId": "string (UUID), optional"
}
\`\`\`
- **Success response (201):**
\`\`\`json
{
  "id": "string",
  "skuId": "string",
  "warehouseId": "string",
  "quantityBefore": "integer",
  "quantityAfter": "integer",
  "createdAt": "string (ISO-8601 UTC)"
}
\`\`\`
- **Exceptions:**

| Status | Error Code | Condition |
| :---: | :--- | :--- |
| 400 | \`VALIDATION_ERROR\` | Missing or malformed field, or \`delta\` = 0 |
| 400 | \`REASON_REQUIRED\` | \`reason\` missing or empty |
| 401 | \`UNAUTHENTICATED\` | Missing, invalid, or expired JWT |
| 403 | \`FORBIDDEN_ROLE\` | Caller's role may not adjust stock (⚠️ \`tenant-role-access.Q01\`) |
| 404 | \`SKU_NOT_FOUND\` | SKU or warehouse does not exist in the caller's tenant |
| 409 | \`INSUFFICIENT_STOCK\` | Resulting quantity < 0 — ⚠️ Blocked by \`.Q02\` |
| 409 | \`DUPLICATE_EVENT\` | \`clientEventId\` already processed — response body ⚠️ \`offline-scanner-sync.Q01\` |

###### \`stock-adjustment-audit-log.API02\` — GET /api/v1/stock-adjustments
- **Auth / Role:** JWT bearer token; roles ⚠️ \`tenant-role-access.Q01\`
- **Query parameters:** \`skuId\` (required), \`warehouseId\`, \`from\`, \`to\` (ISO-8601), \`cursor\`, \`limit\` (default / max ⚠️ \`.Q04\`)
- **Success response (200):**
\`\`\`json
{
  "items": [
    {
      "id": "string",
      "source": "manual | order | transfer",
      "delta": "integer",
      "quantityBefore": "integer",
      "quantityAfter": "integer",
      "reason": "string",
      "userId": "string",
      "createdAt": "string (ISO-8601 UTC)"
    }
  ],
  "nextCursor": "string | null"
}
\`\`\`
- **Exceptions:**

| Status | Error Code | Condition |
| :---: | :--- | :--- |
| 400 | \`INVALID_RANGE\` | \`from\` is later than \`to\`, or a date is malformed |
| 401 | \`UNAUTHENTICATED\` | Missing, invalid, or expired JWT |
| 403 | \`FORBIDDEN_ROLE\` | Caller's role may not view audits |
| 404 | \`SKU_NOT_FOUND\` | SKU does not exist in the caller's tenant |

##### State Transitions & Side Effects
- A committed adjustment updates the SKU's on-hand quantity and emits a stock-change event consumed by \`realtime-stock-updates\` and evaluated by \`low-stock-erp-webhook.BR01\` (*Requirements*: real-time updates, automated reorder triggers).

##### Validation Rules & Edge Cases
- \`delta\` = 0 is rejected with \`VALIDATION_ERROR\`.
- Concurrent adjustments to the same SKU compute \`quantityBefore\` / \`quantityAfter\` inside the transaction, so consecutive entries form an unbroken chain (Derived from BR03).
- Order- and transfer-driven changes record the user who triggered the order or transfer (*Requirements*: user ID on every adjustment).

##### Acceptance Criteria (Given / When / Then)
1. \`stock-adjustment-audit-log.AC1\` — **Given** SKU-100 in warehouse W1 of Tenant A has on-hand 50 and the caller is permitted to adjust stock, **When** they call \`.API01\` with \`delta\` −5 and reason "Damaged", **Then** the response is 201 with \`quantityAfter\` 45, and exactly one entry exists with that \`userId\`, reason "Damaged", \`quantityBefore\` 50, \`quantityAfter\` 45, and a UTC \`createdAt\`.
2. \`stock-adjustment-audit-log.AC2\` — **Given** the same state, **When** the caller omits \`reason\`, **Then** the response is 400 \`REASON_REQUIRED\`, on-hand stays 50, and no entry is created.
3. \`stock-adjustment-audit-log.AC3\` — **Given** an order for SKU-100 is fulfilled, **When** the stock decrement commits, **Then** one entry with \`source\` "order" is written in the same transaction; **and if** the audit write fails, the decrement is rolled back.
4. \`stock-adjustment-audit-log.AC4\` — **Given** a caller from Tenant B, **When** they call \`.API02\` with Tenant A's SKU-100, **Then** the response is 404 \`SKU_NOT_FOUND\` and no Tenant A data is returned.
5. \`stock-adjustment-audit-log.AC5\` — **Given** on-hand is 3, **When** a caller submits \`delta\` −5, **Then** ⚠️ Blocked by \`stock-adjustment-audit-log.Q02\`.
6. \`stock-adjustment-audit-log.AC6\` — **Given** an existing entry, **When** any client attempts to modify or delete it, **Then** ⚠️ Blocked by \`stock-adjustment-audit-log.Q01\`.
7. \`stock-adjustment-audit-log.AC7\` — **Given** the agreed load profile (⚠️ \`project.Q04\`), **When** \`.API01\` and \`.API02\` are measured at the gateway, **Then** p95 latency is < 150 ms.

##### Unit Test Cases (spec-derived)
| Test ID | Maps to AC | Scenario | Expected |
| :--- | :--- | :--- | :--- |
| \`stock-adjustment-audit-log.UT01\` | AC1 | Valid −5 adjustment on on-hand 50 | 201; one entry with before 50 / after 45 |
| \`stock-adjustment-audit-log.UT02\` | AC2 | Missing reason | 400 \`REASON_REQUIRED\`; no writes |
| \`stock-adjustment-audit-log.UT03\` | AC3 | Audit insert throws during order fulfilment | Transaction aborted; on-hand unchanged |
| \`stock-adjustment-audit-log.UT04\` | AC4 | Tenant B queries Tenant A SKU | 404; empty result set |
| \`stock-adjustment-audit-log.UT05\` | AC1 | \`delta\` = 0 | 400 \`VALIDATION_ERROR\` |

##### Feature Out of Scope
- Audit log export (CSV / PDF) and reporting dashboards — not in requirements.
- Retention or archival jobs — pending \`stock-adjustment-audit-log.Q01\`.

##### Non-Functional Constraints
- API p95 latency < 150 ms — *Source: Constraints*
- Tests in Jest, written before implementation — *Source: Constraints, SDD rules*

---

#### Feature 6: Low-Stock ERP Webhook
- **Spec ID:** \`low-stock-erp-webhook\`
- **Status:** Draft — Blocked (\`low-stock-erp-webhook.Q01\`–\`.Q05\`)
- **Intent:** When a SKU's on-hand quantity falls below its reorder threshold, the system sends a webhook to the organisation's configured ERP (SAP or NetSuite) so that a reorder can be raised in that ERP.
- **Core User Stories:**
  - *As an* organisation, *I want* the ERP notified when stock runs low, *so that* reorders start without manual checks.

##### Business Rules
| ID | Rule | Source |
| :--- | :--- | :--- |
| \`low-stock-erp-webhook.BR01\` | The reorder condition MUST be evaluated after every committed stock change. | Requirements ("automated … triggers") |
| \`low-stock-erp-webhook.BR02\` | Webhooks MUST target the tenant's configured ERP; supported ERPs are SAP and NetSuite only. | Requirements |
| \`low-stock-erp-webhook.BR03\` | ERP credentials MUST be stored as a secret-store reference, never in MongoDB documents or logs. | SDD rules |
| \`low-stock-erp-webhook.BR04\` | Webhook dispatch MUST NOT run inside the stock-adjustment request path. | Derived from API p95 < 150 ms (Constraints) |
| \`low-stock-erp-webhook.BR05\` | Scope of a threshold (per SKU, per warehouse, or per SKU-and-warehouse). | ⚠️ \`low-stock-erp-webhook.Q01\` |
| \`low-stock-erp-webhook.BR06\` | Whether a webhook re-fires while stock stays below threshold. | ⚠️ \`low-stock-erp-webhook.Q02\` |

##### Roles & Permissions
| Action | Admin | Warehouse Manager | Picker |
| :--- | :---: | :---: | :---: |
| Configure reorder threshold | ⚠️ \`tenant-role-access.Q01\` | ⚠️ \`tenant-role-access.Q01\` | ⚠️ \`tenant-role-access.Q01\` |
| Configure ERP connection | ⚠️ \`tenant-role-access.Q01\` | ⚠️ \`tenant-role-access.Q01\` | ⚠️ \`tenant-role-access.Q01\` |

##### Data Model (proposed — input to \`low-stock-erp-webhook.plan.md\`)
**Collection:** \`reorder_rules\`

| Field | Type | Required | Default | Constraints / Index | Source |
| :--- | :--- | :---: | :--- | :--- | :--- |
| \`_id\` | ObjectId | Yes | auto | Primary key | Derived |
| \`tenantId\` | ObjectId → \`organizations\` | Yes | — | Index | Requirements |
| \`skuId\` | ObjectId → \`skus\` | Yes | — | Unique with scope ⚠️ \`.Q01\` | Requirements |
| \`warehouseId\` | ObjectId → \`warehouses\` | ⚠️ \`.Q01\` | — | — | ⚠️ \`.Q01\` |
| \`thresholdQty\` | Integer ≥ 0 | Yes | — | — | Derived ("low-stock") |

**Collection:** \`erp_connections\`

| Field | Type | Required | Default | Constraints / Index | Source |
| :--- | :--- | :---: | :--- | :--- | :--- |
| \`_id\` | ObjectId | Yes | auto | Primary key | Derived |
| \`tenantId\` | ObjectId → \`organizations\` | Yes | — | Unique ⚠️ \`.Q04\` | Requirements |
| \`erpType\` | String enum: \`sap\`, \`netsuite\` | Yes | — | Enum | Requirements |
| \`endpointUrl\` | String (HTTPS URL) | Yes | — | — | Derived |
| \`credentialRef\` | String (secret-store reference) | Yes | — | Never the raw secret | SDD rules |

**Collection:** \`webhook_deliveries\`

| Field | Type | Required | Default | Constraints / Index | Source |
| :--- | :--- | :---: | :--- | :--- | :--- |
| \`_id\` | ObjectId | Yes | auto | Primary key | Derived |
| \`tenantId\` | ObjectId → \`organizations\` | Yes | — | Index | Requirements |
| \`reorderRuleId\` | ObjectId → \`reorder_rules\` | Yes | — | Index | Derived |
| \`status\` | String enum: \`pending\`, \`delivered\`, \`failed\` | Yes | \`pending\` | Enum | Derived |
| \`attemptCount\` | Integer ≥ 0 | Yes | 0 | Maximum ⚠️ \`.Q05\` | Derived |
| \`lastAttemptAt\` | Date (UTC) | No | — | — | Derived |
| \`responseStatus\` | Integer (HTTP status) | No | — | — | Derived |
| \`payload\` | Object | Yes | — | Shape ⚠️ \`.Q03\` | ⚠️ \`.Q03\` |

##### API Contract
###### \`low-stock-erp-webhook.API01\` — PUT /api/v1/reorder-rules/{skuId}
- **Auth / Role:** JWT bearer token; roles ⚠️ \`tenant-role-access.Q01\`
- **Request payload:**
\`\`\`json
{ "thresholdQty": "integer >= 0", "warehouseId": "string (ObjectId) — presence depends on Q01" }
\`\`\`
- **Success response (200):**
\`\`\`json
{ "id": "string", "skuId": "string", "thresholdQty": "integer", "warehouseId": "string | null" }
\`\`\`
- **Exceptions:**

| Status | Error Code | Condition |
| :---: | :--- | :--- |
| 400 | \`VALIDATION_ERROR\` | \`thresholdQty\` missing, negative, or not an integer |
| 401 | \`UNAUTHENTICATED\` | Missing, invalid, or expired JWT |
| 403 | \`FORBIDDEN_ROLE\` | Caller's role may not configure thresholds |
| 404 | \`SKU_NOT_FOUND\` | SKU (or warehouse) not in the caller's tenant |

###### \`low-stock-erp-webhook.API02\` — Outbound POST to \`erp_connections.endpointUrl\`
- ⚠️ **Blocked by \`low-stock-erp-webhook.Q03\`:** SAP and NetSuite accept different formats and authentication schemes; neither the payload fields nor the auth mechanism is specified in the inputs.

##### State Transitions & Side Effects
- \`webhook_deliveries.status\`: \`pending\` → \`delivered\` on an ERP 2xx response; \`pending\` → \`failed\` after the final attempt — retry count, backoff, and timeout ⚠️ \`low-stock-erp-webhook.Q05\`.

##### Validation Rules & Edge Cases
- Stock remaining at or above the threshold after a change MUST NOT create a delivery.
- A tenant with no ERP connection ⚠️ \`low-stock-erp-webhook.Q04\`.

##### Acceptance Criteria (Given / When / Then)
1. \`low-stock-erp-webhook.AC1\` — **Given** SKU-100 has \`thresholdQty\` 20 and on-hand 21, **When** a −2 adjustment commits, **Then** exactly one \`webhook_deliveries\` entry with \`status\` "pending" is created for Tenant A's ERP connection.
2. \`low-stock-erp-webhook.AC2\` — **Given** \`thresholdQty\` 20 and on-hand 25, **When** a −2 adjustment commits, **Then** no delivery is created.
3. \`low-stock-erp-webhook.AC3\` — **Given** a pending delivery, **When** the ERP responds with 2xx, **Then** \`status\` becomes "delivered" and \`responseStatus\` stores the code.
4. \`low-stock-erp-webhook.AC4\` — **Given** stock is already below threshold and a delivery was sent, **When** another decrement commits, **Then** ⚠️ Blocked by \`low-stock-erp-webhook.Q02\`.
5. \`low-stock-erp-webhook.AC5\` — **Given** the ERP responds with 5xx or times out, **When** the attempt ends, **Then** ⚠️ Blocked by \`low-stock-erp-webhook.Q05\`.
6. \`low-stock-erp-webhook.AC6\` — **Given** a tenant has no ERP connection, **When** stock crosses the threshold, **Then** ⚠️ Blocked by \`low-stock-erp-webhook.Q04\`.
7. \`low-stock-erp-webhook.AC7\` — **Given** a threshold crossing, **When** the triggering adjustment request is measured, **Then** its p95 latency is < 150 ms, unaffected by ERP response time.

##### Unit Test Cases (spec-derived)
| Test ID | Maps to AC | Scenario | Expected |
| :--- | :--- | :--- | :--- |
| \`low-stock-erp-webhook.UT01\` | AC1 | On-hand 21 → 19, threshold 20 | One pending delivery |
| \`low-stock-erp-webhook.UT02\` | AC2 | On-hand 25 → 23, threshold 20 | No delivery |
| \`low-stock-erp-webhook.UT03\` | AC3 | ERP mock returns 200 | Status "delivered"; \`responseStatus\` 200 |
| \`low-stock-erp-webhook.UT04\` | AC7 | ERP mock delays 5 s | Adjustment response unaffected |

##### Feature Out of Scope
- Creating purchase orders inside this application.
- Two-way sync from the ERP back into inventory.
- ERPs other than SAP and NetSuite.

##### Non-Functional Constraints
- Stock-adjustment p95 < 150 ms regardless of ERP latency — *Source: Constraints*

---

*Features 1–4 and 7 follow the same block structure in a full generation.*

---

## 3. Explicit Non-Goals & Out-of-Scope (Zero-Ambiguity Guardrail)

To prevent scope creep and ambiguity during spec generation, the following items are **EXPLICITLY OUT OF SCOPE**:

* \`OUT-1\`: Direct payment gateway processing — *Source: Constraints.*
* \`OUT-2\`: Third-party logistics (3PL) driver tracking apps — *Source: Constraints.*
* \`OUT-3\`: Native mobile applications — *Derived: the requirements specify a web dashboard and barcode scanning via the mobile browser camera.*
* \`OUT-4\`: ERP integrations other than SAP and NetSuite — *Source: Requirements.*

---

## 4. Technical Architecture & Constraints

### 4.1 Technology Stack

| Dimension | Specification Standard |
| :--- | :--- |
| **Frontend Framework** | Next.js 14 (App Router), React 18, Tailwind CSS, Zustand, Lucide React |
| **Backend Framework** | Node.js / TypeScript — HTTP framework not specified ⚠️ \`project.Q05\` |
| **Database** | MongoDB as the sole datastore, via Mongoose with schema validation |
| **Authentication** | JWT bearer tokens with refresh-token mechanism |
| **Real-Time Transport** | WebSockets — library and multi-instance fan-out ⚠️ \`realtime-stock-updates.Q01\` |
| **Search** | ⚠️ \`sku-search-index.Q01\` |
| **Hosting & Cloud / CI/CD** | Not provided ⚠️ \`project.Q03\` |
| **Testing** | Jest + React Testing Library |
| **API Architecture** | REST with OpenAPI definitions for all stock mutations |

### 4.2 Project Constitution Inputs
- **Testing Discipline:** Jest + React Testing Library; test-first for every endpoint. Coverage floor ⚠️ \`project.Q06\`.
- **Security Posture:** JWT with refresh tokens; no secrets or personal data in specs, logs, or prompts; credentials only via secret-store references.
- **Architectural Constraints:** MongoDB is the only approved datastore; introducing another store (e.g. a cache or search engine) requires an ADR.
- **Non-Functional Baselines:** API p95 < 150 ms; SKU search < 100 ms (measurement point ⚠️ \`sku-search-index.Q02\`). Availability and RPO/RTO not provided ⚠️ \`project.Q06\`.
- **Versioning Rules:** Not provided ⚠️ \`project.Q06\`.

---

## 5. System Interoperability & Integration Endpoints

| Third-Party System | Purpose | Auth Protocol | Rate/Cost Limit |
| :--- | :--- | :--- | :--- |
| **SAP** | Low-stock reorder webhook | ⚠️ \`low-stock-erp-webhook.Q03\` | Not provided |
| **NetSuite** | Low-stock reorder webhook | ⚠️ \`low-stock-erp-webhook.Q03\` | Not provided |

---

## 6. Open Questions, Blockers & Decisions

> **Zero-assumption rule:** anything not stated in the inputs is listed here instead of being guessed. A feature cannot pass Gate 1 while it has an open blocking question.

### 6.1 Open Questions Register

| ID | Feature | Question | Why It Matters | Options (if known) | Blocking |
| :--- | :--- | :--- | :--- | :--- | :---: |
| \`project.Q01\` | — | Client name, provider name, and effective date? | Required for a signable SOW | — | No |
| \`project.Q02\` | — | What measurable business outcome defines success? | Frames acceptance at UAT | — | No |
| \`project.Q03\` | — | Hosting / cloud provider and CI/CD platform? | Deployment and environment specs | AWS / Vercel / other | No |
| \`project.Q04\` | — | Load profile: tenants, concurrent users, stock changes per second? | Every p95 criterion needs a test load | — | Yes |
| \`project.Q05\` | — | Backend HTTP framework? | Plan-level choice; not needed for specs | Express / Fastify / NestJS | No |
| \`project.Q06\` | — | Coverage floor, availability, RPO/RTO, API versioning policy? | Constitution baselines | — | No |
| \`project.Q07\` | — | Milestone dates, payment split, and access-provisioning dates? | Template shows example values only; commercial terms must come from the parties | — | No |
| \`tenant-role-access.Q01\` | \`tenant-role-access\` | What may Admin, Warehouse Manager, and Picker each do? | Every API's 403 rules depend on it | — | Yes |
| \`tenant-role-access.Q02\` | \`tenant-role-access\` | Can a user belong to several organisations, or be limited to specific warehouses? | JWT claims and every tenant filter | — | Yes |
| \`realtime-stock-updates.Q01\` | \`realtime-stock-updates\` | Which WebSocket library, and how are messages fanned out across server instances with MongoDB as the only datastore? | Delivery guarantees and architecture | Socket.IO / ws; MongoDB change streams | Yes |
| \`sku-search-index.Q01\` | \`sku-search-index\` | Which search mechanism, and which SKU fields are searchable? | Determines whether < 100 ms is achievable on MongoDB alone | MongoDB text index / Atlas Search | Yes |
| \`sku-search-index.Q02\` | \`sku-search-index\` | Is < 100 ms a p95 or maximum, measured server-side or end-to-end, and is 50,000+ per tenant or total? | Makes the SLA testable | — | Yes |
| \`barcode-camera-scan.Q01\` | \`barcode-camera-scan\` | Which barcode symbologies and which mobile browsers / devices must be supported? | Library choice and test matrix | EAN-13, UPC-A, Code 128, QR | Yes |
| \`offline-scanner-sync.Q01\` | \`offline-scanner-sync\` | How are conflicts resolved when offline changes clash with server state, and what is the maximum offline period? | Data integrity on sync; idempotency behaviour | Server wins / last-write-wins / manual review | Yes |
| \`stock-adjustment-audit-log.Q01\` | \`stock-adjustment-audit-log\` | Are audit entries immutable, and what is the retention period? | Defines update/delete behaviour and storage | — | Yes |
| \`stock-adjustment-audit-log.Q02\` | \`stock-adjustment-audit-log\` | Is negative on-hand stock allowed? | Validation and 409 behaviour | Reject / allow | Yes |
| \`stock-adjustment-audit-log.Q03\` | \`stock-adjustment-audit-log\` | Is \`reason\` free text or a predefined list? | Field type and validation | Free text / code list / both | Yes |
| \`stock-adjustment-audit-log.Q04\` | \`stock-adjustment-audit-log\` | Default and maximum page size for audit history? | Pagination contract | — | No |
| \`low-stock-erp-webhook.Q01\` | \`low-stock-erp-webhook\` | Is the threshold per SKU, per warehouse, or per SKU and warehouse? | Data model and trigger logic | — | Yes |
| \`low-stock-erp-webhook.Q02\` | \`low-stock-erp-webhook\` | Should the webhook re-fire while stock stays below threshold? | Prevents duplicate reorders | Once until restocked / every change | Yes |
| \`low-stock-erp-webhook.Q03\` | \`low-stock-erp-webhook\` | Payload format and authentication for SAP and for NetSuite? | Outbound contract cannot be written | — | Yes |
| \`low-stock-erp-webhook.Q04\` | \`low-stock-erp-webhook\` | One ERP connection per tenant or several, and what happens if none is configured? | Data model and AC6 | — | Yes |
| \`low-stock-erp-webhook.Q05\` | \`low-stock-erp-webhook\` | Retry count, backoff, timeout, and alerting on final failure? | Delivery states and AC5 | — | Yes |

### 6.2 Decisions Already Made
- Frontend: Next.js 14 (App Router), React 18, Tailwind CSS, Zustand, Lucide React — *Source: Constraints*
- Backend: Node.js / TypeScript — *Source: Constraints*
- MongoDB is the sole datastore, via Mongoose — *Source: Constraints*
- JWT bearer authentication with refresh tokens — *Source: Constraints*
- Jest + React Testing Library — *Source: Constraints*
- API p95 latency < 150 ms — *Source: Constraints*
- Roles: Admin, Warehouse Manager, Picker — *Source: Requirements*

---

## 7. Traceability Matrix

| Spec ID | Business Rules | API Endpoints | Acceptance Criteria | Unit Tests | Blocking Questions |
| :--- | :--- | :--- | :--- | :--- | :--- |
| \`stock-adjustment-audit-log\` | BR01–BR05 | API01–API02 | AC1–AC7 | UT01–UT05 | Q01, Q02, Q03 |
| \`low-stock-erp-webhook\` | BR01–BR06 | API01–API02 | AC1–AC7 | UT01–UT04 | Q01–Q05 |

---

## 8. Milestones, Deliverables & Timeline

| Milestone ID | Phase Name | Key Deliverables | Estimated Completion | Payment % |
| :---: | :--- | :--- | :---: | :---: |
| **M1** | **Discovery & Spec Sign-off** | All blocking questions closed; one Gate 1–approved \`<slug>.spec.md\` per feature | ⚠️ \`project.Q07\` | ⚠️ \`project.Q07\` |
| **M2** | **Core Backend & APIs** | Mongoose schemas, JWT auth, API endpoints with Jest tests | ⚠️ \`project.Q07\` | ⚠️ \`project.Q07\` |
| **M3** | **Frontend & Integrations** | Dashboard UI, WebSocket updates, barcode scanning, ERP webhooks, offline sync | ⚠️ \`project.Q07\` | ⚠️ \`project.Q07\` |
| **M4** | **UAT & Launch** | UAT traced to AC IDs, security fixes, production go-live | ⚠️ \`project.Q07\` | ⚠️ \`project.Q07\` |

---

## 9. Acceptance Criteria & Quality Gates

A milestone deliverable is considered **Complete & Accepted** only when:

1. **Automated Test Coverage:** Jest + React Testing Library suites pass; coverage floor ⚠️ \`project.Q06\`.
2. **Zero Critical Bugs:** Zero \`P1\` (blocker/crash) or \`P2\` (major functionality broken) issues remaining in UAT.
3. **Performance Metric:** API p95 < 150 ms under the agreed load profile (⚠️ \`project.Q04\`).
4. **SDD Validation:** All generated code mirrors the agreed \`spec.md\` contracts without unapproved deviations.

### 9.1 Definition of Ready (per feature spec, before development)
- [ ] Intent fits in one unambiguous paragraph.
- [ ] Every acceptance criterion is Given / When / Then and individually IDed.
- [ ] API Contract is complete (payload, success shape, exception table).
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
* **Credentials & Access:** Provisioning of ERP sandbox access (SAP / NetSuite), domain access, and cloud console permissions by ⚠️ \`project.Q07\`.
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

**Client:** [Client Company Name — ⚠️ \`project.Q01\`]  
**Signature:** ___________________________  
**Name:** [Client Representative Name]  
**Title:** [Title]  
**Date:** _______________

**Provider:** [Provider Company Name — ⚠️ \`project.Q01\`]  
**Signature:** ___________________________  
**Name:** [Provider Representative Name]  
**Title:** [Title]  
**Date:** _______________
`;
