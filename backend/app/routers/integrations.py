from fastapi import APIRouter, HTTPException, BackgroundTasks
from typing import Dict, Any, List
from datetime import datetime
from app.database import get_database
from app.utils.seed_data import DEMO_INTEGRATIONS
import logging

logger = logging.getLogger("rxresolve.integrations")
router = APIRouter(prefix="/api", tags=["Integrations & Observability"])

@router.get("/integrations")
async def list_integrations():
    """Returns status and telemetry for all connected healthcare infrastructure bridges."""
    db = get_database()
    if db is None:
        return DEMO_INTEGRATIONS
    items = await db.integrations.find({}, {"_id": 0}).to_list(length=20)
    return items or DEMO_INTEGRATIONS

@router.post("/integrations/{integration_id}/retry")
async def retry_integration(integration_id: str):
    """Retries a degraded or timed-out external gateway connection."""
    db = get_database()
    if db is None:
        raise HTTPException(status_code=500, detail="Database connection unavailable")

    now = datetime.utcnow()
    await db.integrations.update_one(
        {"id": integration_id},
        {"$set": {
            "status": "HEALTHY",
            "last_error": None,
            "simulate_failure": False,
            "last_sync": now,
            "latency_ms": 52
        }}
    )

    # Record event in audit log
    await db.audit_logs.insert_one({
        "id": f"aud-retry-{integration_id}",
        "timestamp": now,
        "actor_type": "HUMAN",
        "actor_id": "usr-admin-01",
        "actor_name": "Operations Admin",
        "actor_role": "ADMIN",
        "action": f"RETRY_INTEGRATION_{integration_id.upper()}",
        "event_type": "INTEGRATION_RECOVERY",
        "details": {"integration_id": integration_id, "new_status": "HEALTHY"}
    })

    updated = await db.integrations.find_one({"id": integration_id}, {"_id": 0})
    return {"message": f"Integration {integration_id} successfully reconnected.", "integration": updated}

@router.post("/integrations/{integration_id}/toggle-failure")
async def toggle_integration_failure(integration_id: str):
    """Toggles simulated degradation/failure for demo and resiliency testing."""
    db = get_database()
    if db is None:
        raise HTTPException(status_code=500, detail="Database connection unavailable")

    item = await db.integrations.find_one({"id": integration_id})
    if not item:
        raise HTTPException(status_code=404, detail="Integration not found")

    new_status = "DEGRADED" if item.get("status") == "HEALTHY" else "HEALTHY"
    error_msg = "Simulated gateway connection timeout (504 Gateway Timeout)" if new_status == "DEGRADED" else None

    await db.integrations.update_one(
        {"id": integration_id},
        {"$set": {
            "status": new_status,
            "last_error": error_msg,
            "simulate_failure": (new_status == "DEGRADED"),
            "latency_ms": 2840 if new_status == "DEGRADED" else 48,
            "last_sync": datetime.utcnow()
        }}
    )

    updated = await db.integrations.find_one({"id": integration_id}, {"_id": 0})
    return {"message": f"Integration status toggled to {new_status}", "integration": updated}

@router.get("/health")
async def system_health():
    """Observability endpoint reporting system subsystem health."""
    db = get_database()
    db_healthy = False
    if db is not None:
        try:
            await db.command("ping")
            db_healthy = True
        except Exception:
            db_healthy = False

    integrations_status = "HEALTHY"
    if db is not None:
        degraded_count = await db.integrations.count_documents({"status": "DEGRADED"})
        if degraded_count > 0:
            integrations_status = "DEGRADED"

    return {
        "status": "HEALTHY" if db_healthy else "DEGRADED",
        "timestamp": datetime.utcnow(),
        "subsystems": {
            "api": {"status": "HEALTHY", "latency_ms": 4},
            "database": {"status": "HEALTHY" if db_healthy else "DOWN", "type": "MongoDB"},
            "ai_engine": {"status": "HEALTHY", "model": "RxResolve Clinical NLP + Gemini"},
            "rag_service": {"status": "HEALTHY", "sop_documents_indexed": 6},
            "external_integrations": {"status": integrations_status}
        }
    }

# Mock endpoints for simulated network calls
@router.post("/integrations/pharmacy/refill-status")
async def mock_pharmacy_status(payload: Dict[str, Any]):
    return {"status": "ACCEPTED", "transaction_id": "NCPDP-TX-88392", "pharmacy_npi": "1942857102"}

@router.post("/integrations/ehr/patient")
async def mock_ehr_patient(payload: Dict[str, Any]):
    return {"fhir_id": "pat-10482", "active": True, "allergies": ["Penicillin (Mild rash)"]}

@router.post("/integrations/insurance/check")
async def mock_insurance_check(payload: Dict[str, Any]):
    return {"covered": True, "copay": "$10.00", "pa_required": False}
