from fastapi import APIRouter, HTTPException, Depends
from typing import List, Dict, Any, Optional
from datetime import datetime
import uuid
from pydantic import BaseModel
from app.database import get_database
from app.routers.auth import get_current_user
import logging

logger = logging.getLogger("rxresolve.communications")
router = APIRouter(prefix="/api/cases/{case_id}/communications", tags=["Communications"])

class SendMessageRequest(BaseModel):
    recipient_role: str # "PHARMACY_STAFF", "PRACTICE_STAFF", "PROVIDER"
    content: str
    is_ai_drafted: bool = False
    attachments: Optional[List[str]] = None

@router.get("")
async def get_communications(case_id: str):
    """Retrieves all inter-organization and provider messages for a case."""
    db = get_database()
    if db is None:
        raise HTTPException(status_code=500, detail="Database connection unavailable")

    cursor = db.communications.find({"case_id": case_id}, {"_id": 0}).sort("timestamp", 1)
    messages = await cursor.to_list(length=100)
    return messages

@router.post("")
async def send_communication(
    case_id: str,
    req: SendMessageRequest,
    current_user: dict = Depends(get_current_user)
):
    """Sends a verified message between Pharmacy, Practice, or Provider."""
    db = get_database()
    if db is None:
        raise HTTPException(status_code=500, detail="Database connection unavailable")

    case = await db.refill_cases.find_one({"id": case_id})
    if not case:
        raise HTTPException(status_code=404, detail="Case not found")

    now = datetime.utcnow()
    msg_id = f"comm-{uuid.uuid4().hex[:8]}"
    
    new_message = {
        "id": msg_id,
        "case_id": case_id,
        "sender_id": current_user.get("id"),
        "sender_name": current_user.get("name"),
        "sender_role": current_user.get("role"),
        "sender_org": current_user.get("organization_name", "Clinical Operations"),
        "recipient_role": req.recipient_role,
        "content": req.content,
        "is_ai_drafted": req.is_ai_drafted,
        "reviewed_by_human": True,
        "attachments": req.attachments or [],
        "timestamp": now
    }

    await db.communications.insert_one(new_message)

    # Log case event
    await db.case_events.insert_one({
        "id": f"evt-{uuid.uuid4().hex[:8]}",
        "case_id": case_id,
        "actor_id": current_user.get("id"),
        "actor_name": current_user.get("name"),
        "actor_role": current_user.get("role"),
        "action": "COMMUNICATION_SENT",
        "from_status": case.get("status"),
        "to_status": case.get("status"),
        "note": f"Message sent to {req.recipient_role}: {req.content[:60]}...",
        "timestamp": now,
        "details": {"recipient": req.recipient_role, "is_ai_drafted": req.is_ai_drafted}
    })

    # Notify recipient role
    await db.notifications.insert_one({
        "id": f"notif-{uuid.uuid4().hex[:8]}",
        "recipient_role": req.recipient_role,
        "case_id": case_id,
        "title": f"New message on {case_id}",
        "message": f"{current_user.get('name')}: {req.content[:80]}...",
        "priority": "MEDIUM",
        "read": False,
        "action_url": f"/cases/{case_id}",
        "timestamp": now
    })

    return new_message
