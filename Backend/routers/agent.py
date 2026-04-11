from __future__ import annotations

from fastapi import APIRouter, HTTPException

from ..models.alert import AcknowledgeRequest, DispatchRequest
from ..models.ward import WardStatus
from ..services.orchestration import broadcast_ack, dispatch_from_ward_status
from ..services.runtime import log_service

router = APIRouter(prefix="/api/agent", tags=["agent"])


@router.post("/dispatch")
async def dispatch(payload: DispatchRequest):
    ward_status = WardStatus(**payload.ward_status)
    plan, alerts = await dispatch_from_ward_status(ward_status, context=payload.context)
    return {"action_plan": plan, "alerts": alerts}


@router.post("/acknowledge/{alert_id}")
async def acknowledge(alert_id: str, payload: AcknowledgeRequest):
    try:
        alert = log_service.acknowledge(alert_id, payload.dept_id, payload.status)
    except KeyError:
        raise HTTPException(status_code=404, detail={"error": "alert_not_found", "alert_id": alert_id})
    except ValueError as exc:
        raise HTTPException(status_code=400, detail={"error": "invalid_ack", "message": str(exc)})

    await broadcast_ack(alert)
    return alert


@router.get("/alerts")
def get_alerts():
    return log_service.list_alerts()


@router.get("/log")
def get_log():
    return log_service.list_log_entries()
