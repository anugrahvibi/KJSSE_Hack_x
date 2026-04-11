from __future__ import annotations

import asyncio
from contextlib import asynccontextmanager

from fastapi import FastAPI, HTTPException, Request
from fastapi.responses import JSONResponse

from config import OVERDUE_CHECK_SECONDS
from routers import accountability, agent, cascade, demo, detection, websocket
from services.runtime import log_service, ws_manager


overdue_task: asyncio.Task | None = None


async def overdue_loop() -> None:
    while True:
        overdue_alerts = log_service.mark_overdue()
        for alert in overdue_alerts:
            event = {
                "type": "alert_acknowledged",
                "alert_id": alert.alert_id,
                "dept": alert.dept,
                "status": alert.status.value,
                "response_time_seconds": None,
                "timestamp": None,
            }
            await ws_manager.broadcast_alert(event, dept_id=alert.dept)
        await asyncio.sleep(OVERDUE_CHECK_SECONDS)


@asynccontextmanager
async def lifespan(_: FastAPI):
    global overdue_task
    overdue_task = asyncio.create_task(overdue_loop())
    yield
    if overdue_task:
        overdue_task.cancel()


app = FastAPI(title="CascadeNet Mumbai Backend", version="1.0.0", lifespan=lifespan)

app.include_router(detection.router)
app.include_router(agent.router)
app.include_router(cascade.router)
app.include_router(accountability.router)
app.include_router(websocket.router)
app.include_router(demo.router)


@app.get("/health")
def health_check():
    return {"status": "ok"}


@app.exception_handler(HTTPException)
async def http_exception_handler(_: Request, exc: HTTPException):
    detail = exc.detail if isinstance(exc.detail, dict) else {"error": "http_error", "message": str(exc.detail)}
    return JSONResponse(status_code=exc.status_code, content={"ok": False, "error": detail})


@app.exception_handler(Exception)
async def unhandled_exception_handler(_: Request, exc: Exception):
    return JSONResponse(
        status_code=500,
        content={
            "ok": False,
            "error": {
                "type": exc.__class__.__name__,
                "message": str(exc),
            },
        },
    )
