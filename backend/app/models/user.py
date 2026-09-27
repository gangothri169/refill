from typing import Optional
from datetime import datetime
from pydantic import BaseModel, Field

class User(BaseModel):
    id: str
    email: str
    name: str
    role: str # PHARMACY_STAFF, PRACTICE_STAFF, PROVIDER, ADMIN
    role_title: str # e.g. "Lead Pharmacy Technician", "Practice Care Coordinator", "Attending Physician", "Operations Director"
    organization_id: str
    organization_name: str
    organization_type: str # PHARMACY, PRACTICE, HEALTH_SYSTEM
    avatar: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)

class Organization(BaseModel):
    id: str
    name: str
    type: str # PHARMACY, PRACTICE, HEALTH_SYSTEM
    locations_count: int = 1
    created_at: datetime = Field(default_factory=datetime.utcnow)
