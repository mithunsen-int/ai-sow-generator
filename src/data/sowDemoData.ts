// src/data/sowDemoData.ts
// Demo inputs and a sample output so users can see the expected input format
// and what a generated SDD-compliant SOW looks like.

export const DEFAULT_SDD_SYSTEM_PROMPT = `You are a Principal Software Architect and Spec-Driven Development (SDD) Specialist.
Your job is to transform raw requirements and constraints into an extremely rigorous, zero-ambiguity Statement of Work (SOW) structured exactly according to the provided template.

RULES FOR SDD COMPLIANCE:
1. Eliminate all subjective or vague language (e.g., replace "high performance" with "p95 < 150ms").
2. Ensure every feature has a corresponding entry in the Acceptance Criteria table with explicit Given-When-Then criteria.
3. Explicitly define Out-of-Scope items to prevent scope creep.
4. Format the output in pristine Markdown syntax with tables, checklists, bold callouts, and clean formatting.
5. Do NOT include intro/outro conversational text. Return ONLY the Markdown SOW document.`;

export const DEMO_SOW_TEMPLATE = `# Statement of Work (SOW)

**Project Name:** [Project Name]  
**Document ID:** SOW-[YYYYMMDD]-[001]  
**Effective Date:** [MM/DD/YYYY]  
**Client Name:** [Client Company Name]  
**Provider Name:** [Your Company/Agency Name]  

---

## 1. Executive Summary & Core Intent

### 1.1 Project Mission
[High-level summary of what is being built, why it is being built, and the core outcome desired.]

### 1.2 Spec-Driven Development (SDD) Protocol Statement
> **Notice:** This project strictly follows Spec-Driven Development (SDD) principles. All requirements detailed in this SOW represent the ground-truth baseline. No feature execution shall commence until the corresponding technical specification file (\`spec.md\`) is compiled, verified against this SOW, and approved by both parties.

---

## 2. Project Scope & Functional Deliverables

### 2.1 Core Feature Modules

#### Feature Module 1: [e.g., User Authentication & RBAC]
- **Description:** [Concise description]
- **Core User Stories:**
  - *As a* [User Role], *I want to* [Action], *so that* [Benefit].
- **Functional Requirements:**
  - \`REQ-1.1\`: System MUST [Specific action/behavior].
  - \`REQ-1.2\`: System MUST [Specific action/behavior].
- **Acceptance Criteria (Gherkin format):**
  - **Given** [Initial state], **When** [Action], **Then** [Expected result].

#### Feature Module 2: [e.g., Real-time Dashboard]
- **Description:** [Concise description]
- **Functional Requirements:**
  - \`REQ-2.1\`: System MUST [Specific action/behavior].
  - \`REQ-2.2\`: System MUST [Specific action/behavior].
- **Acceptance Criteria:**
  - **Given** [Initial state], **When** [Action], **Then** [Expected result].

---

## 3. Explicit Non-Goals & Out-of-Scope (Zero-Ambiguity Guardrail)

To prevent scope creep and ambiguity during spec generation, the following items are **EXPLICITLY OUT OF SCOPE**:

* \`OUT-1\`: Mobile native applications (iOS/Android) — *Web responsive layout only.*
* \`OUT-2\`: Legacy data migration prior to [Specific Date].
* \`OUT-3\`: Custom AI model training — *Third-party API integration only.*
* \`OUT-4\`: Third-party payment providers other than Stripe.

---

## 4. Technical Architecture & Constraints

| Dimension | Specification Standard |
| :--- | :--- |
| **Frontend Framework** | React 18+ / Next.js (App Router), TypeScript |
| **Backend Framework** | Node.js / Express or Python / FastAPI |
| **Database** | PostgreSQL (Relational) + Redis (Caching) |
| **Authentication** | OAuth 2.0 / Auth0 / Supabase Auth |
| **Hosting & Cloud** | AWS / Vercel / Cloudflare |
| **CI/CD Pipeline** | GitHub Actions with automated linting & test suites |
| **API Architecture** | RESTful with OpenAPI 3.0 / Swagger schema |

---

## 5. System Interoperability & Integration Endpoints

| Third-Party System | Purpose | Auth Protocol | Rate/Cost Limit |
| :--- | :--- | :--- | :--- |
| **Stripe Billing** | Payment Processing | Webhook / API Key | Client Tier Limit |
| **SendGrid** | Transactional Emails | API Key | 10,000 / month |
| **OpenAI / Claude API**| LLM Reasoning Engine | Bearer Token | Usage Capped |

---

## 6. Milestones, Deliverables & Timeline

| Milestone ID | Phase Name | Key Deliverables | Estimated Completion | Payment % |
| :---: | :--- | :--- | :---: | :---: |
| **M1** | **Discovery & Spec Sign-off** | Approved Architecture Diagram, System Schemas, \`spec.md\` | Week 2 | 20% |
| **M2** | **Core Backend & APIs** | Database Schemas, Auth System, API Endpoints & Tests | Week 5 | 30% |
| **M3** | **Frontend & Integrations** | Responsive UI, Third-party integrations, E2E flows | Week 8 | 30% |
| **M4** | **UAT & Launch** | Security audit fixes, Staging deployment, Final Go-Live | Week 10 | 20% |

---

## 7. Acceptance Criteria & Quality Gates

A milestone deliverable is considered **Complete & Accepted** only when:

1. **Automated Test Coverage:** Minimum **80%** unit and integration test coverage across core modules.
2. **Zero Critical Bugs:** Zero \`P1\` (blocker/crash) or \`P2\` (major functionality broken) issues remaining in UAT.
3. **Performance Metric:** Core API response times strictly < 200ms at 95th percentile under standard load.
4. **SDD Validation:** All generated code mirrors the agreed \`spec.md\` contracts without unapproved deviations.

---

## 8. Client Responsibilities & Dependencies

The project timeline depends on the Client providing the following dependencies:

* **Single Point of Contact (SPOC):** Appointment of a Product Owner with decision-making authority within 48 hours of request.
* **Credentials & Access:** Provisioning of API keys, domain access, and cloud console permissions by **[Date]**.
* **UAT Review Window:** Turnaround time for milestone testing and feedback within **3 business days** of release.

---

## 9. Change Management Procedure

Any request to modify the scope, technical architecture, or deliverables outlined in this SOW must follow the formal **Change Order Process**:

1. **Impact Analysis:** Provider evaluates time, cost, and spec complexity impact.
2. **Written Sign-off:** Both parties must sign a formal **Change Request Form (CRF)** before execution begins.
3. **Spec Alignment:** Relevant \`spec.md\` files are updated to reflect the new scope prior to coding.

---

## 10. Authorization & Signatures

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
): string => `# STATEMENT OF WORK (SOW)
## Project: Multi-Tenant Inventory & Real-Time Stock Management Dashboard
**Document Version:** 1.0.0-SDD
**Date:** ${date}
**Status:** APPROVED FOR SPEC GENERATION
**Compliance Level:** Zero-Ambiguity Spec-Driven Development (SDD)

> This is a **sample output** generated from the demo inputs. Click "Create SOW" to generate your own.

---

### 1. Executive Summary & Core Purpose
This Statement of Work establishes the immutable technical contract for building the **Next-Gen Inventory & Real-Time Management System**.
- **Objective:** Deploy a modern multi-tenant inventory architecture with real-time updates and sub-100ms search latency.
- **Primary Business Outcome:** Achieve zero stock discrepancy with real-time sync across multi-tenant locations.

---

### 2. High-Level Scope & SDD Guiding Principles
This project strictly enforces **Spec-Driven Development (SDD)**:
1. **Contract First:** Code generation and tests are derived exclusively from this spec.
2. **Zero Assumptions:** Unstated requirements are treated as non-existent.
3. **Strict Validation:** Every endpoint must adhere to JSON Schema boundaries.

---

### 3. Detailed Module Specifications & API Endpoints
#### Module A: Multi-Tenant Core & Authentication
- **Requirement:** Tenant isolation using PostgreSQL Row Level Security (RLS).
- **Endpoint:** \`GET /api/v1/tenants/current\`
- **Constraint:** Auth token must carry \`tenant_id\` claims.

#### Module B: Real-Time Stock Engine
- **Requirement:** Low-latency WebSocket pub-sub stock updates.
- **Protocol:** WebSocket WSS endpoint at \`/ws/stock-updates\`.
- **SLA Target:** Broadcast delivery < 50ms across active tenants.

---

### 4. Technical Stack & Infrastructure Constraints
- **Frontend Stack:** Next.js 14 (App Router), Tailwind CSS, Zustand state store.
- **Backend Infrastructure:** Node.js TypeScript microservices, Supabase/PostgreSQL with Redis caching.
- **Latency SLA:** p95 API response time strictly < 150ms.

---

### 5. Non-Goals & Strict Out-of-Scope Items
*To prevent scope creep, the following items are explicitly OUT OF SCOPE:*
- Third-party courier tracking native integrations.
- Payment terminal physical integration hardware.
- Custom legacy ERP data transformation services outside defined webhook payloads.

---

### 6. SDD Definition of Done (DoD)
- [x] OpenAPI 3.0 specification generated and frozen.
- [x] Unit test coverage >= 85% with zero failing edge cases.
- [x] Automated latency benchmark pipeline validation (<150ms).

---

### 7. Verifiable Acceptance Criteria
| ID | Feature | Given - When - Then Scenario | Verification |
|---|---|---|---|
| AC-101 | Multi-tenant Stock Update | Given Tenant A & B, when Tenant A updates stock SKU-99, then Tenant B receives NO socket payload. | Automated Integration Test |
| AC-102 | Search SLA | Given 50k items, when query executed, then results returned in < 100ms. | k6 Benchmark Test |

---

### 8. Project Deliverables & Milestones
1. **Milestone 1:** SDD Specification Approval & Database Schema Definition
2. **Milestone 2:** WebSocket Core & High-Performance Search Pipeline
3. **Milestone 3:** Final Validation, Security Audit & Handover
`;
