from typing import Dict, Any, Optional, List
from datetime import datetime, timedelta
from fastapi import HTTPException
from app.models.case import CaseStatus
from app.database import get_database
import uuid
import logging

logger = logging.getLogger("rxresolve.workflow")

# State transition matrix
ALLOWED_TRANSITIONS: Dict[CaseStatus, List[CaseStatus]] = {
    CaseStatus.NEW: [
        CaseStatus.TRIAGING,
        CaseStatus.CANCELLED
    ],
    CaseStatus.TRIAGING: [
        CaseStatus.INVESTIGATING,
        CaseStatus.WAITING_FOR_INFORMATION,
        CaseStatus.WAITING_FOR_PROVIDER,
        CaseStatus.WAITING_FOR_PHARMACY,
        CaseStatus.WAITING_FOR_INSURANCE,
        CaseStatus.ACTION_REQUIRED,
        CaseStatus.CANCELLED
    ],
    CaseStatus.INVESTIGATING: [
        CaseStatus.WAITING_FOR_INFORMATION,
        CaseStatus.WAITING_FOR_PROVIDER,
        CaseStatus.WAITING_FOR_PHARMACY,
        CaseStatus.WAITING_FOR_INSURANCE,
        CaseStatus.ACTION_REQUIRED,
        CaseStatus.ESCALATED,
        CaseStatus.CANCELLED
    ],
    CaseStatus.WAITING_FOR_INFORMATION: [
        CaseStatus.INVESTIGATING,
        CaseStatus.WAITING_FOR_PROVIDER,
        CaseStatus.ACTION_REQUIRED,
        CaseStatus.ESCALATED,
        CaseStatus.CANCELLED
    ],
    CaseStatus.WAITING_FOR_PROVIDER: [
        CaseStatus.ACTION_REQUIRED,
        CaseStatus.RESOLVED,
        CaseStatus.WAITING_FOR_INFORMATION,
        CaseStatus.WAITING_FOR_PHARMACY,
        CaseStatus.ESCALATED,
        CaseStatus.CANCELLED
    ],
    CaseStatus.WAITING_FOR_PHARMACY: [
        CaseStatus.INVESTIGATING,
        CaseStatus.WAITING_FOR_PROVIDER,
        CaseStatus.ACTION_REQUIRED,
        CaseStatus.RESOLVED,
        CaseStatus.ESCALATED,
        CaseStatus.CANCELLED
    ],
    CaseStatus.WAITING_FOR_INSURANCE: [
        CaseStatus.INVESTIGATING,
        CaseStatus.WAITING_FOR_PROVIDER,
        CaseStatus.ACTION_REQUIRED,
        CaseStatus.RESOLVED,
        CaseStatus.ESCALATED,
        CaseStatus.CANCELLED
    ],
    CaseStatus.ACTION_REQUIRED: [
        CaseStatus.RESOLVED,
        CaseStatus.WAITING_FOR_PROVIDER,
        CaseStatus.WAITING_FOR_PHARMACY,
        CaseStatus.FAILED,
        CaseStatus.CANCELLED
    ],
    CaseStatus.ESCALATED: [
        CaseStatus.INVESTIGATING,
        CaseStatus.WAITING_FOR_PROVIDER,
        CaseStatus.ACTION_REQUIRED,
        CaseStatus.RESOLVED,
        CaseStatus.CANCELLED
    ],
    CaseStatus.FAILED: [
        CaseStatus.TRIAGING,
        CaseStatus.INVESTIGATING,
        CaseStatus.CANCELLED
    ],
    CaseStatus.RESOLVED: [
        # Terminal state, but admin/supervisors can re-open to investigating
        CaseStatus.INVESTIGATING
    ],
    CaseStatus.CANCELLED: [
        CaseStatus.TRIAGING
    ]
}

class WorkflowService:
    @staticmethod
    def validate_transition(current_status: CaseStatus, target_status: CaseStatus):
        if current_status == target_status:
            return True
        allowed = ALLOWED_TRANSITIONS.get(current_status, [])
        if target_status not in allowed:
            raise HTTPException(
                status_code=400,
                detail=f"Invalid workflow state transition: Cannot transition case from '{current_status}' to '{target_status}'. Allowed target states: {[s.value for s in allowed]}"
            )
        return True

    @staticmethod
    async def transition_case(
        case_id: str,
        target_status: CaseStatus,
        actor_id: str,
        actor_name: str,
        actor_role: str,
        reason: str,
        note: Optional[str] = None,
        required_next_action: Optional[str] = None,
        new_owner_id: Optional[str] = None,
        new_owner_name: Optional[str] = None,
        new_owner_role: Optional[str] = None,
        metadata: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        db = get_database()
        if db is None:
            raise HTTPException(status_code=500, detail="Database connection unavailable")

        case = await db.refill_cases.find_one({"id": case_id})
        if not case:
            raise HTTPException(status_code=404, detail=f"Case {case_id} not found")

        current_status = CaseStatus(case["status"])
        WorkflowService.validate_transition(current_status, target_status)

        now = datetime.utcnow()

        # Update case payload
        update_fields: Dict[str, Any] = {
            "status": target_status.value,
            "previous_status": current_status.value,
            "last_status_reason": reason,
            "updated_at": now
        }

        if required_next_action:
            update_fields["required_next_action"] = required_next_action
        
        if new_owner_name:
            update_fields["owner_id"] = new_owner_id or actor_id
            update_fields["owner_name"] = new_owner_name
            update_fields["owner_role"] = new_owner_role or actor_role

        if target_status == CaseStatus.RESOLVED:
            update_fields["resolved_at"] = now
            update_fields["resolution_notes"] = note or reason
            update_fields["required_next_action"] = "Case resolved. No pending action."

        if metadata:
            for k, v in metadata.items():
                update_fields[k] = v

        await db.refill_cases.update_one({"id": case_id}, {"$set": update_fields})

        # 1. Create Case Event
        event_entry = {
            "id": f"evt-{uuid.uuid4().hex[:8]}",
            "case_id": case_id,
            "actor_id": actor_id,
            "actor_name": actor_name,
            "actor_role": actor_role,
            "action": f"STATUS_CHANGE_TO_{target_status.value}",
            "from_status": current_status.value,
            "to_status": target_status.value,
            "note": note or reason,
            "timestamp": now,
            "details": {
                "reason": reason,
                "required_next_action": update_fields.get("required_next_action"),
                "new_owner": update_fields.get("owner_name")
            }
        }
        await db.case_events.insert_one(event_entry)

        # 2. Create Immutable Audit Log
        audit_entry = {
            "id": f"audit-{uuid.uuid4().hex[:10]}",
            "timestamp": now,
            "case_id": case_id,
            "actor_type": "HUMAN" if actor_role != "SYSTEM" else "SYSTEM",
            "actor_id": actor_id,
            "actor_name": actor_name,
            "actor_role": actor_role,
            "action": f"TRANSITION_{current_status.value}_TO_{target_status.value}",
            "event_type": "WORKFLOW_TRANSITION",
            "previous_state": current_status.value,
            "new_state": target_status.value,
            "confidence": 1.0,
            "details": {
                "reason": reason,
                "note": note,
                "target_status": target_status.value
            }
        }
        await db.audit_logs.insert_one(audit_entry)

        # 3. Create Notification for Stakeholders
        notification_title = f"Case {case_id} updated: {target_status.value}"
        notification_message = f"{actor_name} moved case to {target_status.value}: {reason}"
        target_role = "PRACTICE_STAFF" if actor_role == "PHARMACY_STAFF" else "PHARMACY_STAFF"
        
        notification_entry = {
            "id": f"notif-{uuid.uuid4().hex[:8]}",
            "recipient_role": target_role,
            "case_id": case_id,
            "title": notification_title,
            "message": notification_message,
            "priority": "HIGH" if target_status in [CaseStatus.ACTION_REQUIRED, CaseStatus.ESCALATED] else "MEDIUM",
            "read": False,
            "action_url": f"/cases/{case_id}",
            "timestamp": now
        }
        await db.notifications.insert_one(notification_entry)

        # Return refreshed case
        refreshed_case = await db.refill_cases.find_one({"id": case_id}, {"_id": 0})
        return refreshed_case

workflow_service = WorkflowService()
