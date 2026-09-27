from typing import Optional, Dict, Any
from datetime import datetime
from pydantic import BaseModel, Field

class IntegrationService(BaseModel):
    id: str
    name: str
    category: str # "EHR", "Pharmacy Network", "Insurance/PBM", "Notifications", "AI Engine", "RAG Engine"
    protocol: str # "FHIR R4", "NCPDP SCRIPT 2017071", "X12 278 / EDI", "WebSocket / Webhook"
    status: str # "HEALTHY", "DEGRADED", "OFFLINE"
    latency_ms: int = 42
    success_rate: float = 99.4
    last_sync: datetime = Field(default_factory=datetime.utcnow)
    last_error: Optional[str] = None
    simulate_failure: bool = False
    details: Dict[str, Any] = Field(default_factory=dict)
