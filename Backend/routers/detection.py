from __future__ import annotations

from fastapi import APIRouter, HTTPException

from ..models.ward import FloodStatus, TriggerScenarioRequest
from ..services.orchestration import dispatch_from_ward_status
from ..services.runtime import drain_service, ws_manager

router = APIRouter(prefix="/api/detection", tags=["detection"])

# Demo mode state
demo_mode = False

@router.post("/demo/start")
def start_demo_mode():
    """Start demo mode with mock data"""
    global demo_mode
    demo_mode = True
    # Force reload of demo data
    drain_service._load_demo_data()
    return {"status": "demo_mode_activated", "message": "Using mock tide and rainfall data for demonstration"}

@router.post("/demo/stop")
def stop_demo_mode():
    """Stop demo mode and return to real data"""
    global demo_mode
    demo_mode = False
    return {"status": "demo_mode_deactivated", "message": "Switched back to real-time data"}

@router.get("/demo/status")
def get_demo_status():
    """Get current demo mode status"""
    return {"demo_mode": demo_mode}


@router.get("/status")
def detection_status():
    return drain_service.compute_all_wards()


@router.get("/environmental")
def environmental_status():
    """Get current environmental data for dashboard display"""
    tide_height = drain_service.get_current_tide_height()
    rainfall_map = drain_service.get_current_rainfall_map()
    
    # Get data for H-East ward (primary ward being monitored)
    h_east_rainfall = rainfall_map.get("DHARAVI", 0.0)
    
    # Calculate drain capacity for H-East
    wards = drain_service.get_wards()
    h_east_ward = next((w for w in wards if w["ward_id"] == "H-East"), None)
    drain_capacity = 0.0
    outfall_elevation = 4.2  # default
    
    if h_east_ward:
        outfall_elevation = float(h_east_ward.get("outfall_elevation_m", 4.2))
        if tide_height >= outfall_elevation:
            drain_capacity = 0.0  # Tidal lock
        else:
            drain_capacity = (outfall_elevation - tide_height) / outfall_elevation * 100
    
    # Determine tide direction (simplified - in real implementation would use tide_parser)
    tide_direction = "Rising" if tide_height < 3.0 else "Falling"
    
    return {
        "tide_height_m": round(tide_height, 1),
        "outfall_elevation_m": outfall_elevation,
        "rainfall_mm_hr": round(h_east_rainfall, 1),
        "drain_capacity_pct": round(drain_capacity, 1),
        "tide_direction": tide_direction,
        "imd_threshold_mm_hr": 65.0,  # IMD extreme rainfall threshold
        "peak_tide_hours": 4  # Estimated hours to peak tide
    }


@router.get("/ward/{ward_id}")
def detection_ward(ward_id: str):
    ward = drain_service.compute_single_ward(ward_id)
    if not ward:
        raise HTTPException(status_code=404, detail={"error": "ward_not_found", "ward_id": ward_id})
    return ward


@router.post("/trigger")
async def detection_trigger(payload: TriggerScenarioRequest):
    ward = drain_service.compute_single_ward(payload.ward_id)
    if not ward:
        raise HTTPException(status_code=404, detail={"error": "ward_not_found", "ward_id": payload.ward_id})

    if payload.severity:
        ward.flood_status = FloodStatus(payload.severity)

    event = {
        "type": "ward_status_update",
        "ward_id": ward.ward_id,
        "severity": ward.flood_status.value,
        "drainage_capacity_pct": ward.drainage_capacity_pct,
        "tide_height": ward.tide_height,
        "rainfall_rate": ward.rainfall_rate,
        "timestamp": "triggered",
    }
    await ws_manager.broadcast_dashboard(event)

    plan, alerts = await dispatch_from_ward_status(ward)
    return {"ward_status": ward, "action_plan": plan, "alerts": alerts}
