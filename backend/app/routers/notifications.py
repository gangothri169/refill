from fastapi import APIRouter, HTTPException, Depends
from typing import List, Optional
from datetime import datetime
from app.database import get_database
from app.routers.auth import get_current_user
import logging

logger = logging.getLogger("rxresolve.notifications")
router = APIRouter(prefix="/api/notifications", tags=["Notifications"])

@router.get("")
async def get_notifications(current_user: dict = Depends(get_current_user)):
    """Retrieves notifications filtered by user role or broadcast."""
    db = get_database()
    if db is None:
        raise HTTPException(status_code=500, detail="Database connection unavailable")

    role = current_user.get("role")
    user_id = current_user.get("id")
    
    query = {
        "$or": [
            {"recipient_role": role},
            {"recipient_user_id": user_id},
            {"recipient_role": None}
        ]
    }
    cursor = db.notifications.find(query, {"_id": 0}).sort("timestamp", -1).limit(50)
    items = await cursor.to_list(length=50)
    return items

@router.patch("/{notification_id}/read")
async def mark_as_read(notification_id: str):
    """Marks a single notification as read."""
    db = get_database()
    if db is None:
        raise HTTPException(status_code=500, detail="Database connection unavailable")

    await db.notifications.update_one({"id": notification_id}, {"$set": {"read": True}})
    return {"status": "ok"}

@router.post("/read-all")
async def mark_all_as_read(current_user: dict = Depends(get_current_user)):
    """Marks all notifications for current user/role as read."""
    db = get_database()
    if db is None:
        raise HTTPException(status_code=500, detail="Database connection unavailable")

    role = current_user.get("role")
    await db.notifications.update_many({"recipient_role": role}, {"$set": {"read": True}})
    return {"status": "ok"}
