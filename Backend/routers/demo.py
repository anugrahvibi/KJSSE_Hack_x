from __future__ import annotations

import asyncio
import json
from pathlib import Path

from fastapi import APIRouter, HTTPException

from ..config import DATA_DIR
from ..models.cascade import DemoStartRequest
from ..models.ward import FloodStatus
from ..services.orchestration import broadcast_ack, dispatch_from_ward_status
from ..services.runtime import demo_service, drain_service, log_service, ws_manager

router = APIRouter(prefix="/api/demo", tags=["demo"])


async def _replay(events: list[dict], speed_multiplier: float):
    events = sorted(events, key=lambda e: e.get("t_seconds", 0))
    last_t = 0
    for event in events:
        t_seconds = int(event.get("t_seconds", 0))
        wait_for = max(0, (t_seconds - last_t) / max(speed_multiplier, 0.1))
        await asyncio.sleep(wait_for)
        last_t = t_seconds

        event_type = event.get("type")
        payload = event.get("payload", {})

        if event_type == "ward_status_update":
            ward = drain_service.compute_single_ward(payload.get("ward_id", ""))
            if ward:
                if payload.get("severity"):
                    ward.flood_status = FloodStatus(payload["severity"])
                if payload.get("drainage_capacity_pct") is not None:
                    ward.drainage_capacity_pct = payload["drainage_capacity_pct"]
                await ws_manager.broadcast_dashboard(
                    {
                        "type": "ward_status_update",
                        "ward_id": ward.ward_id,
                        "severity": ward.flood_status.value,
                        "drainage_capacity_pct": ward.drainage_capacity_pct,
                        "tide_height": ward.tide_height,
                        "rainfall_rate": ward.rainfall_rate,
                        "timestamp": "demo",
                    }
                )

        elif event_type == "agent_dispatch":
            ward = drain_service.compute_single_ward(payload.get("ward_id", ""))
            if ward:
                await dispatch_from_ward_status(ward)

        elif event_type == "acknowledge":
            alert_id = payload.get("alert_id")
            dept = payload.get("dept")
            if alert_id and dept:
                try:
                    alert = log_service.acknowledge(alert_id, dept)
                    await broadcast_ack(alert)
                except Exception:
                    pass

        elif event_type == "cascade_step":
            await ws_manager.broadcast_dashboard(
                {
                    "type": "cascade_step",
                    "step": payload.get("step", 1),
                    "node": payload.get("node", "unknown"),
                    "description": payload.get("description", "cascade effect"),
                    "affected_population": payload.get("affected_population", 0),
                    "t_plus_minutes": payload.get("t_plus_minutes", 0),
                    "timestamp": "demo",
                }
            )


@router.post("/start")
async def start_demo(payload: DemoStartRequest):
    scenario_path = Path(DATA_DIR) / "demo_scenario.json"
    if not scenario_path.exists():
        raise HTTPException(status_code=404, detail={"error": "demo_scenario_missing"})

    with scenario_path.open("r", encoding="utf-8") as f:
        scenario = json.load(f)

    events = scenario.get("events", [])
    demo_service.start(_replay(events, payload.speed_multiplier))
    return {
        "status": "started",
        "scenario_id": scenario.get("scenario_id", "unknown"),
        "events": len(events),
        "speed_multiplier": payload.speed_multiplier,
    }
