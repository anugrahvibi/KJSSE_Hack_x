from __future__ import annotations

from ..config import DATA_DIR, LOGS_DIR
from .agent_service import AgentService
from .cascade_service import CascadeService
from .demo_service import DemoService
from .drain_capacity import DrainCapacityService
from .log_service import AccountabilityLogService
from .sms_service import SMSService
from .ws_manager import WebSocketManager


drain_service = DrainCapacityService(
    tide_path=DATA_DIR / "mock_tide.json",
    rainfall_path=DATA_DIR / "mock_rainfall.json",
    outfalls_path=DATA_DIR / "ward_outfalls.json",
)

agent_service = AgentService()
log_service = AccountabilityLogService(LOGS_DIR / "accountability.jsonl")
ws_manager = WebSocketManager()
cascade_service = CascadeService(
    graph_path=DATA_DIR / "dependency_graph.json",
    outfalls_path=DATA_DIR / "ward_outfalls.json",
    wards_geojson_path=DATA_DIR / "wards.geojson",
)
demo_service = DemoService()
sms_service = SMSService()
