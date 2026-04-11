from __future__ import annotations

import json
from datetime import datetime
from pathlib import Path

from ..models.ward import FloodStatus, WardStatus


WARD_STATION_MAP = {
    "H-East": "DHARAVI",
    "G-South": "BKC",
}


def _parse_dt(value: str) -> datetime:
    return datetime.fromisoformat(value.replace("Z", "+00:00"))


class DrainCapacityService:
    def __init__(self, tide_path: Path, rainfall_path: Path, outfalls_path: Path, mock_tide_path: Path = None, mock_rainfall_path: Path = None):
        self.tide_path = tide_path
        self.rainfall_path = rainfall_path
        self.outfalls_path = outfalls_path
        self.mock_tide_path = mock_tide_path or tide_path.parent / "mock_tide.json"
        self.mock_rainfall_path = mock_rainfall_path or rainfall_path.parent / "mock_rainfall.json"
        self.demo_mode = False

    def _load_json(self, path: Path) -> dict:
        with path.open("r", encoding="utf-8") as f:
            return json.load(f)

    def _load_demo_data(self):
        """Load mock data for demo mode"""
        self.demo_mode = True

    def get_current_tide_height(self) -> float:
        if self.demo_mode and self.mock_tide_path.exists():
            tide_data = self._load_json(self.mock_tide_path)
        else:
            tide_data = self._load_json(self.tide_path)
        
        heights = tide_data.get("heights", [])
        if not heights:
            return 0.0
        latest = sorted(heights, key=lambda x: _parse_dt(x["dt"]))[-1]
        return float(latest.get("height_m", 0.0))

    def get_current_rainfall_map(self) -> dict[str, float]:
        if self.demo_mode and self.mock_rainfall_path.exists():
            rain_data = self._load_json(self.mock_rainfall_path)
        else:
            rain_data = self._load_json(self.rainfall_path)
            
        station_rows = rain_data.get("stations", [])
        return {
            str(row.get("STATION", "")).upper(): float(row.get("RAINFALL_MM_HR", 0.0))
            for row in station_rows
        }

    def get_wards(self) -> list[dict]:
        outfall_data = self._load_json(self.outfalls_path)
        return outfall_data.get("wards", [])

    def compute_ward_status(self, ward: dict, tide_height: float, rainfall_rate: float) -> WardStatus:
        outfall = float(ward.get("outfall_elevation_m", 0.0))
        drain_pct = 0.0 if outfall <= 0 else max(0.0, (outfall - tide_height) / outfall * 100)

        if drain_pct == 0 and rainfall_rate > 0:
            status = FloodStatus.CRITICAL
        elif drain_pct < 30 and rainfall_rate > 0:
            status = FloodStatus.WARNING
        elif drain_pct < 60 and rainfall_rate > 0:
            status = FloodStatus.WATCH
        else:
            status = FloodStatus.CLEAR

        return WardStatus(
            ward_id=ward["ward_id"],
            ward_name=ward["ward_name"],
            drainage_capacity_pct=round(drain_pct, 1),
            tide_height=round(tide_height, 2),
            outfall_elevation_m=outfall,
            rainfall_rate=round(rainfall_rate, 1),
            flood_status=status,
            permanently_undrained=bool(ward.get("permanently_undrained", False)),
        )

    def compute_all_wards(self) -> list[WardStatus]:
        tide_height = self.get_current_tide_height()
        rainfall_map = self.get_current_rainfall_map()
        wards = self.get_wards()
        results: list[WardStatus] = []
        for ward in wards:
            station = WARD_STATION_MAP.get(ward["ward_id"], ward["ward_name"]).upper()
            rain = rainfall_map.get(station, 0.0)
            results.append(self.compute_ward_status(ward, tide_height, rain))
        return results

    def compute_single_ward(self, ward_id: str) -> WardStatus | None:
        all_status = self.compute_all_wards()
        for ward in all_status:
            if ward.ward_id == ward_id:
                return ward
        return None
