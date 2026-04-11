from __future__ import annotations

from fastapi import APIRouter, HTTPException

from models.ward import FloodStatus, TriggerScenarioRequest
from services.orchestration import dispatch_from_ward_status
from services.runtime import drain_service, ws_manager

router = APIRouter(prefix="/api/detection", tags=["detection"])


@router.get("/status")
def detection_status():
    return drain_service.compute_all_wards()


@router.get("/ward/{ward_id}")
def detection_ward(ward_id: str):
    ward = drain_service.compute_single_ward(ward_id)
    if not ward:
        raise HTTPException(status_code=404, detail={"error": "ward_not_found", "ward_id": ward_id})
    return ward


@router.post("/trigger")
async def detection_trigger(payload: TriggerScenarioRequest):
    ward = drain_service.compute_single_ward(payload.ward_id)
    if not ward:
        raise HTTPException(status_code=404, detail={"error": "ward_not_found", "ward_id": payload.ward_id})

    if payload.severity:
        ward.flood_status = FloodStatus(payload.severity)

    event = {
        "type": "ward_status_update",
        "ward_id": ward.ward_id,
        "severity": ward.flood_status.value,
        "drainage_capacity_pct": ward.drainage_capacity_pct,
        "tide_height": ward.tide_height,
        "rainfall_rate": ward.rainfall_rate,
        "timestamp": "triggered",
    }
    await ws_manager.broadcast_dashboard(event)

    plan, alerts = await dispatch_from_ward_status(ward)
    return {"ward_status": ward, "action_plan": plan, "alerts": alerts}
