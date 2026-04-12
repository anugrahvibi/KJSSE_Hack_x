from __future__ import annotations

import json
from datetime import timezone, datetime

from ..config import MOCK_MODE

import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))
from AI.layer2_actionability.agent import run_dispatch_agent as groq_dispatch
from ..models.alert import ActionItem, ActionPlan
from ..models.ward import WardStatus


MUMBAI_DISPATCH_SYSTEM_PROMPT = """
You are Riva Mumbai's flood dispatch agent. When a ward enters
CRITICAL or WARNING flood status, you generate specific, sequenced,
actionable instructions for each responsible agency.
Return only valid JSON matching the requested schema.
""".strip()


class AgentService:
    def __init__(self) -> None:
        self.mock_mode = MOCK_MODE
        self.client = None

    def _build_context(self, extra: dict | None = None) -> dict:
        now = datetime.now(timezone.utc)
        base = {
            "timestamp": now.isoformat().replace("+00:00", "Z"),
            "day_of_week": now.strftime("%A"),
            "hospital_capacity_pct": 72,
            "nearest_ndrf_battalion": "Battalion 4",
            "sion_underpass_status": "Flood-prone",
            "tide_direction": "peak",
        }
        if extra:
            base.update(extra)
        return base

    def _mock_plan(self, ward_status: WardStatus, context: dict) -> ActionPlan:
        priority = ward_status.flood_status.value
        return ActionPlan(
            reasoning_steps=[
                "Peak commute. 3.5M on WR right now.",
                "Tide still rising - 4 hrs zero drainage.",
                "Sion underpass closes in ~15 min. NDRF default route blocked.",
                "Rerouting Bn4 via 60 Feet Road instead.",
                "KEM at 65% - surge protocol viable now."
            ],
            scenario_summary=(
                f"{ward_status.ward_name} ({ward_status.ward_id}) in tidal lock with "
                f"{ward_status.rainfall_rate}mm/hr rainfall."
            ),
            actions=[
                ActionItem(
                    dept_id="BMC_WARD_H_EAST",
                    action="Activate pump stations 3 and 7. Close Sion underpass immediately.",
                    priority=priority,
                    deadline_minutes=15,
                    rationale="Sion underpass submerges first during tidal lock.",
                ),
                ActionItem(
                    dept_id="WESTERN_RAILWAY",
                    action="Prepare Kurla and Sion stations for phased service slowdown.",
                    priority="WARNING",
                    deadline_minutes=20,
                    rationale="Peak crowd risk rises if track drainage degrades.",
                ),
                ActionItem(
                    dept_id="NDRF",
                    action="Deploy Battalion 4 via 60 Feet Road; avoid Sion approach.",
                    priority=priority,
                    deadline_minutes=30,
                    rationale="Route viability drops once underpass closes.",
                ),
                ActionItem(
                    dept_id="KEM_HOSPITAL",
                    action="Activate surge protocol and stage ambulances near Dharavi transit edge.",
                    priority="WARNING",
                    deadline_minutes=25,
                    rationale="Travel-time shocks can delay emergency admissions.",
                ),
            ],
            tide_trajectory_note=f"{context['tide_direction']} — no immediate natural drainage relief.",
            cascade_risk_flag="train_network_wr",
        )

    def run_dispatch_agent(self, ward_status: WardStatus, context: dict | None = None) -> ActionPlan:
        merged_context = self._build_context(context)
        if self.mock_mode:
            return self._mock_plan(ward_status, merged_context)

        parsed = groq_dispatch(ward_status.dict(), merged_context)
        return ActionPlan(**parsed)
