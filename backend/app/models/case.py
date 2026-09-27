from enum import Enum
from typing import Optional, List, Dict, Any
from datetime import datetime
from pydantic import BaseModel, Field

class CaseStatus(str, Enum):
    NEW = "NEW"
    TRIAGING = "TRIAGING"
    INVESTIGATING = "INVESTIGATING"
    WAITING_FOR_INFORMATION = "WAITING_FOR_INFORMATION"
    WAITING_FOR_PROVIDER = "WAITING_FOR_PROVIDER"
    WAITING_FOR_PHARMACY = "WAITING_FOR_PHARMACY"
    WAITING_FOR_INSURANCE = "WAITING_FOR_INSURANCE"
    ACTION_REQUIRED = "ACTION_REQUIRED"
    RESOLVED = "RESOLVED"
    CANCELLED = "CANCELLED"
    FAILED = "FAILED"
    ESCALATED = "ESCALATED"

class PriorityLevel(str, Enum):
    LOW = "LOW"
    MEDIUM = "MEDIUM"
    HIGH = "HIGH"
    CRITICAL = "CRITICAL"

class BlockerCategory(str, Enum):
    PROVIDER_RELATED = "Provider-related"
    INFORMATION_RELATED = "Information-related"
    PHARMACY_RELATED = "Pharmacy-related"
    INSURANCE_ADMINISTRATIVE = "Insurance/administrative"
    SYSTEM_INTEGRATION = "System/integration"

class UserRole(str, Enum):
    PHARMACY_STAFF = "PHARMACY_STAFF"
    PRACTICE_STAFF = "PRACTICE_STAFF"
    PROVIDER = "PROVIDER"
    ADMIN = "ADMIN"

class InformationCompleteness(BaseModel):
    patient_info: bool = True
    medication_info: bool = True
    pharmacy_info: bool = True
    prescription_details: bool = True
    provider_info: bool = True
    required_review_completed: bool = False
    details: Dict[str, str] = Field(default_factory=dict)

class AIAnalysisSummary(BaseModel):
    blocker: str
    category: str
    confidence: float
    recommended_action: str
    recommended_role: str
    operational_priority: str
    reasoning: str
    summary: str
    rag_sources: List[Dict[str, str]] = Field(default_factory=list)
    created_at: datetime = Field(default_factory=datetime.utcnow)

class CaseEvent(BaseModel):
    id: Optional[str] = None
    case_id: str
    actor_id: str
    actor_name: str
    actor_role: str
    action: str
    from_status: Optional[str] = None
    to_status: Optional[str] = None
    note: Optional[str] = None
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    details: Dict[str, Any] = Field(default_factory=dict)
