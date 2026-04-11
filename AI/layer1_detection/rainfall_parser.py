def get_ward_rainfall(rainfall_data: dict, ward_id: str) -> float:
    """
    Match ward_id to nearest station by name mapping.
    "H-East" -> "DHARAVI"
    "G-South" -> "BKC"
    If no match found, returns 0.0 (safe default).
    """
    mapping = {
        "H-East": "DHARAVI",
        "G-South": "BKC"
    }
    
    target_station = mapping.get(ward_id)
    if not target_station:
        return 0.0
        
    for station in rainfall_data.get("stations", []):
        if station.get("STATION") == target_station:
            return float(station.get("RAINFALL_MM_HR", 0.0))
            
    return 0.0
