from pydantic import BaseModel
from enum import Enum

class FloodStatus(str, Enum):
    CLEAR = "CLEAR"
    WATCH = "WATCH"
    WARNING = "WARNING"
    CRITICAL = "CRITICAL"

class WardStatus(BaseModel):
    ward_id: str
    ward_name: str
    drainage_capacity_pct: float
    tide_height: float
    outfall_elevation_m: float
    rainfall_rate: float
    flood_status: FloodStatus
    permanently_undrained: bool = False

def compute_ward_status(ward_id: str, ward_name: str, outfall_elevation_m: float,
                        tide_height: float, rainfall_rate: float,
                        permanently_undrained: bool = False) -> WardStatus:
    """
    Computes purely physics-based drainage potential.
    If tide is above the outfall elevation, the drain is physically sealed (Tidal lock).
    Otherwise, we calculate the remaining capacity percentage.
    """
    if tide_height >= outfall_elevation_m:
        drain_pct = 0.0   # Tidal lock — drain is sealed
    else:
        drain_pct = (outfall_elevation_m - tide_height) / outfall_elevation_m * 100

    if drain_pct == 0 and rainfall_rate > 0:
        status = FloodStatus.CRITICAL
    elif drain_pct < 60 and rainfall_rate > 0:
        status = FloodStatus.WARNING
    elif drain_pct < 90 and rainfall_rate > 0:
        status = FloodStatus.WATCH
    else:
        status = FloodStatus.CLEAR

    return WardStatus(
        ward_id=ward_id,
        ward_name=ward_name,
        drainage_capacity_pct=round(drain_pct, 1),
        tide_height=tide_height,
        outfall_elevation_m=outfall_elevation_m,
        rainfall_rate=rainfall_rate,
        flood_status=status,
        permanently_undrained=permanently_undrained
    )

def compute_all_wards(tide_data: dict, rainfall_data: dict, ward_data: list) -> list[WardStatus]:
    """Main entry point. Called by Backend every 15 minutes or on demand."""
    from .tide_parser import get_current_tide_height
    from .rainfall_parser import get_ward_rainfall

    tide_height = get_current_tide_height(tide_data)
    results = []
    for ward in ward_data:
        rainfall = get_ward_rainfall(rainfall_data, ward["ward_id"])
        results.append(compute_ward_status(
            ward_id=ward["ward_id"],
            ward_name=ward["ward_name"],
            outfall_elevation_m=ward["outfall_elevation_m"],
            tide_height=tide_height,
            rainfall_rate=rainfall,
            permanently_undrained=ward.get("permanently_undrained", False)
        ))
    return results

class CascadeStep(BaseModel):
    step: int
    node_id: str
    node_label: str
    lat: float
    lng: float
    t_plus_minutes: int
    population_affected: int
    failure_condition: str
    cascade_weight: float

class NodeRanking(BaseModel):
    node_id: str
    node_label: str
    lat: float
    lng: float
    cascade_multiplier: int
    downstream_node_count: int

class VulnerabilityReport(BaseModel):
    ranked_nodes: list[NodeRanking]
    single_points_of_failure: list[NodeRanking]   # top 3
    permanently_undrained_wards: list[str]
