from fastapi import APIRouter
from pydantic import BaseModel
import sys
import os

# Add parent directory to Python path to import AI modules
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))
from AI.layer2_actionability.report_generator import generate_report

router = APIRouter(prefix="/api/reports", tags=["reports"])

@router.post("/generate")
def generate(payload: dict):
    from Backend.services.runtime import log_service
    ward_id = payload.get("ward_id", "H-East")
    mode = payload.get("mode", "DEMO")
    print(f"DEBUG: log_service.log_path = {log_service.log_path}")
    print(f"DEBUG: entries count = {len(log_service.list_log_entries())}")
    return generate_report(ward_id, mode)
