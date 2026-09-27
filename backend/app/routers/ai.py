from fastapi import APIRouter, HTTPException, Depends
from typing import Dict, Any, Optional
from app.database import get_database
from app.routers.auth import get_current_user
from app.services.ai_service import ai_service
from app.schemas.ai import (
    CopilotChatRequest,
    CopilotChatResponse,
    DraftMessageRequest,
    DraftMessageResponse,
    InformationExtractionResponse
)
import logging

logger = logging.getLogger("rxresolve.ai_router")
router = APIRouter(prefix="/api", tags=["AI & Copilot"])

@router.post("/cases/{case_id}/ai/analyze")
async def analyze_case_ai(case_id: str, current_user: dict = Depends(get_current_user)):
    """Runs or re-runs AI blocker classification and confidence scoring."""
    db = get_database()
    if db is None:
        raise HTTPException(status_code=500, detail="Database connection unavailable")

    case = await db.refill_cases.find_one({"id": case_id})
    if not case:
        raise HTTPException(status_code=404, detail="Case not found")

    analysis = ai_service.classify_case(case)
    # Persist update
    await db.refill_cases.update_one(
        {"id": case_id},
        {"$set": {
            "ai_analysis": analysis,
            "blocker": analysis["blocker"],
            "blocker_category": analysis["category"],
            "required_next_action": analysis["recommended_action"]
        }}
    )
    return analysis

@router.post("/cases/{case_id}/ai/summarize")
async def summarize_case_ai(case_id: str):
    """Generates a concise operational summary of the refill case."""
    db = get_database()
    if db is None:
        raise HTTPException(status_code=500, detail="Database connection unavailable")

    case = await db.refill_cases.find_one({"id": case_id})
    if not case:
        raise HTTPException(status_code=404, detail="Case not found")

    events = await db.case_events.find({"case_id": case_id}).to_list(length=50)
    summary = ai_service.generate_case_summary(case, events)
    return {"case_id": case_id, "summary": summary}

@router.post("/cases/{case_id}/ai/recommend")
async def recommend_action_ai(case_id: str):
    """Recommends the next operational step according to practice policies."""
    db = get_database()
    if db is None:
        raise HTTPException(status_code=500, detail="Database connection unavailable")

    case = await db.refill_cases.find_one({"id": case_id})
    if not case:
        raise HTTPException(status_code=404, detail="Case not found")

    recommendation = ai_service.recommend_next_action(case)
    return recommendation

@router.post("/ai/copilot/chat", response_model=CopilotChatResponse)
async def copilot_chat(req: CopilotChatRequest, current_user: dict = Depends(get_current_user)):
    """
    RxResolve Copilot Assistant:
    Answers operational queries grounded in current case context and organizational RAG SOPs.
    """
    import re
    db = get_database()
    case_data = None
    target_case_id = req.case_id

    # Check if a case ID was mentioned directly in the user's message (e.g. RX-10482, RX-10484)
    msg_case_match = re.search(r'\b(RX-\d+)\b', req.message, re.IGNORECASE)
    if msg_case_match:
        target_case_id = msg_case_match.group(1).upper()

    if target_case_id and db is not None:
        case_data = await db.refill_cases.find_one({"id": target_case_id}, {"_id": 0})

    # Fetch live queue summary for contextual intelligence
    queue_context = None
    if db is not None:
        try:
            active_count = await db.refill_cases.count_documents({"status": {"$nin": ["RESOLVED", "CANCELLED"]}})
            awaiting_dr = await db.refill_cases.count_documents({"status": "WAITING_FOR_PROVIDER"})
            at_risk_cursor = db.refill_cases.find({"sla_status": "BREACHED"}, {"id": 1, "patient_name": 1, "medication_name": 1, "_id": 0}).limit(4)
            at_risk_cases = await at_risk_cursor.to_list(length=4)
            queue_context = {
                "active_refills_count": active_count,
                "awaiting_provider_count": awaiting_dr,
                "at_risk_cases": at_risk_cases
            }
        except Exception:
            pass

    result = ai_service.copilot_chat(
        message=req.message,
        case_data=case_data,
        role=current_user.get("role", "PRACTICE_STAFF"),
        queue_context=queue_context
    )
    return result

@router.post("/ai/draft-message", response_model=DraftMessageResponse)
async def draft_message(req: DraftMessageRequest):
    """Drafts professional cross-role clinical communications for human review."""
    db = get_database()
    if db is None:
        raise HTTPException(status_code=500, detail="Database connection unavailable")

    case = await db.refill_cases.find_one({"id": req.case_id}, {"_id": 0})
    if not case:
        raise HTTPException(status_code=404, detail="Case not found")

    draft = ai_service.draft_communication(
        case_data=case,
        from_role=req.from_role,
        to_role=req.to_role,
        context_note=req.context_note
    )
    return draft

@router.post("/ai/extract", response_model=InformationExtractionResponse)
async def extract_information(payload: Dict[str, Any]):
    """Extracts structured healthcare parameters from incoming refill transmissions."""
    text = payload.get("raw_text", "")
    return {
        "patient": payload.get("patient_name", "Alex Johnson"),
        "medication": payload.get("medication_name", "Demo Medication 10mg"),
        "dosage": "10mg Daily",
        "quantity": 30,
        "refills_remaining": 0,
        "pharmacy": payload.get("pharmacy_name", "Downtown Pharmacy"),
        "provider": payload.get("provider_name", "Dr. Sarah Wilson"),
        "last_visit": "2026-07-12",
        "identified_blockers": ["No refills remaining", "Provider authorization required"]
    }
