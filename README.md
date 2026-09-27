# RxResolve — AI-Powered Prescription Refill Resolution Platform

**Tagline:** *Turn stuck refills into resolved care.*

RxResolve is a demo-ready, B2B healthcare SaaS operations platform designed for retail pharmacies, physician practices, and health systems. It automates the investigation, coordination, and human-in-the-loop resolution of stuck prescription refill requests caused by missing clinical information, zero refills remaining, prior authorization requirements, or insurance rejections.

---

> **DEMO ENVIRONMENT NOTICE**  
> **Synthetic Healthcare Operations Data (HIPAA-Safe):** This application utilizes purely synthetic patient names, demographics, medications, and simulated healthcare infrastructure bridges. No real patient health information (PHI) is processed or stored.

---

## 1. Problem & Operational Solution

In modern healthcare operations, millions of prescription refill requests become stuck every day:
- **Zero Refills Remaining:** The pharmacy sends an electronic refill request, but the practice chart shows no remaining authorized refills. The request sits idle in a provider's administrative queue.
- **Missing Clinical Information:** The pharmacy lacks updated dosage instructions, or the practice lacks recent bloodwork/vitals.
- **PBM Prior Authorization Barriers:** Formulary exceptions, step-therapy failures, or insurance rejections halt dispensing.
- **Communication Breakdown:** Staff spend 3–5 hours daily on hold or playing phone tag between pharmacies and clinics.

**RxResolve answers the core operational questions:**
1. *What is happening with this refill?*
2. *Why is it stuck?*
3. *What information is missing?*
4. *Who needs to act?*
5. *What should happen next?*
6. *Did that action actually happen?*
7. *What is the new state?*

---

## 2. Core Architecture & Workflow State Machine

RxResolve implements a deterministic healthcare workflow engine with strict state transition validation and an immutable audit trail.

```
                  NEW
                   ↓
                TRIAGING
                   ↓
             INVESTIGATING
                   ↓
   ┌───────────────┼───────────────┐
   ↓               ↓               ↓
WAITING FOR   WAITING FOR     WAITING FOR
INFORMATION     PROVIDER       PHARMACY
   ↓               ↓               ↓
   └───────────────┼───────────────┘
                   ↓
            ACTION REQUIRED
                   ↓
                RESOLVED
```

*Terminal and exception states:* `ESCALATED`, `FAILED` (with retry buffer), `CANCELLED`.

### State Details
Every state change records:
- **Current Owner:** E.g., Dr. Sarah Wilson (Provider) or Maya Lin (Practice Staff)
- **Root Blocker:** E.g., *No refills remaining* (Provider-related)
- **Required Next Action:** E.g., *Provider review and renewal authorization*
- **SLA Clock:** Dynamic countdown to compliance threshold (e.g., 18.0h remaining)
- **Audit Log Event:** Cryptographically immutable event recorded in MongoDB

---

## 3. Four Authenticated Primary Roles

| Role | Demo User | Title / Org | Core Capabilities |
| :--- | :--- | :--- | :--- |
| **Pharmacy Staff** | Elena Rostova, CPhT | Lead Pharmacy Tech, Downtown Pharmacy | Inbound refill creation, blocker inspection, cross-role inquiries, AI messaging |
| **Practice Staff** | Maya Lin, BSN | Care Coordinator, Downtown Physician Group | Case triage, information unblocking, prior authorization initiation, routing to MD |
| **Provider** | Dr. Sarah Wilson, MD | Attending Physician, Internal Medicine | Human clinical decisions: **Approve Renewal**, **Request Info**, **Require Visit**, **Decline** |
| **Operations Admin** | Marcus Vance | Director of Ops, Metropolitan Health System | Bottleneck tracking, SLA compliance, integration diagnostics, audit ledger |

---

## 4. AI & RAG Architecture

### Controlled Clinical NLP & Safety Guardrails
- **Case Classification & Blocker Detection:** Automatically identifies primary blockers (Provider-related, Information-related, Pharmacy-related, Insurance/PBM, System/Integration) with calibrated confidence scores (e.g., 94%).
- **Operational Priority Scoring:** Computes an objective 0–100 urgency score using time waiting, blocker severity, and SLA headroom. *(Strictly an operational workflow priority score, not a clinical triage risk).*
- **Staff AI Copilot:** Right-side conversational assistant answering questions about why a refill is stuck, what is missing, and who needs to act.
- **RAG Knowledge Base Grounding:** All copilot answers and recommendations cite specific organizational Practice SOPs, Administrative Rules, and Internal SLA Policies.
- **Human-in-the-Loop Attestation:** AI models are explicitly prohibited from approving prescriptions or prescribing medications. All clinical decisions require human provider authorization.

---

## 5. Canonical Demo Scenario Walkthrough (`RX-10482`)

The platform is designed around a seamless 13-step demonstration:

1. **Intake:** Elena Rostova (Pharmacy Staff) submits an inbound refill request for **Alex Johnson** (**Demo Medication 10mg**).
2. **Triaging:** System automatically transitions the request to `TRIAGING`.
3. **AI Classification:** RxResolve AI detects `No refills remaining` with 94% confidence and highlights Practice SOP §4.2.
4. **Recommendation:** AI recommends routing to Downtown Physician Group for provider renewal authorization.
5. **Practice Triage:** Maya Lin (Practice Staff) accepts the AI recommendation and routes to attending physician **Dr. Sarah Wilson**.
6. **Case Transition:** Case advances to `WAITING_FOR_PROVIDER` with an 18-hour SLA clock.
7. **Provider Review:** Dr. Sarah Wilson logs in, opens `RX-10482`, and inspects the AI Operational Summary and chart history.
8. **Clinical Decision:** Provider clicks **Authorize Prescription Renewal** (approves 3 refills/90-day supply).
9. **State Advance:** Case advances to `ACTION_REQUIRED` for electronic dispatch.
10. **Automated Notification:** Dispensing pharmacy receives an instant update in the case communication ledger.
11. **Resolution:** Case moves to `RESOLVED` with documented sign-off.
12. **Audit Logging:** Every transition is immutably appended to the audit ledger.
13. **Analytics Update:** Executive command center KPIs and turnaround metrics update dynamically.

---

## 6. Local Setup & Quick Start

### Prerequisites
- **Node.js:** v18+ (tested on v22.16.0)
- **Python:** 3.10+ (tested on 3.12.1)
- **MongoDB:** Running locally or via dedicated instance on port 27018

### Quick Start Commands

#### 1. Start MongoDB (Dedicated Port 27018)
```powershell
& "C:\Program Files\MongoDB\Server\8.2\bin\mongod.exe" --dbpath "c:\refill\data\db" --port 27018 --bind_ip 127.0.0.1
```

#### 2. Start Backend (FastAPI on Port 8005)
```powershell
cd c:\refill\backend
.\venv\Scripts\Activate.ps1
python -m uvicorn app.main:app --host 0.0.0.0 --port 8005
```

#### 3. Start Frontend (React/Vite on Port 5173)
```powershell
cd c:\refill\frontend
npm run dev
```

Open your browser to: **`http://localhost:5173`**

---

## 7. Demo Accounts & Credentials

Convenient 1-click persona switching is available directly on the login screen and on the top navigation bar:

- **Practice Staff (Default):** `practice@rxresolve.demo` / `demo123`
- **Provider (Attending MD):** `provider@rxresolve.demo` / `demo123`
- **Pharmacy Staff:** `pharmacy@rxresolve.demo` / `demo123`
- **Operations Admin:** `admin@rxresolve.demo` / `demo123`

---

## 8. Interactive OpenAPI / Swagger Documentation

Access the interactive API documentation at:
**`http://localhost:8005/docs`**

Grouped endpoints:
- `/api/auth`: JWT login and 1-click demo role switching
- `/api/cases`: CRUD, state transitions, provider human decisions, and timeline
- `/api/ai`: Blocker analysis, operational summaries, copilot chat, message drafts
- `/api/communications`: Inter-organizational messages with AI draft flags
- `/api/analytics`: Turnaround KPIs, bottleneck breakdown, volume trends, ROI metrics
- `/api/audit`: Immutable append-only audit ledger
- `/api/integrations`: Gateway health telemetry, simulated failure, and retry logic
- `/api/notifications`: Role-targeted alert dispatch
- `/api/knowledge`: RAG SOP documents and policy retrieval

---

## 9. Technology Stack

- **Frontend:** React 18, Vite, TypeScript, Tailwind CSS, Lucide Icons, Recharts
- **Backend:** FastAPI, Python 3.12, Pydantic v2, Motor (Async MongoDB), PyJWT, Uvicorn
- **Database:** MongoDB (20+ synthetic cases, users, organizations, audit logs, SOPs)
- **AI & RAG:** Hybrid Clinical NLP engine + Google Gemini API (`google-genai`) with offline fallback
