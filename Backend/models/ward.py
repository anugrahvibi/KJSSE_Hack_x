from __future__ import annotations

from enum import Enum

from pydantic import BaseModel


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


class TriggerScenarioRequest(BaseModel):
    ward_id: str
    severity: FloodStatus | None = None
