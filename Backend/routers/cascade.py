from fastapi import APIRouter, WebSocket, WebSocketDisconnect
import asyncio
import json
import os
from AI.layer3_cascade.graph_builder import G
from AI.layer3_cascade.event_mode import run_event_mode
from AI.layer3_cascade.audit_mode import run_audit_mode

router = APIRouter(tags=["cascade"])

@router.get("/api/cascade/event/{ward_id}")
async def cascade_event(ward_id: str):
    # Map ward_id to graph trigger node (H-East -> WARD_H_EAST)
    trigger_node = f"WARD_{ward_id.replace('-', '_').upper()}"
    if trigger_node not in G.nodes:
        trigger_node = ward_id

    steps = run_event_mode(G, trigger_node)
    return [step.model_dump() for step in steps]

@router.get("/api/cascade/audit")
async def cascade_audit():
    # Load ward_data from ward_outfalls.json
    outfalls_path = "Backend/data/ward_outfalls.json"
    ward_data = []
    if os.path.exists(outfalls_path):
        with open(outfalls_path, "r", encoding="utf-8") as f:
            data = json.load(f)
            ward_data = data.get("wards", [])
            
    report = run_audit_mode(G, ward_data)
    return report.model_dump()

@router.websocket("/ws/cascade")
async def cascade_websocket(websocket: WebSocket):
    await websocket.accept()
    try:
        while True:
            data = await websocket.receive_text()
            message = json.loads(data)
            trigger = message.get("trigger")
            if trigger:
                steps = run_event_mode(G, trigger)
                for step in steps:
                    await websocket.send_json({
                        "type": "cascade_step",
                        "payload": step.model_dump()
                    })
                    await asyncio.sleep(1)
    except WebSocketDisconnect:
        pass
