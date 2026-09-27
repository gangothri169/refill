from fastapi import APIRouter, HTTPException, Depends, Query
from typing import Optional, List, Dict, Any
from datetime import datetime, timedelta
import uuid
from app.database import get_database
from app.routers.auth import get_current_user
from app.models.case import CaseStatus, PriorityLevel, BlockerCategory
from app.schemas.case import (
    CaseCreateRequest,
    CaseStatusUpdateRequest,
    CaseAssignRequest,
    ProviderDecisionRequest
)
from app.services.workflow_service import workflow_service
from app.services.ai_service import ai_service
import logging

logger = logging.getLogger("rxresolve.cases")
router = APIRouter(prefix="/api/cases", tags=["Refill Cases"])

@router.get("")
async def list_cases(
    status: Optional[str] = Query(None),
    blocker: Optional[str] = Query(None),
    priority: Optional[str] = Query(None),
    owner_role: Optional[str] = Query(None),
    pharmacy: Optional[str] = Query(None),
    search: Optional[str] = Query(None),
    current_user: dict = Depends(get_current_user)
):
    """List refill cases with comprehensive enterprise filtering and search."""
    db = get_database()
    if db is None:
        raise HTTPException(status_code=500, detail="Database connection unavailable")

    query: Dict[str, Any] = {}
    if status and status != "ALL":
        query["status"] = status
    if blocker and blocker != "ALL":
        query["blocker"] = blocker
    if priority and priority != "ALL":
        query["priority"] = priority
    if owner_role and owner_role != "ALL":
        query["owner_role"] = owner_role
    if pharmacy and pharmacy != "ALL":
        query["pharmacy_name"] = {"$regex": pharmacy, "$options": "i"}

    if search:
        search_regex = {"$regex": search, "$options": "i"}
        query["$or"] = [
            {"id": search_regex},
            {"patient_name": search_regex},
            {"medication_name": search_regex},
            {"pharmacy_name": search_regex},
            {"provider_name": search_regex},
            {"blocker": search_regex}
        ]

    # Role-based scoping:
    # Pharmacy Staff sees requests originating from or addressed to their pharmacy
    if current_user.get("role") == "PHARMACY_STAFF":
        pass # In demo mode allow visibility across demo network with primary pharmacy filter
    
    cursor = db.refill_cases.find(query, {"_id": 0}).sort("created_at", -1)
    cases = await cursor.to_list(length=100)
    return cases

@router.post("")
async def create_case(req: CaseCreateRequest, current_user: dict = Depends(get_current_user)):
    """Creates a new refill case from a pharmacy or EHR integration."""
    db = get_database()
    if db is None:
        raise HTTPException(status_code=500, detail="Database connection unavailable")

    # Generate sequential or unique Case ID
    case_num = 10502 + await db.refill_cases.count_documents({})
    case_id = f"RX-{case_num}"
    now = datetime.utcnow()

    # Information completeness check
    completeness = {
        "patient_info": bool(req.patient_name and req.patient_dob),
        "medication_info": bool(req.medication_name and req.dosage),
        "pharmacy_info": bool(req.pharmacy_name),
        "prescription_details": bool(req.quantity > 0 and req.days_supply > 0),
        "provider_info": bool(req.provider_name),
        "required_review_completed": False,
        "details": {
            "patient": f"{req.patient_name} (DOB: {req.patient_dob})",
            "medication": f"{req.medication_name} ({req.dosage})",
            "pharmacy": f"{req.pharmacy_name}",
            "provider": f"{req.provider_name}"
        }
    }

    # Initial case dict for AI analysis
    raw_case_data = {
        "id": case_id,
        "patient_name": req.patient_name,
        "medication_name": req.medication_name,
        "dosage": req.dosage,
        "quantity": req.quantity,
        "days_supply": req.days_supply,
        "refills_remaining": req.refills_remaining,
        "pharmacy_name": req.pharmacy_name,
        "provider_name": req.provider_name,
        "notes": req.notes,
        "force_blocker": req.force_blocker,
        "information_completeness": completeness
    }

    # Execute AI Blocker Classification
    ai_result = ai_service.classify_case(raw_case_data)
    priority_res = ai_service.calculate_priority_score({
        **raw_case_data,
        "blocker_category": ai_result["category"],
        "sla_hours_remaining": 24.0
    })

    # Assemble complete case document
    new_case = {
        "id": case_id,
        "patient_id": f"pat-{uuid.uuid4().hex[:6]}",
        "patient_name": req.patient_name,
        "patient_dob": req.patient_dob,
        "patient_phone": req.patient_phone,
        "medication_id": f"med-{uuid.uuid4().hex[:6]}",
        "medication_name": req.medication_name,
        "dosage": req.dosage,
        "quantity": req.quantity,
        "days_supply": req.days_supply,
        "refills_requested": req.refills_requested,
        "refills_remaining": req.refills_remaining,
        "last_fill_date": req.last_fill_date,
        "pharmacy_id": "org-pharm-01",
        "pharmacy_name": req.pharmacy_name,
        "pharmacy_phone": req.pharmacy_phone,
        "practice_id": "org-pract-01",
        "practice_name": req.practice_name,
        "provider_id": "usr-prov-01",
        "provider_name": req.provider_name,
        "status": "TRIAGING", # Enters triaging as required by demo flow
        "previous_status": "NEW",
        "last_status_reason": ai_result["blocker"],
        "blocker": ai_result["blocker"],
        "blocker_category": ai_result["category"],
        "priority": priority_res["level"],
        "priority_score": priority_res["score"],
        "owner_id": current_user.get("id"),
        "owner_name": current_user.get("name"),
        "owner_role": current_user.get("role"),
        "required_next_action": ai_result["recommended_action"],
        "sla_deadline": now + timedelta(hours=24),
        "sla_hours_remaining": 24.0,
        "sla_status": "HEALTHY",
        "information_completeness": completeness,
        "ai_analysis": ai_result,
        "notes": req.notes,
        "created_at": now,
        "updated_at": now,
        "resolved_at": None,
        "resolution_notes": None
    }

    await db.refill_cases.insert_one(new_case)

    # Initial Event: Submitted
    await db.case_events.insert_one({
        "id": f"evt-{uuid.uuid4().hex[:8]}",
        "case_id": case_id,
        "actor_id": current_user.get("id"),
        "actor_name": current_user.get("name"),
        "actor_role": current_user.get("role"),
        "action": "SUBMIT_REFILL_REQUEST",
        "from_status": None,
        "to_status": "NEW",
        "note": f"Pharmacy staff submitted refill request for {req.patient_name} ({req.medication_name}).",
        "timestamp": now,
        "details": {"pharmacy": req.pharmacy_name}
    })

    # Event 2: AI Classified
    await db.case_events.insert_one({
        "id": f"evt-{uuid.uuid4().hex[:8]}",
        "case_id": case_id,
        "actor_id": "system-ai",
        "actor_name": "RxResolve AI",
        "actor_role": "SYSTEM",
        "action": "AI_BLOCKER_CLASSIFIED",
        "from_status": "NEW",
        "to_status": "TRIAGING",
        "note": f"AI classified blocker: '{ai_result['blocker']}' ({ai_result['confidence']*100:.0f}% confidence). Recommended: {ai_result['recommended_action']}",
        "timestamp": now + timedelta(seconds=2),
        "details": {"confidence": ai_result["confidence"], "category": ai_result["category"]}
    })

    # Audit Log
    await db.audit_logs.insert_one({
        "id": f"aud-{uuid.uuid4().hex[:10]}",
        "timestamp": now,
        "case_id": case_id,
        "actor_type": "HUMAN",
        "actor_id": current_user.get("id"),
        "actor_name": current_user.get("name"),
        "actor_role": current_user.get("role"),
        "action": "CREATE_REFILL_CASE",
        "event_type": "CASE_CREATION",
        "previous_state": None,
        "new_state": "TRIAGING",
        "confidence": 1.0,
        "details": {"medication": req.medication_name, "blocker": ai_result["blocker"]}
    })

    # Return created case
    result = await db.refill_cases.find_one({"id": case_id}, {"_id": 0})
    return result

@router.get("/{case_id}")
async def get_case(case_id: str):
    """Retrieves full case workspace data including timeline, completeness, and communications."""
    db = get_database()
    if db is None:
        raise HTTPException(status_code=500, detail="Database connection unavailable")

    case = await db.refill_cases.find_one({"id": case_id}, {"_id": 0})
    if not case:
        raise HTTPException(status_code=404, detail=f"Refill Case '{case_id}' not found")
    
    # Recalculate dynamic SLA remaining
    if case.get("sla_deadline") and case.get("status") not in ["RESOLVED", "CANCELLED"]:
        now = datetime.utcnow()
        deadline = case["sla_deadline"]
        diff_hours = (deadline - now).total_seconds() / 3600.0
        case["sla_hours_remaining"] = max(0.0, round(diff_hours, 1))
        if case["sla_hours_remaining"] <= 2:
            case["sla_status"] = "BREACHED"
        elif case["sla_hours_remaining"] <= 8:
            case["sla_status"] = "WARNING"
        else:
            case["sla_status"] = "HEALTHY"

    return case

@router.patch("/{case_id}/status")
async def update_case_status(
    case_id: str,
    req: CaseStatusUpdateRequest,
    current_user: dict = Depends(get_current_user)
):
    """State transition endpoint enforcing the strict healthcare workflow state machine."""
    updated = await workflow_service.transition_case(
        case_id=case_id,
        target_status=req.new_status,
        actor_id=current_user.get("id"),
        actor_name=current_user.get("name"),
        actor_role=current_user.get("role"),
        reason=req.reason,
        note=req.note,
        required_next_action=req.required_next_action,
        new_owner_id=req.owner_id,
        new_owner_name=req.owner_name,
        new_owner_role=req.owner_role
    )
    return updated

@router.post("/{case_id}/assign")
async def assign_case(
    case_id: str,
    req: CaseAssignRequest,
    current_user: dict = Depends(get_current_user)
):
    """Assigns or routes a refill case to a specific staff member or provider."""
    db = get_database()
    if db is None:
        raise HTTPException(status_code=500, detail="Database connection unavailable")

    now = datetime.utcnow()
    update_data = {
        "owner_id": req.assignee_id,
        "owner_name": req.assignee_name,
        "owner_role": req.assignee_role,
        "updated_at": now
    }
    
    # If assigned to a provider, automatically advance state to WAITING_FOR_PROVIDER if currently in TRIAGING/INVESTIGATING
    case = await db.refill_cases.find_one({"id": case_id})
    if not case:
        raise HTTPException(status_code=404, detail="Case not found")

    if req.assignee_role == "PROVIDER" and case["status"] in ["TRIAGING", "INVESTIGATING", "NEW"]:
        return await workflow_service.transition_case(
            case_id=case_id,
            target_status=CaseStatus.WAITING_FOR_PROVIDER,
            actor_id=current_user.get("id"),
            actor_name=current_user.get("name"),
            actor_role=current_user.get("role"),
            reason=f"Assigned for provider clinical review: {req.note or 'Route to Dr.'}",
            new_owner_id=req.assignee_id,
            new_owner_name=req.assignee_name,
            new_owner_role=req.assignee_role,
            required_next_action="Provider clinical review & authorization"
        )

    await db.refill_cases.update_one({"id": case_id}, {"$set": update_data})
    
    # Log event
    await db.case_events.insert_one({
        "id": f"evt-{uuid.uuid4().hex[:8]}",
        "case_id": case_id,
        "actor_id": current_user.get("id"),
        "actor_name": current_user.get("name"),
        "actor_role": current_user.get("role"),
        "action": "CASE_ASSIGNED",
        "from_status": case["status"],
        "to_status": case["status"],
        "note": f"Assigned to {req.assignee_name} ({req.assignee_role}). {req.note or ''}",
        "timestamp": now,
        "details": {"assignee": req.assignee_name, "role": req.assignee_role}
    })

    return await db.refill_cases.find_one({"id": case_id}, {"_id": 0})

@router.post("/{case_id}/provider-decision")
async def provider_decision(
    case_id: str,
    req: ProviderDecisionRequest,
    current_user: dict = Depends(get_current_user)
):
    """
    CRITICAL HUMAN-IN-THE-LOOP ENDPOINT:
    Provider reviews case and executes explicit clinical decision:
    - APPROVE: Authorizes refills -> moves to ACTION_REQUIRED or RESOLVED
    - REQUEST_INFO: Requests additional labs or details -> moves to WAITING_FOR_INFORMATION
    - REQUIRE_VISIT: Directs clinical encounter -> moves to ACTION_REQUIRED
    - DECLINE: Declines renewal -> moves to RESOLVED / CANCELLED with reason
    """
    db = get_database()
    if db is None:
        raise HTTPException(status_code=500, detail="Database connection unavailable")

    case = await db.refill_cases.find_one({"id": case_id})
    if not case:
        raise HTTPException(status_code=404, detail="Case not found")

    provider_name = current_user.get("name") or "Dr. Sarah Wilson"
    decision = req.decision.upper()

    metadata = {}
    if decision == "APPROVE":
        target_status = CaseStatus.ACTION_REQUIRED
        reason = f"Provider ({provider_name}) approved {req.refills_approved or 1} refills."
        next_action = "Transmit approved electronic renewal to pharmacy network."
        metadata["refills_remaining"] = req.refills_approved or 1
        metadata["information_completeness.required_review_completed"] = True
    elif decision == "REQUEST_INFO":
        target_status = CaseStatus.WAITING_FOR_INFORMATION
        reason = f"Provider requested additional clinical information: {req.request_details or req.notes}"
        next_action = "Practice staff to obtain requested parameters."
    elif decision == "REQUIRE_VISIT":
        target_status = CaseStatus.ACTION_REQUIRED
        reason = f"Provider requires clinical office visit ({req.visit_type_required or 'Standard Consultation'})."
        next_action = "Schedule patient encounter and issue 30-day bridge supply if appropriate."
    elif decision == "DECLINE":
        target_status = CaseStatus.RESOLVED
        reason = f"Provider declined renewal. Clinical rationale: {req.notes}"
        next_action = "Notify dispensing pharmacy and patient of decline reason."
    else:
        raise HTTPException(status_code=400, detail=f"Unrecognized provider decision '{req.decision}'")

    # Transition case with audit
    updated = await workflow_service.transition_case(
        case_id=case_id,
        target_status=target_status,
        actor_id=current_user.get("id"),
        actor_name=provider_name,
        actor_role="PROVIDER",
        reason=reason,
        note=req.notes,
        required_next_action=next_action,
        metadata=metadata
    )

    # Automatically post a communication message to keep pharmacy informed
    await db.communications.insert_one({
        "id": f"comm-{uuid.uuid4().hex[:8]}",
        "case_id": case_id,
        "sender_id": current_user.get("id"),
        "sender_name": provider_name,
        "sender_role": "PROVIDER",
        "sender_org": case.get("practice_name", "Practice"),
        "recipient_role": "PHARMACY_STAFF",
        "content": f"[Provider Decision: {decision}] {reason}. Clinical notes: {req.notes}",
        "is_ai_drafted": False,
        "reviewed_by_human": True,
        "attachments": [],
        "timestamp": datetime.utcnow()
    })

    return updated

@router.get("/{case_id}/timeline")
async def get_case_timeline(case_id: str):
    """Retrieves full chronological ledger of events for a case."""
    db = get_database()
    if db is None:
        raise HTTPException(status_code=500, detail="Database connection unavailable")

    cursor = db.case_events.find({"case_id": case_id}, {"_id": 0}).sort("timestamp", 1)
    events = await cursor.to_list(length=100)
    return events
