from __future__ import annotations

from fastapi import APIRouter

from services.runtime import cascade_service

router = APIRouter(tags=["cascade"])


@router.get("/api/cascade/event/{ward_id}")
def cascade_event(ward_id: str):
    return cascade_service.compute_event_cascade(ward_id)


@router.get("/api/cascade/audit")
def cascade_audit():
    return cascade_service.compute_audit()


@router.get("/api/wards/geojson")
def wards_geojson():
    return cascade_service.wards_geojson()
