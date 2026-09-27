from typing import Optional
from datetime import datetime
from pydantic import BaseModel, Field

class Notification(BaseModel):
    id: str
    recipient_role: Optional[str] = None # PHARMACY_STAFF, PRACTICE_STAFF, PROVIDER, ADMIN, or specific user
    recipient_user_id: Optional[str] = None
    case_id: Optional[str] = None
    title: str
    message: str
    priority: str = "MEDIUM" # LOW, MEDIUM, HIGH, CRITICAL
    read: bool = False
    action_url: Optional[str] = None
    timestamp: datetime = Field(default_factory=datetime.utcnow)

class KnowledgeDocument(BaseModel):
    id: str
    title: str
    category: str # "Practice SOPs", "Administrative Rules", "Internal Workflow Rules"
    source_name: str
    content: str
    keywords: list[str] = Field(default_factory=list)
    version: str = "v2.4"
    updated_at: datetime = Field(default_factory=datetime.utcnow)
