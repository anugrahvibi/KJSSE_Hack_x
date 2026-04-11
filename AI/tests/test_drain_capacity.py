import pytest
from layer1_detection.drain_capacity_engine import compute_ward_status, compute_all_wards, FloodStatus
from layer1_detection.ward_data_loader import load_ward_data
import os
import json

def test_critical_status():
    status = compute_ward_status(
        ward_id="H-East",
        ward_name="Dharavi",
        outfall_elevation_m=4.2,
        tide_height=4.6,
        rainfall_rate=87,
        permanently_undrained=False
    )
    assert status.flood_status == FloodStatus.CRITICAL
    assert status.drainage_capacity_pct == 0.0

def test_warning_status():
    status = compute_ward_status(
        ward_id="H-East",
        ward_name="Dharavi",
        outfall_elevation_m=4.2,
        tide_height=2.0,
        rainfall_rate=50,
        permanently_undrained=False
    )
    assert status.flood_status == FloodStatus.WARNING
    assert abs(status.drainage_capacity_pct - 52.4) < 0.1

def test_clear_status():
    status = compute_ward_status(
        ward_id="H-East",
        ward_name="Dharavi",
        outfall_elevation_m=4.2,
        tide_height=1.0,
        rainfall_rate=0,
        permanently_undrained=False
    )
    assert status.flood_status == FloodStatus.CLEAR

def test_integration():
    base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    tide_path = os.path.join(base_dir, "data", "mock_tide.json")
    rainfall_path = os.path.join(base_dir, "data", "mock_rainfall.json")
    ward_path = os.path.join(base_dir, "data", "ward_outfalls.json")

    with open(tide_path) as f:
        tide_data = json.load(f)
        
    with open(rainfall_path) as f:
        rainfall_data = json.load(f)
        
    ward_data = load_ward_data(path=ward_path)
    
    results = compute_all_wards(tide_data, rainfall_data, ward_data)
    
    he_ward = next((r for r in results if r.ward_id == "H-East"), None)
    gs_ward = next((r for r in results if r.ward_id == "G-South"), None)
    
    assert he_ward is not None
    assert he_ward.flood_status == FloodStatus.CRITICAL
    
    assert gs_ward is not None
    assert gs_ward.permanently_undrained is True
