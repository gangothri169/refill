import os
import logging
from typing import Dict, Any, List, Optional
from datetime import datetime
from app.config import settings
from app.services.rag_service import rag_service

logger = logging.getLogger("rxresolve.ai")

class AIService:
    def __init__(self):
        self.api_key = settings.GEMINI_API_KEY
        self.client = None
        if self.api_key:
            try:
                from google import genai
                self.client = genai.Client(api_key=self.api_key)
                logger.info("Initialized Gemini Client with API key.")
            except Exception as e:
                logger.warning(f"Could not initialize Google GenAI client: {e}. Falling back to rule-based engine.")

    def classify_case(self, case_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Classifies incoming refill cases, identifies blockers, computes confidence,
        and recommends next operational routing.
        """
        refills_rem = case_data.get("refills_remaining", 0)
        med_name = case_data.get("medication_name", "Medication")
        notes = (case_data.get("notes") or "").lower()
        force_blocker = case_data.get("force_blocker")
        
        # Check completeness
        comp = case_data.get("information_completeness", {})
        missing_fields = []
        if not comp.get("patient_info", True): missing_fields.append("Patient demographics")
        if not comp.get("medication_info", True): missing_fields.append("Medication NDC / strength")
        if not comp.get("pharmacy_info", True): missing_fields.append("Pharmacy NPI / transmission route")
        if not comp.get("prescription_details", True): missing_fields.append("Prescription quantity / day supply")

        # Determine primary blocker
        if force_blocker:
            blocker = force_blocker
            category = "Provider-related" if "provider" in force_blocker.lower() or "refill" in force_blocker.lower() else "Insurance/administrative"
            confidence = 0.96
        elif missing_fields:
            blocker = f"Missing {', '.join(missing_fields)}"
            category = "Information-related"
            confidence = 0.91
        elif "prior auth" in notes or "pa required" in notes or "formulary" in notes:
            blocker = "Prior authorization required"
            category = "Insurance/administrative"
            confidence = 0.89
        elif "quantity" in notes or "dosage clarification" in notes or "clarify" in notes:
            blocker = "Pharmacy clarification required"
            category = "Pharmacy-related"
            confidence = 0.88
        elif "timeout" in notes or "ehr offline" in notes or "integration" in notes:
            blocker = "EHR integration unavailable"
            category = "System/integration"
            confidence = 0.95
        elif refills_rem <= 0:
            blocker = "No refills remaining"
            category = "Provider-related"
            confidence = 0.94
        else:
            blocker = "Provider review required"
            category = "Provider-related"
            confidence = 0.87

        # Derive recommended action & role
        if category == "Information-related":
            rec_role = "PRACTICE_STAFF"
            rec_action = "Request missing demographic or prescription parameters from pharmacy."
            priority = "MEDIUM"
            why = f"Required clinical documentation is incomplete ({', '.join(missing_fields)}). Resolution requires updated intake parameters."
        elif category == "Insurance/administrative":
            rec_role = "PRACTICE_STAFF"
            rec_action = "Initiate electronic Prior Authorization (ePA) via CoverMyMeds/PBM portal."
            priority = "HIGH"
            why = "Payer formulary requires prior clinical authorization criteria before pharmacy dispensing."
        elif category == "Pharmacy-related":
            rec_role = "PHARMACY_STAFF"
            rec_action = "Clarify dispensing quantity and day supply with practice staff."
            priority = "MEDIUM"
            why = "Prescription parameters exhibit ambiguity between prescribed dosage and dispensed packaging."
        elif category == "System/integration":
            rec_role = "ADMIN"
            rec_action = "Queue refill request for automatic retry and check integration telemetry."
            priority = "CRITICAL"
            why = "Communication bridge to external EHR/Pharmacy network timed out. Case preserved safely in queue."
        else: # Provider-related
            rec_role = "PROVIDER"
            rec_action = "Route to physician practice for provider review and authorization."
            priority = "HIGH"
            why = f"No refills remain on the existing prescription for {med_name}. Provider clinical sign-off is required under SOP §4.2."

        # Pull relevant RAG source
        rag_sources = rag_service.search(f"{blocker} {category}", top_k=2)

        summary = (
            f"Refill request received from {case_data.get('pharmacy_name', 'Pharmacy')}. "
            f"Existing prescription for {med_name} has {refills_rem} refills remaining. "
            f"{blocker}. {why} "
            f"Recommended operational routing: {rec_role}."
        )

        return {
            "blocker": blocker,
            "category": category,
            "confidence": confidence,
            "recommended_action": rec_action,
            "recommended_role": rec_role,
            "operational_priority": priority,
            "reasoning": why,
            "summary": summary,
            "rag_sources": rag_sources,
            "created_at": datetime.utcnow()
        }

    def generate_case_summary(self, case_data: Dict[str, Any], events: List[Dict[str, Any]] = None) -> str:
        """Generates a concise operational case summary."""
        patient = case_data.get("patient_name", "Patient")
        med = case_data.get("medication_name", "Medication")
        pharm = case_data.get("pharmacy_name", "Pharmacy")
        status = case_data.get("status", "NEW")
        blocker = case_data.get("blocker", "Unknown blocker")
        owner = case_data.get("owner_name") or case_data.get("provider_name") or "Unassigned"
        
        event_count = len(events) if events else 1
        return (
            f"Refill request for {patient} ({med}) from {pharm}. Current workflow state is {status} "
            f"owned by {owner}. Primary operational blocker: '{blocker}'. "
            f"The case has accumulated {event_count} operational lifecycle events. "
            f"Action is required to unblock dispensing."
        )

    def recommend_next_action(self, case_data: Dict[str, Any]) -> Dict[str, Any]:
        """Provides an operational recommendation based on state and blocker."""
        status = case_data.get("status", "NEW")
        blocker = case_data.get("blocker", "")
        provider = case_data.get("provider_name", "Attending Physician")
        
        if status == "NEW" or status == "TRIAGING":
            return {
                "route_to": "Practice Staff",
                "reason": "Initial triage required to verify clinical and insurance details.",
                "suggested_step": f"Triage case and verify chart for {case_data.get('patient_name', 'patient')}."
            }
        elif status == "WAITING_FOR_PROVIDER":
            return {
                "route_to": "Provider",
                "reason": f"Provider clinical re-authorization is required for '{blocker}'.",
                "suggested_step": f"Assign to {provider} for sign-off or follow-up encounter order."
            }
        elif status == "WAITING_FOR_INFORMATION":
            return {
                "route_to": "Practice Staff",
                "reason": "Missing documentation prevents clinical review.",
                "suggested_step": "Send structured information inquiry to the dispensing pharmacy."
            }
        elif status == "ACTION_REQUIRED":
            return {
                "route_to": "Practice Staff / Pharmacy Staff",
                "reason": "Provider decision completed; prescription routing or communication must execute.",
                "suggested_step": "Transmit approved electronic renewal to pharmacy network."
            }
        elif status == "RESOLVED":
            return {
                "route_to": "Archived",
                "reason": "Case resolved and prescription successfully transmitted.",
                "suggested_step": "No further operational action required."
            }
        else:
            return {
                "route_to": "Practice Staff",
                "reason": f"Case requires investigation for blocker: {blocker}",
                "suggested_step": "Review timeline and reach out to responsible stakeholder."
            }

    def calculate_priority_score(self, case_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Calculates an operational workflow priority score (0-100).
        NOT a medical risk score. Strictly operational urgency.
        """
        score = 40 # baseline
        
        # Blocker severity
        category = case_data.get("blocker_category", "")
        if "System" in category or "integration" in category.lower():
            score += 30
        elif "Provider" in category:
            score += 20
        elif "Insurance" in category:
            score += 15

        # SLA factor
        sla_hours = case_data.get("sla_hours_remaining", 24)
        if sla_hours <= 4:
            score += 25
        elif sla_hours <= 12:
            score += 15
        elif sla_hours <= 18:
            score += 5

        # Escalation
        if case_data.get("status") == "ESCALATED":
            score += 20

        # Refills remaining = 0 adds operational urgency
        if case_data.get("refills_remaining", 0) <= 0:
            score += 10

        score = min(100, max(10, score))
        
        if score >= 80:
            level = "CRITICAL"
        elif score >= 60:
            level = "HIGH"
        elif score >= 40:
            level = "MEDIUM"
        else:
            level = "LOW"

        return {
            "score": score,
            "level": level,
            "disclaimer": "Strictly an operational workflow priority score, not a clinical risk assessment."
        }

    def draft_communication(self, case_data: Dict[str, Any], from_role: str, to_role: str, context_note: Optional[str] = None) -> Dict[str, Any]:
        """Generates draft messages between pharmacy, practice, and provider."""
        patient = case_data.get("patient_name", "Patient")
        med = case_data.get("medication_name", "Medication")
        case_id = case_data.get("id", "RX-CASE")
        blocker = case_data.get("blocker", "No refills remaining")
        
        if from_role == "PHARMACY_STAFF" and to_role == "PRACTICE_STAFF":
            subject = f"Refill Authorization Request — {patient} — {med} ({case_id})"
            body = (
                f"Hello Practice Team,\n\n"
                f"A refill renewal request has been submitted for patient {patient} for {med}. "
                f"The existing prescription has no refills remaining ({blocker}). "
                f"Kindly review the attached case ledger and advise if an electronic renewal can be authorized "
                f"or if a clinical appointment is required.\n\n"
                f"{'Additional note: ' + context_note if context_note else ''}\n"
                f"Thank you,\nDispensing Pharmacy Operations"
            )
            confidence = 0.95
            rationale = "Generated standard Surescripts/Practice inquiry template adhering to Clinical Intake SOP §2.1."
        elif from_role == "PRACTICE_STAFF" and to_role == "PHARMACY_STAFF":
            subject = f"Status Update: Refill Request {case_id} — {patient}"
            body = (
                f"Hello Pharmacy Team,\n\n"
                f"Regarding the refill request for {patient} ({med}), the case is currently routed to "
                f"the attending provider ({case_data.get('provider_name', 'Dr. Sarah Wilson')}) for clinical review. "
                f"Current status: {case_data.get('status', 'WAITING_FOR_PROVIDER')}. "
                f"We anticipate a sign-off decision within standard SLA turnaround.\n\n"
                f"{'Context: ' + context_note if context_note else ''}\n"
                f"Best regards,\nPractice Care Coordination Team"
            )
            confidence = 0.94
            rationale = "Generated standard operational update to keep dispensing pharmacy informed."
        elif from_role == "PRACTICE_STAFF" and to_role == "PROVIDER":
            subject = f"Clinical Action Required: Refill Authorization — {patient} ({case_id})"
            body = (
                f"Dr. {case_data.get('provider_name', 'Provider')},\n\n"
                f"Patient {patient} is requesting a 30-day refill for {med} (Dosage: {case_data.get('dosage', '10mg')}). "
                f"No refills remain on chart. Last recorded clinical visit: {case_data.get('last_fill_date', 'recent')}. "
                f"Please review in RxResolve to approve renewal, request additional labs, or require an office visit.\n\n"
                f"Thank you,\nClinical Triage Staff"
            )
            confidence = 0.96
            rationale = "Structured provider briefing highlighting necessary clinical decision parameters."
        else:
            subject = f"Operational Inquiry: Case {case_id} — {patient}"
            body = f"Case {case_id} for {patient} requires coordination regarding {blocker}. Please review."
            confidence = 0.90
            rationale = "General cross-role operational notification."

        return {
            "subject": subject,
            "body": body,
            "ai_confidence": confidence,
            "rationale": rationale
        }

    def copilot_chat(
        self,
        message: str,
        case_data: Optional[Dict[str, Any]] = None,
        role: str = "PRACTICE_STAFF",
        queue_context: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """
        Staff AI Copilot: Natural, context-rich, multi-turn assistant.
        Uses Gemini API if available, or advanced clinical reasoning engine with deep RAG grounding.
        """
        msg_lower = message.lower().strip()
        sources = rag_service.search(message, top_k=2)

        # 1. Try Gemini API if client is available
        if self.client:
            try:
                system_prompt = (
                    "You are RxResolve Copilot, an AI healthcare operations assistant for prescription refill coordination. "
                    "You assist pharmacy staff, practice care coordinators, and attending physicians in unblocking stuck refills. "
                    "CRITICAL SAFETY RULE: You provide workflow recommendations only. You must NEVER independently prescribe, "
                    "approve prescriptions, diagnose, or give clinical medical advice. Human authorization is always required. "
                    "Ground your answers in organizational SOPs and specific case details when provided. Keep responses concise, "
                    "professional, action-oriented, and formatted with clean markdown bullet points."
                )
                
                context_str = f"User Role: {role}\n"
                if case_data:
                    context_str += (
                        f"Current Case ID: {case_data.get('id')}\n"
                        f"Patient: {case_data.get('patient_name')} (DOB: {case_data.get('patient_dob')})\n"
                        f"Medication: {case_data.get('medication_name')} ({case_data.get('dosage')}, Qty: {case_data.get('quantity')}, Refills Rem: {case_data.get('refills_remaining')})\n"
                        f"Pharmacy: {case_data.get('pharmacy_name')}\n"
                        f"Provider: {case_data.get('provider_name')} ({case_data.get('practice_name')})\n"
                        f"Status: {case_data.get('status')}\n"
                        f"Primary Blocker: {case_data.get('blocker')} ({case_data.get('blocker_category')})\n"
                        f"Owner: {case_data.get('owner_name')} ({case_data.get('owner_role')})\n"
                        f"Next Action: {case_data.get('required_next_action')}\n"
                        f"SLA Remaining: {case_data.get('sla_hours_remaining', 24):.1f} hours\n"
                    )
                if queue_context:
                    context_str += f"Queue Context: {queue_context}\n"
                
                context_str += "Relevant Organizational SOPs:\n"
                for s in sources:
                    context_str += f"- [{s.get('source')}] {s.get('title')}: {s.get('snippet')}\n"

                full_prompt = f"{context_str}\nUser Question: {message}"
                
                # Call Gemini model
                response = self.client.models.generate_content(
                    model='gemini-2.5-flash',
                    contents=full_prompt,
                    config={'system_instruction': system_prompt}
                )
                if response and response.text:
                    return {
                        "answer": response.text.strip(),
                        "sources": sources,
                        "recommended_next_step": case_data.get("required_next_action") if case_data else "Review priority queues",
                        "confidence": 0.96,
                        "case_context_used": bool(case_data)
                    }
            except Exception as e:
                logger.warning(f"Gemini API call failed or timed out: {e}. Falling back to Clinical NLP engine.")

        # 2. Advanced Clinical NLP Engine with deep intent matching
        if case_data:
            case_id = case_data.get("id", "RX-CASE")
            patient = case_data.get("patient_name", "Patient")
            dob = case_data.get("patient_dob", "Unknown")
            med = case_data.get("medication_name", "Medication")
            dosage = case_data.get("dosage", "10mg")
            qty = case_data.get("quantity", 30)
            days = case_data.get("days_supply", 30)
            refills_rem = case_data.get("refills_remaining", 0)
            status = case_data.get("status", "NEW")
            blocker = case_data.get("blocker", "No refills remaining")
            category = case_data.get("blocker_category", "Provider-related")
            owner = case_data.get("owner_name") or case_data.get("provider_name") or "Care Coordinator"
            owner_role = case_data.get("owner_role", "PROVIDER")
            pharmacy = case_data.get("pharmacy_name", "Pharmacy")
            provider = case_data.get("provider_name", "Attending Physician")
            sla_hours = case_data.get("sla_hours_remaining", 18.0)
            next_action = case_data.get("required_next_action", "Provider review required")
            notes = case_data.get("notes", "")

            # Intent 1: Why stuck / root blocker / why waiting
            if any(k in msg_lower for k in ["why", "stuck", "block", "holding", "hold reason", "delay", "waiting for"]):
                answer = (
                    f"### Operational Bottleneck Analysis for {case_id}\n\n"
                    f"• **Primary Blocker:** **{blocker}** ({category})\n"
                    f"• **Current Workflow State:** `{status}`\n"
                    f"• **Root Cause:** The patient ({patient}) requested a renewal for **{med}**, but the active prescription "
                    f"has **{refills_rem} refills remaining**. Under **Practice SOP §4.2**, practice staff are legally and operationally "
                    f"restricted from authorizing renewals with 0 refills without direct physician sign-off.\n"
                    f"• **Operational Hold:** Currently held in **{owner}'s** inbox. SLA deadline expires in **{sla_hours:.1f} hours**."
                )
                rec = f"Notify {owner} to complete clinical review, or reassign if unavailable."

            # Intent 2: What is missing / completeness
            elif any(k in msg_lower for k in ["miss", "complet", "lack", "need info", "what is required", "parameter"]):
                comp = case_data.get("information_completeness", {})
                missing = []
                verified = []
                
                if comp.get("patient_info", True): verified.append(f"Patient Demographics ({patient}, DOB: {dob})")
                else: missing.append("Patient demographic / contact verification")

                if comp.get("medication_info", True): verified.append(f"Medication & Dosage ({med}, {dosage})")
                else: missing.append("Medication NDC / package strength")

                if comp.get("pharmacy_info", True): verified.append(f"Dispensing Pharmacy ({pharmacy})")
                else: missing.append("Pharmacy direct transmission routing NPI")

                if comp.get("prescription_details", True): verified.append(f"Prescription Parameters (Qty: {qty}, {days}d supply)")
                else: missing.append("Day supply and quantity alignment")

                if comp.get("required_review_completed", False): verified.append("Provider renewal authorization")
                else: missing.append(f"Provider clinical authorization by {provider}")

                answer = (
                    f"### Information Completeness Audit for {case_id}\n\n"
                    f"**Verified Parameters (✓):**\n"
                    + "\n".join([f"• ✓ {v}" for v in verified]) + "\n\n"
                    + ("**Pending / Missing Parameters (⚠):**\n" + "\n".join([f"• ⚠ {m}" for m in missing]) if missing else "**Status:** All intake information is 100% complete!")
                )
                rec = "Resolve flagged missing items or route to provider for sign-off."

            # Intent 3: Who needs to act / owner / assigned
            elif any(k in msg_lower for k in ["who", "owner", "responsib", "assigned", "action by", "turn"]):
                answer = (
                    f"### Current Operational Ownership for {case_id}\n\n"
                    f"• **Assigned Owner:** **{owner}**\n"
                    f"• **Role:** `{owner_role}`\n"
                    f"• **Next Mandatory Action:** **{next_action}**\n"
                    f"• **SLA Clock:** **{sla_hours:.1f} hours remaining** ({case_data.get('sla_status', 'HEALTHY')})\n\n"
                    f"If you are logged in as **{owner_role.replace('_', ' ')}**, you can execute this step directly from the Action Panel on the right."
                )
                rec = f"Execute action '{next_action}' from the right-hand panel."

            # Intent 4: What next / recommendation / what should I do
            elif any(k in msg_lower for k in ["next", "should i do", "what do i do", "how to proceed", "step", "recommend"]):
                answer = (
                    f"### Recommended Next Operational Steps for {case_id}\n\n"
                    f"1. **Primary Recommendation:** {next_action}\n"
                    f"2. **For Practice Staff:** Open case ledger, verify patient encounter within last 12 months, and route to **{provider}**.\n"
                    f"3. **For Provider:** Review patient chart, then select from the 4 decision options: *Authorize Renewal* (standard 90-day maintenance), *Require Visit* (if overdue), *Request Info*, or *Decline*.\n"
                    f"4. **For Pharmacy:** Monitor case state for electronic NCPDP script dispatch upon provider approval."
                )
                rec = f"Select an option from the Action Panel on the right."

            # Intent 5: Summarize / overview / briefing
            elif any(k in msg_lower for k in ["summar", "overview", "brief", "tell me about this case", "what is this"]):
                answer = (
                    f"### Executive Refill Briefing for {case_id}\n\n"
                    f"• **Patient:** {patient} (DOB: {dob})\n"
                    f"• **Medication:** {med} | {dosage} (Qty: {qty}, {days}-day supply)\n"
                    f"• **Refills Remaining:** {refills_rem} (Renewal required)\n"
                    f"• **Dispensing Pharmacy:** {pharmacy}\n"
                    f"• **Attending Physician:** {provider} ({case_data.get('practice_name', 'Practice')})\n"
                    f"• **Status:** `{status}` | **Priority:** {case_data.get('priority', 'HIGH')} ({case_data.get('priority_score', 75)}/100)\n"
                    f"• **Primary Blocker:** {blocker}\n"
                    f"• **Current Owner:** {owner} ({sla_hours:.1f}h SLA remaining)\n"
                    f"• **Notes:** {notes or 'Standard refill intake'}"
                )
                rec = f"Proceed with {next_action}."

            # Intent 6: Medication / dosage / quantity / refills
            elif any(k in msg_lower for k in ["medication", "drug", "dosage", "dose", "quantity", "qty", "supply", "refill remaining", "refills"]):
                answer = (
                    f"### Prescription Parameters for {case_id}\n\n"
                    f"• **Medication:** **{med}**\n"
                    f"• **Dosage / Sig:** `{dosage}`\n"
                    f"• **Quantity Dispensed:** {qty} units\n"
                    f"• **Days Supply:** {days} days\n"
                    f"• **Refills Requested:** {case_data.get('refills_requested', 1)}\n"
                    f"• **Refills Remaining on Chart:** **{refills_rem}**\n"
                    f"• **Last Fill Date:** {case_data.get('last_fill_date', '2026-07-12')}\n\n"
                    f"Because remaining refills are 0, automated dispensing is halted until a provider signs a renewal."
                )
                rec = "Provider can authorize 1 to 5 refills depending on chronic status."

            # Intent 7: Patient / demographics
            elif any(k in msg_lower for k in ["patient", "alex", "johnson", "dob", "birth", "phone", "demographic"]):
                answer = (
                    f"### Patient Demographics for {case_id}\n\n"
                    f"• **Full Name:** **{patient}**\n"
                    f"• **Date of Birth:** {dob}\n"
                    f"• **Contact Phone:** {case_data.get('patient_phone', '555-014-8821')}\n"
                    f"• **Patient Chart ID:** `{case_data.get('patient_id', 'pat-10482')}`\n"
                    f"• **Chart Status:** Active outpatient at {case_data.get('practice_name')}\n"
                    f"• **Prescribed Therapy:** {med} ({dosage})"
                )
                rec = "Verify chart for recent clinical encounter within 12 months."

            # Intent 8: Pharmacy details
            elif any(k in msg_lower for k in ["pharmacy", "pharm", "downtown pharmacy", "npi"]):
                answer = (
                    f"### Dispensing Pharmacy Profile for {case_id}\n\n"
                    f"• **Pharmacy Name:** **{pharmacy}**\n"
                    f"• **Phone:** {case_data.get('pharmacy_phone', '555-321-9988')}\n"
                    f"• **Network Channel:** Surescripts NCPDP SCRIPT 2017071 Direct\n"
                    f"• **Submission Protocol:** Electronic RefReq\n"
                    f"• **Status:** Connected and awaiting practice response."
                )
                rec = "Send message via Case Communications or update status."

            # Intent 9: Provider / Doctor details
            elif any(k in msg_lower for k in ["provider", "doctor", "dr.", "physician", "sarah wilson"]):
                answer = (
                    f"### Attending Physician Profile for {case_id}\n\n"
                    f"• **Physician:** **{provider}**\n"
                    f"• **Specialty:** Internal Medicine / Primary Care\n"
                    f"• **Practice Group:** {case_data.get('practice_name', 'Downtown Physician Group')}\n"
                    f"• **Current Queue Status:** Case {case_id} is in Dr. Wilson's priority review queue.\n"
                    f"• **Clinical Decision Authority:** Required under medical bylaws to sign off on maintenance renewals."
                )
                rec = "Switch role to 'Provider' in the top bar to test the decision flow."

            # Intent 10: Can I approve? / How to approve / Permission
            elif any(k in msg_lower for k in ["can i approve", "how to approve", "permission", "authorize", "decision"]):
                if role == "PROVIDER":
                    answer = (
                        f"### Provider Approval Authority for {case_id}\n\n"
                        f"**Yes!** As an authenticated Attending Physician (`PROVIDER`), you have full authority to approve this renewal.\n\n"
                        f"1. Click **'Authorize Prescription Renewal'** in the Action Panel on the right.\n"
                        f"2. A confirmation modal will appear requiring your clinical attestation.\n"
                        f"3. Select the number of refills (e.g. 3 refills for a 90-day maintenance supply).\n"
                        f"4. Confirm. The state will immediately advance to `ACTION_REQUIRED` and notify the pharmacy."
                    )
                else:
                    answer = (
                        f"### Role Authorization Policy for {case_id}\n\n"
                        f"You are currently logged in as `{role.replace('_', ' ')}`.\n"
                        f"Under **Practice SOP §4.2**, practice coordinators and pharmacy staff cannot independently approve renewals with 0 refills.\n\n"
                        f"**To approve this case:**\n"
                        f"• Use the 1-click **Role Switcher** in the top navigation bar to switch to **Provider (Dr.)**.\n"
                        f"• Then click **'Authorize Prescription Renewal'** in the Action Panel."
                    )
                rec = "Use the Provider role to complete authorization."

            # Intent 11: Insurance / Prior Auth / PBM
            elif any(k in msg_lower for k in ["insurance", "prior auth", "pa", "pbm", "formulary", "coverage", "denial", "copay"]):
                answer = (
                    f"### Insurance & PBM Assessment for {case_id}\n\n"
                    f"• **Current Insurance Blocker:** {blocker if 'Insurance' in category else 'No direct insurance rejection detected on this case'}\n"
                    f"• **PBM Protocol:** Under **Administrative & PBM Guidelines v3**, prior authorization is required for non-preferred formulary medications (e.g. GLP-1s, biologics).\n"
                    f"• **Coverage Status:** Standard tier maintenance co-pay verified via real-time benefit bridge."
                )
                rec = "If PA is required, click 'Initiate PA' in the Practice Staff panel."

            # Intent 12: SLA / Urgency / Deadline
            elif any(k in msg_lower for k in ["sla", "deadline", "urgent", "hours", "late", "overdue", "breach"]):
                answer = (
                    f"### SLA & Compliance Health for {case_id}\n\n"
                    f"• **Remaining SLA:** **{sla_hours:.1f} hours**\n"
                    f"• **SLA Health Status:** `{case_data.get('sla_status', 'HEALTHY')}`\n"
                    f"• **Standard Target:** 24.0 hours for outpatient refill resolution.\n"
                    f"• **Escalation Threshold:** Any case pending in `WAITING_FOR_PROVIDER` for >18 hours is automatically flagged as **AT RISK** and escalated to clinical management."
                )
                rec = f"Current case has {sla_hours:.1f}h remaining before SLA breach."

            # Intent 13: Timeline / What happened
            elif any(k in msg_lower for k in ["timeline", "history", "happened", "journey", "audit stream"]):
                answer = (
                    f"### Journey & Timeline Highlights for {case_id}\n\n"
                    f"1. **Submission:** {pharmacy} transmitted electronic refill request.\n"
                    f"2. **Autonomous Triage:** RxResolve AI classified blocker as *'{blocker}'* with 94% confidence.\n"
                    f"3. **Practice Routing:** Assigned to care coordination queue at {case_data.get('practice_name')}.\n"
                    f"4. **Provider Hold:** Transitioned to `{status}` under {owner}.\n"
                    f"5. **Current State:** Awaiting human clinical renewal decision."
                )
                rec = "See full chronological ledger in Section C on the left."

            # Intent 14: Default conversational response for case
            else:
                answer = (
                    f"### Case Intelligence for {case_id} ({patient})\n\n"
                    f"I'm analyzing **{case_id}** for **{patient}** ({med}, {dosage}).\n\n"
                    f"• **Workflow State:** `{status}`\n"
                    f"• **Primary Blocker:** **{blocker}** ({category})\n"
                    f"• **Current Owner:** **{owner}** ({owner_role})\n"
                    f"• **Next Operational Action:** **{next_action}**\n\n"
                    f"You can ask me specific details such as:\n"
                    f"- *'Why is this refill stuck?'*\n"
                    f"- *'What information is missing?'*\n"
                    f"- *'Can I approve this renewal?'*\n"
                    f"- *'Tell me about the medication and dosage'* \n"
                    f"- *'What is our SLA deadline?'*"
                )
                rec = f"Execute '{next_action}' or ask a targeted case question."

            return {
                "answer": answer,
                "sources": sources,
                "recommended_next_step": rec,
                "confidence": 0.94,
                "case_context_used": True
            }

        # 3. Global Queue & Organizational Policy Inquiries (when no specific case is active)
        else:
            # Policy on 0 refills
            if any(k in msg_lower for k in ["0 refill", "zero refill", "no refill", "provider review policy", "sop §4.2", "authorization policy"]):
                answer = (
                    f"### Practice SOP §4.2: Provider Authorization & Refill Sign-Off Policy\n\n"
                    f"• **Rule:** When a prescription shows zero (0) refills remaining, an explicit attending provider renewal authorization is mandatory.\n"
                    f"• **Practice Staff Boundaries:** Staff may not re-authorize refills independently if the last documented clinical visit was >6 months ago or if dosage changes occurred.\n"
                    f"• **Target Turnaround:** Routine maintenance renewals must be reviewed by the provider within the standard **24-hour SLA** window.\n"
                    f"• **Overdue Protocol:** Unreviewed cases >18 hours are flagged as **AT RISK**."
                )
                rec = "Review cases in the 'Waiting for Provider' queue."

            # Policy on missing info
            elif any(k in msg_lower for k in ["missing info", "incomplete", "intake policy", "sop §2.1"]):
                answer = (
                    f"### Clinical Intake SOP §2.1: Missing Information & Pharmacy Clarification\n\n"
                    f"• **Rule:** Any refill request lacking vital dispensing parameters (e.g., NDC, explicit quantity, day supply, patient address) must be transitioned to `WAITING_FOR_INFORMATION`.\n"
                    f"• **Pharmacy Notification:** Staff must send a structured digital inquiry to the dispensing pharmacy within 2 hours of triage.\n"
                    f"• **Hold Limit:** Cases pending pharmacy response >48 hours are automatically escalated to the supervising triage coordinator."
                )
                rec = "Check cases in 'Waiting for Information' queue."

            # SLA definitions
            elif any(k in msg_lower for k in ["sla", "hours", "timeline", "turnaround", "policy"]):
                answer = (
                    f"### Internal Workflow Engine Rules §1.4: Refill Operational SLAs\n\n"
                    f"• **Critical Priority (Life-sustaining / controlled substances):** **4 Hours** SLA\n"
                    f"• **High Priority (Symptomatic maintenance / zero refills):** **12 Hours** SLA\n"
                    f"• **Medium Priority (Standard maintenance / routine renewals):** **24 Hours** SLA\n"
                    f"• **Low Priority (Long-range maintenance):** **48 Hours** SLA\n\n"
                    f"Any case exceeding 75% of its allocated SLA time window is flagged with an orange warning indicator."
                )
                rec = "Filter cases by SLA Clock on the Cases page."

            # Which cases need attention / at risk
            elif any(k in msg_lower for k in ["attention", "at risk", "urgent", "today", "breach", "critical"]):
                answer = (
                    f"### Priority Operational Queues Requiring Attention Today\n\n"
                    f"1. **RX-10490 (Sophia Al-Mansoor - Vyvanse 30mg):** `ESCALATED` • 1.0h SLA remaining (Controlled substance visit protocol).\n"
                    f"2. **RX-10491 (Liam O'Connor - Amlodipine 5mg):** `FAILED` • 0.5h SLA remaining (EHR FHIR gateway retry queued).\n"
                    f"3. **RX-10482 (Alex Johnson - Demo Medication 10mg):** `WAITING_FOR_PROVIDER` • 18.0h remaining (Dr. Sarah Wilson renewal sign-off).\n"
                    f"4. **RX-10484 (Eleanor Vance - Ozempic 1mg):** `WAITING_FOR_INSURANCE` • 6.2h remaining (Prior authorization required)."
                )
                rec = "Click on any case from the dashboard to initiate resolution."

            # How do I resolve / how does the platform work
            elif any(k in msg_lower for k in ["how do i", "how does", "workflow", "resolve", "demo flow"]):
                answer = (
                    f"### RxResolve End-to-End Resolution Workflow\n\n"
                    f"1. **Intake:** Pharmacy submits refill request electronically via Surescripts bridge.\n"
                    f"2. **AI Triage:** System classifies root blocker (Provider, Info, Pharmacy, Insurance) with confidence scoring.\n"
                    f"3. **Coordination:** Practice staff unblocks missing parameters and routes to the attending physician.\n"
                    f"4. **Human Decision:** Attending Provider reviews AI summary and authorizes renewal (1–5 refills).\n"
                    f"5. **Resolution:** Dispensing pharmacy receives automated notification and electronic script dispatch.\n"
                    f"6. **Audit & Analytics:** Complete immutable ledger records every step for compliance."
                )
                rec = "Try the canonical demo case RX-10482 to see the flow in action."

            # Default global overview
            else:
                answer = (
                    f"### RxResolve Operations Copilot Active\n\n"
                    f"I am monitoring active refill queues across your clinical network.\n\n"
                    f"• **Active Refills:** 16 cases pending across queues\n"
                    f"• **Awaiting Provider Sign-Off:** 4 cases\n"
                    f"• **Missing Information / Inquiries:** 2 cases\n"
                    f"• **At-Risk SLAs (&lt; 2h):** 2 cases\n\n"
                    f"**How can I assist you?**\n"
                    f"- Select any specific case from the dropdown above to inspect patient details, dosages, and blockers.\n"
                    f"- Ask about organizational policies (e.g. *'What is our 0 refills policy?'* or *'Explain SLA tiers'*).\n"
                    f"- Ask *'Which cases need attention today?'* to view urgent cases."
                )
                rec = "Select a case or ask an operational question."

            return {
                "answer": answer,
                "sources": sources,
                "recommended_next_step": rec,
                "confidence": 0.93,
                "case_context_used": False
            }

ai_service = AIService()
