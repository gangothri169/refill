from fastapi import APIRouter, HTTPException, Query
from typing import Optional, Dict, Any, List
from app.database import get_database
import logging

logger = logging.getLogger("rxresolve.audit")
router = APIRouter(prefix="/api/audit", tags=["Audit Log"])

@router.get("")
async def get_audit_logs(
    case_id: Optional[str] = Query(None),
    actor_type: Optional[str] = Query(None), # AI, HUMAN, SYSTEM
    actor_role: Optional[str] = Query(None),
    event_type: Optional[str] = Query(None),
    search: Optional[str] = Query(None),
    limit: int = Query(100, le=200)
):
    """
    Retrieves immutable audit trail entries.
    Audit log cannot be updated or deleted from the API or UI.
    """
    db = get_database()
    if db is None:
        raise HTTPException(status_code=500, detail="Database connection unavailable")

    query: Dict[str, Any] = {}
    if case_id:
        query["case_id"] = case_id
    if actor_type and actor_type != "ALL":
        query["actor_type"] = actor_type
    if actor_role and actor_role != "ALL":
        query["actor_role"] = actor_role
    if event_type and event_type != "ALL":
        query["event_type"] = event_type
    if search:
        search_regex = {"$regex": search, "$options": "i"}
        query["$or"] = [
            {"case_id": search_regex},
            {"actor_name": search_regex},
            {"action": search_regex},
            {"event_type": search_regex}
        ]

    cursor = db.audit_logs.find(query, {"_id": 0}).sort("timestamp", -1).limit(limit)
    entries = await cursor.to_list(length=limit)
    return entries
