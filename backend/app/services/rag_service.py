from typing import List, Dict, Any
import re
from datetime import datetime

DEMO_KNOWLEDGE_DOCUMENTS = [
    {
        "id": "kb-sop-001",
        "title": "Provider Authorization & Refill Sign-Off Policy",
        "category": "Practice SOPs",
        "source_name": "Practice Refill SOP §4.2",
        "content": "When an existing prescription has zero (0) refills remaining, standard protocol dictates that an explicit provider authorization is required. Practice staff may not re-authorize refills independently without provider review if the last documented clinical encounter exceeded 6 months or if dosage adjustments occurred. Routine maintenance medications with clean visit history (<6 months) may be queued directly for Dr. review with a 24-hour target turnaround.",
        "keywords": ["no refills", "zero refills", "provider review", "authorization", "sign-off", "prescription expired"]
    },
    {
        "id": "kb-sop-002",
        "title": "Missing Information & Pharmacy Clarification SOP",
        "category": "Practice SOPs",
        "source_name": "Clinical Intake SOP §2.1",
        "content": "A refill request missing key dispensing parameters (such as NDC, quantity dispensed, explicit day supply, or patient address verification) must be transitioned to WAITING_FOR_INFORMATION. Practice staff must initiate a structured inquiry to the requesting pharmacy. Cases in WAITING_FOR_PHARMACY for >48 hours without response shall be escalated to the supervising triage coordinator.",
        "keywords": ["missing information", "pharmacy clarification", "quantity", "dosage", "ndc", "unverified"]
    },
    {
        "id": "kb-admin-001",
        "title": "Prior Authorization & PBM Formulary Exception Protocol",
        "category": "Administrative Rules",
        "source_name": "Administrative & PBM Guidelines v3",
        "content": "Refill requests rejected for 'PA Required' or formulary tier restrictions must undergo electronic Prior Authorization (ePA). The clinical coordinator must verify chart notes documenting previous step-therapy failure or diagnosis ICD-10 justification before routing the CoverMyMeds/Surescripts ePA request to the payer.",
        "keywords": ["prior authorization", "insurance rejection", "pbm", "formulary", "coverage", "denial"]
    },
    {
        "id": "kb-admin-002",
        "title": "Annual Patient Encounter & Monitoring Requirement",
        "category": "Administrative Rules",
        "source_name": "Compliance & Medical Board Standard §8",
        "content": "For chronic maintenance medications (e.g. anti-hypertensives, statins, diabetes management), an in-person or synchronous telehealth visit within the past 12 months is legally required to authorize renewals. If the patient has not had a visit in >12 months, the provider should select 'Require Visit' and offer a bridging 30-day supply where medically appropriate.",
        "keywords": ["visit required", "annual visit", "expired visit", "appointment", "follow-up"]
    },
    {
        "id": "kb-workflow-001",
        "title": "Refill Operational SLA & Escalation Rules",
        "category": "Internal Workflow Rules",
        "source_name": "Internal Workflow Engine Rules §1.4",
        "content": "Standard operational target resolution time for outpatient refills is 24 hours. Critical priority cases (life-sustaining or high-risk medications) have an SLA of 4 hours. High priority cases have an SLA of 12 hours. Any case pending in WAITING_FOR_PROVIDER for more than 18 hours is automatically designated AT RISK and escalated to the practice manager.",
        "keywords": ["sla", "escalation", "hours", "timeline", "priority", "at risk", "urgent"]
    },
    {
        "id": "kb-workflow-002",
        "title": "Inter-Organizational Communication & Audit Trail",
        "category": "Internal Workflow Rules",
        "source_name": "Operations Quality & Audit SOP §5",
        "content": "All communications between Pharmacy Staff and Physician Practice Staff must be documented directly in the case ledger. AI-drafted messages require human verification before transmission. System integration failures (EHR FHIR or Surescripts timeout) must trigger automatic retry with exponential backoff and flag the case as degraded without data loss.",
        "keywords": ["communication", "audit", "integration", "timeout", "ehr", "failure", "retry"]
    }
]

class RAGService:
    def __init__(self):
        self.documents = DEMO_KNOWLEDGE_DOCUMENTS

    def search(self, query: str, top_k: int = 2) -> List[Dict[str, str]]:
        """Lightweight semantic and keyword retrieval for organizational knowledge."""
        query_words = set(re.findall(r'\w+', query.lower()))
        scored_docs = []
        for doc in self.documents:
            score = 0
            # Keyword match
            for kw in doc.get("keywords", []):
                if any(word in kw for word in query_words):
                    score += 3
            # Content word overlap
            doc_words = set(re.findall(r'\w+', doc["content"].lower()))
            overlap = len(query_words.intersection(doc_words))
            score += overlap

            if score > 0:
                scored_docs.append((score, doc))

        # Sort by score descending
        scored_docs.sort(key=lambda x: x[0], reverse=True)
        if not scored_docs:
            # Fallback to default policy docs
            return [
                {
                    "source": self.documents[0]["source_name"],
                    "title": self.documents[0]["title"],
                    "category": self.documents[0]["category"],
                    "snippet": self.documents[0]["content"][:220] + "..."
                }
            ]

        results = []
        for score, doc in scored_docs[:top_k]:
            results.append({
                "source": doc["source_name"],
                "title": doc["title"],
                "category": doc["category"],
                "snippet": doc["content"]
            })
        return results

    def get_all_documents(self) -> List[Dict[str, Any]]:
        return self.documents

rag_service = RAGService()
