from __future__ import annotations

from fastapi import APIRouter, WebSocket, WebSocketDisconnect

from ..services.runtime import ws_manager

router = APIRouter(tags=["websocket"])


@router.websocket("/ws/dashboard")
async def ws_dashboard(websocket: WebSocket):
    await ws_manager.connect_dashboard(websocket)
    try:
        while True:
            await websocket.receive_text()
    except WebSocketDisconnect:
        ws_manager.disconnect_dashboard(websocket)
    except Exception:
        ws_manager.disconnect_dashboard(websocket)


@router.websocket("/ws/dept/{dept_id}")
async def ws_department(websocket: WebSocket, dept_id: str):
    await ws_manager.connect_dept(dept_id, websocket)
    try:
        while True:
            await websocket.receive_text()
    except WebSocketDisconnect:
        ws_manager.disconnect_dept(dept_id, websocket)
    except Exception:
        ws_manager.disconnect_dept(dept_id, websocket)
