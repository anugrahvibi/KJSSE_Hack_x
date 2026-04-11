from __future__ import annotations

import asyncio
import os
import sys
from contextlib import asynccontextmanager

from fastapi import FastAPI, HTTPException, Request, Response
from fastapi.responses import JSONResponse

# Add parent directory to Python path to import AI modules
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from Backend.config import OVERDUE_CHECK_SECONDS
from Backend.routers import accountability, agent, cascade, compat_v1, demo, detection, websocket
from Backend.services.runtime import log_service, ws_manager


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


app = FastAPI(title="Riva Mumbai Backend", version="1.0.0", lifespan=lifespan)

app.include_router(detection.router)
app.include_router(agent.router)
app.include_router(cascade.router)
app.include_router(accountability.router)
app.include_router(websocket.router)
app.include_router(demo.router)
app.include_router(compat_v1.router)


@app.get("/health")
def health_check():
    return {"status": "ok"}


@app.get("/health/llm")
def llm_health_check():
    try:
        from AI_ML.layer2_agent.agent import client as shared_client

        ready = shared_client is not None
        provider = "groq" if ready else "unconfigured"
        return {
            "status": "ok",
            "llm_ready": ready,
            "provider": provider,
            "message": "LLM client is ready" if ready else "LLM client is not configured. Set GROQ_API_KEY.",
        }
    except Exception as exc:
        return {
            "status": "error",
            "llm_ready": False,
            "provider": "unknown",
            "message": f"LLM health check failed: {exc}",
        }


@app.get("/")
def root():
    return {
        "service": "Riva Mumbai Backend",
        "status": "ok",
        "docs": "/docs",
        "health": "/health",
        "llm_health": "/health/llm",
    }


@app.get("/favicon.ico", include_in_schema=False)
def favicon():
    return Response(status_code=204)


@app.get("/apple-touch-icon.png", include_in_schema=False)
def apple_touch_icon():
    return Response(status_code=204)


@app.get("/apple-touch-icon-precomposed.png", include_in_schema=False)
def apple_touch_icon_precomposed():
    return Response(status_code=204)


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
