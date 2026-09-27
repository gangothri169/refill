from typing import Optional, List, Dict, Any
from pydantic import BaseModel

class CopilotChatRequest(BaseModel):
    message: str
    case_id: Optional[str] = None
    role: Optional[str] = "PRACTICE_STAFF"

class CopilotChatResponse(BaseModel):
    answer: str
    sources: List[Dict[str, str]]
    recommended_next_step: Optional[str] = None
    confidence: float
    case_context_used: bool

class DraftMessageRequest(BaseModel):
    case_id: str
    from_role: str # "PHARMACY_STAFF" or "PRACTICE_STAFF"
    to_role: str # "PRACTICE_STAFF" or "PHARMACY_STAFF" or "PROVIDER"
    context_note: Optional[str] = None

class DraftMessageResponse(BaseModel):
    subject: str
    body: str
    ai_confidence: float
    rationale: str

class InformationExtractionResponse(BaseModel):
    patient: str
    medication: str
    dosage: str
    quantity: int
    refills_remaining: int
    pharmacy: str
    provider: str
    last_visit: Optional[str]
    identified_blockers: List[str]
