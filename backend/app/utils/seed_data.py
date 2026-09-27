import uuid
from datetime import datetime, timedelta
import logging
from app.database import get_database
from app.services.rag_service import DEMO_KNOWLEDGE_DOCUMENTS

logger = logging.getLogger("rxresolve.seed")

DEMO_USERS = [
    {
        "id": "usr-pharm-01",
        "email": "pharmacy@rxresolve.demo",
        "name": "Elena Rostova, CPhT",
        "role": "PHARMACY_STAFF",
        "role_title": "Lead Pharmacy Technician",
        "organization_id": "org-pharm-01",
        "organization_name": "Downtown Pharmacy",
        "organization_type": "PHARMACY",
        "avatar": "https://images.unsplash.com/photo-1594824813583-30f14652c206?w=150"
    },
    {
        "id": "usr-pract-01",
        "email": "practice@rxresolve.demo",
        "name": "Maya Lin, BSN",
        "role": "PRACTICE_STAFF",
        "role_title": "Practice Care Coordinator",
        "organization_id": "org-pract-01",
        "organization_name": "Downtown Physician Group",
        "organization_type": "PRACTICE",
        "avatar": "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150"
    },
    {
        "id": "usr-prov-01",
        "email": "provider@rxresolve.demo",
        "name": "Dr. Sarah Wilson, MD",
        "role": "PROVIDER",
        "role_title": "Attending Physician, Internal Medicine",
        "organization_id": "org-pract-01",
        "organization_name": "Downtown Physician Group",
        "organization_type": "PRACTICE",
        "avatar": "https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=150"
    },
    {
        "id": "usr-admin-01",
        "email": "admin@rxresolve.demo",
        "name": "Marcus Vance",
        "role": "ADMIN",
        "role_title": "Director of Clinical Operations",
        "organization_id": "org-healthsys-01",
        "organization_name": "Metropolitan Health System",
        "organization_type": "HEALTH_SYSTEM",
        "avatar": "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150"
    }
]

DEMO_ORGANIZATIONS = [
    {"id": "org-pharm-01", "name": "Downtown Pharmacy", "type": "PHARMACY", "locations_count": 4},
    {"id": "org-pract-01", "name": "Downtown Physician Group", "type": "PRACTICE", "locations_count": 8},
    {"id": "org-healthsys-01", "name": "Metropolitan Health System", "type": "HEALTH_SYSTEM", "locations_count": 22},
    {"id": "org-pharm-02", "name": "MetroCare Community Pharmacy", "type": "PHARMACY", "locations_count": 2},
    {"id": "org-pract-02", "name": "Bayside Family Health", "type": "PRACTICE", "locations_count": 5}
]

DEMO_INTEGRATIONS = [
    {
        "id": "int-ehr",
        "name": "EHR Clinical Bridge (Epic / Cerner FHIR)",
        "category": "EHR",
        "protocol": "FHIR R4 / US Core STU3",
        "status": "HEALTHY",
        "latency_ms": 38,
        "success_rate": 99.8,
        "last_sync": datetime.utcnow(),
        "simulate_failure": False,
        "details": {"endpoint": "https://fhir.epic.sandbox.net/r4", "auth": "OAuth2 Smart-on-FHIR", "cached_patients": 4820}
    },
    {
        "id": "int-pharmacy",
        "name": "National Pharmacy Network (Surescripts)",
        "category": "Pharmacy Network",
        "protocol": "NCPDP SCRIPT Standard 2017071",
        "status": "HEALTHY",
        "latency_ms": 74,
        "success_rate": 99.2,
        "last_sync": datetime.utcnow(),
        "simulate_failure": False,
        "details": {"endpoint": "https://directory.surescripts.net/ncpdp", "transaction_type": "RxChange / RefReq", "active_pharmacies": 184}
    },
    {
        "id": "int-insurance",
        "name": "PBM Real-Time Benefit & Prior Auth",
        "category": "Insurance/PBM",
        "protocol": "X12 278 / ePA NCPDP",
        "status": "DEGRADED",
        "latency_ms": 1420,
        "success_rate": 84.6,
        "last_sync": datetime.utcnow() - timedelta(minutes=14),
        "last_error": "PBM gateway timeout on transaction 278-PA-9921",
        "simulate_failure": True,
        "details": {"endpoint": "https://gateway.covermymeds.com/v1", "payer_id": "BCBS_IL_60054", "retry_policy": "Exponential Backoff (3 retries)"}
    },
    {
        "id": "int-notifications",
        "name": "Clinical Alerting & Webhooks",
        "category": "Notifications",
        "protocol": "Secure WebSocket & Twilio SMS",
        "status": "HEALTHY",
        "latency_ms": 19,
        "success_rate": 100.0,
        "last_sync": datetime.utcnow(),
        "simulate_failure": False,
        "details": {"sms_queue_active": True, "websocket_channels": 4}
    },
    {
        "id": "int-ai",
        "name": "RxResolve Clinical NLP Engine",
        "category": "AI Engine",
        "protocol": "Gemini 2.5 Flash / Local Clinical Model",
        "status": "HEALTHY",
        "latency_ms": 110,
        "success_rate": 99.9,
        "last_sync": datetime.utcnow(),
        "simulate_failure": False,
        "details": {"model": "Hybrid (Rule-based Clinical NLP + Gemini)", "safety_guardrails": "Enforced: No Direct Prescribing"}
    },
    {
        "id": "int-rag",
        "name": "Organizational Knowledge Base (RAG)",
        "category": "RAG Engine",
        "protocol": "Vector & Semantic Lexical Hybrid",
        "status": "HEALTHY",
        "latency_ms": 24,
        "success_rate": 100.0,
        "last_sync": datetime.utcnow(),
        "simulate_failure": False,
        "details": {"indexed_documents": 6, "categories": ["Practice SOPs", "Administrative Rules", "Internal Workflow Rules"]}
    }
]

async def seed_database():
    db = get_database()
    if db is None:
        logger.warning("MongoDB not ready; skipping seed.")
        return

    # Check if already seeded with canonical case
    existing = await db.refill_cases.find_one({"id": "RX-10482"})
    if existing:
        logger.info("Database already seeded with demo data.")
        return

    logger.info("Seeding MongoDB with demo healthcare data...")

    # Drop old collections to ensure clean state
    await db.users.delete_many({})
    await db.organizations.delete_many({})
    await db.integrations.delete_many({})
    await db.knowledge_documents.delete_many({})
    await db.refill_cases.delete_many({})
    await db.case_events.delete_many({})
    await db.communications.delete_many({})
    await db.notifications.delete_many({})
    await db.audit_logs.delete_many({})

    # 1. Seed Users & Orgs
    await db.users.insert_many(DEMO_USERS)
    await db.organizations.insert_many(DEMO_ORGANIZATIONS)
    await db.integrations.insert_many(DEMO_INTEGRATIONS)
    await db.knowledge_documents.insert_many(DEMO_KNOWLEDGE_DOCUMENTS)

    # 2. Seed Cases
    now = datetime.utcnow()

    # Case 1: THE DEMO HERO CASE (RX-10482)
    hero_case = {
        "id": "RX-10482",
        "patient_id": "pat-10482",
        "patient_name": "Alex Johnson",
        "patient_dob": "1988-04-14",
        "patient_phone": "555-014-8821",
        "medication_id": "med-01",
        "medication_name": "Demo Medication 10mg",
        "dosage": "10mg PO Daily",
        "quantity": 30,
        "days_supply": 30,
        "refills_requested": 1,
        "refills_remaining": 0,
        "last_fill_date": "2026-07-12",
        "pharmacy_id": "org-pharm-01",
        "pharmacy_name": "Downtown Pharmacy",
        "pharmacy_phone": "555-321-9988",
        "practice_id": "org-pract-01",
        "practice_name": "Downtown Physician Group",
        "provider_id": "usr-prov-01",
        "provider_name": "Dr. Sarah Wilson",
        "status": "WAITING_FOR_PROVIDER",
        "previous_status": "INVESTIGATING",
        "last_status_reason": "No refills remaining; provider authorization required",
        "blocker": "No refills remaining",
        "blocker_category": "Provider-related",
        "priority": "HIGH",
        "priority_score": 78,
        "owner_id": "usr-prov-01",
        "owner_name": "Dr. Sarah Wilson",
        "owner_role": "PROVIDER",
        "required_next_action": "Provider review required",
        "sla_deadline": now + timedelta(hours=18),
        "sla_hours_remaining": 18.0,
        "sla_status": "HEALTHY",
        "information_completeness": {
            "patient_info": True,
            "medication_info": True,
            "pharmacy_info": True,
            "prescription_details": True,
            "provider_info": True,
            "required_review_completed": False,
            "details": {
                "patient": "Alex Johnson (DOB: 1988-04-14) - Chart Active",
                "medication": "Demo Medication 10mg (NDC: 43598-012-30)",
                "pharmacy": "Downtown Pharmacy (NPI: 1942857102)",
                "provider": "Dr. Sarah Wilson (NPI: 1092837411)"
            }
        },
        "ai_analysis": {
            "blocker": "Provider authorization",
            "category": "Provider-related",
            "confidence": 0.94,
            "recommended_action": "Route to physician practice for provider review.",
            "recommended_role": "PROVIDER",
            "operational_priority": "High",
            "reasoning": "Existing prescription has no refills remaining. Provider clinical sign-off is required under SOP §4.2.",
            "summary": "Refill request received from Downtown Pharmacy. Existing prescription has no refills remaining. Provider authorization is required. Patient information and pharmacy information are complete. Case has been waiting for provider review.",
            "rag_sources": [
                {
                    "source": "Practice Refill SOP §4.2",
                    "title": "Provider Authorization & Refill Sign-Off Policy",
                    "category": "Practice SOPs",
                    "snippet": "When an existing prescription has zero (0) refills remaining, standard protocol dictates that an explicit provider authorization is required..."
                }
            ],
            "created_at": now - timedelta(hours=2)
        },
        "notes": "Patient Alex Johnson taking Demo Medication 10mg maintenance. Refills exhausted.",
        "created_at": now - timedelta(hours=6),
        "updated_at": now - timedelta(hours=1)
    }

    # Events for Hero Case (Matches the prompt demo flow!)
    hero_events = [
        {
            "id": "evt-01",
            "case_id": "RX-10482",
            "actor_id": "usr-pharm-01",
            "actor_name": "Elena Rostova, CPhT",
            "actor_role": "PHARMACY_STAFF",
            "action": "SUBMIT_REFILL_REQUEST",
            "from_status": None,
            "to_status": "NEW",
            "note": "Refill request submitted from Downtown Pharmacy via Surescripts e-Prescribe portal.",
            "timestamp": now - timedelta(hours=6),
            "details": {"channel": "NCPDP Electronic"}
        },
        {
            "id": "evt-02",
            "case_id": "RX-10482",
            "actor_id": "system-ai",
            "actor_name": "RxResolve AI",
            "actor_role": "SYSTEM",
            "action": "AI_BLOCKER_CLASSIFIED",
            "from_status": "NEW",
            "to_status": "TRIAGING",
            "note": "AI identified primary blocker: 'No refills remaining' with 94% confidence. Recommended routing: Practice Staff.",
            "timestamp": now - timedelta(hours=5, minutes=58),
            "details": {"confidence": 0.94, "blocker": "No refills remaining"}
        },
        {
            "id": "evt-03",
            "case_id": "RX-10482",
            "actor_id": "system-ai",
            "actor_name": "RxResolve Orchestrator",
            "actor_role": "SYSTEM",
            "action": "ROUTE_TO_PRACTICE",
            "from_status": "TRIAGING",
            "to_status": "INVESTIGATING",
            "note": "Case assigned to Downtown Physician Group care coordinator queue.",
            "timestamp": now - timedelta(hours=5, minutes=50),
            "details": {"target_org": "Downtown Physician Group"}
        },
        {
            "id": "evt-04",
            "case_id": "RX-10482",
            "actor_id": "usr-pract-01",
            "actor_name": "Maya Lin, BSN",
            "actor_role": "PRACTICE_STAFF",
            "action": "PRACTICE_STAFF_TRIAGE",
            "from_status": "INVESTIGATING",
            "to_status": "WAITING_FOR_PROVIDER",
            "note": "Reviewed chart. Verified last encounter was 4 months ago. Routing to Dr. Sarah Wilson for renewal authorization.",
            "timestamp": now - timedelta(hours=4),
            "details": {"assigned_provider": "Dr. Sarah Wilson"}
        },
        {
            "id": "evt-05",
            "case_id": "RX-10482",
            "actor_id": "system-ai",
            "actor_name": "RxResolve Workflow",
            "actor_role": "SYSTEM",
            "action": "SLA_MONITOR_ACTIVE",
            "from_status": "WAITING_FOR_PROVIDER",
            "to_status": "WAITING_FOR_PROVIDER",
            "note": "SLA clock running: 18 hours remaining for provider turnaround.",
            "timestamp": now - timedelta(hours=2),
            "details": {"sla_hours_remaining": 18.0}
        }
    ]

    # Initial communication for Hero Case
    hero_comms = [
        {
            "id": "comm-01",
            "case_id": "RX-10482",
            "sender_id": "usr-pharm-01",
            "sender_name": "Elena Rostova, CPhT",
            "sender_role": "PHARMACY_STAFF",
            "sender_org": "Downtown Pharmacy",
            "recipient_role": "PRACTICE_STAFF",
            "content": "Patient Alex Johnson presented at the counter. Demo Medication 10mg shows 0 refills remaining on original Rx. Patient has 2 doses left at home.",
            "is_ai_drafted": False,
            "reviewed_by_human": True,
            "attachments": ["rx_scan_10482.pdf"],
            "timestamp": now - timedelta(hours=5, minutes=55)
        },
        {
            "id": "comm-02",
            "case_id": "RX-10482",
            "sender_id": "usr-pract-01",
            "sender_name": "Maya Lin, BSN",
            "sender_role": "PRACTICE_STAFF",
            "sender_org": "Downtown Physician Group",
            "recipient_role": "PHARMACY_STAFF",
            "content": "Thank you Elena. I reviewed Alex's chart; recent bloodwork is up to date. I have routed the authorization directly to Dr. Sarah Wilson for sign-off today.",
            "is_ai_drafted": True,
            "ai_confidence": 0.95,
            "reviewed_by_human": True,
            "attachments": [],
            "timestamp": now - timedelta(hours=3, minutes=45)
        }
    ]

    # Initial audit logs for Hero Case
    hero_audits = [
        {
            "id": "aud-01",
            "timestamp": now - timedelta(hours=6),
            "case_id": "RX-10482",
            "actor_type": "HUMAN",
            "actor_id": "usr-pharm-01",
            "actor_name": "Elena Rostova, CPhT",
            "actor_role": "PHARMACY_STAFF",
            "action": "CREATE_REFILL_CASE",
            "event_type": "CASE_CREATION",
            "previous_state": None,
            "new_state": "NEW",
            "confidence": 1.0,
            "details": {"source": "Surescripts Portal", "patient": "Alex Johnson"}
        },
        {
            "id": "aud-02",
            "timestamp": now - timedelta(hours=5, minutes=58),
            "case_id": "RX-10482",
            "actor_type": "AI",
            "actor_id": "rxresolve-ai",
            "actor_name": "RxResolve AI",
            "actor_role": "SYSTEM",
            "action": "BLOCKER_CLASSIFIED",
            "event_type": "AI_INFERENCE",
            "previous_state": "NEW",
            "new_state": "TRIAGING",
            "confidence": 0.94,
            "details": {
                "primary_blocker": "No refills remaining",
                "category": "Provider-related",
                "recommended_routing": "Practice Staff"
            }
        },
        {
            "id": "aud-03",
            "timestamp": now - timedelta(hours=4),
            "case_id": "RX-10482",
            "actor_type": "HUMAN",
            "actor_id": "usr-pract-01",
            "actor_name": "Maya Lin, BSN",
            "actor_role": "PRACTICE_STAFF",
            "action": "ROUTE_TO_PROVIDER",
            "event_type": "WORKFLOW_TRANSITION",
            "previous_state": "INVESTIGATING",
            "new_state": "WAITING_FOR_PROVIDER",
            "confidence": 1.0,
            "details": {
                "assigned_provider": "Dr. Sarah Wilson",
                "sla_window": "24h"
            }
        }
    ]

    cases_to_insert = [hero_case]
    events_to_insert = list(hero_events)
    comms_to_insert = list(hero_comms)
    audits_to_insert = list(hero_audits)

    # 19 additional synthetic cases representing rich healthcare operations diversity
    synthetic_case_configs = [
        {
            "id": "RX-10483",
            "patient": "Marcus Thorne", "dob": "1975-11-20",
            "med": "Atorvastatin 40mg", "dosage": "40mg PO QPM",
            "pharm": "Downtown Pharmacy", "dr": "Dr. Sarah Wilson",
            "status": "WAITING_FOR_PROVIDER", "blocker": "No refills remaining", "cat": "Provider-related",
            "priority": "MEDIUM", "sla_hrs": 14.5, "score": 55,
            "action": "Provider review required"
        },
        {
            "id": "RX-10484",
            "patient": "Eleanor Vance", "dob": "1962-03-09",
            "med": "Ozempic 1mg/dose Pen", "dosage": "1mg SQ Weekly",
            "pharm": "MetroCare Community Pharmacy", "dr": "Dr. Sarah Wilson",
            "status": "WAITING_FOR_INSURANCE", "blocker": "Prior authorization required", "cat": "Insurance/administrative",
            "priority": "HIGH", "sla_hrs": 6.2, "score": 75,
            "action": "Submit ePA criteria to payer"
        },
        {
            "id": "RX-10485",
            "patient": "Carlos Mendez", "dob": "1994-08-30",
            "med": "Amoxicillin 875mg", "dosage": "875mg PO BID x 10d",
            "pharm": "Downtown Pharmacy", "dr": "Dr. Sarah Wilson",
            "status": "WAITING_FOR_PHARMACY", "blocker": "Quantity clarification", "cat": "Pharmacy-related",
            "priority": "MEDIUM", "sla_hrs": 21.0, "score": 45,
            "action": "Awaiting pharmacy response on dispensed packaging"
        },
        {
            "id": "RX-10486",
            "patient": "Patricia Dubois", "dob": "1958-12-14",
            "med": "Lisinopril 20mg", "dosage": "20mg PO Daily",
            "pharm": "MetroCare Community Pharmacy", "dr": "Dr. Sarah Wilson",
            "status": "WAITING_FOR_INFORMATION", "blocker": "Missing patient information", "cat": "Information-related",
            "priority": "MEDIUM", "sla_hrs": 12.0, "score": 50,
            "action": "Obtain updated insurance member ID"
        },
        {
            "id": "RX-10487",
            "patient": "David Kim", "dob": "1983-05-18",
            "med": "Sertraline 50mg", "dosage": "50mg PO Daily",
            "pharm": "Downtown Pharmacy", "dr": "Dr. Sarah Wilson",
            "status": "ACTION_REQUIRED", "blocker": "Provider authorization required", "cat": "Provider-related",
            "priority": "HIGH", "sla_hrs": 2.5, "score": 85,
            "action": "Provider approved; dispatch electronic script"
        },
        {
            "id": "RX-10488",
            "patient": "Rachel Green", "dob": "1990-09-02",
            "med": "Albuterol HFA Inhaler", "dosage": "2 puffs Q4-6H PRN",
            "pharm": "Downtown Pharmacy", "dr": "Dr. Sarah Wilson",
            "status": "RESOLVED", "blocker": "No refills remaining", "cat": "Provider-related",
            "priority": "LOW", "sla_hrs": 0.0, "score": 20,
            "action": "Resolved: Authorized 2 refills (dispensed)"
        },
        {
            "id": "RX-10489",
            "patient": "Harold Finch", "dob": "1960-01-25",
            "med": "Metformin 500mg ER", "dosage": "500mg PO Daily with dinner",
            "pharm": "MetroCare Community Pharmacy", "dr": "Dr. Sarah Wilson",
            "status": "RESOLVED", "blocker": "No refills remaining", "cat": "Provider-related",
            "priority": "LOW", "sla_hrs": 0.0, "score": 25,
            "action": "Resolved: Authorized 3 refills"
        },
        {
            "id": "RX-10490",
            "patient": "Sophia Al-Mansoor", "dob": "1995-07-11",
            "med": "Vyvanse 30mg", "dosage": "30mg PO QAM",
            "pharm": "Downtown Pharmacy", "dr": "Dr. Sarah Wilson",
            "status": "ESCALATED", "blocker": "Patient visit may be required", "cat": "Provider-related",
            "priority": "CRITICAL", "sla_hrs": 1.0, "score": 92,
            "action": "Controlled substance protocol: Schedule clinic encounter"
        },
        {
            "id": "RX-10491",
            "patient": "Liam O'Connor", "dob": "1972-04-03",
            "med": "Amlodipine 5mg", "dosage": "5mg PO Daily",
            "pharm": "Downtown Pharmacy", "dr": "Dr. Sarah Wilson",
            "status": "FAILED", "blocker": "EHR unavailable", "cat": "System/integration",
            "priority": "CRITICAL", "sla_hrs": 0.5, "score": 95,
            "action": "EHR FHIR gateway timed out; retrying safely"
        },
        {
            "id": "RX-10492",
            "patient": "Beatrice Potter", "dob": "1950-10-19",
            "med": "Levothyroxine 75mcg", "dosage": "75mcg PO QAM on empty stomach",
            "pharm": "MetroCare Community Pharmacy", "dr": "Dr. Sarah Wilson",
            "status": "INVESTIGATING", "blocker": "Clinical information requires review", "cat": "Provider-related",
            "priority": "MEDIUM", "sla_hrs": 16.0, "score": 48,
            "action": "Review latest TSH lab panel before sign-off"
        },
        {
            "id": "RX-10493",
            "patient": "Jamal Washington", "dob": "1987-12-01",
            "med": "Duloxetine 60mg", "dosage": "60mg PO Daily",
            "pharm": "Downtown Pharmacy", "dr": "Dr. Sarah Wilson",
            "status": "TRIAGING", "blocker": "No refills remaining", "cat": "Provider-related",
            "priority": "HIGH", "sla_hrs": 23.5, "score": 62,
            "action": "Classify blocker & assign care coordinator"
        },
        {
            "id": "RX-10494",
            "patient": "Grace Hopper", "dob": "1966-06-15",
            "med": "Eliquis 5mg", "dosage": "5mg PO BID",
            "pharm": "Downtown Pharmacy", "dr": "Dr. Sarah Wilson",
            "status": "WAITING_FOR_PROVIDER", "blocker": "Prescription expired", "cat": "Provider-related",
            "priority": "HIGH", "sla_hrs": 8.0, "score": 79,
            "action": "Provider review: Anticoagulant renewal requires new Rx"
        },
        {
            "id": "RX-10495",
            "patient": "Ethan Hunt", "dob": "1980-02-28",
            "med": "Omeprazole 20mg", "dosage": "20mg PO QAM AC",
            "pharm": "MetroCare Community Pharmacy", "dr": "Dr. Sarah Wilson",
            "status": "RESOLVED", "blocker": "No refills remaining", "cat": "Provider-related",
            "priority": "LOW", "sla_hrs": 0.0, "score": 15,
            "action": "Resolved: Authorized 90-day renewal"
        },
        {
            "id": "RX-10496",
            "patient": "Chloe Bennett", "dob": "1998-11-04",
            "med": "Trelegy Ellipta 100mcg", "dosage": "1 inhalation daily",
            "pharm": "Downtown Pharmacy", "dr": "Dr. Sarah Wilson",
            "status": "WAITING_FOR_INSURANCE", "blocker": "Insurance rejection", "cat": "Insurance/administrative",
            "priority": "HIGH", "sla_hrs": 5.0, "score": 72,
            "action": "Payer requires alternative formulary inhaler"
        },
        {
            "id": "RX-10497",
            "patient": "Oliver Queen", "dob": "1985-05-16",
            "med": "Hydrochlorothiazide 25mg", "dosage": "25mg PO Daily",
            "pharm": "Downtown Pharmacy", "dr": "Dr. Sarah Wilson",
            "status": "WAITING_FOR_INFORMATION", "blocker": "Missing prescription information", "cat": "Information-related",
            "priority": "MEDIUM", "sla_hrs": 19.0, "score": 40,
            "action": "Verify day supply calculation with pharmacy"
        },
        {
            "id": "RX-10498",
            "patient": "Natasha Romanoff", "dob": "1989-11-22",
            "med": "Gabapentin 300mg", "dosage": "300mg PO TID",
            "pharm": "MetroCare Community Pharmacy", "dr": "Dr. Sarah Wilson",
            "status": "WAITING_FOR_PROVIDER", "blocker": "Provider review required", "cat": "Provider-related",
            "priority": "HIGH", "sla_hrs": 11.0, "score": 70,
            "action": "Provider review: Renal function clearance review"
        },
        {
            "id": "RX-10499",
            "patient": "Bruce Wayne", "dob": "1978-03-30",
            "med": "Losartan 50mg", "dosage": "50mg PO Daily",
            "pharm": "Downtown Pharmacy", "dr": "Dr. Sarah Wilson",
            "status": "ACTION_REQUIRED", "blocker": "Provider authorization required", "cat": "Provider-related",
            "priority": "HIGH", "sla_hrs": 3.0, "score": 80,
            "action": "Staff dispatching renewal authorization to Downtown Pharmacy"
        },
        {
            "id": "RX-10500",
            "patient": "Diana Prince", "dob": "1991-04-12",
            "med": "Sumatriptan 50mg", "dosage": "50mg PO at onset of migraine",
            "pharm": "Downtown Pharmacy", "dr": "Dr. Sarah Wilson",
            "status": "RESOLVED", "blocker": "Quantity clarification", "cat": "Pharmacy-related",
            "priority": "LOW", "sla_hrs": 0.0, "score": 20,
            "action": "Resolved: Clarified 9 tabs/month limit"
        },
        {
            "id": "RX-10501",
            "patient": "Barry Allen", "dob": "1992-09-30",
            "med": "Montelukast 10mg", "dosage": "10mg PO QHS",
            "pharm": "MetroCare Community Pharmacy", "dr": "Dr. Sarah Wilson",
            "status": "NEW", "blocker": "No refills remaining", "cat": "Provider-related",
            "priority": "MEDIUM", "sla_hrs": 24.0, "score": 45,
            "action": "Pending automated triage intake"
        }
    ]

    for c in synthetic_case_configs:
        cid = c["id"]
        is_resolved = c["status"] == "RESOLVED"
        sla_hrs = c["sla_hrs"]
        sla_stat = "BREACHED" if sla_hrs < 2 and not is_resolved else ("WARNING" if sla_hrs < 8 and not is_resolved else "HEALTHY")
        
        # Build completeness
        comp = {
            "patient_info": "patient" not in c["blocker"].lower(),
            "medication_info": "medication" not in c["blocker"].lower(),
            "pharmacy_info": True,
            "prescription_details": "prescription" not in c["blocker"].lower(),
            "provider_info": True,
            "required_review_completed": is_resolved,
            "details": {
                "patient": f"{c['patient']} (DOB: {c['dob']})",
                "medication": f"{c['med']} - Prescribed",
                "pharmacy": f"{c['pharm']} (Verified)",
                "provider": f"{c['dr']} (Attending)"
            }
        }

        case_obj = {
            "id": cid,
            "patient_id": f"pat-{cid.lower()}",
            "patient_name": c["patient"],
            "patient_dob": c["dob"],
            "patient_phone": "555-019-2041",
            "medication_id": f"med-{cid.lower()}",
            "medication_name": c["med"],
            "dosage": c["dosage"],
            "quantity": 30,
            "days_supply": 30,
            "refills_requested": 1,
            "refills_remaining": 0 if "refills" in c["blocker"].lower() else 1,
            "last_fill_date": "2026-06-18",
            "pharmacy_id": "org-pharm-01" if "Downtown" in c["pharm"] else "org-pharm-02",
            "pharmacy_name": c["pharm"],
            "pharmacy_phone": "555-321-9988",
            "practice_id": "org-pract-01",
            "practice_name": "Downtown Physician Group",
            "provider_id": "usr-prov-01",
            "provider_name": c["dr"],
            "status": c["status"],
            "previous_status": "TRIAGING",
            "last_status_reason": c["blocker"],
            "blocker": c["blocker"],
            "blocker_category": c["cat"],
            "priority": c["priority"],
            "priority_score": c["score"],
            "owner_id": "usr-prov-01" if "PROVIDER" in c["status"] else "usr-pract-01",
            "owner_name": c["dr"] if "PROVIDER" in c["status"] else "Maya Lin, BSN",
            "owner_role": "PROVIDER" if "PROVIDER" in c["status"] else "PRACTICE_STAFF",
            "required_next_action": c["action"],
            "sla_deadline": now + timedelta(hours=sla_hrs),
            "sla_hours_remaining": sla_hrs,
            "sla_status": sla_stat,
            "information_completeness": comp,
            "ai_analysis": {
                "blocker": c["blocker"],
                "category": c["cat"],
                "confidence": 0.92,
                "recommended_action": c["action"],
                "recommended_role": "PROVIDER" if "provider" in c["cat"].lower() else "PRACTICE_STAFF",
                "operational_priority": c["priority"],
                "reasoning": f"Identified {c['blocker']} under category {c['cat']}. Requires operational intervention.",
                "summary": f"Refill case for {c['patient']} ({c['med']}). Current blocker: {c['blocker']}.",
                "rag_sources": [
                    {
                        "source": "Practice Refill SOP §4.2",
                        "title": "Refill Operational Guideline",
                        "category": "Practice SOPs",
                        "snippet": "Adhere to standard practice turnarounds and provider review protocols."
                    }
                ],
                "created_at": now - timedelta(hours=3)
            },
            "notes": f"Automated intake for {c['patient']}. Medication: {c['med']}.",
            "created_at": now - timedelta(hours=12),
            "updated_at": now - timedelta(hours=1),
            "resolved_at": now - timedelta(hours=1) if is_resolved else None,
            "resolution_notes": "Prescription authorized and transmitted via Surescripts" if is_resolved else None
        }
        cases_to_insert.append(case_obj)

        # Event
        events_to_insert.append({
            "id": f"evt-{cid.lower()}-1",
            "case_id": cid,
            "actor_id": "usr-pharm-01",
            "actor_name": "Elena Rostova, CPhT",
            "actor_role": "PHARMACY_STAFF",
            "action": "SUBMIT_REFILL_REQUEST",
            "from_status": None,
            "to_status": "NEW",
            "note": f"Initial refill transmission received from {c['pharm']}.",
            "timestamp": now - timedelta(hours=12),
            "details": {}
        })

        if c["status"] != "NEW":
            events_to_insert.append({
                "id": f"evt-{cid.lower()}-2",
                "case_id": cid,
                "actor_id": "system-ai",
                "actor_name": "RxResolve AI",
                "actor_role": "SYSTEM",
                "action": "BLOCKER_CLASSIFIED",
                "from_status": "NEW",
                "to_status": c["status"],
                "note": f"AI classified blocker: '{c['blocker']}'. Routed to operational owner.",
                "timestamp": now - timedelta(hours=11),
                "details": {"blocker": c["blocker"]}
            })

        # Audit
        audits_to_insert.append({
            "id": f"aud-{cid.lower()}-1",
            "timestamp": now - timedelta(hours=11),
            "case_id": cid,
            "actor_type": "AI",
            "actor_id": "rxresolve-ai",
            "actor_name": "RxResolve AI",
            "actor_role": "SYSTEM",
            "action": "AI_CASE_CLASSIFIED",
            "event_type": "AI_INFERENCE",
            "previous_state": "NEW",
            "new_state": c["status"],
            "confidence": 0.92,
            "details": {"blocker": c["blocker"], "category": c["cat"]}
        })

    await db.refill_cases.insert_many(cases_to_insert)
    await db.case_events.insert_many(events_to_insert)
    await db.communications.insert_many(comms_to_insert)
    await db.audit_logs.insert_many(audits_to_insert)

    # Add initial notifications
    notifications = [
        {
            "id": "notif-01",
            "recipient_role": "PROVIDER",
            "case_id": "RX-10482",
            "title": "Provider Review Required: Alex Johnson",
            "message": "Demo Medication 10mg refill request awaiting clinical authorization. 18 hours remaining.",
            "priority": "HIGH",
            "read": False,
            "action_url": "/cases/RX-10482",
            "timestamp": now - timedelta(minutes=45)
        },
        {
            "id": "notif-02",
            "recipient_role": "PRACTICE_STAFF",
            "case_id": "RX-10490",
            "title": "SLA Approaching: Vyvanse Renewal",
            "message": "Case RX-10490 has only 1.0 hour remaining on operational SLA.",
            "priority": "CRITICAL",
            "read": False,
            "action_url": "/cases/RX-10490",
            "timestamp": now - timedelta(minutes=15)
        },
        {
            "id": "notif-03",
            "recipient_role": "ADMIN",
            "case_id": "RX-10491",
            "title": "Integration Failure Alert: EHR FHIR",
            "message": "EHR Clinical Bridge encountered gateway timeout. Automatic retry queued.",
            "priority": "HIGH",
            "read": False,
            "action_url": "/integrations",
            "timestamp": now - timedelta(minutes=30)
        }
    ]
    await db.notifications.insert_many(notifications)

    logger.info(f"Successfully seeded {len(cases_to_insert)} refill cases, {len(events_to_insert)} events, and system users!")
