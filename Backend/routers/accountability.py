from __future__ import annotations

from fastapi import APIRouter

from services.runtime import log_service

router = APIRouter(prefix="/api/accountability", tags=["accountability"])


@router.get("/log")
def get_accountability_log():
    return log_service.list_log_entries()
