from __future__ import annotations

from collections import defaultdict

from fastapi import WebSocket


class WebSocketManager:
    def __init__(self) -> None:
        self.dashboard_clients: set[WebSocket] = set()
        self.dept_clients: dict[str, set[WebSocket]] = defaultdict(set)

    async def connect_dashboard(self, websocket: WebSocket) -> None:
        await websocket.accept()
        self.dashboard_clients.add(websocket)

    async def connect_dept(self, dept_id: str, websocket: WebSocket) -> None:
        await websocket.accept()
        self.dept_clients[dept_id].add(websocket)

    def disconnect_dashboard(self, websocket: WebSocket) -> None:
        self.dashboard_clients.discard(websocket)

    def disconnect_dept(self, dept_id: str, websocket: WebSocket) -> None:
        self.dept_clients[dept_id].discard(websocket)

    async def broadcast_dashboard(self, event: dict) -> None:
        dead: list[WebSocket] = []
        for ws in self.dashboard_clients:
            try:
                await ws.send_json(event)
            except Exception:
                dead.append(ws)
        for ws in dead:
            self.disconnect_dashboard(ws)

    async def broadcast_dept(self, dept_id: str, event: dict) -> None:
        dead: list[WebSocket] = []
        for ws in self.dept_clients.get(dept_id, set()):
            try:
                await ws.send_json(event)
            except Exception:
                dead.append(ws)
        for ws in dead:
            self.disconnect_dept(dept_id, ws)

    async def broadcast_alert(self, event: dict, dept_id: str | None = None) -> None:
        await self.broadcast_dashboard(event)
        if dept_id:
            await self.broadcast_dept(dept_id, event)
