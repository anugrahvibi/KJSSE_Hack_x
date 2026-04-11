from datetime import datetime, timezone

def get_current_tide_height(tide_data: dict) -> float:
    """
    Finds the tide height whose 'dt' is closest to the current time.
    If no real-time match (mock data is far from now, e.g. > 24 hours),
    returns the highest height in the list (conservative worst case).
    """
    if "heights" not in tide_data or not tide_data["heights"]:
        return 0.0
    
    now = datetime.now(timezone.utc)
    closest_tide = None
    min_diff = None
    
    for entry in tide_data["heights"]:
        dt_str = entry["dt"].replace("Z", "+00:00")
        dt = datetime.fromisoformat(dt_str)
        
        diff = abs((now - dt).total_seconds())
        if min_diff is None or diff < min_diff:
            min_diff = diff
            closest_tide = entry
            
    if min_diff is not None and min_diff > 24 * 3600:
        return max((float(entry.get("height_m", 0.0)) for entry in tide_data["heights"]), default=0.0)
        
    return float(closest_tide["height_m"]) if closest_tide else 0.0

def get_tide_direction(tide_data: dict) -> str:
    """
    Returns "rising", "falling", or "peak" based on comparison of last two nearest entries.
    """
    if "heights" not in tide_data or len(tide_data["heights"]) < 2:
        return "peak"
        
    now = datetime.now(timezone.utc)
    
    def get_diff(entry):
        dt_str = entry["dt"].replace("Z", "+00:00")
        dt = datetime.fromisoformat(dt_str)
        return abs((now - dt).total_seconds())
        
    sorted_entries = sorted(tide_data["heights"], key=get_diff)
    closest = sorted_entries[0]
    second_closest = sorted_entries[1]
    
    dt1 = datetime.fromisoformat(closest["dt"].replace("Z", "+00:00"))
    dt2 = datetime.fromisoformat(second_closest["dt"].replace("Z", "+00:00"))
    
    if dt1 < dt2:
        earlier, later = closest, second_closest
    else:
        earlier, later = second_closest, closest
        
    if later["height_m"] > earlier["height_m"]:
        return "rising"
    elif later["height_m"] < earlier["height_m"]:
        return "falling"
    return "peak"
