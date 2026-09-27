from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field
from app.models.case import CaseStatus, PriorityLevel, BlockerCategory

class CaseCreateRequest(BaseModel):
    patient_name: str
    patient_dob: Optional[str] = "1984-06-12"
    patient_phone: Optional[str] = "555-019-2834"
    medication_name: str
    dosage: str = "10mg"
    quantity: int = 30
    days_supply: int = 30
    refills_requested: int = 1
    refills_remaining: int = 0
    last_fill_date: Optional[str] = "2026-07-15"
    pharmacy_name: str = "Downtown Pharmacy"
    pharmacy_phone: Optional[str] = "555-321-9988"
    practice_name: str = "Downtown Physician Group"
    provider_name: str = "Dr. Sarah Wilson"
    notes: Optional[str] = None
    force_blocker: Optional[str] = None

class CaseStatusUpdateRequest(BaseModel):
    new_status: CaseStatus
    reason: str
    note: Optional[str] = None
    required_next_action: Optional[str] = None
    owner_id: Optional[str] = None
    owner_name: Optional[str] = None
    owner_role: Optional[str] = None

class CaseAssignRequest(BaseModel):
    assignee_id: str
    assignee_name: str
    assignee_role: str
    note: Optional[str] = None

class ProviderDecisionRequest(BaseModel):
    decision: str # "APPROVE", "REQUEST_INFO", "REQUIRE_VISIT", "DECLINE"
    notes: str
    refills_approved: Optional[int] = 3
    visit_type_required: Optional[str] = None # e.g. "Annual Wellness Exam", "Blood Pressure Check"
    request_details: Optional[str] = None

class CaseFilterParams(BaseModel):
    status: Optional[str] = None
    blocker: Optional[str] = None
    priority: Optional[str] = None
    assigned_role: Optional[str] = None
    assigned_user: Optional[str] = None
    pharmacy: Optional[str] = None
    search: Optional[str] = None
