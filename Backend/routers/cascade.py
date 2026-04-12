from fastapi import APIRouter, WebSocket, WebSocketDisconnect
import asyncio
import json
from ..services.runtime import cascade_service

router = APIRouter(tags=["cascade"])

@router.get("/api/cascade/event/{ward_id}")
async def cascade_event(ward_id: str):
    steps = cascade_service.compute_event_cascade(ward_id)
    steps_dump = [step.model_dump() for step in steps]
    try:
        from AI_ML.layer3_cascade.cascade_narrator import generate_cascade_narrative
        narrative = generate_cascade_narrative(ward_id, steps_dump)
        print(f"Cascade narrative projection: {narrative}")
    except Exception as e:
        pass
    return steps_dump

@router.get("/api/cascade/audit")
async def cascade_audit():
    report = cascade_service.compute_audit()
    return report.model_dump()

@router.get("/api/wards/geojson")
async def wards_geojson():
    return cascade_service.wards_geojson()

@router.websocket("/ws/cascade")
async def cascade_websocket(websocket: WebSocket):
    await websocket.accept()
    try:
        while True:
            data = await websocket.receive_text()
            message = json.loads(data)
            trigger = message.get("trigger")
            if trigger:
                steps = cascade_service.compute_event_cascade(trigger)
                for step in steps:
                    await websocket.send_json({
                        "type": "cascade_step",
                        "payload": step.model_dump()
                    })
                    await asyncio.sleep(1)
    except WebSocketDisconnect:
        pass
