from typing import Optional, List, Dict, Any
from datetime import datetime
from pydantic import BaseModel, Field

class CommunicationMessage(BaseModel):
    id: str
    case_id: str
    sender_id: str
    sender_name: str
    sender_role: str
    sender_org: str
    recipient_role: str # PHARMACY_STAFF, PRACTICE_STAFF, PROVIDER
    content: str
    is_ai_drafted: bool = False
    ai_confidence: Optional[float] = None
    reviewed_by_human: bool = True
    attachments: List[str] = Field(default_factory=list)
    timestamp: datetime = Field(default_factory=datetime.utcnow)

class AuditLogEntry(BaseModel):
    id: str
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    case_id: Optional[str] = None
    actor_type: str # "AI" or "HUMAN" or "SYSTEM"
    actor_id: str
    actor_name: str
    actor_role: str
    action: str
    event_type: str
    previous_state: Optional[str] = None
    new_state: Optional[str] = None
    confidence: Optional[float] = None
    details: Dict[str, Any] = Field(default_factory=dict)
