import json
import os

def load_ward_data(path: str = "data/ward_outfalls.json") -> list[dict]:
    """
    Reads ward_outfalls.json and returns a list of ward dicts.
    Raises FileNotFoundError with a clear message if file not found.
    Works with both absolute and relative paths.
    """
    if not os.path.exists(path):
        raise FileNotFoundError(f"Missing ward data file at {path}. Please verify the path.")
        
    with open(path, 'r', encoding='utf-8') as f:
        data = json.load(f)
        return data.get("wards", [])
