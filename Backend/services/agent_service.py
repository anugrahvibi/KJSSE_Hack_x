from __future__ import annotations

import json
from datetime import UTC, datetime

import anthropic

from ..config import ANTHROPIC_API_KEY, ANTHROPIC_MODEL, MOCK_MODE
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
        self.mock_mode = MOCK_MODE or not ANTHROPIC_API_KEY
        self.client = anthropic.Anthropic(api_key=ANTHROPIC_API_KEY) if not self.mock_mode else None

    def _build_context(self, extra: dict | None = None) -> dict:
        now = datetime.now(UTC)
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
                    dept_id="CENTRAL_RAILWAY",
                    action="Trigger harbour-line contingency routing and crowd marshals.",
                    priority="WARNING",
                    deadline_minutes=25,
                    rationale="Shift commuter load before network choke points form.",
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
                ActionItem(
                    dept_id="PUBLIC_ADVISORY",
                    action="Issue flood advisory: avoid Sion underpass; use 90 Feet Road northbound.",
                    priority=priority,
                    deadline_minutes=5,
                    rationale="Early rerouting lowers entrapment risk.",
                ),
            ],
            tide_trajectory_note=f"{context['tide_direction']} — no immediate natural drainage relief.",
            cascade_risk_flag="train_network_wr",
        )

    def run_dispatch_agent(self, ward_status: WardStatus, context: dict | None = None) -> ActionPlan:
        merged_context = self._build_context(context)
        if self.mock_mode:
            return self._mock_plan(ward_status, merged_context)

        user_message = f"""
        FLOOD STATUS UPDATE:
        Ward: {ward_status.ward_id} ({ward_status.ward_name})
        Severity: {ward_status.flood_status.value}
        Drainage Capacity: {ward_status.drainage_capacity_pct}%
        Current Tide Height: {ward_status.tide_height}m
        Outfall Elevation: {ward_status.outfall_elevation_m}m
        Rainfall Rate: {ward_status.rainfall_rate}mm/hr
        Tide Direction: {merged_context['tide_direction']}

        CURRENT CONTEXT:
        Time: {merged_context['timestamp']}
        Day: {merged_context['day_of_week']}
        KEM Hospital Capacity: {merged_context['hospital_capacity_pct']}%
        Nearest NDRF Battalion: {merged_context['nearest_ndrf_battalion']}
        Sion Underpass Status: {merged_context['sion_underpass_status']}

        Generate dispatch action plan as JSON only.
        """

        response = self.client.messages.create(
            model=ANTHROPIC_MODEL,
            max_tokens=1000,
            system=MUMBAI_DISPATCH_SYSTEM_PROMPT,
            messages=[{"role": "user", "content": user_message}],
        )
        raw = response.content[0].text
        parsed = json.loads(raw)
        return ActionPlan(**parsed)
